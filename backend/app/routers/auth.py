# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os

from ..schemas import RegisterIn, RegisterOut, LoginIn, TokenOut, RefreshIn, EmailIn
from ..models import User, AuthSession, EmailVerification
from ..security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    create_email_verify_token,
)
from ..emailer import send_email
from ..deps import db_sess

router = APIRouter(prefix="/auth", tags=["auth"])


def _validate_password_complexity(pw: str) -> None:
    # MVP rules: >=8 and must include lower/upper/digit/special
    if len(pw) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    has_lower = any(c.islower() for c in pw)
    has_upper = any(c.isupper() for c in pw)
    has_digit = any(c.isdigit() for c in pw)
    has_special = any(not c.isalnum() for c in pw)
    if not (has_lower and has_upper and has_digit and has_special):
        raise HTTPException(
            status_code=400,
            detail="Password must include uppercase, lowercase, number, and special character",
        )


def _frontend_base() -> str:
    return os.getenv("FRONTEND_BASE", "http://localhost:3000").rstrip("/")

def _mail_from(key: str) -> str | None:
    """Return a configured sender address for a given mail type."""
    v = os.getenv(key, "").strip()
    if v:
        return v
    # Backwards compatible fallback
    v = os.getenv("SMTP_FROM", "").strip()
    return v or None


def _send_verify_email(to_email: str, token: str) -> str | None:
    url = f"{_frontend_base()}/verify?token={token}"
    subject = "Verify your HeeRise account"
    body = (
        "Welcome to HeeRise!\n\n"
        "Please verify your email by clicking the link below:\n"
        f"{url}\n\n"
        "If you did not create this account, you can ignore this email.\n"
    )
    # If SMTP isn't configured, return the dev link for local verification.
    if not os.getenv("SMTP_HOST", "").strip():
        print(f"[DEV] Verification link for {to_email}: {url}")
        return url
    try:
        send_email(
            to_email,
            subject,
            body,
            from_email=_mail_from("MAIL_FROM_VERIFICATION"),
        )
        return None
    except Exception as e:
        # Dev-friendly fallback: print the link to server logs
        print(f"[WARN] SMTP send failed: {repr(e)}")
        print(f"[DEV] Verification link for {to_email}: {url}")
        return url


@router.post("/register", response_model=RegisterOut)
def register(
    body: RegisterIn,
    request: Request,                
    db: Session = Depends(db_sess),
):
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if body.username:
        if db.query(User).filter(User.username == body.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")

    if body.password != body.password_confirm:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    _validate_password_complexity(body.password)

    u = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        name=body.name,              # Full Name
        username=body.username,      # User Name
    )
    db.add(u)
    db.flush()

    # email verification record
    exp = datetime.utcnow() + timedelta(hours=24)
    db.add(
        EmailVerification(
            user_id=u.id,
            expires_at=exp,
            verified_at=None,
        )
    )
    db.commit()

    token = create_email_verify_token(u.id, u.email)
    dev_url = _send_verify_email(u.email, token)

    return RegisterOut(dev_verify_url=dev_url)


@router.post("/login", response_model=TokenOut)
def login(
    body: LoginIn,
    request: Request,                
    db: Session = Depends(db_sess),
):
    u = db.query(User).filter(User.email == body.email.lower()).first()
    if not u or not u.password_hash or not verify_password(body.password, u.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    ver = db.get(EmailVerification, u.id)
    if not ver or not ver.verified_at:
        raise HTTPException(status_code=403, detail="Email not verified. Please verify your email.")

    access = create_access_token(u.id)
    refresh = create_refresh_token(u.id)

    sess = AuthSession(
        user_id=u.id,
        refresh_token=refresh,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
        expires_at=datetime.utcnow() + timedelta(days=14),
    )
    db.add(sess)
    db.commit()

    return TokenOut(access_token=access, refresh_token=refresh)


@router.get("/verify-email")
def verify_email(token: str, request: Request, db: Session = Depends(db_sess)):
    try:
        data = decode_token(token)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    if data.get("typ") != "email_verify":
        raise HTTPException(status_code=400, detail="Invalid token type")

    uid = data.get("sub")
    email = (data.get("email") or "").lower()
    if not uid or not email:
        raise HTTPException(status_code=400, detail="Invalid token payload")

    u = db.get(User, uid)
    if not u or u.email.lower() != email:
        raise HTTPException(status_code=400, detail="Invalid token payload")

    ver = db.get(EmailVerification, uid)
    if not ver:
        raise HTTPException(status_code=400, detail="Verification record not found")
    already = bool(ver.verified_at)
    if ver.expires_at and ver.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification expired. Please request a new email.")

    if not already:
        ver.verified_at = datetime.utcnow()
        db.commit()

    return {
        "message": "already_verified" if already else "verified",
        # Flow B: verify -> login -> onboarding
        "next": f"/login?next=/onboarding/1&email={u.email}",
    }


@router.post("/resend-verification")
def resend_verification(body: EmailIn, db: Session = Depends(db_sess)):
    u = db.query(User).filter(User.email == body.email.lower()).first()
    if not u:
        # do not leak user existence
        return {"message": "ok"}

    ver = db.get(EmailVerification, u.id)
    if ver and ver.verified_at:
        return {"message": "already_verified"}

    exp = datetime.utcnow() + timedelta(hours=24)
    if not ver:
        ver = EmailVerification(user_id=u.id, expires_at=exp, verified_at=None)
        db.add(ver)
    ver.last_sent_at = datetime.utcnow()
    ver.expires_at = exp
    db.commit()

    token = create_email_verify_token(u.id, u.email)
    dev_url = _send_verify_email(u.email, token)
    out: dict = {"message": "sent"}
    if dev_url:
        out["dev_verify_url"] = dev_url
    return out


@router.post("/refresh", response_model=TokenOut)
def refresh_token(body: RefreshIn, db: Session = Depends(db_sess)):
    sess = db.query(AuthSession).filter(AuthSession.refresh_token == body.refresh_token).first()
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    try:
        data = decode_token(body.refresh_token)
        uid = data.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access = create_access_token(uid)
    new_refresh = create_refresh_token(uid)

    sess.refresh_token = new_refresh
    db.commit()

    return TokenOut(access_token=access, refresh_token=new_refresh)


@router.post("/logout")
def logout(body: RefreshIn, db: Session = Depends(db_sess)):
    sess = db.query(AuthSession).filter(AuthSession.refresh_token == body.refresh_token).first()
    if sess:
        db.delete(sess)
        db.commit()
    return {"message": "ok"}
