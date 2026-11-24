# -*- coding: utf-8 -*-
"""Lightweight content checks before calling Gemini."""
from __future__ import annotations

from typing import Optional, Tuple

# Minimal starter list; expand via ops later (zh/en core for MVP).
_BLOCK = {
    "fuck", "shit", "bitch", "asshole", "cunt",
    "傻逼", "操你", "妈的", "屌",
}

_MAX_CHARS = 20_000


def check_user_text(text: str) -> Tuple[bool, Optional[str]]:
    raw = (text or "").strip()
    if not raw:
        return False, "empty"
    if len(raw) > _MAX_CHARS:
        return False, "too_long"
    lowered = raw.lower()
    for w in _BLOCK:
        if w and w in lowered:
            return False, "profanity"
    return True, None
