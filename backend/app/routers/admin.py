# backend/app/routers/admin.py
from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..deps import db_sess, require_admin
from ..models import User, AuthSession, UserProfile

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=dict)
def stats(
    db: Session = Depends(db_sess),
    _: User = Depends(require_admin),
):
    """Admin dashboard stats (MVP simplified)."""
    total_users = db.query(func.count(User.id)).scalar() or 0

    # "Active users" (lite): sessions not expired
    now = datetime.utcnow()
    active_users = (
        db.query(func.count(func.distinct(AuthSession.user_id)))
        .filter(AuthSession.expires_at > now)
        .scalar()
        or 0
    )

    # Placeholder values for MVP
    premium_conversion_rate = 0.0

    content_performance = [
        {"title": "Content Title 1", "completion_rate": 0.32, "views": 383},
        {"title": "Content Title 2", "completion_rate": 0.21, "views": 271},
        {"title": "Content Title 3", "completion_rate": 0.18, "views": 166},
    ]

    return {
        "total_users": total_users,
        "active_users": active_users,
        "premium_conversion_rate": premium_conversion_rate,
        "content_performance": content_performance,
    }


@router.get("/users", response_model=list[dict])
def list_users(
    limit: int = 20,
    db: Session = Depends(db_sess),
    _: User = Depends(require_admin),
):
    """User table for admin view (MVP simplified)."""
    rows = (
        db.query(User, UserProfile)
        .outerjoin(UserProfile, UserProfile.user_id == User.id)
        .order_by(User.created_at.desc())
        .limit(max(1, min(200, limit)))
        .all()
    )

    out: list[dict] = []
    for u, p in rows:
        out.append(
            {
                "id": u.id,
                "name": u.name or u.username or u.email,
                "target_job_category": (p.target_role if p else None) or "—",
                "readiness_score": (p.ai_readiness_score if p else None),
                "subscription_status": "Free",  # placeholder
                "role": u.role.value,
            }
        )
    return out


