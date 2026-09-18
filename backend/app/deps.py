from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from typing import Optional
from .db import SessionLocal
import os
import secrets
from .models import User, UserRole
from .integrations.local_jwt_auth import LocalJwtAuthProvider
from .integrations.firebase_auth import FirebaseAuthProvider

bearer_scheme = HTTPBearer(auto_error=False)

def db_sess():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(db_sess),
) -> User:
    if cred is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        # Pluggable auth provider (local demo defaults to Local JWT).
        use_firebase = os.getenv("USE_FIREBASE_AUTH", "").strip().lower() in ("1", "true", "yes")
        provider = FirebaseAuthProvider() if use_firebase else LocalJwtAuthProvider()
        ident = provider.verify_bearer_token(cred.credentials)
        user = db.get(User, ident.user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except NotImplementedError as e:
        # When USE_FIREBASE_AUTH is enabled but Firebase integration isn't wired yet.
        raise HTTPException(status_code=501, detail=str(e) or "Auth provider not implemented")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user


def require_lumina_admin_key(
    x_lumina_admin_key: Optional[str] = Header(None, alias="X-Lumina-Admin-Key"),
) -> None:
    """Protect Lumina test-user read APIs with a dedicated admin key (not Heerise admin JWT)."""
    expected = (os.getenv("LUMINA_ADMIN_KEY") or "").strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LUMINA_ADMIN_KEY is not configured",
        )
    provided = (x_lumina_admin_key or "").strip()
    if not provided or not secrets.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Lumina admin key",
        )


def get_current_user_optional(
    cred: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(db_sess),
) -> Optional[User]:
    """Same verification as get_current_user, but returns None if missing/invalid token."""
    if cred is None:
        return None
    try:
        use_firebase = os.getenv("USE_FIREBASE_AUTH", "").strip().lower() in ("1", "true", "yes")
        provider = FirebaseAuthProvider() if use_firebase else LocalJwtAuthProvider()
        ident = provider.verify_bearer_token(cred.credentials)
        user = db.get(User, ident.user_id)
        return user
    except Exception:
        return None
