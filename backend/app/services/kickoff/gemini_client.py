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
GEMINI_TIMEOUT_SEC = float(os.getenv("GEMINI_KICKOFF_TIMEOUT_SEC", "3600"))


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
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": system_prompt + "\n\n---\nRuntime context (JSON):\n" + user_payload}],
            }
        ],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
        },
    }

    async with httpx.AsyncClient(timeout=GEMINI_TIMEOUT_SEC) as client:
        resp = await client.post(
            _model_url(),
            params={"key": api_key},
            json=payload,
        )
        if resp.status_code != 200:
            logger.error("Gemini kickoff error %s: %s", resp.status_code, resp.text[:500])
            raise RuntimeError(f"Gemini API returned {resp.status_code}")

        data = resp.json()
        candidates = data.get("candidates") or []
        if not candidates:
            raise RuntimeError("Gemini returned no candidates")

        parts = (candidates[0].get("content") or {}).get("parts") or []
        text = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
        text = text.strip()
        if not text:
            raise RuntimeError("Gemini returned empty text")
        return text
