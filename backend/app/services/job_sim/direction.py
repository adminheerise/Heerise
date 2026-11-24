# -*- coding: utf-8 -*-
"""Normalize career titles into direction keys."""
from __future__ import annotations

import re

_SYNONYMS = {
    "pm": "product_manager",
    "product_manager": "product_manager",
    "product_management": "product_manager",
    "da": "data_analyst",
    "data_analyst": "data_analyst",
    "data_analytics": "data_analyst",
    "ux": "ux_designer",
    "ux_designer": "ux_designer",
    "ui_ux_designer": "ux_designer",
    "financial_analyst": "financial_analyst",
    "fa": "financial_analyst",
}


def normalize_direction_key(raw: str) -> str:
    text = (raw or "").strip().lower()
    text = text.replace("&", " and ")
    text = re.sub(r"[^a-z0-9\s_+-]+", " ", text)
    text = re.sub(r"[\s\-]+", "_", text).strip("_")
    text = re.sub(r"_+", "_", text)
    if not text:
        return "unknown"
    return _SYNONYMS.get(text, text)
