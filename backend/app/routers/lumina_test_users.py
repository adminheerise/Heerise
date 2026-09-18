# backend/app/routers/lumina_test_users.py
"""Lumina sim registrant capture + admin-key-protected listing."""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime
from threading import Lock
from typing import Deque, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..deps import db_sess, require_lumina_admin_key
from ..models import LuminaTestUser

router = APIRouter(prefix="/lumina-test-users", tags=["lumina-test-users"])

# In-memory rate limit: max N register attempts per IP per window
_RATE_LIMIT = 8
_RATE_WINDOW_SEC = 600
_rate_hits: Dict[str, Deque[float]] = defaultdict(deque)
_rate_lock = Lock()


class RegisterIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    terms_accepted: bool
    subscribed: bool = False


def _client_ip(request: Request) -> str:
    forwarded = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
    if forwarded:
        return forwarded
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _rate_limit_or_raise(ip: str) -> None:
    now = time.time()
    with _rate_lock:
        q = _rate_hits[ip]
        while q and now - q[0] > _RATE_WINDOW_SEC:
            q.popleft()
        if len(q) >= _RATE_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many registration attempts. Please try again later.",
            )
        q.append(now)


def _gate_secret() -> str:
    return (
        (os.getenv("LUMINA_GATE_SECRET") or "").strip()
        or (os.getenv("JWT_SECRET") or "").strip()
        or (os.getenv("LUMINA_ADMIN_KEY") or "").strip()
        or "heerise-lumina-dev-gate"
    )


def make_gate_token(user_id: str) -> str:
    sig = hmac.new(_gate_secret().encode("utf-8"), user_id.encode("utf-8"), hashlib.sha256).hexdigest()[
        :32
    ]
    return f"{user_id}.{sig}"


def verify_gate_token(token: str) -> Optional[str]:
    raw = (token or "").strip()
    if "." not in raw:
        return None
    user_id, _sig = raw.split(".", 1)
    if not user_id:
        return None
    expected = make_gate_token(user_id)
    if not secrets.compare_digest(raw, expected):
        return None
    return user_id


@router.post("/register")
def register(body: RegisterIn, request: Request, db: Session = Depends(db_sess)):
    """Public write-only endpoint. No list/read of stored registrants."""
    if not body.terms_accepted:
        raise HTTPException(status_code=400, detail="Terms of Service must be accepted")

    _rate_limit_or_raise(_client_ip(request))

    full_name = " ".join((body.full_name or "").split()).strip()
    if not full_name:
        raise HTTPException(status_code=400, detail="Full name is required")

    email = str(body.email).strip().lower()
    now = datetime.utcnow()

    row = db.query(LuminaTestUser).filter(LuminaTestUser.email == email).one_or_none()
    if row:
        row.full_name = full_name
        row.subscribed = bool(body.subscribed)
        row.terms_accepted_at = now
        row.updated_at = now
    else:
        row = LuminaTestUser(
            full_name=full_name,
            email=email,
            subscribed=bool(body.subscribed),
            terms_accepted_at=now,
        )
        db.add(row)

    db.commit()
    db.refresh(row)

    return {
        "ok": True,
        "gate_token": make_gate_token(row.id),
        "full_name": row.full_name,
        "email": row.email,
    }


@router.get("/admin/stats")
def admin_stats(
    db: Session = Depends(db_sess),
    _: None = Depends(require_lumina_admin_key),
):
    total = db.query(func.count(LuminaTestUser.id)).scalar() or 0
    subscribed = (
        db.query(func.count(LuminaTestUser.id))
        .filter(LuminaTestUser.subscribed.is_(True))
        .scalar()
        or 0
    )
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month = (
        db.query(func.count(LuminaTestUser.id))
        .filter(LuminaTestUser.created_at >= month_start)
        .scalar()
        or 0
    )
    return {
        "total_users": int(total),
        "email_subscribers": int(subscribed),
        "this_month": int(this_month),
    }


@router.get("/admin/users")
def admin_list_users(
    q: str = Query("", max_length=200),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(db_sess),
    _: None = Depends(require_lumina_admin_key),
):
    query = db.query(LuminaTestUser)
    term = (q or "").strip().lower()
    if term:
        like = f"%{term}%"
        query = query.filter(
            (func.lower(LuminaTestUser.full_name).like(like))
            | (func.lower(LuminaTestUser.email).like(like))
        )
    rows = query.order_by(LuminaTestUser.created_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "full_name": r.full_name,
            "email": r.email,
            "subscribed": bool(r.subscribed),
            "registered_at": r.created_at.isoformat() + "Z" if r.created_at else None,
        }
        for r in rows
    ]
