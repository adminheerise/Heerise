"""Job Simulation registration and saved sessions."""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime
from threading import Lock
from typing import Deque, Dict, Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import update
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from ..deps import db_sess
from ..models import JobSimSession, JobSimUser

router = APIRouter(prefix="/job-sim", tags=["job-sim"])

# In-memory rate limit: max N register attempts per IP per window
_RATE_LIMIT = 8
_RATE_WINDOW_SEC = 600
_rate_hits: Dict[str, Deque[float]] = defaultdict(deque)
_rate_lock = Lock()


class RegisterIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    email: EmailStr = Field(max_length=255)
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
        (os.getenv("JOB_SIM_GATE_SECRET") or "").strip()
        or (os.getenv("JWT_SECRET") or "").strip()
        or "heerise-job-sim-dev-gate"
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
    if not secrets.compare_digest(raw.encode('utf-8'), expected.encode('utf-8')):
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

    row = db.query(JobSimUser).filter(JobSimUser.email == email).one_or_none()
    if row:
        row.full_name = full_name
        row.subscribed = bool(body.subscribed)
        row.terms_accepted_at = now
        row.updated_at = now
    else:
        row = JobSimUser(
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


class SessionIn(BaseModel):
    role_title: str = Field(min_length=1, max_length=200)
    project_title: str = Field(min_length=1, max_length=255)
    difficulty: Literal["easy", "medium", "hard"]
    project: dict


class SessionResultsIn(BaseModel):
    results: dict


def get_job_sim_user(
    token: Optional[str] = Header(None, alias="X-Job-Sim-Token"),
    db: Session = Depends(db_sess),
) -> JobSimUser:
    user_id = verify_gate_token(token) if token else None
    user = db.get(JobSimUser, user_id) if user_id else None
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or missing Job Simulation token")
    return user


def _lock_session_writes(db: Session, user_id: str) -> None:
    # Serialize session mutations on the parent row. SQLite also acquires its write lock.
    # Explicitly preserve updated_at so a session write does not modify the user profile.
    db.execute(
        update(JobSimUser)
        .where(JobSimUser.id == user_id)
        .values(updated_at=JobSimUser.updated_at)
    )


def _session_payload(row: JobSimSession) -> dict:
    return {
        "id": row.id,
        "role_title": row.role_title,
        "project_title": row.project_title,
        "difficulty": row.difficulty,
        "project": json.loads(row.project_json),
        "status": row.status,
        "results": json.loads(row.results_json) if row.results_json is not None else None,
        "created_at": row.created_at.isoformat() + "Z",
        "updated_at": row.updated_at.isoformat() + "Z",
    }


@router.post("/sessions")
def start_session(
    body: SessionIn,
    user: JobSimUser = Depends(get_job_sim_user),
    db: Session = Depends(db_sess),
):
    project_json = json.dumps(body.project, ensure_ascii=False)
    if len(project_json) > 50_000:
        raise HTTPException(status_code=413, detail="Project exceeds 50,000 characters")

    user_id = user.id
    try:
        _lock_session_writes(db, user_id)
        expired = (
            db.query(JobSimSession)
            .filter(JobSimSession.user_id == user_id)
            .order_by(JobSimSession.updated_at.desc(), JobSimSession.created_at.desc(), JobSimSession.id.desc())
            .offset(2)
            .all()
        )
        for row in reversed(expired):
            db.delete(row)
        session = JobSimSession(
            user_id=user_id,
            role_title=body.role_title,
            project_title=body.project_title,
            difficulty=body.difficulty,
            project_json=project_json,
            status="in_progress",
        )
        db.add(session)
        db.flush()
        payload = _session_payload(session)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return payload


@router.patch("/sessions/{session_id}")
def complete_session(
    session_id: str,
    body: SessionResultsIn,
    user: JobSimUser = Depends(get_job_sim_user),
    db: Session = Depends(db_sess),
):
    user_id = user.id
    try:
        _lock_session_writes(db, user_id)
        session = (
            db.query(JobSimSession)
            .filter(JobSimSession.id == session_id, JobSimSession.user_id == user_id)
            .one_or_none()
        )
        if session is None:
            raise HTTPException(status_code=404, detail="Job Simulation session not found")
        session.results_json = json.dumps(body.results, ensure_ascii=False)
        session.status = "completed"
        # A repeated completion still counts as activity for recent-session ordering.
        flag_modified(session, "results_json")
        db.flush()
        payload = _session_payload(session)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return payload


@router.get("/sessions/recent")
def recent_sessions(
    user: JobSimUser = Depends(get_job_sim_user),
    db: Session = Depends(db_sess),
):
    sessions = (
        db.query(JobSimSession)
        .filter(JobSimSession.user_id == user.id)
        .order_by(JobSimSession.updated_at.desc(), JobSimSession.created_at.desc(), JobSimSession.id.desc())
        .limit(3)
        .all()
    )
    return [_session_payload(row) for row in sessions]
