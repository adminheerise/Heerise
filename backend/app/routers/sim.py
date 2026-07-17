# backend/app/routers/sim.py
"""Simulation helpers: server-side TTS so narration works without browser speechSynthesis."""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ..deps import get_current_user_optional
from ..models import User
from ..services.kickoff import agents as kickoff_agents
from ..services.outreach_email import score_outreach_email
from ..services.manager_debrief import fallback_debrief, generate_manager_debrief

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sim", tags=["sim"])


class OutreachEmailScoreIn(BaseModel):
    subject: str = Field(default="", max_length=500)
    body: str = Field(min_length=1, max_length=5000)


class CriterionScoreOut(BaseModel):
    id: str
    score: int
    feedback: str


class OutreachEmailScoreOut(BaseModel):
    criteria: list[CriterionScoreOut]
    total_score: int
    overall_level: str
    stakeholder_response: str
    word_count: int

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


class KickoffAgentIn(BaseModel):
    runtime_context: dict = Field(default_factory=dict)


class KickoffAgentOut(BaseModel):
    spoken_response: str


@router.post("/kickoff/jordan/respond", response_model=KickoffAgentOut)
async def kickoff_jordan_respond(body: KickoffAgentIn):
    """Independent Jordan Kim inference for Phase 5 live call."""
    try:
        text = await kickoff_agents.jordan_respond(body.runtime_context or {})
        return KickoffAgentOut(spoken_response=text)
    except RuntimeError as e:
        msg = str(e)
        if "GEMINI_API_KEY" in msg:
            raise HTTPException(status_code=503, detail="Kickoff agents are not configured") from e
        logger.exception("kickoff jordan respond failed")
        raise HTTPException(status_code=502, detail=msg) from e
    except Exception as e:
        logger.exception("kickoff jordan respond failed")
        raise HTTPException(status_code=502, detail="Failed to generate Jordan response") from e


@router.post("/kickoff/priya/respond", response_model=KickoffAgentOut)
async def kickoff_priya_respond(body: KickoffAgentIn):
    """Independent Dr. Priya Nair inference for Phase 5 live call."""
    try:
        text = await kickoff_agents.priya_respond(body.runtime_context or {})
        return KickoffAgentOut(spoken_response=text)
    except RuntimeError as e:
        msg = str(e)
        if "GEMINI_API_KEY" in msg:
            raise HTTPException(status_code=503, detail="Kickoff agents are not configured") from e
        logger.exception("kickoff priya respond failed")
        raise HTTPException(status_code=502, detail=msg) from e
    except Exception as e:
        logger.exception("kickoff priya respond failed")
        raise HTTPException(status_code=502, detail="Failed to generate Priya response") from e


@router.post("/outreach-email-score", response_model=OutreachEmailScoreOut)
async def outreach_email_score(body: OutreachEmailScoreIn):
    """Score outreach email against the 7-criterion rubric via Gemini."""
    try:
        result = await score_outreach_email(body.subject, body.body)
        return result
    except RuntimeError as e:
        msg = str(e)
        if "GEMINI_API_KEY" in msg:
            raise HTTPException(status_code=503, detail="Email scoring is not configured") from e
        logger.exception("outreach email score failed")
        raise HTTPException(status_code=502, detail=msg) from e
    except Exception as e:
        logger.exception("outreach email score failed")
        raise HTTPException(status_code=502, detail="Failed to score email") from e


class ManagerDebriefIn(BaseModel):
    report: dict = Field(default_factory=dict)


class ManagerDebriefOut(BaseModel):
    headline: str = ""
    score_strip: list = Field(default_factory=list)
    sections: list = Field(default_factory=list)
    source: str = "gemini"


@router.post("/manager-debrief", response_model=ManagerDebriefOut)
async def manager_debrief(body: ManagerDebriefIn):
    """Phase 6: generate collapsible Maya analysis from a structured scoring report."""
    report = body.report or {}
    try:
        result = await generate_manager_debrief(report)
        return ManagerDebriefOut(**{
            "headline": result.get("headline") or "Simulation Complete — Your Performance Summary",
            "score_strip": result.get("score_strip") or [],
            "sections": result.get("sections") or [],
            "source": result.get("source") or "gemini",
        })
    except RuntimeError as e:
        msg = str(e)
        if "GEMINI_API_KEY" in msg:
            fb = fallback_debrief(report)
            return ManagerDebriefOut(**fb)
        logger.exception("manager debrief failed; using fallback")
        fb = fallback_debrief(report)
        return ManagerDebriefOut(**fb)
    except Exception:
        logger.exception("manager debrief failed; using fallback")
        fb = fallback_debrief(report)
        return ManagerDebriefOut(**fb)


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
