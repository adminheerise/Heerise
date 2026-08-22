"""Server-side Career Lab product catalog. Client-supplied amounts are ignored."""
from __future__ import annotations

from typing import Any


PRODUCTS: dict[str, dict[str, Any]] = {
    "bootcamp-premium": {
        "id": "bootcamp-premium",
        "name": "LXD & ID Career Lab — Premium Tier",
        "program": "Instructional Design Bootcamp",
        "program_detail": "8 Weeks, Synchronous Online",
        "email_program": "LXD & ID Career Lab (8 Weeks)",
        "amount_cents": 249700,
        "currency": "USD",
        "kind": "bootcamp",
    },
    "bootcamp-standard": {
        "id": "bootcamp-standard",
        "name": "LXD & ID Career Lab — Standard Tier",
        "program": "Instructional Design Bootcamp",
        "program_detail": "8 Weeks, Synchronous Online",
        "email_program": "LXD & ID Career Lab (8 Weeks)",
        "amount_cents": 199700,
        "currency": "USD",
        "kind": "bootcamp",
    },
    "bootcamp-basic": {
        "id": "bootcamp-basic",
        "name": "LXD & ID Career Lab — Basic Tier",
        "program": "Instructional Design Bootcamp",
        "program_detail": "8 Weeks, Synchronous Online",
        "email_program": "LXD & ID Career Lab (8 Weeks)",
        "amount_cents": 159700,
        "currency": "USD",
        "kind": "bootcamp",
    },
    "job-aid": {
        "id": "job-aid",
        "name": "Career Lab Project — Job Aid",
        "program": "Job Aid",
        "program_detail": "1:1 mentor-guided project",
        "email_program": "Career Lab Project: Job Aid",
        "amount_cents": 4900,
        "currency": "USD",
        "kind": "project",
    },
    "training-proposal": {
        "id": "training-proposal",
        "name": "Career Lab Project — Training Proposal",
        "program": "Training Proposal",
        "program_detail": "1:1 mentor-guided project",
        "email_program": "Career Lab Project: Training Proposal",
        "amount_cents": 19800,
        "currency": "USD",
        "kind": "project",
    },
    "professional-deliverables": {
        "id": "professional-deliverables",
        "name": "Career Lab Project — Professional Deliverables",
        "program": "Professional Deliverables",
        "program_detail": "1:1 mentor-guided project",
        "email_program": "Career Lab Project: Professional Deliverables",
        "amount_cents": 19800,
        "currency": "USD",
        "kind": "project",
    },
    "design-document": {
        "id": "design-document",
        "name": "Career Lab Project — Design Document",
        "program": "Design Document",
        "program_detail": "1:1 mentor-guided project",
        "email_program": "Career Lab Project: Design Document",
        "amount_cents": 19800,
        "currency": "USD",
        "kind": "project",
    },
    "interactive-scenario": {
        "id": "interactive-scenario",
        "name": "Career Lab Project — Interactive Scenario",
        "program": "Interactive Scenario",
        "program_detail": "1:1 mentor-guided project",
        "email_program": "Career Lab Project: Interactive Scenario",
        "amount_cents": 39800,
        "currency": "USD",
        "kind": "project",
    },
    "portfolio-website": {
        "id": "portfolio-website",
        "name": "Career Lab Project — Portfolio Website",
        "program": "Portfolio Website",
        "program_detail": "1:1 mentor-guided project",
        "email_program": "Career Lab Project: Portfolio Website",
        "amount_cents": 39800,
        "currency": "USD",
        "kind": "project",
    },
}

ALLOWED_METHODS = ("card", "paypal", "google_pay", "apple_pay")

METHOD_LABELS = {
    "card": "Credit / Debit Card",
    "paypal": "PayPal",
    "google_pay": "Google Pay",
    "apple_pay": "Apple Pay",
}


def get_product(product_id: str) -> dict[str, Any] | None:
    return PRODUCTS.get((product_id or "").strip())


def public_product(product: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": product["id"],
        "name": product["name"],
        "program": product["program"],
        "program_detail": product["program_detail"],
        "amount_cents": product["amount_cents"],
        "currency": product["currency"],
        "kind": product["kind"],
        "amount_display": format_money(product["amount_cents"], product["currency"]),
    }


def format_money(amount_cents: int, currency: str = "USD") -> str:
    dollars = amount_cents / 100
    if (currency or "USD").upper() == "USD":
        return f"${dollars:,.2f}"
    return f"{currency.upper()} {dollars:,.2f}"
