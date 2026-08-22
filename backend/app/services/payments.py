"""Stripe Checkout + PayPal Orders helpers for Career Lab payments."""
from __future__ import annotations

import base64
import os
from datetime import datetime
from typing import Any
from urllib.parse import urlencode

import httpx
import stripe
from sqlalchemy.orm import Session

from ..models import PaymentOrder
from .payment_catalog import METHOD_LABELS, format_money
from .payment_email import send_order_confirmation, send_team_payment_notice


def frontend_base() -> str:
    return os.getenv("FRONTEND_BASE", "http://localhost:1313").rstrip("/")


def stripe_secret_key() -> str:
    return os.getenv("STRIPE_SECRET_KEY", "").strip()


def stripe_webhook_secret() -> str:
    return os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()


def paypal_env() -> str:
    raw = os.getenv("PAYPAL_ENV", os.getenv("PAYPAL_MODE", "sandbox")).strip().lower()
    return "live" if raw in ("live", "production", "prod") else "sandbox"


def paypal_base_url() -> str:
    return "https://api-m.paypal.com" if paypal_env() == "live" else "https://api-m.sandbox.paypal.com"


def paypal_configured() -> bool:
    return bool(os.getenv("PAYPAL_CLIENT_ID", "").strip() and os.getenv("PAYPAL_CLIENT_SECRET", "").strip())


def stripe_configured() -> bool:
    return bool(stripe_secret_key())


def smtp_configured() -> bool:
    return bool(os.getenv("SMTP_HOST", "").strip())


def _stripe() -> None:
    key = stripe_secret_key()
    if not key:
        raise RuntimeError("STRIPE_SECRET_KEY is not configured")
    stripe.api_key = key


def method_to_provider(method: str) -> str:
    return "paypal" if method == "paypal" else "stripe"


def confirmation_url(order_number: str, extra: dict[str, str] | None = None) -> str:
    params = {"order_id": order_number}
    if extra:
        params.update(extra)
    return f"{frontend_base()}/checkout/confirmed/?{urlencode(params)}"


def cancel_url(method: str, product_id: str) -> str:
    slug = {
        "card": "card",
        "paypal": "paypal",
        "google_pay": "google-pay",
        "apple_pay": "apple-pay",
    }.get(method, "card")
    return f"{frontend_base()}/methods/{slug}/?product_id={product_id}&payment=canceled"


def create_stripe_checkout_session(order: PaymentOrder) -> str:
    _stripe()
    success = confirmation_url(order.order_number, {"payment": "success"})
    kwargs = dict(
        mode="payment",
        success_url=success + "&session_id={CHECKOUT_SESSION_ID}",
        cancel_url=cancel_url(order.method, order.product_id),
        customer_email=order.customer_email,
        client_reference_id=order.order_number,
        submit_type="pay",
        billing_address_collection="auto",
        line_items=[
            {
                "quantity": 1,
                "price_data": {
                    "currency": order.currency.lower(),
                    "unit_amount": order.amount_cents,
                    "product_data": {
                        "name": order.product_name,
                        "description": "HeeRise Academy — LXD & ID Career Lab",
                    },
                },
            }
        ],
        metadata={
            "order_id": order.id,
            "order_number": order.order_number,
            "method": order.method,
            "product_id": order.product_id,
        },
        payment_intent_data={
            "description": f"HeeRise Academy {order.order_number}",
            "statement_descriptor_suffix": "HEERISE",
            "metadata": {
                "order_id": order.id,
                "order_number": order.order_number,
                "method": order.method,
            },
        },
    )
    try:
        session = stripe.checkout.Session.create(**kwargs)
    except stripe.InvalidRequestError:
        kwargs["payment_intent_data"].pop("statement_descriptor_suffix", None)
        session = stripe.checkout.Session.create(**kwargs)
    order.stripe_session_id = session.id
    if getattr(session, "payment_intent", None):
        order.stripe_payment_intent_id = str(session.payment_intent)
    if not session.url:
        raise RuntimeError("Stripe Checkout did not return a redirect URL")
    return session.url


def _paypal_token() -> str:
    client_id = os.getenv("PAYPAL_CLIENT_ID", "").strip()
    secret = os.getenv("PAYPAL_CLIENT_SECRET", "").strip()
    if not client_id or not secret:
        raise RuntimeError("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not configured")
    auth = base64.b64encode(f"{client_id}:{secret}".encode()).decode()
    resp = httpx.post(
        f"{paypal_base_url()}/v1/oauth2/token",
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={"grant_type": "client_credentials"},
        timeout=20.0,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def create_paypal_order(order: PaymentOrder) -> str:
    token = _paypal_token()
    value = f"{order.amount_cents / 100:.2f}"
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": order.order_number,
                "custom_id": order.id,
                "description": order.product_name,
                "amount": {
                    "currency_code": order.currency.upper(),
                    "value": value,
                },
            }
        ],
        "payment_source": {
            "paypal": {
                "experience_context": {
                    "brand_name": "HeeRise Academy",
                    "landing_page": "LOGIN",
                    "user_action": "PAY_NOW",
                    "return_url": confirmation_url(order.order_number, {"payment": "paypal-approved"}),
                    "cancel_url": cancel_url("paypal", order.product_id),
                }
            }
        },
    }
    resp = httpx.post(
        f"{paypal_base_url()}/v2/checkout/orders",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=20.0,
    )
    resp.raise_for_status()
    data = resp.json()
    order.paypal_order_id = data.get("id")
    for link in data.get("links") or []:
        if link.get("rel") in ("payer-action", "approve") and link.get("href"):
            return link["href"]
    raise RuntimeError("PayPal did not return an approval URL")


