# backend/app/routers/career_lab.py
"""
Career Lab bootcamp application.
1) Store in DB (admin visible)
2) Send receipt to user (noreply)
3) Send notification to helloashlee707@gmail.com
"""
from __future__ import annotations

import os
import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from sqlalchemy.orm import Session

from ..emailer import send_email
from ..deps import db_sess
from ..models import CareerLabApplication

router = APIRouter(prefix="/career-lab", tags=["career-lab"])

ADMIN_NOTIFY_EMAIL = "helloashlee707@gmail.com"


# ---------- Schema ----------

class CareerLabApplyIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    message: str = Field(min_length=1, max_length=10000)  # Full application text
    raw_data: Optional[dict[str, Any]] = None  # Optional structured data


# ---------- Helpers ----------

def _mail_from() -> str | None:
    v = os.getenv("MAIL_FROM_CONTACT", "").strip()
    if v:
        return v
    v = os.getenv("MAIL_FROM_VERIFICATION", "").strip()
    if v:
        return v
    v = os.getenv("SMTP_FROM", "").strip()
    return v or None


def _admin_email() -> str:
    return os.getenv("CONTACT_NOTIFY_EMAIL", ADMIN_NOTIFY_EMAIL).strip()


# ---------- Endpoint ----------

@router.post("/apply")
def apply_bootcamp(body: CareerLabApplyIn, db: Session = Depends(db_sess)):
    """
    1) Store application in DB
    2) Send receipt to user
    3) Send notification to helloashlee707@gmail.com
    """
    full_name = f"{body.first_name} {body.last_name}"
    from_addr = _mail_from()

    # --- Store in DB ---
    raw_json = json.dumps(body.raw_data, ensure_ascii=False) if body.raw_data else None
    app = CareerLabApplication(
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
        raw_data=raw_json,
        message=body.message,
    )
    db.add(app)
    db.commit()

    # --- Receipt to user ---
    receipt_subject = "Your Career Lab Application Has Been Received"
    receipt_body = (
        f"Hi {body.first_name},\n\n"
        "Thank you for applying to the ID/LXD Career Lab bootcamp!\n\n"
        "We've received your application and will review it shortly. "
        "You'll hear back from us within a few business days.\n\n"
        "Here's a summary of what you submitted:\n\n"
        f"{body.message}\n\n"
        "Best regards,\n"
        "The Heerise Team\n"
    )

    # --- Notification to admin ---
    notify_subject = f"[Career Lab] New application from {full_name}"
    notify_body = (
        f"New Career Lab bootcamp application:\n\n"
        f"  Name: {full_name}\n"
        f"  Email: {body.email}\n\n"
        f"Application details:\n\n{body.message}\n"
    )

    smtp_configured = bool(os.getenv("SMTP_HOST", "").strip())

    if not smtp_configured:
        print(f"[DEV] Career Lab application from {body.email}")
        print("[DEV] SMTP not configured — skipping emails.")
        return {"message": "received", "dev_note": "SMTP not configured; emails skipped."}

    errors = []

    try:
        send_email(
            body.email,
            receipt_subject,
            receipt_body,
            from_email=from_addr,
        )
    except Exception as e:
        print(f"[WARN] Failed to send receipt to {body.email}: {repr(e)}")
        errors.append("receipt")

    try:
        send_email(
            _admin_email(),
            notify_subject,
            notify_body,
            from_email=from_addr,
            reply_to=body.email,
        )
    except Exception as e:
        print(f"[WARN] Failed to send admin notification: {repr(e)}")
        errors.append("notification")

    if errors:
        return {"message": "received", "warning": f"Some emails failed: {', '.join(errors)}"}

    return {"message": "sent"}
