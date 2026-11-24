# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from ...models import JobSimExploreCatalog
from .direction import normalize_direction_key


def _row_payload(row: JobSimExploreCatalog) -> dict[str, Any]:
    return {
        "id": row.id,
        "direction_key": row.direction_key,
        "display_title": row.display_title,
        "source_query": row.source_query,
        "slot_index": row.slot_index,
        "career": json.loads(row.career_json),
        "created_at": row.created_at.isoformat() + "Z" if row.created_at else None,
    }


def list_by_direction(db: Session, direction_key: str) -> list[dict[str, Any]]:
    key = normalize_direction_key(direction_key)
    rows = (
        db.query(JobSimExploreCatalog)
        .filter(JobSimExploreCatalog.direction_key == key)
        .order_by(JobSimExploreCatalog.slot_index.asc())
        .all()
    )
    return [_row_payload(r) for r in rows]


def list_all(db: Session, limit: int = 48) -> list[dict[str, Any]]:
    rows = (
        db.query(JobSimExploreCatalog)
        .order_by(JobSimExploreCatalog.updated_at.desc())
        .limit(max(1, min(100, limit)))
        .all()
    )
    return [_row_payload(r) for r in rows]


def try_store_career(
    db: Session,
    *,
    title: str,
    source_query: str,
    career: dict[str, Any],
) -> dict[str, Any]:
    key = normalize_direction_key(title or source_query)
    existing = (
        db.query(JobSimExploreCatalog)
        .filter(JobSimExploreCatalog.direction_key == key)
        .order_by(JobSimExploreCatalog.slot_index.asc())
        .all()
    )
    if len(existing) >= 3:
        return {
            "stored": False,
            "reason": "full",
            "direction_key": key,
            "items": [_row_payload(r) for r in existing],
        }

    projects = career.get("projects") or []
    if not isinstance(projects, list) or len(projects) < 1:
        return {"stored": False, "reason": "invalid_career", "direction_key": key, "items": []}

    slot = len(existing) + 1
    display = str(career.get("title") or title or source_query).strip()[:200]
    row = JobSimExploreCatalog(
        direction_key=key,
        display_title=display or key,
        source_query=(source_query or "")[:255],
        career_json=json.dumps(career, ensure_ascii=False),
        slot_index=slot,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    items = existing + [row]
    return {
        "stored": True,
        "reason": "ok",
        "direction_key": key,
        "items": [_row_payload(r) for r in items],
    }


def pick_fallback(db: Session, query: str) -> Optional[dict[str, Any]]:
    key = normalize_direction_key(query)
    rows = list_by_direction(db, key)
    if rows:
        return rows[0]
    # fuzzy: title contains token
    token = key.split("_")[0]
    if token and token != "unknown":
        hit = (
            db.query(JobSimExploreCatalog)
            .filter(JobSimExploreCatalog.direction_key.contains(token))
            .order_by(JobSimExploreCatalog.slot_index.asc())
            .first()
        )
        if hit:
            return _row_payload(hit)
    return None
