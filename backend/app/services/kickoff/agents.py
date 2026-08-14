# backend/app/services/kickoff/agents.py
"""Jordan / Priya independent Gemini inference for kickoff simulation."""
from __future__ import annotations

import re
from typing import Any

from .gemini_client import generate_stakeholder_reply, load_prompt


def _jordan_prompt() -> str:
    # Always reload so prompt edits apply without relying on process restart.
    return load_prompt("jordan_system.txt")


def _priya_prompt() -> str:
    return load_prompt("priya_system.txt")


def _enforce_length(text: str, *, max_sentences: int, max_chars: int) -> str:
    """Trim to a clean spoken turn without mid-word cuts when possible."""
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not text:
        return text

    parts = re.split(r"(?<=[.!?])\s+", text)
    parts = [p for p in parts if p.strip()]
    if len(parts) > max_sentences:
        text = " ".join(parts[:max_sentences])

    if len(text) <= max_chars:
        return text

    clipped = text[:max_chars]
    sentence_end = max(clipped.rfind(". "), clipped.rfind("! "), clipped.rfind("? "))
    if sentence_end >= int(max_chars * 0.45):
        return clipped[: sentence_end + 1].strip()

    word_end = clipped.rfind(" ")
    if word_end >= int(max_chars * 0.5):
        return clipped[:word_end].rstrip(",;:") + "."
    return clipped.rstrip(",;:") + "."


async def jordan_respond(runtime_context: dict[str, Any]) -> str:
    raw = await generate_stakeholder_reply(
        system_prompt=_jordan_prompt(),
        runtime_context=runtime_context,
        temperature=0.45,
        max_output_tokens=256,
    )
    return _enforce_length(raw, max_sentences=3, max_chars=360)


async def priya_respond(runtime_context: dict[str, Any]) -> str:
    raw = await generate_stakeholder_reply(
        system_prompt=_priya_prompt(),
        runtime_context=runtime_context,
        temperature=0.35,
        max_output_tokens=320,
    )
    return _enforce_length(raw, max_sentences=4, max_chars=480)
