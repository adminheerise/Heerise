from __future__ import annotations

from ..interfaces.auth_provider import AuthProvider, AuthIdentity
from ..security import decode_token


class LocalJwtAuthProvider(AuthProvider):
    """Current auth: our own JWT (HS256) issued by backend/app/security.py."""

    def verify_bearer_token(self, token: str) -> AuthIdentity:
        data = decode_token(token)
        uid = data.get("sub")
        if not uid:
            raise ValueError("Invalid token payload (missing sub)")
        return AuthIdentity(user_id=str(uid), email=data.get("email"), raw=dict(data))

