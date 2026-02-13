# backend/app/routers/contact.py
"""
Public contact form endpoint.
Sends a receipt email to the user and a notification to the team,
using the same SMTP infrastructure as email verification.
"""
from __future__ import annotations

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

from ..emailer import send_email

router = APIRouter(prefix="/contact", tags=["contact"])


# ---------- Schema ----------

class ContactIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=30)
    hear_about: Optional[str] = Field(None, max_length=100)
    service_interest: Optional[str] = Field(None, max_length=50)
    message: str = Field(min_length=1, max_length=5000)


# ---------- Helpers ----------

def _mail_from_contact() -> str | None:
    """Return the noreply sender address for contact receipts."""
    v = os.getenv("MAIL_FROM_CONTACT", "").strip()
    if v:
        return v
    v = os.getenv("MAIL_FROM_VERIFICATION", "").strip()
    if v:
        return v
    v = os.getenv("SMTP_FROM", "").strip()
    return v or None


def _team_email() -> str:
    """Where to send internal contact-form notifications."""
    return os.getenv("CONTACT_NOTIFY_EMAIL", "hello@heeriseacademy.com").strip()


# ---------- Endpoint ----------

@router.post("")
def submit_contact(body: ContactIn):
    """
    Receive a contact form submission.
    1) Send a receipt / confirmation email to the user.
    2) Send a notification email to the Heerise team.
    If SMTP is not configured, log to console (dev-friendly).
    """
    full_name = f"{body.first_name} {body.last_name}"
    from_addr = _mail_from_contact()

    # --- Receipt email to the user ---
    receipt_subject = "Thanks for contacting Heerise!"
    receipt_body = (
        f"Hi {body.first_name},\n\n"
        "Thank you for reaching out to Heerise! We've received your message "
        "and will get back to you within 24-48 hours.\n\n"
        "Here's a summary of what you sent:\n"
        f"  Name: {full_name}\n"
        f"  Email: {body.email}\n"
    )
    if body.phone:
        receipt_body += f"  Phone: {body.phone}\n"
    if body.service_interest:
        receipt_body += f"  Interest: {body.service_interest}\n"
    receipt_body += (
        f"\n  Message:\n  {body.message}\n\n"
        "Best regards,\n"
        "The Heerise Team\n"
    )

    # --- Internal notification to team ---
    notify_subject = f"[Heerise Contact] New inquiry from {full_name}"
    notify_body = (
        f"New contact form submission:\n\n"
        f"  Name: {full_name}\n"
        f"  Email: {body.email}\n"
        f"  Phone: {body.phone or 'N/A'}\n"
        f"  How they heard about us: {body.hear_about or 'N/A'}\n"
        f"  Service interest: {body.service_interest or 'N/A'}\n"
        f"\n  Message:\n  {body.message}\n"
    )

    smtp_configured = bool(os.getenv("SMTP_HOST", "").strip())

    if not smtp_configured:
        print(f"[DEV] Contact form from {body.email}:")
        print(f"  Name: {full_name}")
        print(f"  Phone: {body.phone}")
        print(f"  Hear about: {body.hear_about}")
        print(f"  Interest: {body.service_interest}")
        print(f"  Message: {body.message}")
        print("[DEV] SMTP not configured — skipping emails.")
        return {"message": "received", "dev_note": "SMTP not configured; emails skipped."}

    errors = []

    # Send receipt to user
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

    # Send notification to team
    try:
        send_email(
            _team_email(),
            notify_subject,
            notify_body,
            from_email=from_addr,
            reply_to=body.email,
        )
    except Exception as e:
        print(f"[WARN] Failed to send team notification: {repr(e)}")
        errors.append("notification")

    if errors:
        return {"message": "received", "warning": f"Some emails failed: {', '.join(errors)}"}

    return {"message": "sent"}
