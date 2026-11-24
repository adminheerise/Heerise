# -*- coding: utf-8 -*-
"""Job Simulation LLM proxy + explore catalog (server-side Gemini only)."""
from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock
from typing import Any, Deque, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..deps import db_sess
from ..models import JobSimUser
from ..routers.job_sim import _client_ip, get_job_sim_user
from ..services.job_sim import catalog as catalog_svc
from ..services.job_sim.direction import normalize_direction_key
from ..services.job_sim.gemini import api_key_configured, generate_json
from ..services.job_sim.safety import check_user_text

router = APIRouter(prefix="/job-sim", tags=["job-sim-ai"])

# Authenticated LLM calls: allow a full practice session (turns + hints + debrief).
_LLM_RATE_LIMIT = 60
_LLM_RATE_WINDOW_SEC = 600
_llm_hits: Dict[str, Deque[float]] = defaultdict(deque)
_llm_lock = Lock()


def _llm_rate_limit_or_raise(ip: str) -> None:
    now = time.time()
    with _llm_lock:
        q = _llm_hits[ip]
        while q and now - q[0] > _LLM_RATE_WINDOW_SEC:
            q.popleft()
        if len(q) >= _LLM_RATE_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many Job Simulation requests. Please try again in a few minutes.",
            )
        q.append(now)


class ParseJdIn(BaseModel):
    jd_text: str = Field(min_length=20, max_length=20000)


class CareerGuideIn(BaseModel):
    query: str = Field(min_length=1, max_length=200)


class ProjectsMoreIn(BaseModel):
    role_title: str = Field(min_length=1, max_length=200)
    responsibilities: list[str] = Field(default_factory=list)
    batch_index: int = Field(default=0, ge=0, le=2)


class TurnIn(BaseModel):
    role_title: str
    project: dict[str, Any]
    messages: list[dict[str, str]]
    turn_count: int = Field(ge=1, le=20)
    max_turns: int = Field(default=8, ge=3, le=12)


class HintIn(BaseModel):
    role_title: str
    project: dict[str, Any]
    messages: list[dict[str, str]]
    level: int = Field(ge=1, le=5)


class DebriefIn(BaseModel):
    role_title: str
    project: dict[str, Any]
    messages: list[dict[str, str]]
    max_hint_level_used: int = Field(default=0, ge=0, le=5)
    support_history: list[dict[str, Any]] = Field(default_factory=list)


class CatalogStoreIn(BaseModel):
    source_query: str = Field(default="", max_length=255)
    career: dict[str, Any]


class CompleteIn(BaseModel):
    """Generic JSON completion used by the Job Simulation SPA (prompts stay server-gated by auth)."""
    system_instruction: str = Field(min_length=10, max_length=12000)
    user_prompt: str = Field(min_length=1, max_length=24000)
    temperature: float = Field(default=0.4, ge=0.0, le=1.0)


def _blocked_or_raise(text: str) -> None:
    ok, reason = check_user_text(text)
    if not ok:
        raise HTTPException(status_code=400, detail={"code": "CONTENT_BLOCKED", "reason": reason})


@router.get("/status")
def job_sim_status():
    return {
        "ok": True,
        "llm": "gemini",
        "api_key_configured": api_key_configured(),
        "fallback_mode": not api_key_configured(),
    }


@router.get("/explore-catalog")
def get_explore_catalog(
    direction: Optional[str] = None,
    limit: int = 48,
    db: Session = Depends(db_sess),
):
    if direction:
        return {
            "direction_key": normalize_direction_key(direction),
            "items": catalog_svc.list_by_direction(db, direction),
        }
    return {"items": catalog_svc.list_all(db, limit=limit)}


@router.post("/explore-catalog")
def post_explore_catalog(
    body: CatalogStoreIn,
    request: Request,
    user: JobSimUser = Depends(get_job_sim_user),
    db: Session = Depends(db_sess),
):
    _llm_llm_rate_limit_or_raise(_client_ip(request))
    title = str((body.career or {}).get("title") or body.source_query or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="career.title or source_query required")
    return catalog_svc.try_store_career(
        db,
        title=title,
        source_query=body.source_query or title,
        career=body.career,
    )


@router.post("/llm/complete")
async def llm_complete(
    body: CompleteIn,
    request: Request,
    user: JobSimUser = Depends(get_job_sim_user),
):
    """Server-side Gemini JSON proxy. Browser never holds an API key."""
    _llm_rate_limit_or_raise(_client_ip(request))
    _blocked_or_raise(body.user_prompt)
    parsed = await generate_json(
        system_instruction=body.system_instruction,
        user_prompt=body.user_prompt,
        temperature=body.temperature,
    )
    if not parsed:
        return {"ok": False, "fallback": True, "result": None}
    return {"ok": True, "fallback": False, "result": parsed}


