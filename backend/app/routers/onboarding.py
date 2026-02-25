# backend/app/routers/onboarding.py
from __future__ import annotations

from datetime import datetime
import json
import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any, Dict
from sqlalchemy.orm import Session

from ..deps import db_sess, get_current_user
from ..schemas import FlowOut, QuestionOut, QuestionOption, AnswerIn, CompleteOut
from ..models import (
    OnboardingFlow,
    OnboardingQuestion,
    OnboardingOption,
    OnboardingResponse,
    OnboardingPreCache,
    User,
    UserProfile,
    Skill,
    UserSkill,
    QType,
    CareerStageHistory,
)

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


# ---------- Seed flow for dev ----------

@router.post("/dev/seed")
def seed_default_flow(db: Session = Depends(db_sess)):
    """Create / update the default onboarding flow.

    上线后应该通过一次性的 migration / 管理脚本来维护，
    不要在生产环境随便调用这个接口。
    """
    flow = (
        db.query(OnboardingFlow)
        .filter(OnboardingFlow.code == "default_v1")
        .first()
    )
    if not flow:
        flow = OnboardingFlow(
            code="default_v1",
            title="Default Onboarding",
            is_active=True,
        )
        db.add(flow)
        db.flush()

    db.query(OnboardingFlow).filter(OnboardingFlow.id != flow.id).update(
        {OnboardingFlow.is_active: False}
    )

    def upsert_question(step_order: int, code: str, label: str, qtype: QType):
        q = (
            db.query(OnboardingQuestion)
            .filter(
                OnboardingQuestion.flow_id == flow.id,
                OnboardingQuestion.code == code,
            )
            .first()
        )
        if not q:
            q = OnboardingQuestion(
                flow_id=flow.id,
                step_order=step_order,
                code=code,
                label=label,
                type=qtype,
            )
            db.add(q)
            db.flush()
        else:
            q.step_order = step_order
            q.label = label
            q.type = qtype
        return q

    def replace_options(question_id: int, labels: list[str]):
        db.query(OnboardingOption).filter(
            OnboardingOption.question_id == question_id
        ).delete()
        for i, lab in enumerate(labels, start=1):
            db.add(
                OnboardingOption(
                    question_id=question_id,
                    value=lab,
                    label=lab,
                    sort_order=i,
                )
            )

    q1 = upsert_question(
        1,
        "major",
        "What was your primary field of study (your major)?",
        QType.single_choice,
    )
    replace_options(
        q1.id,
        [
            "Early Childhood Education",
            "K–12 Education Teaching (Teacher Education)",
            "Higher Education Administration",
            "Special Education",
            "Education Technology",
            "Non-profit / Social Work",
            "Professional Counseling",
            "Education Entrepreneurship",
            "Education Policy",
            "Data Analytics",
        ],
    )

    q2 = upsert_question(
        2,
        "career_stage",
        "What best describes your current career stage?",
        QType.single_choice,
    )
    replace_options(
        q2.id,
        [
            "Student",
            "Recent Graduate (less than 2 years out)",
            "Early Career (2–5 years experience)",
            "Mid-Career (6–15 years experience)",
            "Experienced Professional (15+ years experience)",
            "Looking to Re-enter Workforce",
        ],
    )

    q3 = upsert_question(
        3,
        "skills",
        "From the list below, select up to 5 skills where you feel strongest.",
        QType.multi_choice,
    )
    replace_options(
        q3.id,
        [
            "Communication (Verbal & Written)",
            "Team Collaboration",
            "Public Speaking",
            "Networking",
            "Conflict Management",
            "Adaptability",
            "Curriculum Development",
            "Training & Facilitation",
            "Project Coordination/Management",
            "Assessment & Evaluation",
            "Data Analysis (basic)",
            "Research & Synthesis",
            "Problem-Solving",
            "Mentoring & Coaching",
            "Stakeholder Management",
            "Content Creation",
            "Digital Literacy (general)",
            "Presentation Skills",
            "Empathy & Interpersonal Skills",
            "Leadership",
            "Other (please specify)",
        ],
    )

    q4 = upsert_question(
        4,
        "interests",
        "Are there any industries or job functions you are curious about?",
        QType.multi_choice,
    )
    replace_options(
        q4.id,
        [
            "Learning & Development (L&D)",
            "Instructional Design",
            "Curriculum Development",
            "Data Analysis / Data Science",
            "User Experience (UX) / User Interface (UI)",
            "EdTech Product Management/Development",
            "Marketing & Communications",
            "Tech Education/Training",
            "AI Ethics / Responsible AI",
            "Prompt Engineering / AI Content Creation",
            "Teaching",
            "Language Specialist",
            "Student Affairs",
            "Not sure, show me options!",
            "Other (please specify)",
        ],
    )

    q5 = upsert_question(
        5,
        "motivation",
        "What is your primary motivation for seeking a career change or upskilling?",
        QType.single_choice,
    )
    replace_options(
        q5.id,
        [
            "Higher Salary",
            "Better Work-Life Balance",
            "More Challenging Work",
            "Personal Growth",
            "New Industry Interest",
            "Impact of AI on my field",
            "Job Security",
            "Other",
        ],
    )

    q6 = upsert_question(
        6,
        "weekly_time",
        "How much time per week can you dedicate to learning and skill development?",
        QType.single_choice,
    )
    replace_options(
        q6.id,
        [
            "0-2 hours",
            "3-5 hours",
            "6-10 hours",
            "10+ hours",
        ],
    )

    db.commit()
    return {"message": "seeded", "flow_id": flow.id}


