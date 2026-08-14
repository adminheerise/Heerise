# backend/app/services/kickoff/gemini_client.py
"""Shared Gemini client for kickoff call agents."""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
# Keep kickoff turns snappy; frontend falls back if this budget is exceeded.
# Spoken turns are short; 40s covers cold starts / occasional Gemini lag.
# Keep frontend API_TIMEOUT_MS a few seconds higher so the client does not abort first.
GEMINI_TIMEOUT_SEC = float(os.getenv("GEMINI_KICKOFF_TIMEOUT_SEC", "40"))


def _model_url() -> str:
    return (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent"
    )


def load_prompt(name: str) -> str:
    path = _PROMPTS_DIR / name
    if not path.is_file():
        raise FileNotFoundError(f"Missing kickoff prompt: {path}")
    return path.read_text(encoding="utf-8").strip()


def _extract_visible_text(parts: list[Any]) -> str:
    """Join model text parts, skipping Gemini 2.5 thinking/thought parts."""
    chunks: list[str] = []
    for part in parts:
        if not isinstance(part, dict):
            continue
        if part.get("thought") is True:
            continue
        text = part.get("text")
        if isinstance(text, str) and text.strip():
            chunks.append(text)
    return "".join(chunks).strip()


async def generate_stakeholder_reply(
    *,
    system_prompt: str,
    runtime_context: dict[str, Any],
    temperature: float,
    max_output_tokens: int,
) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    import json

    user_payload = json.dumps(runtime_context, ensure_ascii=False)
    contents = [
        {
            "role": "user",
            "parts": [
                {
                    "text": system_prompt
                    + "\n\n---\nRuntime context (JSON):\n"
                    + user_payload
                }
            ],
        }
    ]
    # Prefer thinkingBudget=0 so maxOutputTokens go to spoken dialogue.
    # Fall back without thinkingConfig if the model/API rejects it.
    configs = [
        {
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
            "thinkingConfig": {"thinkingBudget": 0},
        },
        {
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
        },
    ]

    async with httpx.AsyncClient(timeout=GEMINI_TIMEOUT_SEC) as client:
        last_error: Exception | None = None
        for generation_config in configs:
            payload = {"contents": contents, "generationConfig": generation_config}
            resp = await client.post(
                _model_url(),
                params={"key": api_key},
                json=payload,
            )
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates") or []
                if not candidates:
                    last_error = RuntimeError("Gemini returned no candidates")
                    continue
                parts = (candidates[0].get("content") or {}).get("parts") or []
                text = _extract_visible_text(parts)
                if text:
                    return text
                last_error = RuntimeError("Gemini returned empty text")
                continue
            # Retry without thinkingConfig on 400; otherwise fail
            logger.error("Gemini kickoff error %s: %s", resp.status_code, resp.text[:500])
            last_error = RuntimeError(f"Gemini API returned {resp.status_code}")
            if resp.status_code != 400:
                break
        raise last_error or RuntimeError("Gemini request failed")