@router.post("/llm/parse-jd")
async def llm_parse_jd(
    body: ParseJdIn,
    request: Request,
    user: JobSimUser = Depends(get_job_sim_user),
):
    _llm_rate_limit_or_raise(_client_ip(request))
    _blocked_or_raise(body.jd_text)
    sys = (
        "You are an expert career coach and simulation designer. Given a job description, "
        "translate what the role actually involves into 4 concise plain-English responsibilities, "
        "and generate 3 realistic workplace projects (1 Easy, 1 Medium, 1 Hard) with observable "
        "evaluation criteria and simulationSetup. Never use em dashes. "
        "Return ONLY valid JSON with: title, orgType, plainResponsibilities, projects."
    )
    parsed = await generate_json(system_instruction=sys, user_prompt=body.jd_text)
    if not parsed:
        return {"ok": False, "fallback": True, "result": None}
    return {"ok": True, "fallback": False, "result": parsed}


@router.post("/llm/career-guide")
async def llm_career_guide(
    body: CareerGuideIn,
    request: Request,
    user: JobSimUser = Depends(get_job_sim_user),
    db: Session = Depends(db_sess),
):
    _llm_rate_limit_or_raise(_client_ip(request))
    _blocked_or_raise(body.query)

    sys = f"""You are an expert career advisor and workplace simulation architect.
Create a complete career exploration guide and 3 realistic workplace projects
(1 Easy, 1 Medium, 1 Hard) for the career role: "{body.query}".
Do NOT use em dashes. Ensure every simulationSetup.openingLine ends with ONLY ONE clear question.
Return ONLY valid JSON with:
title, shortDesc, whatTheyDo, typicalWorkday, typicalProjects, skillsAndTools,
challenges, relatedCareers, projects (array of 3 with full project fields including simulationSetup)."""

    parsed = await generate_json(
        system_instruction=sys,
        user_prompt=f"Generate career exploration guide and 3 leveled projects for: {body.query}",
    )
    if parsed:
        # fire store attempt (ignore failure of uniqueness races)
        try:
            catalog_svc.try_store_career(
                db,
                title=str(parsed.get("title") or body.query),
                source_query=body.query,
                career=parsed,
            )
        except Exception:
            db.rollback()
        return {"ok": True, "fallback": False, "result": parsed, "source": "gemini"}

    fb = catalog_svc.pick_fallback(db, body.query)
    if fb:
        return {
            "ok": True,
            "fallback": True,
            "result": fb.get("career"),
            "source": "catalog",
            "catalog_meta": {"id": fb.get("id"), "direction_key": fb.get("direction_key")},
        }
    return {"ok": False, "fallback": True, "result": None, "source": "none"}


@router.post("/llm/projects-more")
async def llm_projects_more(
    body: ProjectsMoreIn,
    request: Request,
    user: JobSimUser = Depends(get_job_sim_user),
):
    _llm_rate_limit_or_raise(_client_ip(request))
    resp = "; ".join(body.responsibilities[:12])
    sys = (
        f"Generate exactly 3 workplace simulation projects (Easy, Medium, Hard) for role "
        f"{body.role_title}. Batch {body.batch_index + 1}. "
        "Each project needs: id, difficulty, title, shortDesc, tags, businessContext, objective, "
        "yourRole, deliverables, challenges, skillsApplied, rubric (4 observable behaviors), "
        "simulationSetup {{stakeholderName, stakeholderRole, setScene, openingLine}}. "
        "Return JSON {{ projects: [...] }}."
    )
    parsed = await generate_json(
        system_instruction=sys,
        user_prompt=f"Role: {body.role_title}\nResponsibilities: {resp}",
    )
    if not parsed:
        return {"ok": False, "fallback": True, "result": None}
    return {"ok": True, "fallback": False, "result": parsed}


@router.post("/llm/turn")
async def llm_turn(
    body: TurnIn,
    request: Request,
    user: JobSimUser = Depends(get_job_sim_user),
):
    _llm_rate_limit_or_raise(_client_ip(request))
    last_user = ""
    for m in reversed(body.messages):
        if m.get("role") == "user":
            last_user = m.get("content") or ""
            break
    _blocked_or_raise(last_user or "x")

    p = body.project or {}
    setup = p.get("simulationSetup") or {}
    transcript = "\n".join(
        f"{'USER' if m.get('role') == 'user' else setup.get('stakeholderName', 'Stakeholder')}: {m.get('content', '')}"
        for m in body.messages
    )
    sys = f"""You are playing {setup.get('stakeholderName', 'Alex')} ({setup.get('stakeholderRole', 'Stakeholder')})
in a focused workplace simulation. The user is a {body.role_title} on "{p.get('title', 'project')}".
Business Context: {p.get('businessContext', '')}
Objective: {p.get('objective', '')}
Ask ONE question at a time. Never use em dashes.
Return JSON: {{ "reply": "...", "isComplete": false }}
Set isComplete true only if turn_count >= 5 AND user proposed a concrete next step,
or turn_count >= {body.max_turns}."""
    parsed = await generate_json(
        system_instruction=sys,
        user_prompt=f"Current turn: {body.turn_count}/{body.max_turns}\nConversation:\n{transcript}",
    )
    if not parsed:
        return {
            "ok": False,
            "fallback": True,
            "result": {
                "reply": "What outcome are you recommending, and what evidence supports it?",
                "isComplete": body.turn_count >= body.max_turns,
            },
        }
    return {"ok": True, "fallback": False, "result": parsed}