def _card_display_from_intent(intent: Any) -> str | None:
    if not intent:
        return None
    charges = getattr(intent, "charges", None)
    data = getattr(charges, "data", None) if charges is not None else None
    charge = data[0] if data else None
    details = getattr(charge, "payment_method_details", None) if charge else None
    if not details:
        latest = getattr(intent, "latest_charge", None)
        if latest and not isinstance(latest, str):
            details = getattr(latest, "payment_method_details", None)
    if not details:
        return None
    wallet = getattr(details, "card", None)
    card = wallet or getattr(details, "card_present", None)
    if not card:
        return None
    brand = (getattr(card, "brand", None) or "Card").replace("_", " ").title()
    last4 = getattr(card, "last4", None) or ""
    wallet_type = getattr(getattr(card, "wallet", None), "type", None)
    if wallet_type == "apple_pay":
        return f"Apple Pay · {brand} ending in {last4}" if last4 else "Apple Pay"
    if wallet_type == "google_pay":
        return f"Google Pay · {brand} ending in {last4}" if last4 else "Google Pay"
    if last4:
        return f"{brand} ending in {last4}"
    return brand


def payment_method_from_stripe_session(session: Any) -> str:
    method = (getattr(session, "metadata", None) or {}).get("method") if session else None
    intent = getattr(session, "payment_intent", None)
    if isinstance(intent, str):
        try:
            _stripe()
            intent = stripe.PaymentIntent.retrieve(intent, expand=["latest_charge"])
        except Exception:
            intent = None
    display = _card_display_from_intent(intent)
    if display:
        return display
    return METHOD_LABELS.get(method or "card", "Credit / Debit Card")


def mark_order_paid(
    db: Session,
    order: PaymentOrder,
    *,
    payment_method_display: str,
    provider_ref: str | None = None,
) -> PaymentOrder:
    if order.status != "paid":
        order.status = "paid"
        order.paid_at = datetime.utcnow()
        order.payment_method_display = payment_method_display
        if provider_ref:
            order.provider_ref = provider_ref
        order.updated_at = datetime.utcnow()
        db.add(order)
        db.commit()
        db.refresh(order)

    if order.email_sent_at:
        return order
    if not smtp_configured():
        print(f"[DEV] Payment confirmation email skipped for {order.order_number} (SMTP not configured)")
        return order
    try:
        send_order_confirmation(order)
        try:
            send_team_payment_notice(order)
        except Exception as notify_err:
            print(f"[WARN] Payment team notice failed: {repr(notify_err)}")
        order.email_sent_at = datetime.utcnow()
        db.add(order)
        db.commit()
        db.refresh(order)
    except Exception as e:
        print(f"[WARN] Payment confirmation email failed for {order.order_number}: {repr(e)}")
    return order


def sync_stripe_session(db: Session, order: PaymentOrder, session_id: str | None = None) -> PaymentOrder:
    _stripe()
    sid = session_id or order.stripe_session_id
    if not sid:
        return order
    session = stripe.checkout.Session.retrieve(sid, expand=["payment_intent", "payment_intent.latest_charge"])
    order.stripe_session_id = session.id
    pi = getattr(session, "payment_intent", None)
    if pi:
        order.stripe_payment_intent_id = pi if isinstance(pi, str) else getattr(pi, "id", None)
    paid = session.payment_status == "paid" or session.status == "complete"
    if paid:
        display = payment_method_from_stripe_session(session)
        return mark_order_paid(db, order, payment_method_display=display, provider_ref=session.id)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def capture_paypal_order(db: Session, order: PaymentOrder) -> PaymentOrder:
    if not order.paypal_order_id:
        raise RuntimeError("Missing PayPal order id")
    token = _paypal_token()
    resp = httpx.post(
        f"{paypal_base_url()}/v2/checkout/orders/{order.paypal_order_id}/capture",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        timeout=20.0,
    )
    if resp.status_code == 422:
        # Already captured — retrieve instead.
        got = httpx.get(
            f"{paypal_base_url()}/v2/checkout/orders/{order.paypal_order_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=20.0,
        )
        got.raise_for_status()
        data = got.json()
    else:
        resp.raise_for_status()
        data = resp.json()
    status = (data.get("status") or "").upper()
    if status in ("COMPLETED", "APPROVED"):
        capture_id = None
        try:
            capture_id = (
                data["purchase_units"][0]["payments"]["captures"][0]["id"]
            )
        except Exception:
            capture_id = data.get("id")
        return mark_order_paid(
            db,
            order,
            payment_method_display="PayPal",
            provider_ref=capture_id or order.paypal_order_id,
        )
    return order


def format_order_amount(order: PaymentOrder) -> str:
    return format_money(order.amount_cents, order.currency)
