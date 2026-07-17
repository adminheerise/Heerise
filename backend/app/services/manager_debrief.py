# backend/app/services/manager_debrief.py
"""Phase 6 Manager Debrief — Gemini generates collapsible phase analysis from a scoring report."""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

import httpx

logger = logging.getLogger(__name__)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)

SYSTEM_PROMPT = """
You are Maya Chen, a supportive L&D manager debriefing a learner after a stakeholder kickoff simulation.

You receive a structured scoring report with evidence from Phases 1–5.
Write a performance analysis the learner can review in a coaching bubble.

Rules:
- Speak as Maya: warm, direct, professional. Second person ("you").
- Do NOT invent facts, scores, quotes, or evidence that are not in the report.
- If a phase has missing evidence, say briefly what was missing — do not fabricate results.
- Do NOT rewrite or invent a closing farewell; the UI already shows a fixed closing message.
- Do NOT change the numeric scores; explain them using the evidence provided.
- Keep each section body under 120 words. collapsed_summary under 18 words.
- Return ONLY valid JSON matching the schema below.

Schema:
{
  "headline": "Simulation Complete — Your Performance Summary",
  "score_strip": [
    {"phase": 1, "label": "Knowing What You Don't Know", "tier": "strong|partial|weak", "one_liner": "..."}
  ],
  "sections": [
    {
      "phase": 1,
      "title": "Phase 1 · Knowing What You Don't Know",
      "collapsed_summary": "...",
      "body": "..."
    }
  ]
}

Include exactly 5 items in score_strip and exactly 5 sections for phases 1–5.
Use tier labels: strong (score 3), partial (score 2), weak (score 1).
"""


def _extract_json(text: str) -> dict[str, Any]:
    text = (text or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def _tier_from_score(score: int) -> str:
    if score >= 3:
        return "strong"
    if score >= 2:
        return "partial"
    return "weak"


def fallback_debrief(report: dict[str, Any]) -> dict[str, Any]:
    """Rule-based short analysis when Gemini is unavailable."""
    scores = report.get("scores") or [2, 2, 2, 2, 2]
    labels = [
        "Knowing What You Don't Know",
        "Hypothesis-driven Research",
        "Stakeholder Credibility",
        "Agenda Design",
        "Discovery Facilitation",
    ]
    strip = []
    sections = []
    for i, label in enumerate(labels):
        score = int(scores[i]) if i < len(scores) else 2
        score = max(1, min(3, score))
        tier = _tier_from_score(score)
        strip.append(
            {
                "phase": i + 1,
                "label": label,
                "tier": tier,
                "one_liner": f"Rated {tier} based on your Phase {i + 1} evidence.",
            }
        )
        body = (
            f"Your Phase {i + 1} result is {tier}. "
            "Open this section after reconnecting for a fuller coach write-up, "
            "or review the evidence from that phase in your notes and results screens."
        )
        if i == 0:
            p1 = report.get("phase1") or {}
            if p1.get("passed"):
                body = (
                    "You completed the gap analysis cleanly (CC-01). "
                    "Separating confirmed facts, research tasks, and stakeholder questions "
                    "is the foundation of efficient discovery."
                )
            elif p1:
                body = (
                    "Gap analysis still had gaps or misplacements. "
                    "Revisit what is Known vs Research vs Stakeholder before the next kickoff."
                )
        if i == 1:
            p2 = report.get("phase2") or {}
            hyp = (p2.get("hypothesis") or "").strip()
            if hyp:
                body = f'Your working hypothesis was: "{hyp[:220]}". Use the kickoff to test and refine it.'
            else:
                body = "No one-hypothesis was saved. Next time, converge research into one testable claim."
        if i == 2:
            p3 = report.get("phase3") or {}
            level = p3.get("overall_level") or tier.upper()
            body = f"Outreach email overall level: {level}. Use the criterion feedback as evidence of credibility."
        if i == 3:
            p4 = report.get("phase4") or {}
            fb = (p4.get("feedback") or "").strip()
            body = fb[:400] if fb else f"Agenda design rated {tier}. Check diagnostics for what to fix."
        if i == 4:
            p5 = report.get("phase5") or {}
            dps = p5.get("dp_results") or {}
            body = (
                f"Kickoff overall {p5.get('overall_tier') or tier}. "
                f"Decision points — DP5: {dps.get('DP5') or 'n/a'}, "
                f"DP6: {dps.get('DP6') or 'n/a'}, DP7: {dps.get('DP7') or 'n/a'}."
            )
        sections.append(
            {
                "phase": i + 1,
                "title": f"Phase {i + 1} · {label}",
                "collapsed_summary": strip[-1]["one_liner"],
                "body": body,
            }
        )
    return {
        "headline": "Simulation Complete — Your Performance Summary",
        "score_strip": strip,
        "sections": sections,
        "source": "fallback",
    }


async def generate_manager_debrief(report: dict[str, Any]) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    user_prompt = (
        "Scoring report JSON:\n"
        + json.dumps(report, ensure_ascii=False)[:14000]
        + "\n\nWrite the debrief JSON now."
    )

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": SYSTEM_PROMPT + "\n\n" + user_prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
        resp = await client.post(
            GEMINI_URL,
            params={"key": api_key},
            json=payload,
        )
        if resp.status_code != 200:
            logger.error("Gemini manager debrief error %s: %s", resp.status_code, resp.text[:500])
            raise RuntimeError(f"Gemini API returned {resp.status_code}")

        data = resp.json()
        candidates = data.get("candidates") or []
        if not candidates:
            raise RuntimeError("Gemini returned no candidates")
        parts = (((candidates[0] or {}).get("content") or {}).get("parts")) or []
        text = ""
        for part in parts:
            if isinstance(part, dict) and part.get("text"):
                text += part["text"]
        parsed = _extract_json(text)
        if not isinstance(parsed, dict):
            raise RuntimeError("Gemini returned invalid JSON")
        parsed["source"] = "gemini"
        return parsed
