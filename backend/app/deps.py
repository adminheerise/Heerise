from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from .db import SessionLocal
import os
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
