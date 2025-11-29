# backend/app/models.py
from __future__ import annotations

from datetime import datetime, date
from enum import Enum as PyEnum
from uuid import uuid4

from sqlalchemy import (
    Column,
    String,
    Text,
    Enum,
    Integer,
    DateTime,
    Boolean,
    ForeignKey,
    UniqueConstraint,
    Date,
)
from sqlalchemy.orm import relationship

from .db import Base


# --------- helpers ---------

def gen_uuid() -> str:
    """Generate a UUID4 string for primary keys."""
    return str(uuid4())


# ---------- Enums ----------

class UserRole(str, PyEnum):
    user = "user"
    admin = "admin"


class VisaStatus(str, PyEnum):
    none = "none"
    F1 = "F1"
    J1 = "J1"
    H1B = "H1B"
    Other = "Other"


class QType(str, PyEnum):
    single_choice = "single_choice"
    multi_choice = "multi_choice"
    short_text = "short_text"
    # 预留给以后：长文本 / 量表 / 国家选择 / 技能选择
    # long_text = "long_text"
    # scale = "scale"
    # country = "country"
    # skills = "skills"


# ---------- Core user / auth ----------

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    name = Column(String, nullable=True)      # Full Name
    username = Column(String, unique=True, nullable=True)  # User Name
    role = Column(Enum(UserRole), nullable=False, default=UserRole.user)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    profile = relationship("UserProfile", uselist=False, back_populates="user")
    auth_sessions = relationship(
        "AuthSession", back_populates="user", cascade="all, delete-orphan"
    )
    onboarding_responses = relationship(
        "OnboardingResponse", back_populates="user", cascade="all, delete-orphan"
    )
    user_skills = relationship(
        "UserSkill", back_populates="user", cascade="all, delete-orphan"
    )
    career_stage_history = relationship(
        "CareerStageHistory", back_populates="user", cascade="all, delete-orphan"
    )


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id = Column(String, primary_key=True, default=gen_uuid)

    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    refresh_token = Column(Text, unique=True, nullable=False)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    # 注意：这里要和 User.auth_sessions 对应
    user = relationship("User", back_populates="auth_sessions")


# ---------- Onboarding flow ----------

class OnboardingFlow(Base):
    __tablename__ = "onboarding_flows"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    questions = relationship(
        "OnboardingQuestion", back_populates="flow", cascade="all, delete-orphan"
    )


class OnboardingQuestion(Base):
    __tablename__ = "onboarding_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    flow_id = Column(Integer, ForeignKey("onboarding_flows.id", ondelete="CASCADE"), nullable=False)
    step_order = Column(Integer, nullable=False)
    code = Column(String, nullable=False)
    label = Column(Text, nullable=False)
    type = Column(Enum(QType), nullable=False)
    is_required = Column(Boolean, nullable=False, default=True)

    flow = relationship("OnboardingFlow", back_populates="questions")
    options = relationship(
        "OnboardingOption", back_populates="question", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("flow_id", "code", name="uq_onboarding_question_flow_code"),
    )


class OnboardingOption(Base):
    __tablename__ = "onboarding_options"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(
        Integer, ForeignKey("onboarding_questions.id", ondelete="CASCADE"), nullable=False
    )
    value = Column(String, nullable=False)
    label = Column(String, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)

    question = relationship("OnboardingQuestion", back_populates="options")


class OnboardingResponse(Base):
    __tablename__ = "onboarding_responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(
        Integer, ForeignKey("onboarding_questions.id", ondelete="CASCADE"), nullable=False
    )
    answer_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    user = relationship("User", back_populates="onboarding_responses")
    question = relationship("OnboardingQuestion")

    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_onboarding_response_user_question"),
    )


# ---------- Profile / skills ----------

class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    # Basic personal info
    date_of_birth = Column(Date, nullable=True)
    headline = Column(String, nullable=True)
    about_you = Column(Text, nullable=True)

    # Education & background from onboarding
    major_of_study = Column(String, nullable=True)
    interested_work_professions = Column(Text, nullable=True)
    goals_objectives = Column(Text, nullable=True)
    learning_progress = Column(Text, nullable=True)
    learning_achievement = Column(Text, nullable=True)
    commitment_level = Column(String, nullable=True)
    current_career_stage = Column(String, nullable=True)

    # Location & immigration
    country = Column(String, nullable=True)
    state = Column(String, nullable=True)
    current_city = Column(String, nullable=True)
    visa = Column(Enum(VisaStatus), nullable=False, default=VisaStatus.none)

    # Career targets / learning prefs
    target_role = Column(String, nullable=True)
    target_industry = Column(String, nullable=True)
    years_experience = Column(Integer, nullable=True)
    learning_style = Column(String, nullable=True)
    ai_readiness_score = Column(Integer, nullable=True)

    # Legacy free-form field
    about_me = Column(Text, nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profile")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)

    user_skills = relationship("UserSkill", back_populates="skill", cascade="all, delete-orphan")


class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    level = Column(Integer, nullable=True)

    user = relationship("User", back_populates="user_skills")
    skill = relationship("Skill", back_populates="user_skills")

    __table_args__ = (
        UniqueConstraint("user_id", "skill_id", name="uq_user_skill_user_skill"),
    )


class CareerStageHistory(Base):
    __tablename__ = "career_stage_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    stage = Column(String, nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="career_stage_history")
