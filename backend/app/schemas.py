# backend/app/schemas.py
from __future__ import annotations

from datetime import datetime, date
from enum import Enum
from typing import Optional, List, Any, Dict

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=1024)
    name: Optional[str] = None
    username: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=1024)


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshIn(BaseModel):
    refresh_token: str


# ---------- Profile ----------

class CountryEnum(str, Enum):
    USA = "USA"
    Canada = "Canada"
    China = "China"
    India = "India"
    Other = "Other"


class LearningStyleEnum(str, Enum):
    Visual = "Visual"
    Auditory = "Auditory"
    Kinesthetic = "Kinesthetic"
    Reading_Writing = "Reading/Writing"


class ProfileOut(BaseModel):
    email: EmailStr
    name: Optional[str]
    username: Optional[str]

    # top card fields
    headline: Optional[str]
    location: Optional[str]
    major_of_study: Optional[str]
    current_career_stage: Optional[str]
    commitment_level: Optional[str]

    # detailed editable fields
    date_of_birth: Optional[date]
    about_you: Optional[str]
    interested_work_professions: Optional[str]
    goals_objectives: Optional[str]
    learning_progress: Optional[str]
    learning_achievement: Optional[str]

    country: Optional[str]
    state: Optional[str]
    current_city: Optional[str]
    visa: Optional[str]

    target_role: Optional[str]
    target_industry: Optional[str]
    years_experience: Optional[int]
    learning_style: Optional[str]
    ai_readiness_score: Optional[int]
    about_me: Optional[str]

    class Config:
        orm_mode = True


class ProfileUpdateIn(BaseModel):
    date_of_birth: Optional[date] = None
    headline: Optional[str] = None
    about_you: Optional[str] = None
    major_of_study: Optional[str] = None
    interested_work_professions: Optional[str] = None
    goals_objectives: Optional[str] = None
    learning_progress: Optional[str] = None
    learning_achievement: Optional[str] = None
    commitment_level: Optional[str] = None
    current_career_stage: Optional[str] = None

    country: Optional[str] = None
    state: Optional[str] = None
    current_city: Optional[str] = None
    visa: Optional[str] = None

    target_role: Optional[str] = None
    target_industry: Optional[str] = None
    years_experience: Optional[int] = Field(None, ge=0)
    learning_style: Optional[LearningStyleEnum] = None
    ai_readiness_score: Optional[int] = None
    about_me: Optional[str] = None


# ---------- Skills ----------

class SkillItem(BaseModel):
    name: str
    level: Optional[int] = None


class SkillsUpdateIn(BaseModel):
    skills: List[SkillItem]


# ---------- Onboarding ----------

class FlowOut(BaseModel):
    id: int
    code: str
    title: str


class QuestionOption(BaseModel):
    id: int
    value: str
    label: str
    sort_order: int


class QuestionOut(BaseModel):
    id: int
    step_order: int
    code: str
    label: str
    type: str
    options: List[QuestionOption] = []


class AnswerIn(BaseModel):
    question_id: int
    answer_json: Dict[str, Any]


class CompleteOut(BaseModel):
    message: str
    next: str = "/dashboard"
