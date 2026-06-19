# backend/app/services/outreach_email.py
"""Score stakeholder kickoff outreach emails via Gemini."""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Literal

import httpx

logger = logging.getLogger(__name__)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)

CRITERION_IDS = [
    "subject_line",
    "context_credibility",
    "meeting_purpose",
    "pre_call_question",
    "scheduling",
    "close",
    "tone_word_count",
]

RUBRIC_SYSTEM = """
You are a supportive instructional design coach scoring a stakeholder kickoff outreach email in a LEARNING SIMULATION.

Your scoring style: fair and encouraging. Learners are practicing — reward clear effort and professional intent. Do NOT grade like a harsh editor or require perfection.

Context:
- The learner is an instructional designer leading sales enablement training for "Aria Agent" (a new product).
- Recipients: Jordan Kim (Sales Manager) and Priya Nair (Product Lead). Maya Chen is CC'd.
- Phase 2 research uncovered: 7.2-month sales ramp time, failed wiki/manager training attempts, Jordan cares about rep readiness, Priya cares about product accuracy.
- Email should stay under 300 words.

Score each criterion 1–3:
1 = DEVELOPING, 2 = PROFICIENT, 3 = EXEMPLARY

CALIBRATION (follow strictly):
- Default to 2 (PROFICIENT) when the email addresses the criterion in a reasonable, professional way — even if not polished.
- Use 3 (EXEMPLARY) when the criterion is clearly strong; it does NOT need to match every bullet in the EXEMPLARY description.
- Use 1 (DEVELOPING) ONLY when that element is missing, generic, or clearly weak. Never give 1 if the learner made a sincere attempt.
- When torn between two levels, choose the HIGHER score.
- A complete email with greeting, purpose, question, scheduling attempt, and close should rarely score below 2 on tone_word_count or close.
- Mentioning Aria, kickoff, Jordan/Priya, or sales enablement counts toward context and subject — do not require exact Phase 2 statistics for PROFICIENT.
- One specific time window OR "happy to adjust" scheduling counts as PROFICIENT, not DEVELOPING.
- Any non-Googleable question directed at Jordan or Priya counts as at least PROFICIENT for pre_call_question.

Criteria rubric:

1. subject_line — Subject Line
   DEVELOPING: Empty, or generic only ("Kickoff Meeting", "Hello") with no project reference.
   PROFICIENT: Mentions Aria, kickoff, meeting, rep readiness, or sales enablement — signals purpose.
   EXEMPLARY: Sharp stakes or urgency in few words; clearly prepared; would stand out in a busy inbox.

2. context_credibility — Context & Credibility
   DEVELOPING: No intro and no sign of knowing the project.
   PROFICIENT: Introduces role, references Aria / the project / enablement goal, shows brief awareness of stakeholders.
   EXEMPLARY: Cites specific findings (7.2-month ramp, wiki/manager sessions) or Jordan vs Priya priorities.

3. meeting_purpose — Meeting Purpose
   DEVELOPING: Only "let's discuss" with no sense of what the call achieves.
   PROFICIENT: States kickoff/discovery purpose and at least one outcome (objectives, scope, success, agenda).
   EXEMPLARY: Names multiple deliverables: objectives, scope, each stakeholder's definition of success; framed as discovery.

4. pre_call_question — Pre-Call Question
   DEVELOPING: No question, or only Googleable/generic ("What are your goals?").
   PROFICIENT: Targeted question for Jordan or Priya about the project, reps, or kickoff.
   EXEMPLARY: Hypothesis-driven; only they can answer; tied to Phase 2 insight; improves the call.

5. scheduling — Scheduling
   DEVELOPING: Only "let me know when works" with zero options.
   PROFICIENT: Offers a timeframe, one or more windows, or flexible availability with initiative.
   EXEMPLARY: 2–3 specific windows with dates/times/duration; easy to book in one reply.

6. close — Close
   DEVELOPING: Abrupt ending with no courtesy.
   PROFICIENT: Professional sign-off; looks forward to the call or collaboration.
   EXEMPLARY: Ties to shared goal (rep readiness / partnership); warm and motivating.

7. tone_word_count — Tone & Word Count
   DEVELOPING: Unprofessional, heavy L&D jargon, major typos, OR clearly over 300 words.
   PROFICIENT: Clear professional tone, stakeholder-friendly, within or near 300 words.
   EXEMPLARY: Outcome-focused language, confident partner tone, well under 300 words.

Return ONLY valid JSON:
{
  "criteria": [
    {"id": "subject_line", "score": 2, "feedback": "..."},
    {"id": "context_credibility", "score": 2, "feedback": "..."},
    {"id": "meeting_purpose", "score": 2, "feedback": "..."},
    {"id": "pre_call_question", "score": 2, "feedback": "..."},
    {"id": "scheduling", "score": 2, "feedback": "..."},
    {"id": "close", "score": 2, "feedback": "..."},
    {"id": "tone_word_count", "score": 2, "feedback": "..."}
  ]
}

Each feedback: start with level and em dash, e.g. "PROFICIENT — Names project and general goal."
Under 220 characters. Specific to this email. Tone: constructive, not punitive.
"""


