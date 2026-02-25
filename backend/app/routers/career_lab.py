# backend/app/routers/career_lab.py
"""
Career Lab bootcamp application.
Stores in DB, sends receipt to user, notifies helloashlee707@gmail.com.
"""
from __future__ import annotations

import json
import os
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

from ..deps import db_sess
from ..emailer import send_email
from ..models import CareerLabApplication

router = APIRouter(prefix="/career-lab", tags=["career-lab"])


class CareerLabApplyIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(default="", max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=30)
    hear_about: Optional[str] = Field(None, max_length=100)
    service_interest: Optional[str] = Field(None, max_length=50)
    message: str = Field(min_length=1, max_length=10000)


def _mail_from() -> str | None:
    v = os.getenv("MAIL_FROM_VERIFICATION", "").strip()
    if v:
        return v
    return os.getenv("SMTP_FROM", "").strip() or None


def _team_email() -> str:
    return os.getenv("CONTACT_NOTIFY_EMAIL", "helloashlee707@gmail.com").strip()


@router.post("/apply")
def apply_career_lab(body: CareerLabApplyIn, db=Depends(db_sess)):
    """Store application, send receipt to user, notify team."""
    row = CareerLabApplication(
        first_name=body.first_name,
        last_name=body.last_name or "",
        email=body.email,
        raw_data=json.dumps(body.model_dump()),
        message=body.message,
    )
    db.add(row)
    db.commit()

    full_name = f"{body.first_name} {body.last_name}".strip() or body.first_name
    from_addr = _mail_from()
    smtp_ok = bool(os.getenv("SMTP_HOST", "").strip())

    if not smtp_ok:
        print(f"[DEV] Career Lab application from {body.email}: {full_name}")
        return {"message": "received", "dev_note": "SMTP not configured; emails skipped."}

    receipt_subject = "Career Lab Application Received"
    receipt_body = (
        f"Hi {body.first_name},\n\n"
        "Thank you for applying to the ID/LXD Career Lab! We've received your application "
        "and will review it within 24-48 hours.\n\n"
        "If selected, we'll invite you to interview with our instructors.\n\n"
        "Best regards,\n"
        "The Heerise Team\n"
    )
    try:
        send_email(body.email, receipt_subject, receipt_body, from_email=from_addr)
    except Exception as e:
        print(f"[WARN] Career Lab receipt failed: {repr(e)}")

    notify_subject = f"[Career Lab] Application from {full_name}"
    notify_body = (
        f"New Career Lab application:\n\n"
        f"  Name: {full_name}\n"
        f"  Email: {body.email}\n"
        f"  Phone: {body.phone or 'N/A'}\n\n"
        f"  Message:\n  {body.message}\n"
    )
    try:
        send_email(_team_email(), notify_subject, notify_body, from_email=from_addr, reply_to=body.email)
    except Exception as e:
        print(f"[WARN] Career Lab notify failed: {repr(e)}")

    return {"message": "sent"}
