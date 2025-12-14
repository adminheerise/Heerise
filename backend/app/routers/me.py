# backend/app/routers/me.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json

from ..deps import db_sess, get_current_user
from ..models import User, UserProfile, UserSkill, Skill, OnboardingResponse, OnboardingQuestion
from ..schemas import ProfileOut, ProfileUpdateIn, SkillsUpdateIn, SkillItem

router = APIRouter(prefix="/me", tags=["me"])


def _ensure_profile(db: Session, user: User) -> UserProfile:
    prof = db.get(UserProfile, user.id)
    if not prof:
        prof = UserProfile(user_id=user.id)
        db.add(prof)
        db.commit()
        db.refresh(prof)
    return prof


def _profile_to_out(user: User, prof: UserProfile) -> ProfileOut:
    location = None
    parts = [p for p in [prof.current_city, prof.state, prof.country] if p]
    if parts:
        location = ", ".join(parts)

    return ProfileOut(
        email=user.email,
        name=user.name,
        username=user.username,
        headline=prof.headline,
        location=location,
        major_of_study=prof.major_of_study,
        current_career_stage=prof.current_career_stage,
        commitment_level=prof.commitment_level,
        date_of_birth=prof.date_of_birth,
        about_you=prof.about_you,
        interested_work_professions=prof.interested_work_professions,
        goals_objectives=prof.goals_objectives,
        learning_progress=prof.learning_progress,
        learning_achievement=prof.learning_achievement,
        country=prof.country,
        state=prof.state,
        current_city=prof.current_city,
        visa=prof.visa.value if prof.visa else None,
        target_role=prof.target_role,
        target_industry=prof.target_industry,
        years_experience=prof.years_experience,
        learning_style=prof.learning_style,
        ai_readiness_score=prof.ai_readiness_score,
        about_me=prof.about_me,
    )


@router.get("", response_model=dict)
def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "username": user.username,
        "role": user.role.value,
    }


@router.get("/profile", response_model=ProfileOut)
def get_profile(
    db: Session = Depends(db_sess),
    user: User = Depends(get_current_user),
):
    prof = _ensure_profile(db, user)
    return _profile_to_out(user, prof)


@router.put("/profile", response_model=ProfileOut)
def update_profile(
    payload: ProfileUpdateIn,
    db: Session = Depends(db_sess),
    user: User = Depends(get_current_user),
):
    prof = _ensure_profile(db, user)

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(prof, field, value)

    db.commit()
    db.refresh(prof)
    return _profile_to_out(user, prof)


@router.put("/skills", response_model=list[SkillItem])
def update_skills(
    payload: SkillsUpdateIn,
    db: Session = Depends(db_sess),
    user: User = Depends(get_current_user),
):
    db.query(UserSkill).filter(UserSkill.user_id == user.id).delete()

    names = [s.name for s in payload.skills]
    existing = {
        s.name: s for s in db.query(Skill).filter(Skill.name.in_(names)).all()
    }
    for s in payload.skills:
        skill = existing.get(s.name)
        if not skill:
            skill = Skill(name=s.name)
            db.add(skill)
            db.flush()
            existing[s.name] = skill
        db.add(UserSkill(user_id=user.id, skill_id=skill.id, level=s.level))

    db.commit()
    return payload.skills


@router.get("/export", response_model=dict)
def export_my_data(
    db: Session = Depends(db_sess),
    user: User = Depends(get_current_user),
):
    """Download my data (MVP): user + profile + skills + onboarding responses."""
    prof = db.get(UserProfile, user.id)
    skills = (
        db.query(UserSkill, Skill)
        .join(Skill, UserSkill.skill_id == Skill.id)
        .filter(UserSkill.user_id == user.id)
        .all()
    )
    answers = (
        db.query(OnboardingResponse, OnboardingQuestion)
        .join(OnboardingQuestion, OnboardingResponse.question_id == OnboardingQuestion.id)
        .filter(OnboardingResponse.user_id == user.id)
        .all()
    )

    def _json_or_raw(s: str):
        try:
            return json.loads(s)
        except Exception:
            return s

    return {
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "username": user.username,
            "role": user.role.value,
            "created_at": user.created_at.isoformat() + "Z" if user.created_at else None,
        },
        "profile": {
            "date_of_birth": prof.date_of_birth.isoformat() if prof and prof.date_of_birth else None,
            "headline": prof.headline if prof else None,
            "about_you": prof.about_you if prof else None,
            "major_of_study": prof.major_of_study if prof else None,
            "interested_work_professions": prof.interested_work_professions if prof else None,
            "goals_objectives": prof.goals_objectives if prof else None,
            "learning_progress": prof.learning_progress if prof else None,
            "learning_achievement": prof.learning_achievement if prof else None,
            "commitment_level": prof.commitment_level if prof else None,
            "current_career_stage": prof.current_career_stage if prof else None,
            "country": prof.country if prof else None,
            "state": prof.state if prof else None,
            "current_city": prof.current_city if prof else None,
            "visa": prof.visa.value if prof and prof.visa else None,
            "target_role": prof.target_role if prof else None,
            "target_industry": prof.target_industry if prof else None,
            "years_experience": prof.years_experience if prof else None,
            "learning_style": prof.learning_style if prof else None,
            "ai_readiness_score": prof.ai_readiness_score if prof else None,
            "about_me": prof.about_me if prof else None,
            "updated_at": prof.updated_at.isoformat() + "Z" if prof and prof.updated_at else None,
        },
        "skills": [{"name": s.name, "level": us.level} for us, s in skills],
        "onboarding_responses": [
            {
                "question_id": r.question_id,
                "question_code": q.code,
                "question_label": q.label,
                "answer": _json_or_raw(r.answer_json),
                "updated_at": r.updated_at.isoformat() + "Z" if r.updated_at else None,
            }
            for r, q in answers
        ],
    }


@router.delete("")
def delete_account(
    db: Session = Depends(db_sess),
    user: User = Depends(get_current_user),
):
    """Delete my account (MVP)."""
    u = db.get(User, user.id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(u)
    db.commit()
    return {"message": "deleted"}
