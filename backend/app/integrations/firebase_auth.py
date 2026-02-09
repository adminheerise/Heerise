from __future__ import annotations

from ..interfaces.auth_provider import AuthProvider, AuthIdentity


class FirebaseAuthProvider(AuthProvider):
    """
    Placeholder for Firebase Auth integration.

    Not implemented by design (local demo phase).
    When you are ready to go live, this should verify Firebase ID tokens and
    return AuthIdentity (user_id, email, raw claims).
    """

    def verify_bearer_token(self, token: str) -> AuthIdentity:
        raise NotImplementedError("Firebase Auth is not integrated yet")

