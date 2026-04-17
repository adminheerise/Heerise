# backend/app/routers/sim.py
"""Simulation helpers: server-side TTS so narration works without browser speechSynthesis."""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from ..deps import get_current_user_optional
from ..models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sim", tags=["sim"])

# Microsoft Edge neural voice (English US, female). See: edge-tts --list-voices
MAYA_VOICE = "en-US-JennyNeural"


def _maya_script(who: str) -> str:
    """Full briefing — 与前端 buildScriptLines 三段拼接结果一致。"""
    w = (who or "there").strip() or "there"
    return (
        f"Hey {w}. We've been asked to build sales enablement training for Aria Agent. "
        "The product just launched and the sales team is struggling to ramp. "
        "I'm assigning this to you as lead designer. "
        "You'll start to run the full analysis phase and schedule a kickoff call with Jordan Kiml "
        "(Sales Manager) and Dr. Priya Nair, the product lead. "
        "They're your key stakeholders. "
        "I'm sending you the project brief. "
        "Read it, then come back and let me know what you think you know, what you don't know "
        "(things to ask in the kickoff), and what questions you need answered before that call."
    )


@router.get("/maya-zoom-narration")
async def maya_zoom_narration(
    user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Stream MP3 (MPEG) audio: Maya's briefing with the caller's username (if logged in).
    Anonymous callers hear \"Hey there\".
    """
    try:
        import edge_tts  # type: ignore
    except ImportError as e:
        logger.exception("edge-tts not installed")
        raise HTTPException(status_code=503, detail="TTS unavailable") from e

    who = "there"
    if user is not None:
        who = (user.username or user.name or "there").strip() or "there"

    text = _maya_script(who)

    async def audio_stream():
        try:
            communicate = edge_tts.Communicate(text, MAYA_VOICE)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]
        except Exception:
            logger.exception("edge-tts stream failed")
            raise

    return StreamingResponse(
        audio_stream(),
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "private, no-store",
            "X-Robots-Tag": "noindex",
        },
    )
