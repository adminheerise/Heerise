# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import time
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8001/api"


def call(method: str, path: str, body=None, token: str | None = None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["X-Job-Sim-Token"] = token
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> None:
    for i in range(20):
        try:
            st = call("GET", "/job-sim/status")
            break
        except Exception:
            time.sleep(0.5)
    else:
        raise SystemExit("API not reachable on :8001")

    print("status", st)
    reg = call(
        "POST",
        "/job-sim/register",
        {
            "full_name": "Smoke Tester",
            "email": "jobsim-smoke@heerise.com",
            "terms_accepted": True,
            "subscribed": False,
        },
    )
    token = reg["gate_token"]
    print("registered", reg.get("email"))

    cat = call("GET", "/job-sim/explore-catalog?direction=Product%20Manager")
    print("catalog", len(cat.get("items") or []))

    cg = call("POST", "/job-sim/llm/career-guide", {"query": "Product Manager"}, token=token)
    print(
        "career-guide",
        {
            "ok": cg.get("ok"),
            "fallback": cg.get("fallback"),
            "source": cg.get("source"),
            "title": (cg.get("result") or {}).get("title"),
        },
    )

    comp = call(
        "POST",
        "/job-sim/llm/complete",
        {
            "system_instruction": 'Return JSON {"ping":"pong"} only.',
            "user_prompt": "ping",
        },
        token=token,
    )
    print("complete", {"ok": comp.get("ok"), "fallback": comp.get("fallback"), "result": comp.get("result")})


if __name__ == "__main__":
    main()
