# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ..schemas import RegisterIn, LoginIn, TokenOut, RefreshIn
from ..models import User, AuthSession
from ..security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from ..deps import db_sess

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
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

    u = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        name=body.name,              # Full Name
        username=body.username,      # User Name
    )
    db.add(u)
    db.flush()

    # 4) 生成 token + session
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


@router.post("/login", response_model=TokenOut)
def login(
    body: LoginIn,
    request: Request,                
    db: Session = Depends(db_sess),
):
    u = db.query(User).filter(User.email == body.email.lower()).first()
    if not u or not u.password_hash or not verify_password(body.password, u.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

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
