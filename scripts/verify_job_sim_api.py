# -*- coding: utf-8 -*-
"""Verify Job Simulation DB tables + API contract against local backend."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))
# Match uvicorn cwd so sqlite:///./app.db resolves to backend/app.db
import os

os.chdir(BACKEND)
from dotenv import load_dotenv

load_dotenv(BACKEND / ".env")

BASE = "http://127.0.0.1:8001/api"


def http(method: str, path: str, body=None, token: str | None = None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["X-Job-Sim-Token"] = token
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw)
        except Exception:
            payload = {"raw": raw}
        return e.code, payload


def check_db() -> None:
    from app.db import SessionLocal, engine
    from app.models import JobSimExploreCatalog, JobSimSession, JobSimUser
    from sqlalchemy import inspect

    insp = inspect(engine)
    tables = set(insp.get_table_names())
    required = {"job_sim_users", "job_sim_sessions", "job_sim_explore_catalog"}
    missing = required - tables
    print("DB tables present:", sorted(required & tables))
    if missing:
        print("DB tables MISSING:", sorted(missing))
        raise SystemExit(1)

    db = SessionLocal()
    try:
        users = db.query(JobSimUser).count()
        sessions = db.query(JobSimSession).count()
        catalog = db.query(JobSimExploreCatalog).count()
        print(f"DB counts users={users} sessions={sessions} catalog={catalog}")
        cols_users = {c["name"] for c in insp.get_columns("job_sim_users")}
        cols_sessions = {c["name"] for c in insp.get_columns("job_sim_sessions")}
        cols_catalog = {c["name"] for c in insp.get_columns("job_sim_explore_catalog")}
        expect_users = {"id", "full_name", "email", "subscribed", "terms_accepted_at", "created_at", "updated_at"}
        expect_sessions = {
            "id",
            "user_id",
            "role_title",
            "project_title",
            "difficulty",
            "project_json",
            "status",
            "results_json",
            "created_at",
            "updated_at",
        }
        expect_catalog = {
            "id",
            "direction_key",
            "display_title",
            "source_query",
            "career_json",
            "slot_index",
            "created_at",
            "updated_at",
        }
        for label, have, need in (
            ("job_sim_users", cols_users, expect_users),
            ("job_sim_sessions", cols_sessions, expect_sessions),
            ("job_sim_explore_catalog", cols_catalog, expect_catalog),
        ):
            miss = need - have
            if miss:
                print(f"COLUMN MISSING on {label}:", sorted(miss))
                raise SystemExit(1)
            print(f"OK columns {label}")
    finally:
        db.close()


def check_api() -> None:
    code, st = http("GET", "/job-sim/status")
    print("GET /status", code, st)
    assert code == 200 and st.get("ok") is True

    code, reg = http(
        "POST",
        "/job-sim/register",
        {
            "full_name": "API Verify",
            "email": "jobsim-verify@heerise.com",
            "terms_accepted": True,
            "subscribed": False,
        },
    )
    print("POST /register", code, {k: reg.get(k) for k in ("ok", "email", "gate_token") if k in reg or True})
    assert code == 200 and reg.get("gate_token")
    token = reg["gate_token"]

    code, bad = http("GET", "/job-sim/sessions/recent")
    print("GET /sessions/recent without token", code)
    assert code == 401

    code, recent = http("GET", "/job-sim/sessions/recent", token=token)
    print("GET /sessions/recent", code, f"n={len(recent) if isinstance(recent, list) else recent}")
    assert code == 200 and isinstance(recent, list)

    project = {
        "id": "verify-1",
        "difficulty": "Easy",
        "title": "Verify Onboarding Fix",
        "objective": "Align on a fix",
        "businessContext": "Retention dropped",
        "simulationSetup": {
            "stakeholderName": "Alex",
            "stakeholderRole": "Engineer",
            "setScene": "Sprint planning",
            "openingLine": "Why onboarding?",
        },
        "rubric": ["Clarifies problem", "Uses data", "Prioritizes", "Handles pushback"],
    }
    code, sess = http(
        "POST",
        "/job-sim/sessions",
        {
            "role_title": "Product Manager",
            "project_title": project["title"],
            "difficulty": "easy",
            "project": project,
        },
        token=token,
    )
    print("POST /sessions", code, {k: sess.get(k) for k in ("id", "status", "role_title")})
    assert code == 200 and sess.get("id") and sess.get("status") == "in_progress"

    code, done = http(
        "PATCH",
        f"/job-sim/sessions/{sess['id']}",
        {
            "results": {
                "transcript": [{"role": "user", "content": "Because retention dropped."}],
                "debrief": {"summary": "ok"},
            }
        },
        token=token,
    )
    print("PATCH /sessions/{id}", code, {k: done.get(k) for k in ("id", "status")})
    assert code == 200 and done.get("status") == "completed"

    code, cat = http("GET", "/job-sim/explore-catalog?direction=Product%20Manager")
    print("GET /explore-catalog", code, f"items={len((cat or {}).get('items') or [])}")
    assert code == 200

    code, cg = http("POST", "/job-sim/llm/career-guide", {"query": "Product Manager"}, token=token)
    print(
        "POST /llm/career-guide",
        code,
        {
            "ok": cg.get("ok"),
            "fallback": cg.get("fallback"),
            "source": cg.get("source"),
            "title": (cg.get("result") or {}).get("title"),
        },
    )
    assert code == 200 and cg.get("result")

    code, comp = http(
        "POST",
        "/job-sim/llm/complete",
        {"system_instruction": 'Return JSON {"ping":"pong"} only.', "user_prompt": "ping"},
        token=token,
    )
    print("POST /llm/complete", code, {"ok": comp.get("ok"), "fallback": comp.get("fallback")})
    assert code == 200

    code, turn = http(
        "POST",
        "/job-sim/llm/turn",
        {
            "role_title": "Product Manager",
            "project": project,
            "messages": [
                {"role": "assistant", "content": "Why onboarding?"},
                {"role": "user", "content": "Retention dropped due to Day-1 setup friction."},
            ],
            "turn_count": 1,
            "max_turns": 8,
        },
        token=token,
    )
    print("POST /llm/turn", code, {"ok": turn.get("ok"), "fallback": turn.get("fallback"), "has_reply": bool((turn.get("result") or {}).get("reply"))})
    assert code == 200 and (turn.get("result") or {}).get("reply")

    print("ALL API CHECKS PASSED")


def main() -> None:
    check_db()
    check_api()


if __name__ == "__main__":
    main()
