from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage


def send_email(
    to_email: str,
    subject: str,
    text_body: str,
    *,
    from_email: str | None = None,
    reply_to: str | None = None,
) -> None:
    """
    Send a plain-text email via SMTP.

    Required env:
      SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

    Optional env:
      SMTP_FROM (default "From" if from_email not provided)

    If SMTP_HOST is not set, this function raises RuntimeError.
    """
    host = os.getenv("SMTP_HOST", "").strip()
    if not host:
        raise RuntimeError("SMTP is not configured (SMTP_HOST missing)")

    port = int(os.getenv("SMTP_PORT", "587"))
    use_ssl = os.getenv("SMTP_SSL", "").strip().lower() in ("1", "true", "yes") or port == 465
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASS", "").strip()
    default_from = os.getenv("SMTP_FROM", user).strip()
    chosen_from = (from_email or default_from).strip()
    if not chosen_from:
        chosen_from = user

    msg = EmailMessage()
    msg["From"] = chosen_from
    msg["To"] = to_email
    msg["Subject"] = subject
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content(text_body)

    if use_ssl:
        with smtplib.SMTP_SSL(host, port, timeout=20) as s:
            s.ehlo()
            if user and password:
                s.login(user, password)
            s.send_message(msg)
    else:
        with smtplib.SMTP(host, port, timeout=20) as s:
            s.ehlo()
            # common for 587
            try:
                s.starttls()
                s.ehlo()
            except Exception:
                # allow non-TLS SMTP servers
                pass
            if user and password:
                s.login(user, password)
            s.send_message(msg)


