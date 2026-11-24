# -*- coding: utf-8 -*-
"""Server-side Gemini JSON helper for Job Simulation (key optional / placeholder)."""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)

GEMINI_MODEL = (
    os.getenv("JOB_SIM_GEMINI_MODEL")
    or os.getenv("GEMINI_MODEL")
    or "gemini-2.5-flash"
).strip()
GEMINI_TIMEOUT_SEC = float(os.getenv("JOB_SIM_GEMINI_TIMEOUT_SEC", "55"))


def _api_key() -> str:
    return (
        (os.getenv("JOB_SIM_GEMINI_API_KEY") or "").strip()
        or (os.getenv("GEMINI_API_KEY") or "").strip()
    )


def api_key_configured() -> bool:
    return bool(_api_key())


def _extract_json(text: str) -> Optional[dict[str, Any]]:
    if not text:
        return None
    cleaned = text.replace("```json", "").replace("```", "").strip()
    try:
        obj = json.loads(cleaned)
        return obj if isinstance(obj, dict) else None
    except Exception:
        pass
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        try:
            obj = json.loads(cleaned[start : end + 1])
            return obj if isinstance(obj, dict) else None
        except Exception:
            return None
    return None


def _strip_em_dashes(obj: Any) -> Any:
    if isinstance(obj, str):
        return obj.replace("\u2014", "-").replace("\u2013", "-")
    if isinstance(obj, list):
        return [_strip_em_dashes(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _strip_em_dashes(v) for k, v in obj.items()}
    return obj


async def generate_json(
    *,
    system_instruction: str,
    user_prompt: str,
    temperature: float = 0.4,
) -> Optional[dict[str, Any]]:
    """
    Call Gemini and parse JSON.
    Returns None when key missing, timeout, or parse failure (caller uses fallback).
    """
    api_key = _api_key()
    if not api_key:
        logger.info("Job Sim Gemini skipped: GEMINI_API_KEY not set")
        return None

    strict = (
        f"{system_instruction}\n"
        "IMPORTANT RULES: Never use em dashes in any text field. "
        "Keep questions strictly one question at a time. "
        "Return ONLY valid JSON."
    )
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent"
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "systemInstruction": {"parts": [{"text": strict}]},
        "generationConfig": {
            "temperature": temperature,
            "responseMimeType": "application/json",
        },
    }

    try:
        async with httpx.AsyncClient(timeout=GEMINI_TIMEOUT_SEC) as client:
            resp = await client.post(url, params={"key": api_key}, json=payload)
            if resp.status_code != 200:
                logger.error(
                    "Job Sim Gemini HTTP %s: %s",
                    resp.status_code,
                    resp.text[:400],
                )
                return None
            data = resp.json()
            candidates = data.get("candidates") or []
            if not candidates:
                return None
            parts = (candidates[0].get("content") or {}).get("parts") or []
            raw = ""
            for part in parts:
                if isinstance(part, dict) and part.get("thought") is True:
                    continue
                if isinstance(part, dict) and isinstance(part.get("text"), str):
                    raw += part["text"]
            parsed = _extract_json(raw)
            if not parsed:
                return None
            return _strip_em_dashes(parsed)
    except Exception as e:
        logger.warning("Job Sim Gemini failed: %s", repr(e))
        return None