@router.post("/llm/hint")
async def llm_hint(
    body: HintIn,
    request: Request,
    user: JobSimUser = Depends(get_job_sim_user),
):
    _llm_rate_limit_or_raise(_client_ip(request))
    p = body.project or {}
    setup = p.get("simulationSetup") or {}
    transcript = "\n".join(
        f"{m.get('role', '')}: {m.get('content', '')}" for m in body.messages[-8:]
    )
    levels = {
        1: "Open-ended prompt only. Ask one gentle follow-up question.",
        2: "Directional hint: one or two considerations, do not reveal the answer.",
        3: "Structured options: 2-3 approaches with brief trade-offs; ask user to choose.",
        4: "Example response sketch the user can adapt (not a full model answer).",
        5: "Model answer with short reasoning, then invite the user to continue.",
    }
    sys = (
        f"You coach a {body.role_title} in a simulation. Hint level {body.level}: {levels.get(body.level, '')} "
        "Return JSON {{ hintText, label }}. No em dashes. Do not shame the user."
    )
    parsed = await generate_json(
        system_instruction=sys,
        user_prompt=f"Scene: {setup.get('setScene', '')}\nObjective: {p.get('objective', '')}\nRecent:\n{transcript}",
    )
    if not parsed:
        defaults = {
            1: "What information would help you decide how to approach this?",
            2: "Consider both stakeholder impact and delivery constraints before choosing a path.",
            3: "Option A: gather more data. Option B: propose a scoped pilot. Option C: align on the decision criteria first. Which fits and why?",
            4: "A professional might say: 'Here is the trade-off I see, and the recommendation I would make next.' Adapt that to your case.",
            5: "Model: Clarify the goal, cite one metric, propose one next step, and ask if they agree. Continue in your own words.",
        }
        return {
            "ok": False,
            "fallback": True,
            "result": {
                "hintText": defaults.get(body.level, defaults[1]),
                "label": f"Level {body.level}",
            },
        }
    return {"ok": True, "fallback": False, "result": parsed}


@router.post("/llm/debrief")
async def llm_debrief(
    body: DebriefIn,
    request: Request,
    user: JobSimUser = Depends(get_job_sim_user),
):
    _llm_rate_limit_or_raise(_client_ip(request))
    p = body.project or {}
    rubric = p.get("rubric") or []
    transcript = "\n".join(
        f"[{i+1}] {m.get('role')}: {m.get('content')}" for i, m in enumerate(body.messages)
    )
    sys = (
        "You evaluate a workplace simulation with a predefined rubric. "
        "For each rubric item assign one of: Demonstrated Independently, Demonstrated with Support, "
        "Demonstrated after Modeling, Not Yet Demonstrated. Cite brief evidence. "
        "Return JSON: { summary, competencies: [{ name, level, evidence }], recommendations: [..] }. "
        "No em dashes. Keep actionable and concise."
    )
    parsed = await generate_json(
        system_instruction=sys,
        user_prompt=(
            f"Role: {body.role_title}\nProject: {p.get('title')}\n"
            f"Rubric: {rubric}\nMax hint level: {body.max_hint_level_used}\n"
            f"Support: {body.support_history}\nTranscript:\n{transcript}"
        ),
    )
    if not parsed:
        level = (
            "Demonstrated Independently"
            if body.max_hint_level_used == 0
            else (
                "Demonstrated with Support"
                if body.max_hint_level_used <= 3
                else "Demonstrated after Modeling"
            )
        )
        comps = [
            {
                "name": str(r),
                "level": level,
                "evidence": "Review your dialogue for concrete recommendations and stakeholder handling.",
            }
            for r in (rubric[:4] if rubric else ["Clarify the problem", "Use evidence", "Handle pushback", "Propose next step"])
        ]
        return {
            "ok": False,
            "fallback": True,
            "result": {
                "summary": "You completed the practice scenario. Focus next on clearer evidence and a concrete ask.",
                "competencies": comps,
                "recommendations": [
                    "Lead with the decision criteria before the recommendation.",
                    "Name one metric or constraint when answering pushback.",
                ],
            },
        }
    return {"ok": True, "fallback": False, "result": parsed}
