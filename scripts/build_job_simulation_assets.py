# -*- coding: utf-8 -*-
"""Transform Gemini HTML prototype into Hugo static Job Simulation assets."""
from __future__ import annotations

import re
from pathlib import Path

SRC_CANDIDATES = [
    Path(r"C:\Users\Zhang\Downloads\job_simulation_career_simulation_mvp.html"),
    Path(r"D:\Google\job_simulation_career_simulation_mvp.html"),
]
ROOT = Path(__file__).resolve().parents[1]
OUT_CSS = ROOT / "frontend" / "hugo-landing" / "static" / "css" / "job-simulation.css"
OUT_JS = ROOT / "frontend" / "hugo-landing" / "static" / "js" / "job-simulation.js"
OUT_PARTIAL = ROOT / "frontend" / "hugo-landing" / "layouts" / "partials" / "job-simulation.html"

API_CLIENT = r'''
/* ============================================================================
   HEERISE SERVER API (no browser Gemini key / no Google login)
   ============================================================================ */
const JOB_SIM_GATE_KEY = "heerise_job_sim_gate_token";
const JOB_SIM_NAME_KEY = "heerise_job_sim_full_name";

function jobSimApiBase() {
  const host = window.location && window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  let b = window.HEERISE_API_BASE || window.API_BASE || (isLocal ? "http://localhost:8001" : "/api");
  b = String(b).replace(/\/$/, "");
  if (b === "/api") return "/api";
  return b.endsWith("/api") ? b : b + "/api";
}

function getJobSimToken() {
  try { return localStorage.getItem(JOB_SIM_GATE_KEY) || ""; } catch (e) { return ""; }
}

function setJobSimToken(token, fullName) {
  try {
    if (token) localStorage.setItem(JOB_SIM_GATE_KEY, token);
    if (fullName) localStorage.setItem(JOB_SIM_NAME_KEY, fullName);
  } catch (e) {}
}

async function jobSimFetch(path, options = {}) {
  const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
  const token = getJobSimToken();
  if (token) headers["X-Job-Sim-Token"] = token;
  const res = await fetch(jobSimApiBase() + path, Object.assign({}, options, { headers, credentials: "omit" }));
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { detail: text }; }
  if (!res.ok) {
    const detail = data.detail;
    let msg = "Request failed (" + res.status + ")";
    if (typeof detail === "string") msg = detail;
    else if (detail && detail.reason) msg = String(detail.reason);
    else if (Array.isArray(detail)) msg = detail.map(d => d.msg || JSON.stringify(d)).join(" ");
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function callGeminiJSON(systemInstruction, userPrompt) {
  const delays = [800, 1600];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const data = await jobSimFetch("/job-sim/llm/complete", {
        method: "POST",
        body: JSON.stringify({
          system_instruction: systemInstruction,
          user_prompt: userPrompt
        })
      });
      if (data && data.result) return deepCleanObject(data.result);
      return null;
    } catch (e) {
      if (e && e.status === 401) {
        renderEmailGate("Please register with your email to continue.");
        return null;
      }
      if (attempt === delays.length) return null;
      await new Promise(r => setTimeout(r, delays[attempt]));
    }
  }
  return null;
}

function parseCleanJSON(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(cleaned); } catch (e) {}
  const firstObj = cleaned.indexOf("{");
  const lastObj = cleaned.lastIndexOf("}");
  if (firstObj !== -1 && lastObj > firstObj) {
    try { return JSON.parse(cleaned.slice(firstObj, lastObj + 1)); } catch (e) {}
  }
  return null;
}

function renderEmailGate(errorMsg) {
  state.screen = "gate";
  updateTopBar(1);
  const restartBtnEl = document.getElementById("restartBtn");
  if (restartBtnEl) restartBtnEl.style.visibility = "hidden";
  app.innerHTML = `
    <section class="page-header" style="text-align:center; max-width:560px; margin:24px auto;">
      <h1 class="hero-title" style="font-size:clamp(1.6rem, 3vw, 2rem);">Start Career Simulation</h1>
      <p class="subtitle">Enter your name and email to practice workplace scenarios. No Google or Gemini login required.</p>
    </section>
    <form class="card" id="jobSimGateForm" style="max-width:520px; margin:0 auto;" novalidate>
      <label for="jsGateName" style="font-weight:700; color:var(--navy);">Full name</label>
      <input id="jsGateName" name="full_name" type="text" required autocomplete="name" style="width:100%; margin:8px 0 16px;" placeholder="Your full name">
      <label for="jsGateEmail" style="font-weight:700; color:var(--navy);">Email</label>
      <input id="jsGateEmail" name="email" type="email" required autocomplete="email" style="width:100%; margin:8px 0 16px;" placeholder="you@example.com">
      <label style="display:flex; gap:10px; align-items:flex-start; margin-bottom:12px; font-size:0.95rem;">
        <input id="jsGateTerms" type="checkbox" required style="margin-top:4px;">
        <span>I agree to the <a href="/terms-of-service/" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span>
      </label>
      <label style="display:flex; gap:10px; align-items:flex-start; margin-bottom:18px; font-size:0.95rem;">
        <input id="jsGateSub" type="checkbox" style="margin-top:4px;">
        <span>Send me tips and updates about HeeRise Academy (optional).</span>
      </label>
      <p id="jsGateError" role="alert" style="color:var(--crimson); min-height:1.2em; margin:0 0 12px;">${errorMsg ? cleanText(errorMsg) : ""}</p>
      <button type="submit" class="btn-primary" id="jsGateSubmit" style="width:100%;">Continue to Career Simulation</button>
    </form>
  `;
  document.getElementById("jobSimGateForm").onsubmit = async (e) => {
    e.preventDefault();
    const full_name = document.getElementById("jsGateName").value.trim();
    const email = document.getElementById("jsGateEmail").value.trim();
    const terms = document.getElementById("jsGateTerms").checked;
    const subscribed = document.getElementById("jsGateSub").checked;
    const err = document.getElementById("jsGateError");
    const btn = document.getElementById("jsGateSubmit");
    err.textContent = "";
    if (!full_name || !email || !terms) {
      err.textContent = "Name, email, and terms agreement are required.";
      return;
    }
    btn.disabled = true;
    btn.textContent = "Continuing...";
    try {
      const data = await jobSimFetch("/job-sim/register", {
        method: "POST",
        body: JSON.stringify({ full_name, email, terms_accepted: true, subscribed })
      });
      setJobSimToken(data.gate_token, data.full_name || full_name);
      goHome();
    } catch (ex) {
      err.textContent = (ex && ex.message) || "Registration failed. Please try again.";
      btn.disabled = false;
      btn.textContent = "Continue to Career Simulation";
    }
  };
}

async function requireGateThen(fn) {
  if (!getJobSimToken()) {
    renderEmailGate("");
    return;
  }
  return fn();
}
'''