def _level_from_total(total: int) -> Literal["DEVELOPING", "PROFICIENT", "EXEMPLARY"]:
    if total >= 18:
        return "EXEMPLARY"
    if total >= 12:
        return "PROFICIENT"
    return "DEVELOPING"


def _stakeholder_response(level: Literal["DEVELOPING", "PROFICIENT", "EXEMPLARY"]) -> str:
    if level == "EXEMPLARY":
        return (
            "Jordan confirms quickly and answers the pre-call question. "
            "Priya replies with product details."
        )
    if level == "PROFICIENT":
        return (
            "Jordan confirms but asks a clarifying question. Priya does not respond."
        )
    return (
        "Jordan responds late: \"Can you clarify what this call is actually for?\" "
        "Priya does not respond."
    )


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


async def score_outreach_email(subject: str, body: str) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    word_count = len(re.findall(r"\S+", body or ""))
    user_prompt = (
        f"Subject line:\n{subject.strip()}\n\n"
        f"Email body ({word_count} words):\n{body.strip()}\n\n"
        "Score this email against all 7 criteria."
    )

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": RUBRIC_SYSTEM + "\n\n" + user_prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.35,
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            GEMINI_URL,
            params={"key": api_key},
            json=payload,
        )
        if resp.status_code != 200:
            logger.error("Gemini API error %s: %s", resp.status_code, resp.text[:500])
            raise RuntimeError(f"Gemini API returned {resp.status_code}")

        data = resp.json()
        candidates = data.get("candidates") or []
        if not candidates:
            raise RuntimeError("Gemini returned no candidates")

        parts = (candidates[0].get("content") or {}).get("parts") or []
        raw_text = ""
        for part in parts:
            if "text" in part:
                raw_text += part["text"]

        if not raw_text.strip():
            raise RuntimeError("Gemini returned empty text")

        parsed = _extract_json(raw_text)
        criteria_raw = parsed.get("criteria") or []
        criteria: list[dict[str, Any]] = []

        by_id = {str(c.get("id")): c for c in criteria_raw if isinstance(c, dict)}
        for cid in CRITERION_IDS:
            item = by_id.get(cid) or {}
            score = int(item.get("score", 2))
            score = max(1, min(3, score))
            feedback = str(item.get("feedback", "")).strip()
            if not feedback:
                level = _level_from_total(score)
                feedback = f"{level} — Review this criterion."
            criteria.append({"id": cid, "score": score, "feedback": feedback})

        total_score = sum(c["score"] for c in criteria)
        overall_level = _level_from_total(total_score)

        return {
            "criteria": criteria,
            "total_score": total_score,
            "overall_level": overall_level,
            "stakeholder_response": _stakeholder_response(overall_level),
            "word_count": word_count,
        }
