# backend/app/services/onboarding.py
"""Apply pre-cached ACC assessment to user profile."""
from __future__ import annotations

import json
from datetime import datetime
from sqlalchemy.orm import Session

from ..models import (
    UserProfile,
    Skill,
    UserSkill,
    CareerStageHistory,
    OnboardingPreCache,
)


def apply_pre_cache_to_profile(db: Session, user_id: str, session_id: str) -> bool:
    """
    Look up pre-cached answers by session_id and apply to user profile.
    Returns True if cache was found and applied, False otherwise.
    """
    cache = db.query(OnboardingPreCache).filter(
        OnboardingPreCache.session_id == session_id
    ).first()
    if not cache or not cache.answers_json:
        return False

    try:
        answers = json.loads(cache.answers_json)
    except Exception:
        return False

    if not isinstance(answers, dict):
        return False

    prof = db.get(UserProfile, user_id)
    if not prof:
        prof = UserProfile(user_id=user_id)
        db.add(prof)

    def get_val(key: str) -> str | None:
        v = answers.get(key)
        if isinstance(v, str) and v.strip():
            return v.strip()
        if isinstance(v, list) and v:
            return ", ".join(str(x) for x in v[:10])
        return None

    # q1 → major_of_study
    major = get_val("q1") or get_val("major")
    if major:
        prof.major_of_study = major

    # career_stage → current_career_stage
    stage = get_val("career_stage")
    if stage:
        prof.current_career_stage = stage
        db.add(CareerStageHistory(user_id=user_id, stage=stage))

    # q2 → learning_progress (skills as comma-separated) + UserSkill
    skills_raw = answers.get("q2") or answers.get("skills")
    if isinstance(skills_raw, list) and skills_raw:
        names = [str(x) for x in skills_raw[:10]]
        prof.learning_progress = ", ".join(names)
        existing = {s.name: s for s in db.query(Skill).filter(Skill.name.in_(names)).all()}
        for name in names:
            s = existing.get(name)
            if not s:
                s = Skill(name=name)
                db.add(s)
                db.flush()
                existing[name] = s
            if not db.query(UserSkill).filter(
                UserSkill.user_id == user_id,
                UserSkill.skill_id == s.id,
            ).first():
                db.add(UserSkill(user_id=user_id, skill_id=s.id, level=None))
    elif isinstance(skills_raw, str) and skills_raw.strip():
        prof.learning_progress = skills_raw.strip()

    # q3 → interested_work_professions
    q3_val = get_val("q3")
    if q3_val:
        prof.interested_work_professions = q3_val

    # q4 → goals_objectives
    q4_val = get_val("q4")
    if q4_val:
        prof.goals_objectives = q4_val

    # q5 → commitment_level
    q5_val = get_val("q5")
    if q5_val:
        prof.commitment_level = q5_val

    # q6 → about_you
    q6_val = get_val("q6")
    if q6_val:
        prof.about_you = q6_val

    prof.updated_at = datetime.utcnow()
    cache.user_id = user_id
    return True