def find_src() -> Path:
    for p in SRC_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError("job_simulation_career_simulation_mvp.html not found")


def main() -> None:
    src = find_src()
    text = src.read_text(encoding="utf-8")

    s0 = text.index("<style>") + len("<style>")
    s1 = text.index("</style>")
    css = text[s0:s1].strip() + "\n\n"
    css += """
/* Hugo embed: soften theme chrome on Job Simulation page */
body:has(#job-sim-root) footer,
body:has(#job-sim-root) #footer {
  display: none !important;
}
#job-sim-root {
  min-height: 100vh;
}
"""

    b0 = text.index("<body>") + len("<body>")
    b1 = text.index('<script type="module">')
    body_html = text[b0:b1].strip()

    j0 = text.index('<script type="module">') + len('<script type="module">')
    j1 = text.rindex("</script>")
    js = text[j0:j1].strip()
    js = re.sub(
        r'^import\s+\{\s*GoogleGenAI\s*\}\s+from\s+["\'][^"\']+["\'];\s*',
        "",
        js,
        count=1,
        flags=re.M,
    )

    # Replace Gemini integration block through parseCleanJSON
    m = re.search(
        r"/\*[*=\s]*\n\s*GEMINI API INTEGRATION[\s\S]*?\nfunction parseCleanJSON\(text\) \{[\s\S]*?\n\}",
        js,
    )
    if not m:
        raise RuntimeError("Could not locate GEMINI API INTEGRATION block")
    js = js[: m.start()] + API_CLIENT + js[m.end() :]

    # Gate Path A / Path B entry points
    js = js.replace(
        "window.openPathAInput = function() {",
        "window.openPathAInput = function() {\n  if (!getJobSimToken()) { renderEmailGate(\"\"); return; }",
    )
    js = js.replace(
        "window.openPathBGrid = function() {",
        "window.openPathBGrid = function() {\n  if (!getJobSimToken()) { renderEmailGate(\"\"); return; }",
    )

    # Prefer typed career-guide endpoint for custom search (stores catalog)
    old_custom_call = (
        "const parsed = await callGeminiJSON(sys, "
        "`Generate career exploration guide and 3 leveled projects (Easy, Medium, Hard) for: ${query}`);"
    )
    new_custom_call = """let parsed = null;
  try {
    const cg = await jobSimFetch("/job-sim/llm/career-guide", {
      method: "POST",
      body: JSON.stringify({ query })
    });
    if (cg && cg.result) parsed = deepCleanObject(cg.result);
  } catch (e) {
    parsed = await callGeminiJSON(sys, `Generate career exploration guide and 3 leveled projects (Easy, Medium, Hard) for: ${query}`);
  }"""
    if old_custom_call not in js:
        raise RuntimeError("Could not patch custom career search call")
    js = js.replace(old_custom_call, new_custom_call)

    # Persist session on debrief
    js = js.replace(
        "state.lastDebrief = debrief;\n  renderDebriefScreen(debrief);",
        """state.lastDebrief = debrief;
  try {
    const roleTitle = state.path === "A" ? (state.jdData && state.jdData.title) : (state.careerB && state.careerB.title);
    const diff = String((state.project && state.project.difficulty) || "easy").toLowerCase();
    const difficulty = ["easy", "medium", "hard"].includes(diff) ? diff : "medium";
    const started = await jobSimFetch("/job-sim/sessions", {
      method: "POST",
      body: JSON.stringify({
        role_title: roleTitle || "Role",
        project_title: (state.project && state.project.title) || "Project",
        difficulty,
        project: state.project || {}
      })
    });
    if (started && started.id) {
      await jobSimFetch("/job-sim/sessions/" + started.id, {
        method: "PATCH",
        body: JSON.stringify({
          results: {
            transcript: state.messages,
            debrief,
            max_hint_level_used: state.maxHintLevelUsed,
            support_history: state.supportHistory,
            path: state.path,
            attempt: state.attemptNum
          }
        })
      });
    }
  } catch (e) { /* non-blocking */ }
  renderDebriefScreen(debrief);""",
    )

    # Boot: show gate if needed
    js = js.replace(
        "renderHome();",
        'if (getJobSimToken()) { renderHome(); } else { renderEmailGate(""); }',
        1,
    )
    # Only replace the final boot call — the last occurrence
    # The replace above may have hit goHome's renderHome. Fix carefully.
    # Re-read: first replace with count=1 hits earliest. goHome has renderHome too.
    # Revert approach: restore goHome and patch only final line.

    OUT_CSS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_PARTIAL.parent.mkdir(parents=True, exist_ok=True)

    # Fix accidental first renderHome replacement inside goHome if any
    js = js.replace(
        "if (getJobSimToken()) { renderHome(); } else { renderEmailGate(\"\"); }",
        "renderHome();",
    )
    if not js.rstrip().endswith("renderHome();"):
        # append boot guard
        js = js.rstrip() + "\n\nif (getJobSimToken()) {\n  renderHome();\n} else {\n  renderEmailGate(\"\");\n}\n"
    else:
        js = js.rstrip()
        if js.endswith("renderHome();"):
            js = js[: -len("renderHome();")] + (
                'if (getJobSimToken()) {\n  renderHome();\n} else {\n  renderEmailGate("");\n}\n'
            )

    # Wrap as IIFE (non-module)
    js_out = "(function () {\n\"use strict\";\n" + js + "\n})();\n"

    # Brand home click should keep on /job-simulation/
    body_html = body_html.replace('onclick="goHome()"', 'onclick="goHome()"', 1)

    partial = f"""<div id="job-sim-root">
{body_html}
</div>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Roboto:wght@500;700&display=swap" rel="stylesheet">
"""

    OUT_CSS.write_text(css, encoding="utf-8")
    OUT_JS.write_text(js_out, encoding="utf-8")
    OUT_PARTIAL.write_text(partial, encoding="utf-8")
    print(f"Wrote {OUT_CSS}")
    print(f"Wrote {OUT_JS} ({OUT_JS.stat().st_size} bytes)")
    print(f"Wrote {OUT_PARTIAL}")


if __name__ == "__main__":
    main()
