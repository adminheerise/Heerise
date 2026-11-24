# -*- coding: utf-8 -*-
"""Seed Path B explore catalog with a few preset careers when empty."""
from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from ...models import JobSimExploreCatalog
from .catalog import try_store_career

logger = logging.getLogger(__name__)

# Minimal PM pack so Path B custom-search fallback works without Gemini key.
_PM_CAREER = {
    "title": "Product Manager",
    "shortDesc": "Prioritize features, work with engineers, and make product decisions.",
    "whatTheyDo": (
        "Product Managers bridge user needs, business goals, and engineering reality. "
        "They diagnose which problems matter most and align teams around a clear roadmap."
    ),
    "typicalWorkday": (
        "Morning standup with engineers, mid-day funnel analysis, afternoon customer "
        "interviews, and scoping requirements with designers."
    ),
    "typicalProjects": "Redesigning onboarding, launching a billing tier, or scoping an AI assistant.",
    "skillsAndTools": [
        "Problem Discovery",
        "Data Analysis",
        "Prioritization",
        "Stakeholder Alignment",
    ],
    "challenges": "Saying no to loud feature requests using objective data.",
    "relatedCareers": ["Product Marketing Manager", "UX Designer", "Data Analyst"],
    "projects": [
        {
            "id": "seed-pm-1",
            "difficulty": "Easy",
            "title": "Fixing Day-1 User Onboarding Drop-Off",
            "shortDesc": "Align engineering on fixing onboarding friction before power-user features.",
            "tags": ["Problem Diagnosis", "Roadmap Prioritization"],
            "businessContext": (
                "Day-14 retention fell from 42% to 28%. Funnel analytics show 68% of new "
                "signups abandon during Day-1 workspace setup."
            ),
            "objective": (
                "Identify the Day-1 setup bottleneck and align the Lead Engineer on "
                "prioritizing onboarding improvements this sprint."
            ),
            "yourRole": "Product Manager in sprint planning with the Lead Software Engineer.",
            "deliverables": "Data-backed diagnosis, sprint priority recommendation, phased plan.",
            "challenges": "The Lead Engineer wants to build a Custom Automation feature instead.",
            "skillsApplied": ["Problem Clarification", "Data-Backed Decisions", "Sprint Prioritization"],
            "rubric": [
                "Clarifies the retention bottleneck before jumping to solutions.",
                "Uses concrete funnel data to support decisions.",
                "Prioritizes based on customer impact and sprint capacity.",
                "Addresses engineering concerns and proposes a phased compromise.",
            ],
            "simulationSetup": {
                "stakeholderName": "Alex Rivera",
                "stakeholderRole": "Lead Software Engineer",
                "setScene": (
                    "Sprint planning with Alex Rivera. 68% of new signups quit during Day-1 "
                    "setup. Alex wants to build a Custom Automation Builder instead."
                ),
                "openingLine": (
                    "Before we lock the sprint backlog, my team wants to start the Custom "
                    "Automation Builder. Why pause new features to rework Day-1 onboarding?"
                ),
            },
        },
        {
            "id": "seed-pm-2",
            "difficulty": "Medium",
            "title": "Scoping an Enterprise Reporting Request",
            "shortDesc": "Negotiate a realistic MVP when Sales demands a custom dashboard in two weeks.",
            "tags": ["Scope Management", "Stakeholder Alignment"],
            "businessContext": (
                "A $250k enterprise prospect requested automated PDF exports. Full custom "
                "reporting takes 6 weeks and would delay the Q3 roadmap."
            ),
            "objective": (
                "Uncover the core reporting need and align Sales on a 1-week CSV + scheduled "
                "dashboard MVP."
            ),
            "yourRole": "Product Manager negotiating with the VP of Enterprise Sales.",
            "deliverables": "Core problem definition, 1-week MVP spec, roadmap protection plan.",
            "challenges": "The VP insists only a custom PDF builder will close the account.",
            "skillsApplied": ["Requirement Scoping", "Trade-Off Negotiation", "Cross-Functional Alignment"],
            "rubric": [
                "Clarifies the prospect's underlying reporting need.",
                "Uses timeline and effort constraints to frame trade-offs.",
                "Proposes a scoped MVP that can close the deal.",
                "Protects the broader roadmap while addressing Sales urgency.",
            ],
            "simulationSetup": {
                "stakeholderName": "Morgan Lee",
                "stakeholderRole": "VP of Enterprise Sales",
                "setScene": (
                    "Deal desk with Morgan Lee. The prospect wants PDF exports in two weeks. "
                    "Full build is six weeks."
                ),
                "openingLine": (
                    "This $250k deal needs custom PDF reporting in two weeks or we lose it. "
                    "Can Engineering just build it?"
                ),
            },
        },
        {
            "id": "seed-pm-3",
            "difficulty": "Hard",
            "title": "Balancing Launch Scope Under a Hard Deadline",
            "shortDesc": "Phase a market launch when engineering capacity cannot cover every request.",
            "tags": ["Launch Planning", "Executive Alignment"],
            "businessContext": (
                "A regional launch is locked in 8 weeks. Engineering needs 11 weeks for full "
                "localization, billing, and data residency."
            ),
            "objective": (
                "Align the Regional Director on a Day-1 must-have set plus a 30-day fast-follow."
            ),
            "yourRole": "Product Manager in the launch readiness review.",
            "deliverables": "Must-have vs phaseable matrix, Day-1 plan, 30-day follow-up.",
            "challenges": "The Regional Director treats every request as a Day-1 blocker.",
            "skillsApplied": ["Scope Phasing", "Constraint Communication", "Executive Influence"],
            "rubric": [
                "Separates launch blockers from phaseable enhancements.",
                "Uses capacity and timeline math to justify phasing.",
                "Proposes an on-time Day-1 plan with a concrete follow-up.",
                "Addresses market readiness concerns with evidence.",
            ],
            "simulationSetup": {
                "stakeholderName": "Hannah Weber",
                "stakeholderRole": "Regional Director",
                "setScene": (
                    "Launch readiness with Hannah Weber. Full scope needs 11 weeks; the event "
                    "is in 8 weeks."
                ),
                "openingLine": (
                    "Our launch is locked for eight weeks. How do you deliver residency, "
                    "localization, and billing all by Day 1?"
                ),
            },
        },
    ],
}


def seed_explore_catalog_if_empty(db: Session) -> None:
    try:
        count = db.query(JobSimExploreCatalog).count()
        if count > 0:
            return
        result = try_store_career(
            db,
            title="Product Manager",
            source_query="Product Manager",
            career=_PM_CAREER,
        )
        logger.info("Job Sim catalog seed: %s", result.get("reason"))
    except Exception as e:
        logger.warning("Job Sim catalog seed skipped: %s", repr(e))
        try:
            db.rollback()
        except Exception:
            pass
