"""Career Lab checkout: Stripe (card / Apple Pay / Google Pay) and PayPal."""
from __future__ import annotations

import random
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

import stripe

from ..deps import db_sess
from ..models import PaymentOrder
from ..services.payment_catalog import (
    ALLOWED_METHODS,
    METHOD_LABELS,
    get_product,
    public_product,
)
from ..services.payment_email import confirmation_payload
from ..services.payments import (
    capture_paypal_order,
    create_paypal_order,
    create_stripe_checkout_session,
    method_to_provider,
    paypal_configured,
    stripe_configured,
    stripe_webhook_secret,
    sync_stripe_session,
)

router = APIRouter(prefix="/payments", tags=["payments"])


class CheckoutSessionIn(BaseModel):
    method: str = Field(min_length=3, max_length=32)
    product_id: str = Field(min_length=1, max_length=80)
    email: EmailStr
    first_name: str = Field(default="Student", max_length=100)
    product_name: str | None = None
    amount: int | None = None
    currency: str | None = None
    return_url: str | None = None


def _new_order_number(db: Session) -> str:
    for _ in range(12):
        number = f"HR-{random.randint(100000, 999999)}"
        exists = db.query(PaymentOrder).filter(PaymentOrder.order_number == number).first()
        if not exists:
            return number
    raise HTTPException(status_code=500, detail="Could not allocate an order number")


def _get_order(db: Session, order_id: str) -> PaymentOrder | None:
    raw = (order_id or "").strip()
    if raw.startswith("#"):
        raw = raw[1:]
    row = db.query(PaymentOrder).filter(PaymentOrder.order_number == raw).first()
    if row:
        return row
    return db.query(PaymentOrder).filter(PaymentOrder.id == raw).first()


@router.get("/products")
def list_products():
    from ..services.payment_catalog import PRODUCTS

    return {"products": [public_product(p) for p in PRODUCTS.values()]}


@router.get("/products/{product_id}")
def product_detail(product_id: str):
    product = get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Unknown product")
    return public_product(product)


@router.post("/checkout/session")
def create_checkout_session(body: CheckoutSessionIn, db: Session = Depends(db_sess)):
    method = (body.method or "").strip().lower().replace("-", "_")
    if method not in ALLOWED_METHODS:
        raise HTTPException(status_code=400, detail="Unsupported payment method")

    product = get_product(body.product_id)
    if not product:
        raise HTTPException(status_code=400, detail="Unknown product")

    first_name = (body.first_name or "Student").strip() or "Student"
    order = PaymentOrder(
        order_number=_new_order_number(db),
        product_id=product["id"],
        product_name=product["name"],
        amount_cents=int(product["amount_cents"]),
        currency=product["currency"],
        method=method,
        status="pending",
        customer_email=str(body.email).strip().lower(),
        first_name=first_name,
        payment_method_display=METHOD_LABELS.get(method),
        provider=method_to_provider(method),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    try:
        if method == "paypal":
            if not paypal_configured():
                raise RuntimeError("PayPal is not configured on the server")
            redirect_url = create_paypal_order(order)
        else:
            if not stripe_configured():
                raise RuntimeError("Stripe is not configured on the server")
            redirect_url = create_stripe_checkout_session(order)
    except HTTPException:
        raise
    except Exception as e:
        order.status = "failed"
        db.add(order)
        db.commit()
        raise HTTPException(status_code=503, detail=str(e) or "Could not start checkout") from e

    db.add(order)
    db.commit()
    db.refresh(order)
    return {
        "ok": True,
        "provider": order.provider,
        "order_id": order.order_number,
        "redirect_url": redirect_url,
        "amount_cents": order.amount_cents,
        "currency": order.currency,
    }


@router.get("/orders/{order_id}/confirmation")
def get_confirmation(order_id: str, session_id: str | None = None, db: Session = Depends(db_sess)):
    order = _get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != "paid":
        try:
            if order.provider == "stripe" and stripe_configured():
                order = sync_stripe_session(db, order, session_id)
            elif order.provider == "paypal" and order.paypal_order_id and paypal_configured():
                order = capture_paypal_order(db, order)
        except Exception as e:
            print(f"[WARN] Payment sync failed for {order.order_number}: {repr(e)}")

    return confirmation_payload(order)


@router.post("/paypal/capture")
def paypal_capture(body: dict, db: Session = Depends(db_sess)):
    order_id = str(body.get("order_id") or "").strip()
    order = _get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.provider != "paypal":
        raise HTTPException(status_code=400, detail="Order is not a PayPal payment")
    try:
        order = capture_paypal_order(db, order)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"PayPal capture failed: {e}") from e
    return confirmation_payload(order)


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
    db: Session = Depends(db_sess),
):
    secret = stripe_webhook_secret()
    if not secret:
        raise HTTPException(status_code=503, detail="Stripe webhook secret is not configured")
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature or "", secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Stripe signature: {e}") from e

    event_type = event["type"]
    obj = event["data"]["object"]
    order = None
    if event_type in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        session_id = obj.get("id")
        metadata = obj.get("metadata") or {}
        order_number = metadata.get("order_number") or obj.get("client_reference_id")
        if order_number:
            order = _get_order(db, order_number)
        if not order and session_id:
            order = db.query(PaymentOrder).filter(PaymentOrder.stripe_session_id == session_id).first()
        if order and stripe_configured():
            sync_stripe_session(db, order, session_id)
    return {"received": True}


@router.post("/webhooks/paypal")
async def paypal_webhook(request: Request, db: Session = Depends(db_sess)):
    """Fulfill from PayPal webhooks by re-fetching the order (do not trust payload alone)."""
    data = await request.json()
    resource = data.get("resource") or {}
    paypal_id = resource.get("id")
    custom_id = resource.get("custom_id")
    ref = None
    try:
        ref = (resource.get("purchase_units") or [{}])[0].get("reference_id")
    except Exception:
        ref = None
    order = None
    if custom_id:
        order = db.query(PaymentOrder).filter(PaymentOrder.id == custom_id).first()
    if not order and ref:
        order = _get_order(db, ref)
    if not order and paypal_id:
        order = db.query(PaymentOrder).filter(PaymentOrder.paypal_order_id == paypal_id).first()
    if order and order.status != "paid" and paypal_configured():
        try:
            capture_paypal_order(db, order)
        except Exception as e:
            print(f"[WARN] PayPal webhook capture failed: {repr(e)}")
    return {"received": True}
