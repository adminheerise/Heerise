from __future__ import annotations

from typing import Protocol


class Mailer(Protocol):
    """Pluggable mailer (SMTP now; Gmail API/SendGrid later)."""

    def send(
        self,
        *,
        to_email: str,
        subject: str,
        text_body: str,
        from_email: str | None = None,
        reply_to: str | None = None,
    ) -> None:
        ...

