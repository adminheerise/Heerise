# backend/app/routers/syllabus.py
"""
Syllabus preview lead capture.
Stores first_name, last_name, email in DB for admin visibility.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field

from ..deps import db_sess
from ..models import SyllabusLead

router = APIRouter(prefix="/syllabus", tags=["syllabus"])


class SyllabusLeadIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr


@router.post("/lead")
def submit_syllabus_lead(body: SyllabusLeadIn, db=Depends(db_sess)):
    """Capture lead before showing syllabus PDF."""
    row = SyllabusLead(
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
    )
    db.add(row)
    db.commit()
    return {"message": "ok"}
