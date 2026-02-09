from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, Any


@dataclass(frozen=True)
class AuthIdentity:
    """A minimal identity extracted from an auth token."""

    user_id: str
    email: str | None = None
    raw: dict[str, Any] | None = None


class AuthProvider(Protocol):
    """Pluggable auth provider (Local JWT now; Firebase later)."""

    def verify_bearer_token(self, token: str) -> AuthIdentity:
        ...