# ---------- Query flow & questions ----------

@router.get("/flows/current", response_model=FlowOut)
def current_flow(db: Session = Depends(db_sess)):
    flow = (
        db.query(OnboardingFlow)
        .filter(OnboardingFlow.is_active == True)
        .order_by(OnboardingFlow.id.desc())
        .first()
    )
    if not flow:
        raise HTTPException(status_code=404, detail="No active flow")
    return FlowOut(id=flow.id, code=flow.code, title=flow.title)


@router.get("/flows/{flow_id}/questions", response_model=list[QuestionOut])
def get_questions(flow_id: int, db: Session = Depends(db_sess)):
    qs = (
        db.query(OnboardingQuestion)
        .filter(OnboardingQuestion.flow_id == flow_id)
        .order_by(OnboardingQuestion.step_order)
        .all()
    )
    out: list[QuestionOut] = []
    for q in qs:
        opts = (
            db.query(OnboardingOption)
            .filter(OnboardingOption.question_id == q.id)
            .order_by(OnboardingOption.sort_order)
            .all()
        )
        out.append(
            QuestionOut(
                id=q.id,
                step_order=q.step_order,
                code=q.code,
                label=q.label,
                type=q.type.value,
                options=[
                    QuestionOption(
                        id=o.id,
                        value=o.value,
                        label=o.label,
                        sort_order=o.sort_order,
                    )
                    for o in opts
                ],
            )
        )
    return out


# ---------- Pre-cache (anonymous assessment before register) ----------

class PreCacheIn(BaseModel):
    answers: Dict[str, Any]


class PreCacheOut(BaseModel):
    session_id: str


@router.post("/pre-cache", response_model=PreCacheOut)
def pre_cache_assessment(body: PreCacheIn, db: Session = Depends(db_sess)):
    """
    Store anonymous assessment answers. Returns session_id.
    Frontend stores session_id (e.g. localStorage), sends it with register.
    On register, backend binds pre-cache to user and fills profile.
    """
    session_id = secrets.token_urlsafe(32)
    answers_json = json.dumps(body.answers, ensure_ascii=False)
    cache = OnboardingPreCache(
        session_id=session_id,
        answers_json=answers_json,
    )
    db.add(cache)
    db.commit()
    return PreCacheOut(session_id=session_id)


