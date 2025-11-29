# backend/app/routers/me.py
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..deps import db_sess, get_current_user
from ..models import User, UserProfile
from ..schemas import ProfileOut, ProfileUpdateIn, SkillsUpdateIn, SkillItem
from ..models import Skill, UserSkill

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
