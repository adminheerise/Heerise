# backend/app/routers/syllabus.py
"""
Syllabus preview leads — store first/last name, email in DB. Admin visible.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from ..deps import db_sess
from ..models import SyllabusLead

router = APIRouter(prefix="/syllabus", tags=["syllabus"])


# ---------- Schema ----------

class SyllabusLeadIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr


# ---------- Endpoint ----------

@router.post("/lead")
def submit_syllabus_lead(body: SyllabusLeadIn, db: Session = Depends(db_sess)):
    """Store syllabus preview lead (first name, last name, email). Admin can view in /admin/leads."""
    lead = SyllabusLead(
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
    )
    db.add(lead)
    db.commit()
    return {"message": "received"}