def apply_pre_cache_to_profile(prof: UserProfile, answers: dict) -> None:
    """Map frontend answer keys to UserProfile fields. Used when binding pre-cache to user."""
    def get_single(key: str) -> str | None:
        v = answers.get(key)
        if isinstance(v, list):
            return v[0] if v else None
        return str(v).strip() if v else None

    def get_multi(key: str) -> list:
        v = answers.get(key)
        if isinstance(v, list):
            return [str(x) for x in v]
        if v:
            return [str(v)]
        return []

    # Frontend keys: q1=major, career_stage, q2=skills, q3=work enjoyment, q4=motivation, q5, q6
    prof.major_of_study = get_single("q1") or prof.major_of_study
    prof.current_career_stage = get_single("career_stage") or prof.current_career_stage
    prof.interested_work_professions = get_single("q3") or prof.interested_work_professions
    prof.goals_objectives = get_single("q4") or prof.goals_objectives
    if answers.get("q6"):
        prof.about_you = str(answers.get("q6", "")).strip() or prof.about_you

    skills = get_multi("q2")
    if skills:
        prof.learning_progress = ", ".join(skills) if skills else prof.learning_progress


# ---------- Save answers & complete ----------

@router.post("/responses")
def upsert_answer(
    body: AnswerIn,
    db: Session = Depends(db_sess),
    user: User = Depends(get_current_user),
):
    q = db.get(OnboardingQuestion, body.question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    r = (
        db.query(OnboardingResponse)
        .filter(
            OnboardingResponse.user_id == user.id,
            OnboardingResponse.question_id == q.id,
        )
        .first()
    )
    payload = json.dumps(body.answer_json, ensure_ascii=False)
    if r:
        r.answer_json = payload
        r.updated_at = datetime.utcnow()
    else:
        r = OnboardingResponse(
            user_id=user.id,
            question_id=q.id,
            answer_json=payload,
        )
        db.add(r)

    db.commit()
    return {"message": "saved"}


@router.post("/complete", response_model=CompleteOut)
def complete(
    db: Session = Depends(db_sess),
    user: User = Depends(get_current_user),
):
    prof = db.get(UserProfile, user.id)
    if not prof:
        prof = UserProfile(user_id=user.id)
        db.add(prof)

    answers = (
        db.query(OnboardingResponse)
        .filter(OnboardingResponse.user_id == user.id)
        .all()
    )
    raw_by_qid: dict[int, dict] = {}
    for a in answers:
        try:
            raw_by_qid[a.question_id] = json.loads(a.answer_json)
        except Exception:
            continue

    qs = db.query(OnboardingQuestion).all()
    code_by_id = {q.id: q.code for q in qs}
    rev: dict[str, dict] = {
        code_by_id[qid]: payload
        for qid, payload in raw_by_qid.items()
        if qid in code_by_id
    }

    def get_single(code: str) -> str | None:
        v = rev.get(code)
        if not isinstance(v, dict):
            return None
        val = (v.get("label") or v.get("value") or "").strip()
        return val or None

    prof.major_of_study = get_single("major") or prof.major_of_study
    prof.current_career_stage = get_single("career_stage") or prof.current_career_stage
    prof.commitment_level = get_single("weekly_time") or prof.commitment_level

    new_stage = get_single("career_stage")
    if new_stage:
        db.add(CareerStageHistory(user_id=user.id, stage=new_stage))

    skills_payload = rev.get("skills")
    if isinstance(skills_payload, dict):
        values = skills_payload.get("values")
        if isinstance(values, list):
            names = [str(x) for x in values]
            existing_skills = {
                s.name: s
                for s in db.query(Skill).filter(Skill.name.in_(names)).all()
            }
            for name in names:
                s = existing_skills.get(name)
                if not s:
                    s = Skill(name=name)
                    db.add(s)
                    db.flush()
                    existing_skills[name] = s
                if not db.query(UserSkill).filter(
                    UserSkill.user_id == user.id,
                    UserSkill.skill_id == s.id,
                ).first():
                    db.add(UserSkill(user_id=user.id, skill_id=s.id, level=None))

    prof.updated_at = datetime.utcnow()
    db.commit()

    return CompleteOut(message="onboarding completed", next="/dashboard")
