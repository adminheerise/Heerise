# backend/app/services/kickoff/agents.py
"""Jordan / Priya independent Gemini inference for kickoff simulation."""
from __future__ import annotations

import re
from typing import Any

from .gemini_client import generate_stakeholder_reply, load_prompt

_JORDAN_PROMPT: str | None = None
_PRIYA_PROMPT: str | None = None


def _jordan_prompt() -> str:
    global _JORDAN_PROMPT
    if _JORDAN_PROMPT is None:
        _JORDAN_PROMPT = load_prompt("jordan_system.txt")
    return _JORDAN_PROMPT


def _priya_prompt() -> str:
    global _PRIYA_PROMPT
    if _PRIYA_PROMPT is None:
        _PRIYA_PROMPT = load_prompt("priya_system.txt")
    return _PRIYA_PROMPT


def _enforce_length(text: str, *, max_sentences: int, max_chars: int) -> str:
    text = re.sub(r"\s+", " ", (text or "").strip())
    if len(text) > max_chars:
        text = text[: max_chars - 1].rsplit(" ", 1)[0] + "…"
    parts = re.split(r"(?<=[.!?])\s+", text)
    parts = [p for p in parts if p.strip()]
    if len(parts) > max_sentences:
        text = " ".join(parts[:max_sentences])
    return text


async def jordan_respond(runtime_context: dict[str, Any]) -> str:
    raw = await generate_stakeholder_reply(
        system_prompt=_jordan_prompt(),
        runtime_context=runtime_context,
        temperature=0.45,
        max_output_tokens=120,
    )
    return _enforce_length(raw, max_sentences=3, max_chars=320)


async def priya_respond(runtime_context: dict[str, Any]) -> str:
    raw = await generate_stakeholder_reply(
        system_prompt=_priya_prompt(),
        runtime_context=runtime_context,
        temperature=0.35,
        max_output_tokens=160,
    )
    return _enforce_length(raw, max_sentences=4, max_chars=460)
