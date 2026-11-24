(function () {
"use strict";
/* ============================================================================
   TEXT SANITIZER (Strips all em dashes and en dashes from static & dynamic text)
   ============================================================================ */
function cleanText(val) {
  if (typeof val !== "string") return val;
  return val
    .replace(/\u2014/g, ", ")
    .replace(/\u2013/g, "-")
    .replace(/&mdash;/g, ", ")
    .replace(/\s+,\s+/g, ", ")
    .replace(/,\s*,/g, ",")
    .trim();
}

function deepCleanObject(obj) {
  if (typeof obj === "string") return cleanText(obj);
  if (Array.isArray(obj)) return obj.map(deepCleanObject);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const k of Object.keys(obj)) {
      out[k] = deepCleanObject(obj[k]);
    }
    return out;
  }
  return obj;
}

function getInitials(name) {
  return (name || "ST").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function getDifficultyBadgeClass(diff) {
  const d = (diff || "Easy").toLowerCase();
  if (d.includes("hard")) return "diff-hard";
  if (d.includes("med")) return "diff-medium";
  return "diff-easy";
}


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


/* ============================================================================
   CURATED DATA: PATH A (PRODUCT MANAGER SAMPLE JD + EXTRA BATCHES)
   ============================================================================ */
const SAMPLE_JD_TEXT = `Role: Product Manager
Organization: B2B SaaS Workflow Platform
About the Role:
We are looking for a Product Manager to lead core workflow adoption, onboarding activation, and cross-functional feature delivery. You will partner closely with Engineering, Design, Data Analytics, and Go-To-Market teams to diagnose user problems, prioritize high-impact initiatives, and drive measurable product growth.

Key Responsibilities:
- Analyze product funnel metrics and user feedback to identify core retention and activation bottlenecks.
- Prioritize the product roadmap based on customer impact, engineering effort, and business constraints.
- Partner with engineers and UX designers to define clear product requirements and ship iterative releases.
- Align cross-functional stakeholders around product trade-offs and measure post-launch outcomes.`;

const PRELOADED_PATH_A = {
  title: "Product Manager",
  orgType: "B2B SaaS Workflow Platform",
  plainResponsibilities: [
    "Diagnose user drop-offs and retention bottlenecks using product analytics and customer feedback.",
    "Prioritize the product roadmap by balancing user value, business goals, and engineering effort.",
    "Define clear product requirements and collaborate daily with engineering and design teams.",
    "Align cross-functional stakeholders on trade-offs and evaluate post-launch adoption metrics."
  ],
  projects: [
    {
      id: "pm-a-1",
      difficulty: "Easy",
      title: "Fixing Day-1 User Onboarding Drop-Off",
      shortDesc: "Investigate a sharp decline in new user retention and align your lead engineer on fixing onboarding friction before building complex power-user features.",
      tags: ["Problem Diagnosis", "Roadmap Prioritization"],
      businessContext: "Day-14 user retention fell from 42% to 28% this quarter. Funnel analytics show 68% of new signups abandon the product during Day-1 workspace setup, while users who finish setup retain at 85%.",
      objective: "Examine the funnel evidence, identify the Day-1 setup bottleneck, and align the Lead Engineer on prioritizing onboarding improvements this sprint.",
      yourRole: "Product Manager leading sprint prioritization with your Lead Software Engineer.",
      deliverables: "Data-backed problem diagnosis, sprint priority recommendation, and a phased plan for Engineering.",
      challenges: "The Lead Engineer wants to spend the sprint building an advanced Custom Automation feature and views onboarding changes as routine work.",
      skillsApplied: ["Problem Clarification", "Data-Backed Decisions", "Sprint Prioritization"],
      rubric: [
        "Clarifies the underlying user retention bottleneck before jumping to solutions.",
        "Uses concrete funnel data (68% Day-1 drop-off vs. 85% completion retention) to support decisions.",
        "Prioritizes initiatives based on customer impact and sprint capacity constraints.",
        "Addresses the Lead Engineer's concerns constructively and proposes a phased compromise."
      ],
      simulationSetup: {
        stakeholderName: "Alex Rivera",
        stakeholderRole: "Lead Software Engineer",
        setScene: "You are in Sprint Planning with Alex Rivera, Lead Software Engineer. Analytics show 68% of new signups quit during Day-1 workspace setup, while users who complete setup retain at 85%. Alex wants to dedicate this sprint to building a Custom Automation Builder instead.",
        openingLine: "Before we lock the sprint backlog, my team is excited to start building the Custom Automation Builder today. Why are you suggesting we pause new features to rework the Day-1 onboarding flow?"
      }
    },
    {
      id: "pm-a-2",
      difficulty: "Medium",
      title: "Scoping an Enterprise Reporting Request",
      shortDesc: "Negotiate a realistic MVP scope when the VP of Sales demands a custom reporting dashboard in two weeks to close a major enterprise deal.",
      tags: ["Scope Management", "Stakeholder Alignment"],
      businessContext: "A $250k enterprise prospect requested automated executive PDF exports before signing. Full custom PDF reporting takes 6 weeks of engineering work, which would delay the core Q3 roadmap.",
      objective: "Uncover the prospect's core reporting need and align the VP of Sales on a 1-week CSV + scheduled dashboard MVP that closes the deal without derailing the roadmap.",
      yourRole: "Product Manager negotiating feature scope and timeline with the VP of Enterprise Sales.",
      deliverables: "Core customer problem definition, 1-week MVP specification, and Q3 roadmap protection plan.",
      challenges: "The VP of Sales is under quota pressure and insists that only a custom PDF builder will close the account.",
      skillsApplied: ["Requirement Scoping", "Trade-Off Negotiation", "Cross-Functional Alignment"],
      rubric: [
        "Clarifies the enterprise buyer's underlying reporting job-to-be-done rather than taking the feature request at face value.",
        "Uses engineering effort estimates and roadmap trade-offs to frame the cost of a 6-week custom build.",
        "Proposes a lean, high-value MVP alternative that fits within the prospect's decision timeline.",
        "Addresses the Sales VP's revenue urgency and commits to a clear follow-up validation step."
      ],
      simulationSetup: {
        stakeholderName: "Marcus Vance",
        stakeholderRole: "VP of Enterprise Sales",
        setScene: "You are meeting with Marcus Vance, VP of Enterprise Sales. He wants Engineering to drop current sprint commitments and spend 6 weeks building a custom PDF report generator for a $250k prospect.",
        openingLine: "We have $250k on the line with Acme Corp this month, and their procurement lead asked for automated PDF report exports. Can you pull two engineers off the core roadmap today so we can promise them the full PDF builder in two weeks?"
      }
    },
    {
      id: "pm-a-3",
      difficulty: "Hard",
      title: "Resolving a Post-Launch Pricing & Packaging Conflict",
      shortDesc: "Lead an executive decision when a new AI add-on drives high trial usage but triggers customer support escalations over unexpected usage limits.",
      tags: ["Product Strategy", "Executive Decision-Making"],
      businessContext: "Two weeks after launching the new AI Workflow Assistant, 40% of active teams hit the 50-run monthly paywall within 3 days. Support tickets spiked 300%, and Customer Success wants the paywall removed completely, while Finance requires protecting gross margins.",
      objective: "Diagnose the paywall friction and align the VP of Customer Success on a usage-tier adjustment that protects cloud compute margins while reducing customer frustration.",
      yourRole: "Product Manager presenting a data-backed packaging adjustment to the VP of Customer Success.",
      deliverables: "Usage distribution analysis, revised threshold recommendation, and customer communication plan.",
      challenges: "Customer Success wants unlimited free AI runs to stop complaints immediately, even though compute costs would erase account profitability.",
      skillsApplied: ["Unit Economics", "Data Analysis", "Executive Conflict Resolution"],
      rubric: [
        "Clarifies both the customer experience friction and the underlying unit-economics constraint.",
        "Uses usage distribution and margin data to evaluate the impact of changing paywall thresholds.",
        "Prioritizes a balanced packaging change (such as usage alerts and a higher starter cap) over extreme options.",
        "Addresses Customer Success escalations empathetically while protecting sustainable product margins."
      ],
      simulationSetup: {
        stakeholderName: "Elena Rostova",
        stakeholderRole: "VP of Customer Success",
        setScene: "You are in an urgent review with Elena Rostova, VP of Customer Success. Support tickets jumped 300% after users hit the 50-run AI paywall in 3 days, and Elena wants the limit removed immediately despite high AI compute costs.",
        openingLine: "My Customer Success Managers are getting hammered with complaints from angry users who hit the 50-run AI cap on day three. Can we just turn off the usage cap for the rest of the quarter so my team can calm these accounts down?"
      }
    }
  ],
  extraBatches: [
    [
      {
        id: "pm-a-4",
        difficulty: "Easy",
        title: "Streamlining Mobile Notification Settings",
        shortDesc: "Reduce mobile app uninstalls by simplifying noisy default push notifications without hurting weekly active engagement.",
        tags: ["User Experience", "Metric Analysis"],
        businessContext: "Mobile app uninstalls rose 22% among first-week users. Survey data shows 61% of uninstallers cite too many daily push notifications, but the Growth team fears turning off notifications will drop Weekly Active Users (WAU).",
        objective: "Propose a smart notification digest default that cuts uninstall rates while preserving weekly engagement.",
        yourRole: "Product Manager aligning the Growth Marketing Lead on notification default settings.",
        deliverables: "Uninstall data summary, smart digest experiment design, and guardrail metrics.",
        challenges: "The Growth Lead is measured on daily notification clicks and resists reducing push frequency.",
        skillsApplied: ["Experiment Design", "Metric Trade-Offs", "Stakeholder Alignment"],
        rubric: [
          "Clarifies the link between notification volume and first-week app uninstalls.",
          "Uses the 61% survey finding and 22% uninstall spike to justify testing new defaults.",
          "Balances short-term click volume against long-term user retention.",
          "Proposes a controlled A/B test with clear guardrail metrics to reassure the Growth Lead."
        ],
        simulationSetup: {
          stakeholderName: "Jordan Blake",
          stakeholderRole: "Growth Marketing Lead",
          setScene: "You are meeting with Jordan Blake, Growth Marketing Lead. First-week app uninstalls rose 22% due to notification fatigue, but Jordan relies on daily push alerts to hit weekly click targets.",
          openingLine: "I saw your proposal to cut our default push notifications from five per day down to one daily digest. If we do that, won't our daily click-through numbers tank this month?"
        }
      },
      {
        id: "pm-a-5",
        difficulty: "Medium",
        title: "Deprecating a Legacy Integration",
        shortDesc: "Create a migration plan to sunset a high-maintenance legacy API used by 8% of customers so Engineering can focus on modern webhooks.",
        tags: ["Technical Debt", "Customer Migration"],
        businessContext: "Maintaining the legacy v1 Sync API consumes 30% of backend engineering capacity for bugs, yet only 8% of accounts still use it. Engineering wants to shut it off in 14 days, while Account Management fears churn.",
        objective: "Align the Engineering Manager on a 60-day assisted migration timeline with a one-click upgrade tool.",
        yourRole: "Product Manager balancing backend engineering velocity with customer retention.",
        deliverables: "Deprecation timeline, automated migration utility scope, and customer outreach schedule.",
        challenges: "The Engineering Manager is frustrated by v1 maintenance bugs and wants an immediate 14-day cutoff.",
        skillsApplied: ["Technical Trade-Offs", "Migration Planning", "Cross-Functional Negotiation"],
        rubric: [
          "Clarifies both the 30% engineering maintenance burden and the retention risk for the 8% of active accounts.",
          "Uses account usage data to segment which customers need migration support.",
          "Proposes a realistic 60-day sunset window paired with a self-serve migration helper.",
          "Addresses the Engineering Manager's burnout concerns by freezing non-critical v1 changes immediately."
        ],
        simulationSetup: {
          stakeholderName: "Samir Patel",
          stakeholderRole: "Backend Engineering Manager",
          setScene: "You are syncing with Samir Patel, Backend Engineering Manager. Legacy v1 API bugs take up 30% of his team's sprint time, and he wants to shut down the endpoint in 14 days.",
          openingLine: "My engineers spent another 40 hours this week patching the legacy v1 API for just 8% of our user base. Why can't we send an email today and shut v1 down permanently in two weeks?"
        }
      },
      {
        id: "pm-a-6",
        difficulty: "Hard",
        title: "Pivoting a Delayed Q4 Flagship Launch",
        shortDesc: "Navigate an executive trade-off when security compliance reviews delay your flagship enterprise launch by four weeks right before the annual user conference.",
        tags: ["Crisis Management", "Executive Communication"],
        businessContext: "Three weeks before the annual customer conference, InfoSec flagged a data-isolation vulnerability in the new Collaborative Workspace feature. Fixing it properly takes 4 weeks, meaning a full general availability launch at the conference is impossible.",
        objective: "Align the VP of Product Marketing on announcing an invite-only sandbox beta at the conference while Engineering completes the security fix.",
        yourRole: "Lead Product Manager aligning Product Marketing and Security constraints ahead of the keynote.",
        deliverables: "Phased beta launch plan, security risk mitigation summary, and updated keynote messaging.",
        challenges: "The VP of Product Marketing has already built the keynote around instant general availability for all users.",
        skillsApplied: ["Risk Management", "Launch Strategy", "Executive Alignment"],
        rubric: [
          "Clarifies why the InfoSec data-isolation requirement is non-negotiable for general availability.",
          "Evaluates launch options based on security risk, engineering timeline, and keynote impact.",
          "Proposes a gated sandbox beta that preserves the live keynote demo without exposing customer production data.",
          "Addresses Marketing's concerns empathetically and provides clear customer wait-list messaging."
        ],
        simulationSetup: {
          stakeholderName: "claire Vance",
          stakeholderRole: "VP of Product Marketing",
          setScene: "You are meeting with Claire Vance, VP of Product Marketing, three weeks before the annual user conference. InfoSec found a data-isolation issue that requires 4 weeks to fix, blocking an open public launch.",
          openingLine: "Our CEO keynote is in three weeks and the press release promises instant public access to Collaborative Workspaces. Are you telling me InfoSec is blocking the launch, or can we still turn access on for everyone on keynote day?"
        }
      }
    ],
    [
      {
        id: "pm-a-7",
        difficulty: "Easy",
        title: "Prioritizing Accessibility Fixes in Checkout",
        shortDesc: "Build consensus to schedule keyboard-navigation and contrast fixes in the billing flow ahead of minor visual polish.",
        tags: ["Accessibility", "Backlog Prioritization"],
        businessContext: "An accessibility audit revealed that keyboard-only users cannot complete the billing upgrade modal due to focus-trap bugs. Fixing it takes 3 days, competing with a cosmetic dashboard animation request.",
        objective: "Align the Design Lead on prioritizing the 3-day accessibility fix in the upcoming sprint.",
        yourRole: "Product Manager reviewing sprint polish priorities with the Lead Product Designer.",
        deliverables: "Accessibility impact summary, sprint backlog order, and QA verification checklist.",
        challenges: "The Design Lead wants to ship new dashboard micro-animations for a portfolio showcase this sprint.",
        skillsApplied: ["Inclusive Product Management", "Backlog Prioritization", "Team Alignment"],
        rubric: [
          "Clarifies that a broken keyboard billing flow completely blocks upgrades for affected users and enterprise compliance.",
          "Uses the audit findings and 3-day effort estimate to frame the high ROI of the fix.",
          "Sequences functional accessibility compliance ahead of cosmetic animations.",
          "Schedules the animation polish for the following sprint to keep the Design Lead engaged."
        ],
        simulationSetup: {
          stakeholderName: "Liam O'Connor",
          stakeholderRole: "Lead Product Designer",
          setScene: "You are reviewing the UI backlog with Liam O'Connor, Lead Product Designer. You have 3 days of frontend capacity either to fix a keyboard focus bug in billing or to add dashboard micro-animations.",
          openingLine: "We have three days of frontend capacity left for this sprint. I really want to ship the new dashboard welcome animations, so can we push the billing keyboard-navigation fixes to next month?"
        }
      },
      {
        id: "pm-a-8",
        difficulty: "Medium",
        title: "Improving Search Relevance vs. Voice Search",
        shortDesc: "Use search log analytics to convince a stakeholder to fix zero-result text queries before investing in a speculative voice-search feature.",
        tags: ["Search Analytics", "Evidence-Based Roadmapping"],
        businessContext: "Search logs show 24% of daily workspace searches return zero results because of strict exact-word matching and typo intolerance. Meanwhile, an executive stakeholder suggests adding Voice Search.",
        objective: "Use search log data to align the stakeholder on implementing typo-tolerant fuzzy search before exploring voice input.",
        yourRole: "Product Manager reviewing Q2 search roadmap priorities with the VP of Strategy.",
        deliverables: "Zero-result query analysis, fuzzy-search impact projection, and Q2 roadmap sequence.",
        challenges: "The VP of Strategy recently saw a competitor demo voice search and wants a flashy counter-feature.",
        skillsApplied: ["Data Storytelling", "Problem Validation", "Executive Influence"],
        rubric: [
          "Clarifies the core user failure mode (24% of daily searches returning zero results).",
          "Uses search log evidence to show that fixing typo tolerance impacts far more users than voice input.",
          "Prioritizes foundational search relevance based on high user frequency and lower engineering complexity.",
          "Addresses the VP's competitive concern respectfully and defines criteria for evaluating voice search later."
        ],
        simulationSetup: {
          stakeholderName: "Victor Thorne",
          stakeholderRole: "VP of Strategy",
          setScene: "You are reviewing Q2 search priorities with Victor Thorne, VP of Strategy. Analytics show 24% of text searches fail due to typos, but Victor wants the team to build a Voice Search button.",
          openingLine: "I saw our competitor demo Voice Search at a conference yesterday and it looked impressive. Instead of spending Q2 tweaking our text search backend, why don't we build Voice Search right now?"
        }
      },
      {
        id: "pm-a-9",
        difficulty: "Hard",
        title: "Aligning International Expansion Localization Scope",
        shortDesc: "Coordinate Engineering, Legal, and Regional Sales to launch in Germany on time by separating mandatory GDPR data residency from optional UI features.",
        tags: ["Global Expansion", "Cross-Functional Trade-Offs"],
      businessContext: "The company plans to launch in Germany in 8 weeks. EU data residency and German UI translation take 6 weeks, while building local SEPA direct-debit billing takes another 5 weeks (totaling 11 weeks if done sequentially).",
        objective: "Structure a compliant 8-week launch using EU data residency + German UI + standard credit/invoice billing, scheduling automated SEPA direct-debit for 30 days post-launch.",
        yourRole: "Product Manager leading the international launch readiness review with the EMEA Regional Director.",
        deliverables: "8-week compliant launch scope, payment method breakdown, and Day-30 fast-follow commitment.",
        challenges: "The EMEA Regional Director insists that every local feature must be included on Day 1 without slipping the 8-week launch date.",
        skillsApplied: ["Regulatory Prioritization", "Release Phasing", "International Stakeholder Management"],
        rubric: [
          "Distinguishes clearly between legally mandatory launch blockers (EU data residency) and phaseable enhancements.",
          "Uses timeline and engineering capacity constraints (11 weeks vs. 8 weeks) to show why scope phasing is required.",
          "Proposes an on-time Day-1 launch using invoice/card billing paired with a 30-day SEPA fast-follow.",
          "Addresses the Regional Director's market readiness concerns with data on enterprise invoice preferences."
        ],
        simulationSetup: {
          stakeholderName: "Hannah Weber",
          stakeholderRole: "EMEA Regional Director",
          setScene: "You are in the Germany launch readiness meeting with Hannah Weber, EMEA Regional Director. Engineering needs 11 weeks to build EU data residency, German UI, and automated SEPA billing, but the launch date is in 8 weeks.",
          openingLine: "Our Munich launch event is locked in for eight weeks from today. How are you going to deliver EU data hosting, full German translation, and automated SEPA direct-debit all by Day 1 without moving the date?"
        }
      }
    ]
  ]
};

/* ============================================================================
   CURATED DATA: PATH B (12 CAREERS IN 3 SETS OF 4 + CUSTOM CAREER GENERATOR)
   ============================================================================ */
const CAREERS_POOL_PATH_B = [
  {
    id: "pm",
    title: "Product Manager",
    shortDesc: "Prioritize features, work with engineers, and make product decisions.",
    whatTheyDo: "Product Managers bridge user needs, business goals, and engineering reality. They diagnose which problems matter most, align cross-functional teams around a clear roadmap, and make tough trade-off decisions.",
    typicalWorkday: "Morning standup with engineers, mid-day funnel data analysis to spot user drop-offs, afternoon customer interviews, and scoping product requirements with designers.",
    typicalProjects: "Redesigning user onboarding to stop churn, launching a self-serve billing tier, or scoping an AI workflow assistant.",
    skillsAndTools: ["Problem Discovery", "Data Analysis (Amplitude/SQL)", "Prioritization", "Stakeholder Alignment", "Figma & Linear"],
    challenges: "Saying 'no' to loud feature requests using objective data, and guiding teams without direct managerial authority.",
    relatedCareers: ["Product Marketing Manager", "UX Designer", "Data Analyst"],
    projects: JSON.parse(JSON.stringify(PRELOADED_PATH_A.projects)),
    extraBatches: JSON.parse(JSON.stringify(PRELOADED_PATH_A.extraBatches))
  },
  {
    id: "da",
    title: "Data Analyst",
    shortDesc: "Analyze data, identify patterns, and communicate insights.",
    whatTheyDo: "Data Analysts turn raw behavioral and financial datasets into clear strategic recommendations. Rather than just pulling spreadsheets, they uncover why metrics shifted and prevent costly misinterpretations.",
    typicalWorkday: "Writing SQL queries to investigate metric anomalies, cleaning cohort datasets, building visual dashboards, and briefing leadership on actionable insights.",
    typicalProjects: "Evaluating promotion ROI across user cohorts, diagnosing checkout funnel drop-offs, and building executive KPI models.",
    skillsAndTools: ["SQL & Python", "Cohort & Funnel Analysis", "Data Storytelling", "Hypothesis Testing", "Tableau / Looker"],
    challenges: "Helping stakeholders look past vanity headline numbers (like raw signups) to understand true retention and unit economics.",
    relatedCareers: ["Product Manager", "Financial Analyst", "Marketing Analytics Manager"],
    projects: [
      {
        id: "da-1",
        difficulty: "Easy",
        title: "Evaluating a Discount Campaign's True Impact",
        shortDesc: "Marketing wants to double budget on a 30%-off promo because signups rose 40%. Present cohort data showing promo users churn at 3x the normal rate and recommend a targeted alternative.",
        tags: ["Cohort Analysis", "Data Storytelling"],
        businessContext: "Last month's Flash30 discount drove a 40% spike in new signups. The Marketing Director wants to run it site-wide all quarter. Your cohort data reveals Month-2 retention for monthly promo users fell to 18% (vs. 54% baseline), except when paired with annual plans.",
        objective: "Explain the trade-off between raw signup volume and net customer lifetime value (LTV), and align the Marketing Director on restricting the discount to annual plans.",
        yourRole: "Lead Data Analyst reviewing campaign findings with the Director of Growth Marketing.",
        deliverables: "Cohort retention breakdown, profitable segment identification, and targeted recommendation.",
        challenges: "The Marketing Director is proud of the +40% signup headline and gets defensive if the campaign is framed as a failure.",
        skillsApplied: ["Cohort Diagnostics", "Data Storytelling", "Constructive Pushback"],
        rubric: [
          "Clarifies the core business goal (sustainable net revenue vs. raw signup volume).",
          "Uses specific cohort retention data (18% vs. 54% baseline) to explain why headline metrics are incomplete.",
          "Proposes a targeted optimization (annual-plan promo) rather than a flat rejection.",
          "Addresses the stakeholder's pride diplomatically while standing firm on the data."
        ],
        simulationSetup: {
          stakeholderName: "Jordan Blake",
          stakeholderRole: "Director of Growth Marketing",
          setScene: "You are reviewing the campaign slide deck with Jordan Blake an hour before the CEO budget meeting. Slide 1 proclaims '+40% Signup Surge!', overlooking that Month-2 retention for monthly promo users dropped to 18%.",
          openingLine: "Did you see the Flash30 results with a 40% jump in signups? I am asking the CEO to double our site-wide discount budget for Q4, so can you confirm the numbers look great?"
        }
      },
      {
        id: "da-2",
        difficulty: "Medium",
        title: "Diagnosing a Regional Conversion Drop",
        shortDesc: "Investigate why checkout conversion dropped 15% this week and prevent leadership from blaming ad quality when the real culprit is a mobile payment bug.",
        tags: ["Funnel Diagnostics", "Root-Cause Analysis"],
        businessContext: "Overall checkout conversion dropped 15% this week. Sales leadership wants to pause paid acquisition campaigns immediately, assuming ad traffic quality degraded. Your device-level cut shows desktop conversion is flat, while iOS Apple Pay fails 62% of the time after Tuesday's app update.",
        objective: "Present the segmented device breakdown to stop an unnecessary ad pause and redirect urgency toward hotfixing the iOS payment bug.",
        yourRole: "Data Analyst briefing the Head of E-Commerce during an urgent conversion review.",
        deliverables: "Device-segmented funnel breakdown, root-cause isolation, and immediate action plan.",
        challenges: "The Head of E-Commerce is ready to pull the plug on paid ads within the hour based on the blended average drop.",
        skillsApplied: ["Segmentation Analysis", "Anomaly Detection", "Executive Briefing"],
        rubric: [
          "Clarifies why blended average conversion hides the true underlying issue.",
          "Uses segmented device and payment data (desktop flat vs. 62% iOS failure) to pinpoint the root cause.",
          "Recommends keeping healthy ad campaigns live while escalating the iOS hotfix.",
          "Addresses the stakeholder's urgency with a clear metric monitoring plan post-fix."
        ],
        simulationSetup: {
          stakeholderName: "Rachel Sterling",
          stakeholderRole: "Head of E-Commerce",
          setScene: "You are in an emergency huddle with Rachel Sterling, Head of E-Commerce. Blended checkout conversion fell 15% this week, and she is about to pause all paid social ads.",
          openingLine: "Blended conversion is down 15% since Tuesday, so clearly our new ad creatives are bringing in low-intent traffic. Should I pause all paid campaigns right now before we waste more budget?"
        }
      },
      {
        id: "da-3",
        difficulty: "Hard",
        title: "Standardizing Conflicting Revenue Definitions",
        shortDesc: "Resolve a board-report discrepancy where Sales and Finance report Active ARR numbers that differ by $1.4M due to unaligned churn definitions.",
        tags: ["Data Governance", "Executive Alignment"],
        businessContext: "Two days before the quarterly board meeting, Sales reports $18.4M in Active ARR (counting signed contracts plus grace-period renewals), while Finance reports $17.0M (counting only paid invoiced subscriptions). Both VPs claim the other team's dashboard is wrong.",
        objective: "Explain the exact definitional gap without blaming either team and align the VP of Sales on a two-metric executive view (Booked ARR vs. Invoiced ARR).",
        yourRole: "Senior Data Analyst reconciling the board deck metrics with the VP of Sales.",
        deliverables: "Reconciliation bridge table, standardized metric definitions, and single-source dashboard proposal.",
        challenges: "The VP of Sales feels Finance is undercutting Sales performance in front of the board.",
        skillsApplied: ["Metric Governance", "Data Reconciliation", "Cross-Department Diplomacy"],
        rubric: [
          "Clarifies the exact technical reason for the $1.4M gap (signed bookings + grace period vs. paid invoices).",
          "Uses a transparent reconciliation bridge to show both numbers are mathematically accurate for different stages.",
          "Proposes clear, distinct labels (Booked ARR vs. Realized Invoiced ARR) for the board slide.",
          "De-escalates inter-departmental friction and secures agreement on a shared data dictionary."
        ],
        simulationSetup: {
          stakeholderName: "Marcus Vance",
          stakeholderRole: "VP of Global Sales",
          setScene: "You are reviewing the board deck with Marcus Vance, VP of Global Sales. His CRM shows $18.4M ARR, while Finance's billing table shows $17.0M ARR due to $1.4M in pending renewals and unbilled contracts.",
          openingLine: "Finance put $17.0M ARR on the board slide when my CRM clearly shows $18.4M in active signed deals. Can you tell the CFO that Finance's SQL query is broken so we show the $18.4M number?"
        }
      }
    ],
    extraBatches: []
  },
  {
    id: "ux",
    title: "UX Designer",
    shortDesc: "Research user needs and design digital experiences.",
    whatTheyDo: "UX Designers make digital products intuitive, accessible, and frictionless. They observe real users, diagnose workflow confusion, design interactive prototypes, and balance user simplicity with business goals.",
    typicalWorkday: "Running 30-minute usability tests, mapping user flows, iterating wireframes and interactive prototypes in Figma, and reviewing technical feasibility with engineers.",
    typicalProjects: "Simplifying a high-abandonment mobile checkout, designing an enterprise analytics dashboard, and conducting accessibility audits.",
    skillsAndTools: ["Usability Testing", "Interaction Design", "Information Architecture", "Figma Prototyping", "Design Rationale"],
    challenges: "Protecting a simple, high-converting user experience when internal teams want to add extra mandatory form fields and pop-ups.",
    relatedCareers: ["Product Manager", "UX Researcher", "Frontend UI Engineer"],
    projects: [
      {
        id: "ux-1",
        difficulty: "Easy",
        title: "Simplifying a High-Abandonment Checkout Flow",
        shortDesc: "Present usability evidence to stop the Sales VP from adding three mandatory CRM dropdowns onto Step 1 of mobile checkout.",
        tags: ["Usability Evidence", "Design Negotiation"],
        businessContext: "Mobile checkout abandonment sits at 71%. Usability testing with 12 buyers showed 8 of 12 quit on Step 1 because of mandatory profile fields. Now the VP of Commercial Sales wants to add 3 more mandatory dropdowns (Budget, Company Size, Timeline) onto Step 1.",
        objective: "Present usability evidence and gain buy-in on progressive disclosure (capturing CRM lead questions after purchase) so conversion and lead routing both win.",
        yourRole: "Lead UX Designer reviewing the checkout redesign with the VP of Commercial Sales.",
        deliverables: "Usability test evidence summary, post-checkout progressive profiling flow, and A/B test plan.",
        challenges: "The VP of Sales prioritizes CRM data completeness and thinks form placement is just cosmetic.",
        skillsApplied: ["User Research Synthesis", "Progressive Disclosure", "Trade-Off Negotiation"],
        rubric: [
          "Clarifies both the mobile checkout friction problem and the stakeholder's CRM routing need.",
          "Uses concrete usability testing observations (8 of 12 users quitting on Step 1) rather than subjective opinions.",
          "Proposes progressive disclosure (collecting CRM fields on the post-purchase confirmation screen).",
          "Addresses stakeholder pushback constructively and proposes an A/B test to verify lead completion."
        ],
        simulationSetup: {
          stakeholderName: "Rachel Sterling",
          stakeholderRole: "VP of Commercial Sales",
          setScene: "You are reviewing your streamlined mobile checkout prototype with Rachel Sterling, VP of Commercial Sales. She wants three mandatory CRM qualification dropdowns added onto Step 1 before payment.",
          openingLine: "I looked at your mobile checkout mockups and noticed you removed the company profile questions. I actually need three mandatory dropdowns on Step 1 for Budget, Company Size, and Timeline so my reps can route leads, so can you add those back today?"
        }
      },
      {
        id: "ux-2",
        difficulty: "Medium",
        title: "Redesigning an Overloaded Enterprise Dashboard",
        shortDesc: "Restructure a cluttered 28-widget analytics home screen using information hierarchy when the Product Director wants every feature visible above the fold.",
        tags: ["Information Architecture", "Visual Hierarchy"],
        businessContext: "Enterprise admins take an average of 4 minutes just to find the Weekly Alert Summary because the home dashboard crams 28 widgets onto one screen. The Product Director fears hiding any widget inside tabs will reduce feature discovery.",
        objective: "Use task-completion timing data to align the Product Director on a customizable role-based summary view with expandable detail drawers.",
        yourRole: "Senior UX Designer presenting the dashboard information architecture to the Product Director.",
        deliverables: "Task-time usability findings, tiered dashboard hierarchy prototype, and discovery metric plan.",
        challenges: "The Product Director equates putting a widget on the home screen with high adoption.",
        skillsApplied: ["Information Architecture", "Cognitive Load Reduction", "Stakeholder Influence"],
        rubric: [
          "Clarifies how visual overload (28 competing widgets) actually hurts task completion and discovery.",
          "Uses task-timing evidence (4 minutes to locate alerts) to justify information hierarchy.",
          "Proposes a clean primary summary view paired with role-based progressive drill-downs.",
          "Addresses the Product Director's feature-adoption concern by tracking drill-down engagement."
        ],
        simulationSetup: {
          stakeholderName: "David Chen",
          stakeholderRole: "Director of Enterprise Product",
          setScene: "You are reviewing the new enterprise home dashboard with David Chen. Users currently take 4 minutes to locate critical alerts amid 28 widgets, but David wants all 28 widgets kept above the fold.",
          openingLine: "In your new wireframe, you moved 18 of our analytics widgets into secondary tabs and drawers. If users don't see all 28 widgets on the main screen immediately, won't they forget those features exist?"
        }
      },
      {
        id: "ux-3",
        difficulty: "Hard",
        title: "Designing Trustworthy AI Permission Controls",
        shortDesc: "Resolve a conflict between Growth and Legal by designing transparent, user-friendly AI data-sharing controls that avoid dark patterns.",
        tags: ["Ethical UX", "Cross-Functional Alignment"],
        businessContext: "The company is launching an AI Document Summarizer. Growth wants a hidden pre-checked opt-in box to train models on user docs, while Legal wants a 1,200-word legalese popup wall that blocks the workflow.",
        objective: "Align the Growth Lead on a clear, plain-language inline permission toggle that builds user trust without using dark patterns or unreadable legal walls.",
        yourRole: "Staff UX Designer mediating the onboarding consent flow with the Growth Product Lead.",
        deliverables: "Plain-language consent pattern, trust test results, and compliant opt-in flow.",
        challenges: "The Growth Lead worries that an explicit, transparent choice will lower opt-in rates compared to a hidden pre-checked box.",
        skillsApplied: ["Ethical Design", "Regulatory UX", "Persuasive Communication"],
        rubric: [
          "Clarifies why dark patterns (hidden pre-checked boxes) create severe enterprise trust and compliance risks.",
          "Uses user trust testing insights to show that plain-language value explanations drive sustainable opt-ins.",
          "Proposes a contextual, plain-English inline choice rather than a 1,200-word legal wall or hidden toggle.",
          "Addresses the Growth Lead's opt-in target by highlighting clear user benefits right next to the control."
        ],
        simulationSetup: {
          stakeholderName: "Jordan Blake",
          stakeholderRole: "Growth Product Lead",
          setScene: "You are reviewing the AI Document Summarizer consent screen with Jordan Blake. Growth wants data-training consent buried in a pre-checked footnote to maximize opt-in rates.",
          openingLine: "If we show users an explicit toggle asking permission to use their documents for AI quality improvement, half of them will click 'No'. Why can't we just leave it pre-checked inside the fine-print terms link?"
        }
      }
    ],
    extraBatches: []
  },
  {
    id: "fa",
    title: "Financial Analyst",
    shortDesc: "Build financial models and support business decisions.",
    whatTheyDo: "Financial Analysts evaluate the unit economics, cash flow risks, and ROI of strategic bets. They stress-test assumptions, build sensitivity forecasts, and help leaders allocate capital wisely.",
    typicalWorkday: "Updating monthly P&L variance models, running best/base/downside scenario analyses for new proposals, and preparing executive investment memos.",
    typicalProjects: "Stress-testing a new market expansion proposal, modeling SaaS pricing tier margins, and preparing quarterly board forecasts.",
    skillsAndTools: ["Financial Modeling", "Sensitivity & Risk Analysis", "Unit Economics", "Excel / SQL", "Executive Partnering"],
    challenges: "Challenging overly optimistic growth assumptions from department heads without being seen as a roadblock.",
    relatedCareers: ["Corporate Strategy Manager", "Data Analyst", "Revenue Operations Manager"],
    projects: [
      {
        id: "fa-1",
        difficulty: "Easy",
        title: "Stress-Testing an Expansion Proposal",
        shortDesc: "Walk the VP of Operations through fragile ramp-time assumptions in a $1.2M hiring request and align on a milestone-gated funding plan.",
        tags: ["Financial Modeling", "Risk Advisory"],
        businessContext: "The VP of Operations is requesting $1.2M upfront today to hire 10 specialists for a new enterprise tier, projecting a 4-month payback based on 100% Day-1 utilization. Your sensitivity model shows a realistic 3-month ramp extends payback to 14 months and creates a $450k cash shortfall.",
        objective: "Highlight the cash-burn risk of assuming instant 100% utilization and align the VP on a 2-tranche milestone hiring plan (5 hires now, 5 hires after hitting 75% utilization).",
        yourRole: "Senior Financial Analyst advising the VP of Operations ahead of CFO approval.",
        deliverables: "Sensitivity risk breakdown, downside cash-burn impact, and 2-tranche milestone funding plan.",
        challenges: "The VP of Operations wants all $1.2M upfront and views Finance guardrails as bureaucracy.",
        skillsApplied: ["Assumption Stress-Testing", "Payback Modeling", "Staged Capital Allocation"],
        rubric: [
          "Clarifies the strategic upside while pinpointing fragile model assumptions (100% Day-1 utilization).",
          "Uses concrete financial figures (14-month payback, $450k cash risk) to illustrate downside exposure.",
          "Proposes a staged 2-tranche milestone funding plan rather than flatly rejecting the headcount.",
          "Addresses the stakeholder's growth urgency and frames guardrails as the fastest way to win CFO sign-off."
        ],
        simulationSetup: {
          stakeholderName: "Victor Thorne",
          stakeholderRole: "VP of Operations",
          setScene: "You are meeting with Victor Thorne an hour before the CFO capital review. Victor's model asks for $1.2M upfront today to hire 10 specialists at once, assuming 100% billable utilization starting Day 1.",
          openingLine: "Look at my spreadsheet: $1.2M upfront for 10 specialists, and we break even in 4 months flat. Can I count on Finance to back the full $1.2M upfront request in the CFO meeting today?"
        }
      },
      {
        id: "fa-2",
        difficulty: "Medium",
        title: "Restructuring an Unprofitable Enterprise Deal",
        shortDesc: "Help the Sales Director restructure a custom 3-year deal where heavy Year-1 implementation costs push gross margin down to 32%.",
        tags: ["Deal Desk Margin", "Pricing Structure"],
        businessContext: "Sales wants approval on a $300k/year contract that includes 800 hours of free custom engineering onboarding in Year 1. Your deal-desk model shows Year-1 gross margin drops to 32% (well below the 70% company floor), burning $110k in upfront services cost.",
        objective: "Align the Sales Director on charging a dedicated $60k Year-1 implementation fee or capping free onboarding hours at 150 hours to protect gross margin.",
        yourRole: "Deal Desk Financial Analyst reviewing contract unit economics with the Enterprise Sales Director.",
        deliverables: "Gross margin breakdown, onboarding cost cap options, and revised contract term sheet.",
        challenges: "The Sales Director only cares about the top-line $300k ARR bookings number for commission.",
        skillsApplied: ["Gross Margin Analysis", "Deal Structuring", "Commercial Negotiation"],
        rubric: [
          "Clarifies the difference between top-line ARR bookings and net gross margin after service delivery costs.",
          "Uses the 32% vs. 70% margin threshold and $110k service cost to explain why the current structure fails review.",
          "Offers concrete deal-structure alternatives (implementation fee or capped hours) that preserve the sale.",
          "Supports the Sales Director in framing the implementation scope as a premium package to the client."
        ],
        simulationSetup: {
          stakeholderName: "Marcus Vance",
          stakeholderRole: "Enterprise Sales Director",
          setScene: "You are reviewing a major contract with Marcus Vance. He offered 800 hours of free Year-1 custom engineering setup to close a $300k ARR deal, dragging Year-1 gross margin down to 32%.",
          openingLine: "This is a $300k annual contract ready for signature today, and all we had to throw in was 800 hours of free custom setup. Why is Deal Desk holding up approval over services margin when we are adding $300k in ARR?"
        }
      },
      {
        id: "fa-3",
        difficulty: "Hard",
        title: "Reallocating Q3 Cloud Infrastructure Overruns",
        shortDesc: "Partner with the CTO to curb a 38% cloud compute budget overrun without throttling core production performance.",
        tags: ["Cost Optimization", "OpEx Variance"],
        businessContext: "Monthly AWS cloud spend jumped 38% ($95k/month over budget) due to unindexed staging environments running 24/7 and uncompressed log retention. Finance needs OpEx brought back within budget this quarter without slowing customer-facing app speed.",
        objective: "Use the environment-level cost breakdown to align the VP of Infrastructure on auto-hibernating non-production staging servers and archiving old logs to save $80k/month.",
        yourRole: "FP&A Lead reviewing cloud cost variance with the VP of Infrastructure Engineering.",
        deliverables: "Production vs. staging spend breakdown, $80k/month savings roadmap, and budget tracking cadence.",
        challenges: "The VP of Infrastructure assumes Finance will demand cuts to customer-facing production servers.",
        skillsApplied: ["Variance Decomposition", "Cloud FinOps", "Technical Partnering"],
        rubric: [
          "Clarifies that Finance wants to protect customer-facing production capacity while eliminating non-production waste.",
          "Uses disaggregated cost data (24/7 idle staging clusters and raw log storage) to isolate $80k/month in waste.",
          "Prioritizes automated staging off-hours scheduling and log tiering over production downsizing.",
          "Addresses engineering workflow concerns by keeping staging instant-wake available during work hours."
        ],
        simulationSetup: {
          stakeholderName: "Samir Patel",
          stakeholderRole: "VP of Infrastructure Engineering",
          setScene: "You are reviewing the Q3 cloud variance report with Samir Patel. Cloud spend is $95k/month over budget due to 24/7 idle staging clusters and uncompressed logs.",
          openingLine: "I know our cloud bill came in $95k over budget last month, but if Finance asks me to downgrade our customer-facing production servers, site latency will spike. What exactly are you asking my team to cut?"
        }
      }
    ],
    extraBatches: []
  },
  /* Batch 2 of 4 Careers */
  {
    id: "pmm",
    title: "Product Marketing Manager",
    shortDesc: "Craft product positioning, lead launches, and equip sales teams to win.",
    whatTheyDo: "Product Marketing Managers translate complex product capabilities into compelling customer value propositions. They lead go-to-market launches, conduct competitive intelligence, and enable sales teams.",
    typicalWorkday: "Interviewing won and lost customers, drafting launch messaging frameworks, building sales battlecards, and aligning launch tier timing with Product and Demand Gen.",
    typicalProjects: "Repositioning an enterprise tier against a lower-priced competitor, leading a Tier-1 product launch, and revamping sales discovery decks.",
    skillsAndTools: ["Positioning & Messaging", "Competitive Battlecards", "Launch Orchestration", "Win/Loss Analysis", "Sales Enablement"],
    challenges: "Getting Product, Sales, and Executive leadership to agree on a single differentiated narrative instead of listing 20 technical features.",
    relatedCareers: ["Product Manager", "Growth Marketing Manager", "Customer Marketing Lead"],
    projects: [
      {
        id: "pmm-1",
        difficulty: "Easy",
        title: "Refocusing a Feature-Heavy Launch Announcement",
        shortDesc: "Convince the Engineering Lead to center a launch email on customer workflow time-savings rather than backend database architecture.",
        tags: ["Value Messaging", "Launch Strategy"],
        businessContext: "The team is launching Instant Workspace Search. The Engineering Lead drafted a customer announcement focused on 'Rust-based vector indexing latency,' whereas buyer interviews show customers care about finding client contracts in under 3 seconds.",
        objective: "Align the Engineering Lead on leading the customer email with business outcomes while showcasing the technical architecture in a linked engineering blog post.",
        yourRole: "Product Marketing Manager finalizing launch messaging with the Lead Architect.",
        deliverables: "Outcome-led messaging hierarchy, customer email copy, and technical blog cross-link plan.",
        challenges: "The Lead Architect is proud of the Rust indexing engine and thinks outcome messaging is 'fluff.'",
        skillsApplied: ["Audience Segmentation", "Value Positioning", "Cross-Functional Diplomacy"],
        rubric: [
          "Clarifies the difference between buyer motivations (workflow speed) and technical implementation details.",
          "Uses customer interview insights to support leading with the 3-second contract search outcome.",
          "Proposes a dual-channel approach (outcome-led customer email + deep-dive engineering blog).",
          "Validates the engineering team's technical achievement while protecting customer clarity."
        ],
        simulationSetup: {
          stakeholderName: "Alex Rivera",
          stakeholderRole: "Lead Systems Architect",
          setScene: "You are reviewing the customer launch email with Alex Rivera, Lead Systems Architect. Alex wants the subject line and first paragraph to focus on Rust vector indexing architecture.",
          openingLine: "My team spent four months building our custom Rust vector indexing engine, yet your draft customer email barely mentions it in the headline. Why aren't we leading the announcement with our indexing architecture?"
        }
      },
      {
        id: "pmm-2",
        difficulty: "Medium",
        title: "Countering a Competitor's Half-Price Undercut",
        shortDesc: "Equip the Sales Director with a value-defense battlecard instead of slashing list prices when a new competitor launches a cheap basic clone.",
        tags: ["Competitive Strategy", "Sales Enablement"],
        businessContext: "A startup competitor launched a basic tool at 50% of your price. Win/loss data shows you still win 82% of deals when reps highlight automated SOC2 compliance and ERP sync (which the competitor lacks), but Sales wants an across-the-board 40% price cut.",
        objective: "Use win/loss evidence to align the Sales Director on a targeted competitive battlecard and ROI calculator rather than an margin-destroying price cut.",
        yourRole: "Senior Product Marketing Manager briefing the Commercial Sales Director.",
        deliverables: "Win/loss analysis summary, competitive trap-setting battlecard, and TCO calculator.",
        challenges: "Sales reps are panicking on early discovery calls whenever prospects mention the competitor's sticker price.",
        skillsApplied: ["Win/Loss Diagnostics", "Competitive Positioning", "Sales Coaching"],
        rubric: [
          "Clarifies why competing on raw sticker price erodes margins without addressing total cost of ownership.",
          "Uses the 82% win-rate data (when compliance and ERP sync are introduced) to prove differentiation works.",
          "Provides concrete discovery questions and a TCO battlecard reps can use immediately.",
          "Agrees to join live competitive deal reviews this month to validate the battlecard in the field."
        ],
        simulationSetup: {
          stakeholderName: "Marcus Vance",
          stakeholderRole: "Commercial Sales Director",
          setScene: "You are meeting with Marcus Vance, who wants to slash list prices by 40% to match a budget startup competitor, even though win/loss data shows an 82% win rate when reps position ERP sync and compliance.",
          openingLine: "Three prospects brought up LiteFlow's half-price plan this week and my reps are panicking. Instead of another positioning deck, why don't we just cut our list price by 40% to match them?"
        }
      },
      {
        id: "pmm-3",
        difficulty: "Hard",
        title: "Re-Tiering a Crowded Go-To-Market Launch Calendar",
        shortDesc: "Consolidate four separate minor product updates into one cohesive quarterly narrative when four PMs each demand a standalone Tier-1 launch.",
        tags: ["Launch Governance", "Executive Alignment"],
        businessContext: "Four different Product Managers want separate Tier-1 press releases, webinars, and email blasts inside the same 3-week window. Last quarter, sending 4 separate product blasts caused customer email unsubscribe rates to triple.",
        objective: "Align the Director of Product on bundling the updates into a single themed 'Spring Workflow Release' event.",
        yourRole: "Lead Product Marketing Manager negotiating the Q2 launch calendar with the Director of Product.",
        deliverables: "Tiered launch framework, bundled 'Spring Release' campaign plan, and unsubscribe data review.",
        challenges: "Each PM was promised individual launch visibility, and the Director of Product wants every team's work highlighted.",
        skillsApplied: ["Launch Tiering", "Portfolio Storytelling", "Stakeholder Negotiation"],
        rubric: [
          "Clarifies how launch fatigue (3x unsubscribe spike) hurts overall customer engagement for every feature.",
          "Uses email fatigue metrics and pipeline data to show bundled releases outperform fragmented blasts.",
          "Proposes a unified flagship release event where each of the 4 features gets a dedicated spotlight segment.",
          "Addresses the Product Director's team-recognition concern with dedicated in-app and sales enablement modules."
        ],
        simulationSetup: {
          stakeholderName: "David Chen",
          stakeholderRole: "Director of Product Management",
          setScene: "You are reviewing Q2 launch requests with David Chen. Four PMs on his team each requested a standalone Tier-1 email blast and webinar in May, despite a 3x spike in unsubscribes last quarter.",
          openingLine: "All four of my PMs worked hard on their May features, and each one expects a dedicated Tier-1 email blast and customer webinar. Why are you pushing to combine them into a single bundled announcement?"
        }
      }
    ],
    extraBatches: []
  },
  {
    id: "lxd",
    title: "Learning Experience Designer",
    shortDesc: "Diagnose performance gaps and design interactive workplace training.",
    whatTheyDo: "Learning Experience Designers partner with business leaders to identify why teams are struggling on the job and design practical simulations, job aids, and enablement programs that measurably improve performance.",
    typicalWorkday: "Conducting root-cause interviews with department heads, scripting realistic scenario rehearsals, collaborating with Subject Matter Experts, and analyzing post-training performance data.",
    typicalProjects: "Building a sales discovery simulation, creating a new-manager coaching program, and measuring training impact on support ticket escalations.",
    skillsAndTools: ["Performance Consulting", "Scenario & Simulation Design", "Stakeholder Management", "Impact Evaluation", "Articulate / LMS"],
    challenges: "Moving stakeholders away from mandatory 3-hour slide webinars toward focused, practice-based interventions.",
    relatedCareers: ["Product Manager", "Customer Enablement Manager", "People Operations Partner"],
    projects: [
      {
        id: "lxd-b-1",
        difficulty: "Easy",
        title: "Sales Enablement Program",
        shortDesc: "Diagnose why mid-market deal conversion dropped 18% and steer the VP of Sales away from a mandatory 3-hour slide webinar toward practical call rehearsal.",
        tags: ["Stakeholder Consulting", "Learning Design"],
        businessContext: "Mid-market deal conversion dropped 18% last quarter. The VP of Sales blames reps for not memorizing the new AI module specs and demands a mandatory 3-hour technical webinar by Friday.",
        objective: "Diagnose the true performance bottleneck in customer discovery calls and align the VP on a micro-rehearsal enablement plan without pulling reps off the floor for 3 hours.",
        yourRole: "Senior LXD consulting with the VP of Sales to scope the root issue and intervention.",
        deliverables: "Root-cause diagnostic summary, micro-rehearsal enablement plan, and 30-day deal-progression metric.",
        challenges: "The VP of Sales is urgent, convinced a 60-slide feature webinar will solve the problem, and skeptical of slow design processes.",
        skillsApplied: ["Stakeholder Consulting", "Performance Gap Analysis", "Learning Design"],
        rubric: [
          "Clarifies the underlying performance problem before proposing a training solution.",
          "Uses diagnostic questions or call evidence to test whether memorizing specs solves the conversion drop.",
          "Proposes a realistic practice-based design balanced against sales reps' time constraints.",
          "Addresses the stakeholder's urgency and explains the business rationale behind recommendations."
        ],
        simulationSetup: {
          stakeholderName: "Marcus Vance",
          stakeholderRole: "VP of Global Sales",
          setScene: "Q3 conversion numbers landed 18% below target. You are on a call with Marcus Vance, VP of Global Sales, who has a 60-slide engineering deck open and wants it turned into a mandatory 3-hour webinar by Friday.",
          openingLine: "Our reps are fumbling the new AI module on calls, and Engineering gave me this 60-slide spec deck. Can your team run a mandatory 3-hour webinar for all 120 account executives this Friday?"
        }
      },
      {
        id: "lxd-b-2",
        difficulty: "Medium",
        title: "New Manager Coaching Simulation",
        shortDesc: "Design a low-friction coaching rehearsal pilot for newly promoted engineering leads when the Engineering Director refuses a 4-hour HR seminar.",
        tags: ["Scenario Design", "Performance Consulting"],
        businessContext: "45 recently promoted engineering leads are struggling to give constructive performance feedback. HR wants a 4-hour policy seminar, while Engineering Directors refuse to lose sprint capacity.",
        objective: "Propose a lightweight, realistic 20-minute scenario-rehearsal workflow and align Engineering leadership on a low-friction pilot.",
        yourRole: "Lead Learning Experience Designer scoping the pilot with the Director of Platform Engineering.",
        deliverables: "Asynchronous coaching simulation format, SME time-saving plan, and behavioral success metrics.",
        challenges: "The Engineering Director fiercely protects developer time and dislikes traditional HR workshops.",
        skillsApplied: ["Scenario Design", "Performance Consulting", "Cross-Functional Alignment"],
        rubric: [
          "Diagnoses specific manager behavioral bottlenecks rather than pitching generic theory.",
          "Designs a high-practice simulation format that respects tight engineering time constraints.",
          "Balances competing stakeholder priorities between HR goals and engineering velocity.",
          "Defines clear observable indicators to measure whether coaching conversations improve."
        ],
        simulationSetup: {
          stakeholderName: "Elena Rostova",
          stakeholderRole: "Director of Platform Engineering",
          setScene: "You are meeting with Elena Rostova, whose newly promoted engineering leads have high team turnover. She is skeptical of any training that pulls leads out of sprint delivery.",
          openingLine: "My new team leads freeze up when giving tough code-review feedback, but if you ask them to sit through a 4-hour HR slide seminar, I am blocking it. What are you actually proposing?"
        }
      },
      {
        id: "lxd-b-3",
        difficulty: "Hard",
        title: "Learning Impact Evaluation",
        shortDesc: "Uncover why a $150k Customer Support onboarding revamp with 4.8/5 satisfaction scores hasn't reduced 90-day ticket escalation rates.",
        tags: ["Data Analysis", "Learning Evaluation"],
        businessContext: "The company invested $150k revamping Customer Support onboarding. Post-course satisfaction scores average 4.8/5, yet 90-day ticket escalation rates haven't improved at all.",
        objective: "Present a concrete evaluation strategy that moves beyond course satisfaction scores to uncover workflow blockers preventing on-the-job skill transfer.",
        yourRole: "Senior LXD briefing the VP of Customer Operations on the evaluation diagnostic plan.",
        deliverables: "On-the-job performance metric map, workflow blocker diagnostic, and 30-day evaluation plan.",
        challenges: "The VP is frustrated that high training completion and satisfaction scores haven't improved operational KPIs.",
        skillsApplied: ["Data Analysis", "Learning Evaluation", "Executive Advisory"],
        rubric: [
          "Distinguishes clearly between course satisfaction scores and actual workplace performance.",
          "Hypothesizes realistic workflow or environmental blockers preventing skill transfer.",
          "Selects concrete operational metrics (escalation rate, resolution time) to measure impact.",
          "Presents a structured, credible 30-day diagnostic plan to a skeptical executive."
        ],
        simulationSetup: {
          stakeholderName: "David Chen",
          stakeholderRole: "VP of Customer Operations",
          setScene: "You are reviewing quarterly onboarding metrics with David Chen. Course satisfaction is 4.8/5 with 96% completion, yet new hires are still escalating tier-2 tickets at the exact same rate as last year.",
          openingLine: "Your dashboard shows 96% completion and 4.8 star reviews on the new onboarding, yet my new reps still take 42 hours to resolve standard tickets. Why isn't this training showing up in my operational numbers?"
        }
      }
    ],
    extraBatches: []
  },
  {
    id: "csm",
    title: "Customer Success Manager",
    shortDesc: "Drive enterprise product adoption, prevent churn, and expand accounts.",
    whatTheyDo: "Customer Success Managers partner with clients after the sale to ensure they achieve measurable business outcomes using the platform, driving renewals and account expansion.",
    typicalWorkday: "Leading Executive Business Reviews (EBRs), monitoring account health scores, resolving adoption bottlenecks with client champions, and partnering with Sales on renewals.",
    typicalProjects: "Turning around an at-risk enterprise renewal, onboarding a 500-seat global deployment, and driving adoption of a new workflow module.",
    skillsAndTools: ["Account Health Diagnostics", "Executive Business Reviews", "Renewal Risk Mitigation", "Gainsight / Salesforce", "Value Realization"],
    challenges: "Re-engaging executive sponsors when seat utilization drops 60 days before a major contract renewal.",
    relatedCareers: ["Account Executive", "Implementation Manager", "Product Operations Manager"],
    projects: [
      {
        id: "csm-1",
        difficulty: "Easy",
        title: "Re-Engaging an At-Risk Renewal Account",
        shortDesc: "Turn around a $120k client whose active seat login rate dropped to 35% ninety days before contract renewal.",
        tags: ["Adoption Recovery", "Executive Alignment"],
        businessContext: "GlobalLogistics ($120k ARR) renews in 90 days, but weekly active seat usage dropped from 80% to 35% after their original project manager left. Their VP of Operations just asked to cut their license count in half.",
        objective: "Diagnose the workflow bottleneck behind the usage drop and align the client VP on a 30-day team re-activation plan before discussing license cuts.",
        yourRole: "Senior Customer Success Manager leading the 90-day renewal check-in with the client VP.",
        deliverables: "Usage drop diagnostic, 30-day champion enablement plan, and executive value review milestone.",
        challenges: "The client VP sees low login numbers and assumes the software isn't needed by half the team.",
        skillsApplied: ["Adoption Diagnostics", "Value Defense", "Stakeholder Coaching"],
        rubric: [
          "Clarifies the root cause of the usage drop (departure of the internal champion) rather than immediately discounting licenses.",
          "Uses department-level login data to show teams with trained leads still achieve 85% efficiency gains.",
          "Proposes a concrete 30-day re-onboarding sprint for the inactive regional teams.",
          "Secures agreement on a 30-day checkpoint before making permanent contract reductions."
        ],
        simulationSetup: {
          stakeholderName: "Victor Thorne",
          stakeholderRole: "VP of Client Operations",
          setScene: "You are on a renewal preparation call with Victor Thorne at GlobalLogistics. Active seat usage fell to 35% after their internal admin left two months ago, and Victor wants to cut licenses by 50%.",
          openingLine: "Our renewal is in 90 days and only 35% of our 200 licensed users logged in last month. Can you send over a revised quote cutting our seat count in half for next year?"
        }
      },
      {
        id: "csm-2",
        difficulty: "Medium",
        title: "De-Escalating a Critical Outage Executive Call",
        shortDesc: "Rebuild trust with a strategic client after a 3-hour reporting outage disrupted their Monday morning executive meeting.",
        tags: ["Crisis De-Escalation", "Executive Communication"],
        businessContext: "A database migration caused a 3-hour dashboard outage on Monday morning right during your largest client's board prep. Engineering has deployed a permanent fix and automated failover, but the client VP is threatening to invoke a contract termination clause.",
        objective: "Acknowledge the business impact transparently, explain the permanent preventative safeguard in plain English, and establish a joint reliability governance cadence.",
        yourRole: "Enterprise CSM leading the post-incident review with the client's VP of Finance.",
        deliverables: "Root-cause summary, preventative failover guarantee, and pre-board-meeting priority support protocol.",
        challenges: "The client VP was embarrassed in front of their CEO and wants accountability, not excuses.",
        skillsApplied: ["Executive De-Escalation", "Incident Communication", "Trust Recovery"],
        rubric: [
          "Takes clear ownership of the Monday morning disruption without making technical excuses.",
          "Explains the root cause and the new automated failover protection in concise, non-jargon business terms.",
          "Proposes a concrete safeguard (dedicated pre-check 24 hours before future board meetings).",
          "Restores executive confidence and shifts the conversation toward a 30-day reliability review."
        ],
        simulationSetup: {
          stakeholderName: "Claire Vance",
          stakeholderRole: "Client VP of Finance",
          setScene: "You are meeting with Claire Vance the day after a 3-hour Monday morning outage left her without live dashboards during her CEO prep session.",
          openingLine: "Yesterday's three-hour outage left me empty-handed in front of my CEO thirty minutes before our board call. Why shouldn't I have Legal review our termination clause right now?"
        }
      },
      {
        id: "csm-3",
        difficulty: "Hard",
        title: "Navigating an Unplanned Feature Gap in Deployment",
        shortDesc: "Keep a 500-user enterprise rollout on track when the client discovers a custom approval workflow won't be ready until next quarter.",
        tags: ["Rollout Governance", "Workaround Design"],
        businessContext: "Midway through a 500-seat rollout, the client's IT Director realizes multi-step parallel approvals aren't supported natively until Q4. They threaten to freeze the entire company launch for 4 months.",
        objective: "Align the client IT Director on launching Phase 1 for the 420 standard users next week while using a webhook notification bridge for the 80 complex approval users until Q4.",
        yourRole: "Lead CSM managing the enterprise launch steering committee with the client IT Director.",
        deliverables: "Phased go-live architecture, webhook bridge workflow, and Q4 beta enrollment agreement.",
        challenges: "The client IT Director prefers an all-or-nothing launch and resists interim workflows.",
        skillsApplied: ["Solution Architecture", "Change Management", "Executive Negotiation"],
        rubric: [
          "Clarifies that 84% of users (420 of 500 seats) only require single-step approvals that are ready today.",
          "Quantifies the cost of delaying the entire company's productivity gains by 4 months.",
          "Proposes a practical phased launch paired with a supported webhook bridge for the remaining 80 seats.",
          "Secures a clear go-live commitment by locking the client into early Q4 beta access."
        ],
        simulationSetup: {
          stakeholderName: "Samir Patel",
          stakeholderRole: "Client IT Director",
          setScene: "You are in the rollout steering meeting with Samir Patel. Native parallel approvals won't ship until Q4, and he wants to halt Monday's 500-user launch completely.",
          openingLine: "I just learned native parallel approvals won't ship until Q4, so I want to freeze Monday's entire 500-user rollout until the feature is live. How can we possibly launch without it?"
        }
      }
    ],
    extraBatches: []
  },
  {
    id: "bizops",
    title: "Business Operations Manager",
    shortDesc: "Solve cross-functional bottlenecks, align strategy, and scale processes.",
    whatTheyDo: "Business Operations (BizOps) Managers act as internal strategy consultants and execution operators. They diagnose operational bottlenecks across Sales, Product, and Support, and build scalable processes.",
    typicalWorkday: "Analyzing funnel handoff SLA delays, facilitating cross-departmental planning rhythms, building operational capacity models, and running pilot process fixes.",
    typicalProjects: "Cutting enterprise customer onboarding time by 40%, redesigning lead-to-cash handoffs, and leading annual OKR resource allocation.",
    skillsAndTools: ["Process Architecture", "Cross-Functional Alignment", "SQL & Financial Modeling", "SLA Design", "Executive Communications"],
    challenges: "Fixing broken handoffs between departments when each VP blames the other team for delays.",
    relatedCareers: ["Product Manager", "Financial Analyst", "Chief of Staff"],
    projects: [
      {
        id: "bo-1",
        difficulty: "Easy",
        title: "Fixing Broken Sales-to-Implementation Handoffs",
        shortDesc: "Cut customer onboarding delays from 18 days to 5 days by establishing a standardized deal-handoff checklist between Sales and Implementation.",
        tags: ["Process Optimization", "Cross-Team SLA"],
        businessContext: "New enterprise customers wait an average of 18 days after signing before kickoff begins. Data shows 65% of the delay happens because Sales closes deals without documenting technical admin contacts or scope notes.",
        objective: "Align the Sales Operations Lead on adding 3 mandatory handoff fields in the CRM at contract stage before automated kickoff scheduling triggers.",
        yourRole: "BizOps Manager redesigning the post-sale handoff workflow with the Sales Ops Lead.",
        deliverables: "Bottleneck time-study, 3-field CRM handoff gate, and 5-day kickoff SLA target.",
        challenges: "Sales Ops worries that mandatory CRM fields will slow down reps closing deals at quarter-end.",
        skillsApplied: ["Root-Cause Process Mapping", "SLA Design", "Stakeholder Buy-In"],
        rubric: [
          "Clarifies that 65% of the 18-day onboarding delay stems from missing admin contact and scope data at handoff.",
          "Uses time-study evidence to show that 90 seconds of CRM entry saves 13 days of post-sale chasing.",
          "Proposes a lightweight 3-field requirement tied only to closed-won stage (not early pipeline).",
          "Addresses quarter-end speed concerns by automating the kickoff invite as soon as the 3 fields are filled."
        ],
        simulationSetup: {
          stakeholderName: "Rachel Sterling",
          stakeholderRole: "Head of Sales Operations",
          setScene: "You are reviewing the 18-day customer kickoff delay with Rachel Sterling. Missing technical contacts in closed CRM deals cause 65% of the delay, and you want 3 mandatory handoff fields added.",
          openingLine: "My sales reps are sprinting to close deals at quarter-end, and now you want to add mandatory implementation fields to the CRM before a deal can close. Won't that just slow down bookings?"
        }
      },
      {
        id: "bo-2",
        difficulty: "Medium",
        title: "Rebalancing Support Tier Escalation Rules",
        shortDesc: "Stop Tier-1 support from escalating 45% of routine billing tickets to expensive Tier-3 engineers by fixing permission rules and runbooks.",
        tags: ["Operational Efficiency", "Capacity Modeling"],
        businessContext: "Tier-3 Escalation Engineers spend 18 hours a week handling routine invoice-reset tickets because Tier-1 agents lack admin billing permissions. This backlog delays critical bug investigations by 3 days.",
        objective: "Align the Risk & Billing Lead on granting Tier-1 Team Leads guarded invoice-reset permissions with an audit log.",
        yourRole: "BizOps Manager proposing the support tier permission redesign to the Billing Risk Lead.",
        deliverables: "Escalation volume breakdown, guarded permission role spec, and engineering hours saved projection.",
        challenges: "The Billing Risk Lead is cautious about giving support staff access to billing adjustments.",
        skillsApplied: ["Workflow Bottleneck Removal", "Risk Guardrail Design", "Operational ROI"],
        rubric: [
          "Clarifies how blocking routine invoice resets consumes 18 hours/week of scarce Tier-3 engineering time.",
          "Uses ticket audit data to show 92% of billing escalations are simple address or date resets under $500.",
          "Proposes a guarded role (restricted to Team Leads, capped at $500, with full audit logging).",
          "Addresses compliance concerns directly while unlocking 3-day faster engineering bug resolution."
        ],
        simulationSetup: {
          stakeholderName: "Victor Thorne",
          stakeholderRole: "Director of Billing & Risk",
          setScene: "You are meeting with Victor Thorne to propose giving Tier-1 Support Team Leads permission to reset routine invoices under $500 so Tier-3 engineers stop losing 18 hours a week.",
          openingLine: "We locked billing adjustments down to Tier-3 Engineering two years ago to prevent unauthorized credits. Why are you asking me to open billing permissions up to Customer Support now?"
        }
      },
      {
        id: "bo-3",
        difficulty: "Hard",
        title: "Arbitrating Q4 Headcount Across Competing Departments",
        shortDesc: "Present an objective ROI framework when Sales and Engineering both claim the final 4 approved Q4 headcount slots.",
        tags: ["Resource Allocation", "Executive Strategy"],
        businessContext: "The CEO approved 4 net-new headcount slots for Q4. Sales wants 4 Account Executives to chase new pipeline, while Engineering wants 4 Backend Engineers to eliminate platform stability bottlenecks that caused $400k in enterprise churn last quarter.",
        objective: "Walk the COO through a net-ARR impact model recommending 2 Backend Reliability Engineers + 2 Enterprise AEs Sequenced to maximize net revenue retention.",
        yourRole: "Senior BizOps Lead presenting the Q4 headcount allocation model to the COO.",
        deliverables: "Churn-adjusted ARR model, split allocation recommendation, and Q4 hiring sequence.",
        challenges: "The COO is heavily focused on top-line sales quota and initially leans toward giving all 4 slots to Sales.",
        skillsApplied: ["Capital & Headcount Allocation", "Net ARR Modeling", "Executive Advisory"],
        rubric: [
          "Clarifies that adding top-line sales without fixing the $400k/quarter stability churn creates a leaky bucket.",
          "Uses net ARR math (new bookings minus stability churn) to compare allocation scenarios objectively.",
          "Recommends a balanced split (2 reliability engineers + 2 AEs) tied to clear quarterly milestones.",
          "Addresses the COO's pipeline target by showing improved platform uptime increases enterprise win rates."
        ],
        simulationSetup: {
          stakeholderName: "Elena Rostova",
          stakeholderRole: "Chief Operating Officer",
          setScene: "You are reviewing the final 4 Q4 headcount slots with COO Elena Rostova. Sales wants all 4 slots for new AEs, even though stability outages caused $400k in enterprise churn last quarter.",
          openingLine: "We need to hit an aggressive Q4 bookings target, so my instinct is to give all four remaining headcount slots to Sales for new Account Executives. Why does your BizOps model recommend splitting them with Engineering?"
        }
      }
    ],
    extraBatches: []
  },
  /* Batch 3 of 4 Careers */
  {
    id: "uxr",
    title: "UX Researcher",
    shortDesc: "Uncover deep user behaviors, test assumptions, and guide product strategy.",
    whatTheyDo: "UX Researchers study how real people interact with products and solve problems. They design qualitative and quantitative studies that prevent teams from building features nobody wants.",
    typicalWorkday: "Conducting contextual user interviews, synthesizing usability test videos, running survey segmentation, and leading insight workshops with Product and Design.",
    typicalProjects: "Validating whether enterprise buyers actually want an AI chat assistant, diagnosing why power users export data to Excel, and testing pricing page comprehension.",
    skillsAndTools: ["User Interviews", "Usability Testing", "Survey Design", "Dovetail / Qualtrics", "Research Synthesis"],
    challenges: "Convincing fast-moving product teams to test risky assumptions before writing months of production code.",
    relatedCareers: ["UX Designer", "Product Manager", "Consumer Insights Lead"],
    projects: [
      {
        id: "uxr-1",
        difficulty: "Easy",
        title: "Reframing a Biased Customer Survey",
        shortDesc: "Help a Product Manager fix a leading customer survey before it gets sent to 10,000 users and produces misleading validation data.",
        tags: ["Survey Methodology", "Bias Removal"],
        businessContext: "A Product Manager drafted a 15-question email survey asking users: 'How excited are you about our amazing new Calendar Sync feature (1-5)?' and wants to blast it to 10,000 users today to justify Q3 engineering budget.",
        objective: "Explain why leading, hypothetical excitement questions overestimate adoption, and align the PM on a neutral 4-question behavioral workflow survey plus 5 quick user calls.",
        yourRole: "UX Researcher reviewing the research plan with the Product Manager.",
        deliverables: "Unbiased question rewrite, behavioral workflow screeners, and 48-hour rapid insight plan.",
        challenges: "The PM needs data by Friday for the roadmap review and worries real research will take weeks.",
        skillsApplied: ["Survey Design", "Cognitive Bias Mitigation", "Rapid Research Scoping"],
        rubric: [
          "Clarifies how leading wording ('How excited are you...') creates acquiescence bias and false positives.",
          "Explains the difference between asking about past calendar behavior vs. hypothetical future excitement.",
          "Proposes a concise, neutral 4-question survey paired with 5 fast customer calls that still finishes by Friday.",
          "Supports the PM's Friday deadline so research is seen as an accelerator rather than a blocker."
        ],
        simulationSetup: {
          stakeholderName: "Liam O'Connor",
          stakeholderRole: "Product Manager",
          setScene: "You are reviewing Liam O'Connor's draft survey before it goes to 10,000 users. Question 1 asks: 'How excited are you to use our awesome new Calendar Sync feature?'",
          openingLine: "I need data by Friday to get Calendar Sync approved on the Q3 roadmap, so I wrote this quick excitement survey to send to 10,000 users today. Can you give it a quick thumbs-up so I can hit send?"
        }
      },
      {
        id: "uxr-2",
        difficulty: "Medium",
        title: "Delivering Unpopular Research Findings to Leadership",
        shortDesc: "Present field research showing users ignore a flagship AI chatbot in favor of inline keyboard shortcuts, and guide the team toward a pivot.",
        tags: ["Insight Storytelling", "Strategic Pivot"],
        businessContext: "Leadership spent 2 months building a beta AI Sidebar Chatbot. Your diary study with 18 beta users reveals 16 of 18 stopped opening the chat sidebar after Day 2 because typing long prompts slowed down their spreadsheet workflow, whereas 15 of 18 asked for one-click inline cell autofill.",
        objective: "Share the diary study evidence constructively with the VP of Product and align on repurposing the same AI model into one-click inline autofill.",
        yourRole: "Senior UX Researcher presenting beta study findings to the VP of Product.",
        deliverables: "Diary study behavioral synthesis, video clip highlights, and inline autofill pivot recommendation.",
        challenges: "The VP of Product championed the conversational sidebar interface and is emotionally invested in it.",
        skillsApplied: ["Executive Storytelling", "Behavioral Evidence", "Constructive Reframing"],
        rubric: [
          "Clarifies that users value the underlying AI intelligence, even though the chat sidebar interface creates workflow friction.",
          "Uses specific diary study evidence (16 of 18 dropping chat after Day 2) and user video observations.",
          "Recommends pivoting the UI to one-click inline autofill while reusing the core AI backend investment.",
          "Frames the finding as an early beta win that saves months of wasted general-availability marketing."
        ],
        simulationSetup: {
          stakeholderName: "David Chen",
          stakeholderRole: "VP of Product",
          setScene: "You are debriefing the AI Sidebar Chatbot beta study with VP of Product David Chen, who personally championed the chatbot UI. Your study shows 16 of 18 users abandoned the chat sidebar after two days.",
          openingLine: "I am eager to hear how much our beta testers loved the new AI Sidebar Chatbot. Are we ready to roll the chat sidebar out to 100% of our user base next week?"
        }
      },
      {
        id: "uxr-3",
        difficulty: "Hard",
        title: "Preventing a Premature Enterprise Redesign",
        shortDesc: "Convince the Design Director to run a 5-day workflow shadowing sprint before committing 4 months to a full visual overhaul.",
        tags: ["Discovery Research", "Risk Reduction"],
        businessContext: "Customer churn rose in the enterprise claims portal. The Design Director wants to start a 4-month visual UI reskin immediately, assuming the portal 'looks dated.' Support logs suggest users are actually churning because batch claims require 14 manual clicks per row.",
        objective: "Align the Design Director on conducting a 5-day contextual inquiry shadowing 8 claims adjusters before locking the 4-month redesign scope.",
        yourRole: "Lead UX Researcher advising the Design Director during project kickoff.",
        deliverables: "5-day contextual shadowing plan, support log hypothesis brief, and workflow bottleneck map.",
        challenges: "The Design Director wants designers producing high-fidelity Figma screens on Day 1.",
        skillsApplied: ["Contextual Inquiry", "Problem Framing", "Stakeholder Influence"],
        rubric: [
          "Clarifies the risk of spending 4 months reskinning colors and fonts if the real churn driver is a 14-click batch workflow.",
          "Uses support ticket evidence to show functional workflow friction outweighs aesthetic complaints.",
          "Proposes a time-boxed 5-day shadowing sprint where designers observe live claims adjusters alongside UXR.",
          "Integrates the research directly into Week 1 so the 4-month delivery schedule stays intact."
        ],
        simulationSetup: {
          stakeholderName: "Claire Vance",
          stakeholderRole: "Director of Product Design",
          setScene: "You are in the kickoff meeting for the Enterprise Portal overhaul with Claire Vance. She wants her designers creating polished visual reskins today without doing workflow discovery.",
          openingLine: "Our enterprise portal looks five years old, so I want my six designers jumping straight into high-fidelity visual reskins today. Why are you asking to pause visual design for user shadowing?"
        }
      }
    ],
    extraBatches: []
  },
  {
    id: "pjm",
    title: "Technical Program Manager",
    shortDesc: "Coordinate complex engineering initiatives, manage dependencies, and mitigate delivery risks.",
    whatTheyDo: "Technical Program Managers (TPMs) orchestrate large-scale cross-team engineering programs. They map critical-path dependencies, unblock architectural bottlenecks, and keep executive stakeholders aligned on realistic delivery milestones.",
    typicalWorkday: "Running cross-team dependency standups, tracking critical-path risks in Jira, resolving API contract mismatches between teams, and publishing executive program status briefs.",
    typicalProjects: "Coordinating a zero-downtime cloud database migration, launching a cross-platform SOC2 security program, and integrating an acquired company's billing system.",
    skillsAndTools: ["Dependency Mapping", "Critical Path Management", "Risk Mitigation", "System Architecture Literacy", "Jira / Confluence"],
    challenges: "Unblocking cross-team bottlenecks when an upstream platform team deprioritizes a dependency your program needs.",
    relatedCareers: ["Product Manager", "Engineering Manager", "Business Operations Manager"],
    projects: [
      {
        id: "tpm-1",
        difficulty: "Easy",
        title: "Unblocking a Cross-Team API Dependency",
        shortDesc: "Negotiate a mock-API contract so the Mobile team isn't blocked for 3 weeks waiting on the Auth Platform team.",
        tags: ["Dependency Management", "Agile Execution"],
        businessContext: "The Mobile App release is scheduled in 5 weeks, but the Auth Platform team just slipped their new token endpoint delivery by 3 weeks. Waiting sequentially will cause the Mobile team to sit idle and miss the launch.",
        objective: "Align the Auth Platform Lead on locking the JSON API schema today and providing a stubbed mock endpoint by tomorrow so Mobile can build and test in parallel.",
        yourRole: "Technical Program Manager resolving the critical-path blocker with the Auth Platform Lead.",
        deliverables: "Locked API schema contract, mock endpoint delivery date, and parallel integration test plan.",
        challenges: "The Auth Platform Lead is overloaded with security patches and doesn't want extra meetings.",
        skillsApplied: ["Critical Path Unblocking", "Interface Contracts", "Parallel Execution"],
        rubric: [
          "Clarifies how a 3-week sequential wait pushes the entire Mobile release past its deadline.",
          "Separates defining the lightweight API contract/mock (2 hours of work) from completing the full backend logic.",
          "Proposes locking the JSON schema today so Mobile and Auth teams can develop in parallel.",
          "Protects the Auth team's focus by time-boxing the schema sign-off to a single 30-minute working session."
        ],
        simulationSetup: {
          stakeholderName: "Samir Patel",
          stakeholderRole: "Auth Platform Engineering Lead",
          setScene: "You are meeting with Samir Patel, Auth Platform Lead. His team slipped the new token endpoint by 3 weeks, threatening to leave the Mobile team blocked.",
          openingLine: "My team is buried in critical security patches, so we won't finish the new Auth endpoint for another three weeks. Doesn't the Mobile team just have to wait until our backend code is 100% done?"
        }
      },
      {
        id: "tpm-2",
        difficulty: "Medium",
        title: "Containing Scope Creep in a Cloud Migration",
        shortDesc: "Prevent a Senior Architect from adding an unplanned microservice rewrite in the middle of a time-sensitive data center exit.",
        tags: ["Scope Control", "Risk Management"],
        businessContext: "The company must exit its legacy data center in 10 weeks before a $400k lease penalty triggers. Midway through the lift-and-shift migration, the Lead Architect wants to rewrite the billing monolith into microservices, adding 8 weeks of risk.",
        objective: "Align the Lead Architect on completing the lift-and-shift migration first to beat the 10-week lease deadline, then scheduling the microservice refactoring for Q3.",
        yourRole: "Lead Technical Program Manager governing the data center migration timeline.",
        deliverables: "Critical-path risk assessment, two-phase migration charter, and Q3 refactoring backlog commitment.",
        challenges: "The Lead Architect argues that migrating legacy code without rewriting it first is 'wasted effort.'",
        skillsApplied: ["Program Governance", "Risk Quantification", "Technical Negotiation"],
        rubric: [
          "Clarifies the hard business constraint (10-week lease expiration and $400k penalty).",
          "Quantifies how adding an 8-week rewrite onto the critical path guarantees missing the exit deadline.",
          "Sequences the clean lift-and-shift first, followed by modular refactoring once safely in the cloud.",
          "Validates the Architect's modernization goal by locking Q3 capacity for the billing service split."
        ],
        simulationSetup: {
          stakeholderName: "Alex Rivera",
          stakeholderRole: "Principal Systems Architect",
          setScene: "You are reviewing the data center exit schedule with Alex Rivera. With 10 weeks left before a $400k lease penalty hits, Alex wants to pause the lift-and-shift to rewrite the billing service into microservices.",
          openingLine: "Since we are already moving the billing database to AWS, I want my team to spend the next eight weeks rewriting the billing monolith into microservices at the same time. Why move old code twice?"
        }
      },
      {
        id: "tpm-3",
        difficulty: "Hard",
        title: "Communicating a Red-Status Program Reset to Executives",
        shortDesc: "Present a transparent recovery plan to the VP of Engineering when integration testing reveals a 3-week critical-path delay.",
        tags: ["Executive Escalation", "Recovery Planning"],
        businessContext: "End-to-end load testing for the new Enterprise Billing Engine failed at 5,000 concurrent transactions. Fixing the database locking bottleneck requires 3 weeks, meaning the original May 1st cutover date is no longer safe.",
        objective: "Present the red status transparently to the VP of Engineering along with a de-risked 2-step cutover plan (new small accounts on May 1st, high-volume enterprise accounts on May 22nd).",
        yourRole: "Staff TPM briefing the VP of Engineering during the weekly program review.",
        deliverables: "Load-test failure analysis, 2-step cohort cutover schedule, and rollback safety checklist.",
        challenges: "The VP of Engineering dislikes date slips and initially pressures the team to launch everyone on May 1st anyway.",
        skillsApplied: ["Transparent Escalation", "Cohort Cutover Strategy", "Executive Risk Advisory"],
        rubric: [
          "Presents the load-test failure data (database locking at 5,000 concurrent runs) transparently without sugarcoating.",
          "Explains the severe customer billing corruption risk of forcing high-volume enterprise accounts onto the unpatched engine.",
          "Proposes a pragmatic 2-wave cutover (low-concurrency cohorts on May 1st, enterprise cohorts on May 22nd after the fix).",
          "Defines clear load-test exit criteria required before Wave 2 triggers."
        ],
        simulationSetup: {
          stakeholderName: "Elena Rostova",
          stakeholderRole: "VP of Engineering",
          setScene: "You are in the weekly executive program review with Elena Rostova. Load tests failed at 5,000 concurrent transactions yesterday, making a full enterprise cutover on May 1st unsafe.",
          openingLine: "We promised the executive team a full billing cutover on May 1st. Even with yesterday's high-volume load test hiccup, can't we just push all accounts live on May 1st and patch performance on the fly?"
        }
      }
    ],
    extraBatches: []
  },
  {
    id: "da_mkt",
    title: "Digital Marketing Manager",
    shortDesc: "Plan multi-channel acquisition campaigns, optimize CAC, and grow pipeline.",
    whatTheyDo: "Digital Marketing Managers design, execute, and optimize paid and organic acquisition engines. They allocate budget across channels based on Customer Acquisition Cost (CAC) and pipeline conversion quality.",
    typicalWorkday: "Reviewing channel CAC and pipeline attribution dashboards, testing landing page conversion variants, briefing creative teams, and aligning lead quality criteria with Sales.",
    typicalProjects: "Reallocating $200k in quarterly paid spend toward high-converting intent channels, optimizing webinar-to-demo conversion, and fixing lead scoring.",
    skillsAndTools: ["Paid Acquisition & SEO", "CAC / LTV Attribution", "A/B Conversion Testing", "HubSpot / Google Ads", "Funnel Optimization"],
    challenges: "Shifting budget away from cheap, low-intent clicks toward channels that generate qualified sales pipeline.",
    relatedCareers: ["Product Marketing Manager", "Growth Data Analyst", "E-Commerce Manager"],
    projects: [
      {
        id: "dmm-1",
        difficulty: "Easy",
        title: "Shifting Budget from Vanity Clicks to Pipeline Quality",
        shortDesc: "Convince the VP of Marketing to shift $40k from cheap display ads with 0.2% demo conversion into high-intent search campaigns.",
        tags: ["Budget Allocation", "Pipeline Attribution"],
        businessContext: "Display ads generate 60% of raw website clicks at $1.50 CPC, but only 0.2% convert into qualified sales demos ($4,200 CAC per qualified opportunity). Meanwhile, high-intent search ads cost $12 CPC but convert to qualified pipeline at $1,100 CAC.",
        objective: "Use full-funnel cost-per-opportunity math to align the VP of Marketing on shifting $40k from Display into High-Intent Search.",
        yourRole: "Digital Marketing Manager presenting Q3 channel reallocation to the VP of Marketing.",
        deliverables: "Full-funnel CAC comparison, $40k reallocation plan, and net pipeline projection.",
        challenges: "The VP of Marketing likes seeing high top-of-funnel website traffic totals in monthly updates.",
        skillsApplied: ["Full-Funnel Attribution", "CAC Optimization", "Data-Backed Persuasion"],
        rubric: [
          "Clarifies the difference between top-of-funnel click volume and cost per qualified sales opportunity.",
          "Uses the $1,100 vs. $4,200 cost-per-opportunity data to demonstrate a 3.8x efficiency advantage.",
          "Proposes shifting $40k to high-intent search while keeping a focused retargeting layer.",
          "Projects the exact increase in qualified sales demos to address leadership goals."
        ],
        simulationSetup: {
          stakeholderName: "Jordan Blake",
          stakeholderRole: "VP of Marketing",
          setScene: "You are reviewing Q3 ad budgets with Jordan Blake. Display ads drive cheap $1.50 clicks but cost $4,200 per qualified sales opportunity, compared to $1,100 in Paid Search.",
          openingLine: "Display ads brought in 60% of our raw website traffic last month at just $1.50 a click. If we move $40k out of Display into $12-a-click Search ads, won't our total website traffic drop?"
        }
      },
      {
        id: "dmm-2",
        difficulty: "Medium",
        title: "Fixing Lead-Quality Friction with Sales",
        shortDesc: "Resolve a conflict where Sales rejects 70% of ebook leads by introducing intent-based lead scoring and a nursery cadence.",
        tags: ["Lead Scoring", "Sales-Marketing Alignment"],
        businessContext: "Marketing sent 1,200 ebook download leads directly to Sales SDRs last month. SDRs rejected 70% as 'students or researchers not ready to buy' and stopped calling Marketing leads altogether.",
        objective: "Align the SDR Manager on a new MQL threshold: only routing leads who visit the pricing page or request a workflow guide, while placing early ebook readers into an automated nurture track.",
        yourRole: "Demand Generation Manager resetting the MQL handoff agreement with the SDR Manager.",
        deliverables: "Revised MQL scoring rules, automated email nurture sequence, and 24-hour SDR follow-up SLA.",
        challenges: "The SDR Manager currently distrusts all Marketing leads and wants to rely solely on cold outbound.",
        skillsApplied: ["Lead Scoring Architecture", "Cross-Team SLA", "Funnel Conversion"],
        rubric: [
          "Acknowledges openly why unscreened top-of-funnel ebook downloads wasted SDR calling capacity.",
          "Uses historical conversion data showing pricing-intent leads convert 6x higher than cold ebook downloads.",
          "Proposes filtering raw downloads into automated nurture and passing only high-intent MQLs to SDRs.",
          "Secures a reciprocal 24-hour SDR follow-up commitment on the smaller, higher-quality MQL volume."
        ],
        simulationSetup: {
          stakeholderName: "Marcus Vance",
          stakeholderRole: "SDR Team Manager",
          setScene: "You are meeting with Marcus Vance, SDR Manager. His team rejected 70% of last month's raw ebook leads and has stopped calling Marketing leads.",
          openingLine: "My SDRs wasted half of last month calling 1,200 ebook downloaders who had zero interest in buying software. Why should my team spend another minute calling Marketing leads this quarter?"
        }
      },
      {
        id: "dmm-3",
        difficulty: "Hard",
        title: "Diagnosing a Post-Redesign Landing Page Conversion Drop",
        shortDesc: "Use scroll-map and load-time data to fix a new brand landing page that looks sleek but cut demo signups by 34%.",
        tags: ["Conversion Rate Optimization", "Experimentation"],
        businessContext: "The Brand team launched a video-heavy homepage redesign on Monday. Paid ad conversion dropped 34% immediately. Analytics show mobile page load time jumped to 6.8 seconds and the primary CTA button pushed below the fold.",
        objective: "Align the Creative Director on replacing the heavy autoplay background video with a fast lightweight hero preview and restoring the above-the-fold CTA in an A/B test today.",
        yourRole: "Growth Marketing Manager reviewing the conversion drop with the Creative Director.",
        deliverables: "Load-speed and heatmap evidence, lightweight hero variant, and 7-day split-test plan.",
        challenges: "The Creative Director won internal praise for the cinematic background video and resists changing the layout.",
        skillsApplied: ["CRO Diagnostics", "Page Speed Optimization", "Creative Diplomacy"],
        rubric: [
          "Clarifies how the 6.8-second mobile load time and below-the-fold CTA caused the 34% drop in paid demo signups.",
          "Uses objective heatmap and bounce-rate metrics rather than subjective aesthetic critiques.",
          "Proposes keeping the new brand visual style while swapping the heavy background video for an instant-load preview and visible CTA.",
          "Frames the change as a head-to-head 50/50 split test so conversion data decides."
        ],
        simulationSetup: {
          stakeholderName: "Claire Vance",
          stakeholderRole: "Brand Creative Director",
          setScene: "You are meeting with Claire Vance four days after her video-heavy landing page went live. Mobile load time hit 6.8 seconds and paid demo signups dropped 34%.",
          openingLine: "Everyone on the executive team complimented the cinematic 4K background video on our new landing page. Why are you asking my designers to strip the video out and move the CTA button up?"
        }
      }
    ],
    extraBatches: []
  },
  {
    id: "hrbp",
    title: "People Operations Partner",
    shortDesc: "Design talent systems, improve retention, and coach managers through organizational growth.",
    whatTheyDo: "People Operations Partners (HRBPs) use workforce data and organizational design to help leaders build high-performing, engaged teams, reduce regrettable attrition, and run fair performance cycles.",
    typicalWorkday: "Analyzing quarterly attrition and engagement survey drivers, coaching department heads on team structure, calibrating promotion criteria, and resolving complex employee relations.",
    typicalProjects: "Reducing mid-level engineering attrition, redesigning a broken performance review rubric, and structuring a hybrid return-to-office policy.",
    skillsAndTools: ["Workforce Analytics", "Manager Coaching", "Performance Calibration", "Compensation Benchmarking", "Organizational Design"],
    challenges: "Using objective people data to push back when department leaders want quick policy band-aids instead of fixing manager or career-path bottlenecks.",
    relatedCareers: ["Learning Experience Designer", "Business Operations Manager", "Talent Acquisition Lead"],
    projects: [
      {
        id: "hr-1",
        difficulty: "Easy",
        title: "Diagnosing Mid-Level Engineering Attrition",
        shortDesc: "Use exit interview and promotion data to show the VP of Engineering that unclear L4-to-L5 career progression, not free office snacks, is driving turnover.",
        tags: ["People Analytics", "Retention Strategy"],
        businessContext: "Voluntary turnover among mid-level (L4) engineers reached 24% this year. Exit interviews show 78% of departing engineers cited 'no clear path or rubric for promotion to Senior (L5),' while the VP of Engineering wants to spend $50k on office perks and catered events.",
        objective: "Align the VP of Engineering on publishing a transparent L4-to-L5 competency rubric and instituting bi-annual career check-ins.",
        yourRole: "People Operations Partner reviewing retention findings with the VP of Engineering.",
        deliverables: "Exit data synthesis, transparent L4-to-L5 leveling guide, and manager career-conversation toolkit.",
        challenges: "The VP of Engineering thinks perks are faster and dreads the effort of standardizing leveling criteria.",
        skillsApplied: ["Attrition Root-Cause Analysis", "Career Architecture", "Executive Coaching"],
        rubric: [
          "Clarifies that 78% of departing L4 engineers left due to opaque promotion paths rather than office perks.",
          "Uses exit survey data and time-in-level metrics to quantify the cost of replacing mid-level engineers.",
          "Proposes a ready-to-adapt L4-to-L5 leveling template so engineering managers don't have to write it from scratch.",
          "Addresses the VP's time concern by piloting the rubric in one engineering org first."
        ],
        simulationSetup: {
          stakeholderName: "Samir Patel",
          stakeholderRole: "VP of Engineering",
          setScene: "You are reviewing Q2 engineering turnover with Samir Patel. Exit interviews show 78% of departing L4 engineers left over unclear promotion criteria, but Samir wants to spend $50k on office morale events.",
          openingLine: "We lost six mid-level engineers this quarter, so I want to put $50k into upgraded office catering and monthly game nights to boost morale. Can People Ops approve that budget today?"
        }
      },
      {
        id: "hr-2",
        difficulty: "Medium",
        title: "Calibrating Inconsistent Performance Ratings",
        shortDesc: "Guide a Sales Director through fair evidence-based calibration when they rate 90% of their team as 'Exceeds Expectations' despite missing team quota.",
        tags: ["Performance Calibration", "Manager Alignment"],
        businessContext: "During annual performance calibration, one Sales Director rated 9 of 10 reps at the top '5/5 Exceeds' tier to maximize their bonus pool, even though the region finished at 84% of quota. Meanwhile, other directors held strictly to objective quota attainment.",
        objective: "Align the Sales Director on anchoring ratings to documented quota attainment and observable competency behaviors so the bonus pool remains fair across all teams.",
        yourRole: "People Partner facilitating the performance calibration pre-check with the Sales Director.",
        deliverables: "Quota-to-rating distribution comparison, evidence-based rating adjustments, and retention communication plan.",
        challenges: "The Sales Director argues that lowering ratings will demotivate their team.",
        skillsApplied: ["Calibration Governance", "Objective Rubric Enforcement", "Difficult Conversations"],
        rubric: [
          "Clarifies how inflating 90% of ratings to 5/5 at 84% quota attainment penalizes higher-performing teams sharing the bonus pool.",
          "Uses objective attainment data to distinguish the 2 reps who hit 115% quota from reps at 75%.",
          "Proposes reserving 5/5 for the true top performers while giving solid 3/5 and 4/5 ratings with clear growth feedback to the rest.",
          "Coaches the Director on how to deliver encouraging, honest development conversations."
        ],
        simulationSetup: {
          stakeholderName: "Marcus Vance",
          stakeholderRole: "Regional Sales Director",
          setScene: "You are in a calibration review with Marcus Vance. His region hit 84% of quota, yet he submitted 5/5 'Exceeds Expectations' ratings for 9 out of 10 reps.",
          openingLine: "My reps worked hard in a tough market this year, so I gave nine out of ten of them a 5-out-of-5 rating. Why is People Ops asking me to adjust my ratings down before tomorrow's calibration?"
        }
      },
      {
        id: "hr-3",
        difficulty: "Hard",
        title: "Designing a Structured Hiring Rubric to Stop Bad Hires",
        shortDesc: "Replace unstructured 'gut-feel' interviews with a competency scorecard after 35% of recent sales hires failed within 90 days.",
        tags: ["Talent Systems", "Structured Interviewing"],
        businessContext: "35% of newly hired Account Executives over the past two quarters washed out within 90 days. Audit data shows hiring managers ran unstructured 'chat over coffee' interviews with zero standardized roleplay or rubric scoring.",
        objective: "Align the VP of Sales on implementing a 3-stage structured interview scorecard with a 15-minute discovery call simulation.",
        yourRole: "Senior People Partner presenting the hiring quality overhaul to the VP of Sales.",
        deliverables: "90-day mis-hire cost analysis, structured competency scorecard, and 15-minute mock discovery rubric.",
        challenges: "The VP of Sales prides himself on 'reading salespeople in five minutes' and thinks scorecards slow down hiring.",
        skillsApplied: ["Structured Assessment Design", "Quality-of-Hire Analytics", "Executive Influence"],
        rubric: [
          "Clarifies the financial and pipeline cost of a 35% 90-day new-hire failure rate.",
          "Uses interview audit data to show unstructured gut-feel chats fail to predict actual discovery call skill.",
          "Proposes a concise 15-minute live discovery simulation and 4-point scorecard that adds zero extra days to time-to-hire.",
          "Respects the VP's sales expertise by having him define the top 3 discovery behaviors on the scorecard."
        ],
        simulationSetup: {
          stakeholderName: "Victor Thorne",
          stakeholderRole: "VP of Commercial Sales",
          setScene: "You are reviewing hiring outcomes with Victor Thorne after 35% of new AEs failed within 90 days. Currently, his managers run unstructured conversational interviews without rubrics.",
          openingLine: "I have been hiring salespeople for fifteen years and I can tell in five minutes of casual conversation if someone has grit. Why do you want my managers filling out structured scorecards and running mock roleplays?"
        }
      }
    ],
    extraBatches: []
  }
];

/* ============================================================================
   STATE MANAGEMENT
   ============================================================================ */
const state = {
  screen: "home", // home | pathA_input | pathA_overview | pathB_grid | pathB_detail | brief | sim | debrief
  path: null, // "A" | "B"
  jdData: null,
  extraBatchesUsedA: 0,
  careerBatchIdxB: 0, // 0, 1, 2 (cycles 4 careers at a time out of 12)
  careerB: null,
  extraBatchesUsedB: 0,
  project: null,
  messages: [], // { role: 'user'|'assistant', content: string }
  turnCount: 0,
  maxTurns: 7,
  hintDrawerOpen: false,
  currentHintLevel: 0, // 0..5 for current turn
  maxHintLevelUsed: 0,
  supportHistory: [], // { turn, level, label }
  pinnedBriefVisible: true, // Pinned brief in simulation is visible by default and toggleable
  attemptNum: 1,
  retryTwist: null,
  lastDebrief: null
};

const app = document.getElementById("app");
const stepperNav = document.getElementById("stepperNav");
const restartBtn = document.getElementById("restartBtn");

const STEPS = [
  { id: 1, label: "1. Choose Path" },
  { id: 2, label: "2. Role & Project" },
  { id: 3, label: "3. Simulation" },
  { id: 4, label: "4. Debrief" }
];

function updateTopBar(activeStepId) {
  restartBtn.style.visibility = state.screen === "home" ? "hidden" : "visible";
  if (state.screen === "sim") {
    app.classList.add("sim-mode");
  } else {
    app.classList.remove("sim-mode");
  }
  stepperNav.innerHTML = STEPS.map((s, idx) => {
    let cls = "step-pill";
    if (s.id === activeStepId) cls += " active";
    else if (s.id < activeStepId) cls += " done";
    const sep = idx < STEPS.length - 1 ? `<span class="step-sep">/</span>` : "";
    return `<span class="${cls}">${s.label}</span>${sep}`;
  }).join("");
  if (state.screen !== "sim") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

window.goHome = function() {
  state.screen = "home";
  state.path = null;
  state.retryTwist = null;
  state.attemptNum = 1;
  renderHome();
};

function renderLoader(title, subtitle) {
  app.innerHTML = `
    <div class="card loader-wrap">
      <div class="spinner"></div>
      <h3 class="section-title" style="margin-bottom:4px;">${cleanText(title)}</h3>
      <p class="section-desc" style="margin:0;">${cleanText(subtitle)}</p>
    </div>
  `;
}

/* ============================================================================
   HELPER: GENERATE 3 EXTRA PROJECTS (1 EASY, 1 MEDIUM, 1 HARD)
   ============================================================================ */
async function generateThreeMoreProjectsForRole(roleTitle, orgType, responsibilities, existingProjects, batchIndex) {
  const existingTitles = existingProjects.map(p => p.title).join(", ");
  const sys = `You are an expert workplace simulation designer. Generate exactly 3 new realistic workplace projects for a "${roleTitle}" (${orgType || "Corporate"}).
Crucial Requirements:
- Project 1 MUST have "difficulty": "Easy"
- Project 2 MUST have "difficulty": "Medium"
- Project 3 MUST have "difficulty": "Hard"
- Do NOT repeat these existing projects: ${existingTitles}
- Do NOT use em dashes anywhere.
- In "simulationSetup.openingLine", the stakeholder must ask ONLY ONE focused question at the end.

Return ONLY valid JSON with this schema:
{
  "projects": [
    {
      "id": "gen-1",
      "difficulty": "Easy",
      "title": "Short Project Title",
      "shortDesc": "1-2 sentence plain summary of the project.",
      "tags": ["Competency Tag 1", "Competency Tag 2"],
      "businessContext": "2 concise sentences on why the company needs this now with specific numbers.",
      "objective": "1-2 sentences on what problem to solve.",
      "yourRole": "Your specific responsibility in this scenario.",
      "deliverables": "Key deliverables or decision required.",
      "challenges": "Main stakeholder pushback or constraint.",
      "skillsApplied": ["Skill 1", "Skill 2", "Skill 3"],
      "rubric": [
        "Observable behavior 1 (Clarifies underlying problem before proposing solutions)",
        "Observable behavior 2 (Uses relevant data or evidence to support decisions)",
        "Observable behavior 3 (Prioritizes initiatives based on impact, effort, and constraints)",
        "Observable behavior 4 (Addresses stakeholder concerns and explains the rationale)"
      ],
      "simulationSetup": {
        "stakeholderName": "Full Name",
        "stakeholderRole": "Stakeholder Title",
        "setScene": "2-3 sentences setting the immediate meeting context and numbers.",
        "openingLine": "Natural 2-sentence opening from the stakeholder ending with ONE clear question."
      }
    }
  ]
}`;

  const parsed = await callGeminiJSON(sys, `Role: ${roleTitle}\nResponsibilities: ${(responsibilities || []).join("; ")}\nBatch number: ${batchIndex + 1}`);
  if (parsed && Array.isArray(parsed.projects) && parsed.projects.length === 3) {
    const diffs = ["Easy", "Medium", "Hard"];
    return parsed.projects.map((p, i) => ({
      ...p,
      id: `extra-${Date.now()}-${i}`,
      difficulty: diffs[i]
    }));
  }

  // Instant reliable fallback if offline or rate-limited
  return [
    {
      id: `fb-easy-${batchIndex}`,
      difficulty: "Easy",
      title: batchIndex === 0 ? `Workflow Bottleneck Diagnostic (${roleTitle})` : `Onboarding Clarity Sprint (${roleTitle})`,
      shortDesc: `Analyze a 24% drop in team process completion and align your stakeholder on a lightweight 2-week fix rather than a heavy overhaul.`,
      tags: ["Problem Diagnosis", "Stakeholder Alignment"],
      businessContext: `Team completion rates on the core workflow dropped 24% this month. Analytics show 70% of errors happen on Step 2 due to an unclear template, while the Department Lead wants to mandate a 2-hour training class.`,
      objective: `Use the Step-2 error data to align the Department Lead on simplifying the template first and measuring completion for two weeks.`,
      yourRole: `${roleTitle} reviewing workflow metrics with the Department Lead.`,
      deliverables: `Step-2 error breakdown, simplified template proposal, and 14-day pilot metric.`,
      challenges: `The Department Lead assumes people aren't trying hard enough and prefers mandatory training.`,
      skillsApplied: ["Root-Cause Analysis", "Data-Backed Decisions", "Pragmatic Scoping"],
      rubric: [
        "Clarifies the Step-2 template bottleneck before agreeing to mandatory training.",
        "Uses the 70% error concentration data to support a targeted workflow fix.",
        "Prioritizes a low-effort 2-week pilot over a disruptive overhaul.",
        "Addresses the stakeholder's urgency and defines a clear success metric."
      ],
      simulationSetup: {
        stakeholderName: "Taylor Morgan",
        stakeholderRole: "Department Operations Lead",
        setScene: `You are meeting with Taylor Morgan. Workflow completion fell 24% this month, with 70% of errors occurring on Step 2, and Taylor wants to schedule a mandatory 2-hour training class for everyone.`,
        openingLine: `Completion rates dropped 24% this month, so I want to mandate a two-hour training session for the whole team this Friday. Why are you suggesting we change the Step-2 template instead?`
      }
    },
    {
      id: `fb-med-${batchIndex}`,
      difficulty: "Medium",
      title: batchIndex === 0 ? `Cross-Functional Priority Trade-Off (${roleTitle})` : `Q3 Resource Reallocation (${roleTitle})`,
      shortDesc: `Negotiate a realistic scope phased plan when an urgent partner request competes directly with your committed quarterly deliverable.`,
      tags: ["Prioritization", "Trade-Off Negotiation"],
      businessContext: `You are halfway through delivering a high-impact Q3 initiative expected to improve retention by 15%. A partner VP just requested an unplanned custom deliverable due in 10 days that would consume 80% of your team's capacity.`,
      objective: `Uncover the core need behind the partner VP's request and align on a 2-day streamlined MVP so the main Q3 retention goal stays on track.`,
      yourRole: `${roleTitle} negotiating scope and capacity with the Partner VP.`,
      deliverables: `Capacity impact comparison, 2-day MVP specification, and Phase-2 schedule.`,
      challenges: `The Partner VP views their request as top priority and isn't aware of the 15% retention trade-off.`,
      skillsApplied: ["Scope Management", "Impact vs. Effort Analysis", "Cross-Functional Alignment"],
      rubric: [
        "Clarifies the partner VP's core business need behind the urgent request.",
        "Uses capacity data and the 15% retention target to make the trade-off visible.",
        "Proposes a high-value 2-day MVP that solves 80% of the need without derailing Q3.",
        "Secures agreement on a clear Phase-2 date for the remaining enhancements."
      ],
      simulationSetup: {
        stakeholderName: "Jordan Blake",
        stakeholderRole: "VP of Partner Operations",
        setScene: `You are syncing with Jordan Blake, who just requested an unplanned 10-day custom build that would pull your team off the flagship Q3 retention initiative.`,
        openingLine: `My team needs this custom partner workflow built over the next ten days for our upcoming regional rollout. Can you pause your current Q3 project for two weeks to get this done for us?`
      }
    },
    {
      id: `fb-hard-${batchIndex}`,
      difficulty: "Hard",
      title: batchIndex === 0 ? `Executive Metric & Budget Alignment (${roleTitle})` : `High-Stakes Launch Risk Mitigation (${roleTitle})`,
      shortDesc: `Present a risk-mitigated phased rollout to a skeptical executive when early pilot data reveals a critical operational constraint.`,
      tags: ["Executive Advisory", "Risk Mitigation"],
      businessContext: `A 50-user pilot of a new initiative showed strong satisfaction (88%) but revealed that edge-case exceptions take 3x longer to process manually. Launching to all 2,000 users next Monday without automation would overload the operations queue by 400%.`,
      objective: `Align the Executive Sponsor on launching Wave 1 (standard accounts, 70% of volume) on Monday while holding complex accounts for 14 days until automated exception handling is live.`,
      yourRole: `${roleTitle} briefing the Executive Sponsor ahead of the go/no-go decision.`,
      deliverables: `Pilot exception analysis, 2-wave rollout schedule, and queue capacity safeguard.`,
      challenges: `The Executive Sponsor promised a 100% launch on Monday and resists any perceived delay.`,
      skillsApplied: ["Risk Quantification", "Phased Rollout Strategy", "Executive Influence"],
      rubric: [
        "Clarifies both the 88% pilot success and the 3x manual exception bottleneck.",
        "Uses queue capacity math (400% overload risk) to show why an unphased launch threatens service quality.",
        "Proposes launching 70% of standard volume on Monday so the headline deadline is met safely.",
        "Establishes a concrete 14-day milestone for automating the remaining 30% complex cohort."
      ],
      simulationSetup: {
        stakeholderName: "Elena Rostova",
        stakeholderRole: "Executive Sponsor",
        setScene: `You are in the go/no-go review with Executive Sponsor Elena Rostova. Pilot satisfaction hit 88%, but manual edge cases would overload the team by 400% if all 2,000 users launch at once on Monday.`,
        openingLine: `Our pilot hit 88% satisfaction and I already told the leadership team we are launching to all 2,000 users this Monday. Why are you recommending we hold back 30% of the accounts for two weeks?`
      }
    }
  ];
}

/* ============================================================================
   SCREEN 1: CLEAN HOMEPAGE
   ============================================================================ */
function renderHome() {
  updateTopBar(1);
  app.innerHTML = `
    <section class="page-header" style="text-align:center; max-width:760px; margin:16px auto 32px;">
      <h1 class="hero-title">Get Ready for the Job You Want</h1>
    </section>

    <section aria-labelledby="journey-prompt-heading" style="max-width:860px; margin:0 auto;">
      <div style="text-align:center; margin-bottom:28px;">
        <h2 id="journey-prompt-heading" class="journey-heading">Where are you in your career journey?</h2>
      </div>

      <div class="grid-2">
        <!-- Entry Card A -->
        <div class="interactive-card" role="button" tabindex="0" onclick="openPathAInput()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openPathAInput();}">
          <div>
            <span class="badge badge-outline-navy" style="margin-bottom:18px;">For active job seekers</span>
            <h3 class="section-title" style="font-size:1.5rem; margin-bottom:12px;">I have a job in mind</h3>
            <p style="color:var(--ink-secondary); font-size:1rem; margin:0 0 32px;">
              I found a job posting and want to understand the role, prepare my application, and practice the work.
            </p>
          </div>
          <div>
            <span class="btn-primary" style="width:100%; display:inline-flex; min-height:48px; border-radius:8px; align-items:center; justify-content:center;">Start with a Job Description</span>
          </div>
        </div>

        <!-- Entry Card B -->
        <div class="interactive-card" role="button" tabindex="0" onclick="openPathBGrid()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openPathBGrid();}">
          <div>
            <span class="badge badge-neutral" style="margin-bottom:18px;">For career explorers</span>
            <h3 class="section-title" style="font-size:1.5rem; margin-bottom:12px;">I'm exploring career options</h3>
            <p style="color:var(--ink-secondary); font-size:1rem; margin:0 0 32px;">
              I'm not sure what career I want. Help me discover different roles and experience what the work is actually like.
            </p>
          </div>
          <div>
            <span class="btn-primary" style="width:100%; display:inline-flex; min-height:48px; border-radius:8px; align-items:center; justify-content:center;">Explore Career Paths</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

/* ============================================================================
   SCREEN 2A: PATH A - PASTE JD & ROLE BREAKDOWN (PRODUCT MANAGER SAMPLE)
   ============================================================================ */
window.openPathAInput = function() {
  if (!getJobSimToken()) { renderEmailGate(""); return; }
  state.path = "A";
  state.screen = "pathA_input";
  updateTopBar(2);

  app.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Path A : For Active Job Seekers</div>
      <h1 class="hero-title" style="font-size:clamp(1.75rem, 3vw, 2.25rem);">Understand the Role & Explore Real Work</h1>
      <p class="subtitle">Paste a job posting below, or load our Product Manager sample, to translate the job description into plain-English responsibilities and leveled workplace projects.</p>
    </div>

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
        <label for="jdTextarea" style="font-size:1rem; font-weight:700; color:var(--navy);">Job Description</label>
        <button type="button" class="btn-secondary btn-sm" id="fillSampleBtn">Load Sample JD (Product Manager)</button>
      </div>
      <textarea id="jdTextarea" rows="7" placeholder="Paste the full job posting here..."></textarea>
      <div style="display:flex; gap:12px; margin-top:20px; flex-wrap:wrap;">
        <button type="button" class="btn-primary" id="analyzeJdBtn">Understand the Job</button>
        <button type="button" class="btn-ghost" onclick="goHome()">Back to Home</button>
      </div>
    </div>
  `;

  document.getElementById("fillSampleBtn").onclick = () => {
    document.getElementById("jdTextarea").value = SAMPLE_JD_TEXT;
  };

  document.getElementById("analyzeJdBtn").onclick = async () => {
    const val = document.getElementById("jdTextarea").value.trim();
    if (!val) {
      document.getElementById("jdTextarea").value = SAMPLE_JD_TEXT;
      return;
    }
    state.extraBatchesUsedA = 0;

    if (val === SAMPLE_JD_TEXT.trim()) {
      state.jdData = JSON.parse(JSON.stringify(PRELOADED_PATH_A));
      renderPathAOverview();
      return;
    }

    renderLoader("Analyzing job posting...", "Translating responsibilities into plain English and building 3 leveled project scenarios (Easy, Medium, Hard).");

    const sys = `You are an expert career coach and simulation designer. Given a job description, translate what the role actually involves into 4 concise plain-English responsibilities, and generate 3 realistic workplace projects (1 Easy, 1 Medium, 1 Hard) with observable evaluation criteria.
Never use em dashes. Ensure "simulationSetup.openingLine" ends with ONLY ONE clear question.
Return ONLY valid JSON with this structure:
{
  "title": "Job Title",
  "orgType": "Industry / Org Type",
  "plainResponsibilities": ["4 concise plain-English responsibilities"],
  "projects": [
    {
      "id": "p1",
      "difficulty": "Easy",
      "title": "Short Project Title",
      "shortDesc": "1-2 sentence plain summary of the project.",
      "tags": ["Competency Tag 1", "Competency Tag 2"],
      "businessContext": "2 concise sentences on why the company needs this now.",
      "objective": "1-2 sentences on what problem to solve.",
      "yourRole": "Your specific responsibility in this scenario.",
      "deliverables": "Key deliverables or decision required.",
      "challenges": "Main stakeholder pushback or constraint.",
      "skillsApplied": ["Skill 1", "Skill 2", "Skill 3"],
      "rubric": [
        "Observable behavior 1 (Clarifies underlying problem before proposing solutions)",
        "Observable behavior 2 (Uses relevant data or evidence to support decisions)",
        "Observable behavior 3 (Prioritizes initiatives based on impact, effort, and constraints)",
        "Observable behavior 4 (Addresses stakeholder concerns and explains the rationale)"
      ],
      "simulationSetup": {
        "stakeholderName": "Full Name",
        "stakeholderRole": "Stakeholder Title",
        "setScene": "2-3 sentences setting the immediate meeting context and numbers.",
        "openingLine": "Natural opening line from stakeholder asking ONE single clear question."
      }
    }
  ]
}`;
    const parsed = await callGeminiJSON(sys, val);
    if (parsed && parsed.projects && parsed.projects.length) {
      const diffs = ["Easy", "Medium", "Hard"];
      parsed.projects = parsed.projects.slice(0, 3).map((p, idx) => ({
        ...p,
        difficulty: diffs[idx] || p.difficulty || "Easy"
      }));
      parsed.extraBatches = [];
      state.jdData = parsed;
    } else {
      state.jdData = JSON.parse(JSON.stringify(PRELOADED_PATH_A));
    }
    renderPathAOverview();
  };
};

window.renderPathAOverview = function() {
  state.screen = "pathA_overview";
  updateTopBar(2);
  const d = state.jdData;

  app.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px;">
      <div>
        <div class="eyebrow">Role Breakdown : ${cleanText(d.orgType || "Target Role")}</div>
        <h1 class="hero-title" style="font-size:clamp(1.75rem, 3vw, 2.25rem); margin-bottom:0;">${cleanText(d.title)}</h1>
      </div>
      <button type="button" class="btn-secondary btn-sm" onclick="openPathAInput()">Change Job Description</button>
    </div>

    <!-- Section 1: What does this job actually involve? -->
    <section class="card-compact" style="margin-bottom:32px;" aria-labelledby="involve-heading">
      <h2 id="involve-heading" class="section-title" style="margin-bottom:6px;">
        1. What does this job actually involve?
      </h2>
      <p style="font-size:0.95rem; color:var(--ink-secondary); margin:0 0 12px;">Typical responsibilities in plain English:</p>
      <div class="resp-grid">
        ${(d.plainResponsibilities || []).map(r => `
          <div class="resp-item">
            <span class="resp-marker" aria-hidden="true"></span>
            <span>${cleanText(r)}</span>
          </div>
        `).join("")}
      </div>
    </section>

    <!-- Section 2: What projects might you work on? -->
    <section aria-labelledby="projects-heading">
      <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 id="projects-heading" class="section-title">2. What projects might you work on?</h2>
          <p class="section-desc">Choose a project below (Easy, Medium, or Hard) to experience a realistic workplace challenge.</p>
        </div>
        <span class="badge badge-outline-navy">${(d.projects || []).length} Projects Available</span>
      </div>

      <div class="grid-3">
        ${(d.projects || []).map((p, idx) => `
          <div class="interactive-card" role="button" tabindex="0" style="padding:24px;" onclick="selectProjectA(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectProjectA(${idx});}">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:10px;">
                <span style="font-size:0.82rem; font-weight:700; color:var(--navy); text-transform:uppercase;">
                  Project ${idx + 1}
                </span>
                <span class="badge ${getDifficultyBadgeClass(p.difficulty)}">${cleanText(p.difficulty || "Easy")}</span>
              </div>
              <h3 class="section-title" style="font-size:1.2rem; margin-bottom:10px;">${cleanText(p.title)}</h3>
              <p style="font-size:0.96rem; color:var(--ink-secondary); margin:0 0 18px;">${cleanText(p.shortDesc)}</p>
              <div style="margin-bottom:20px;">
                ${(p.tags || []).map(t => `<span class="tag">${cleanText(t)}</span>`).join("")}
              </div>
            </div>
            <span class="btn-primary btn-sm" style="width:100%; display:inline-flex; align-items:center; justify-content:center;">Explore this project</span>
          </div>
        `).join("")}
      </div>

      <!-- Generate More Projects Control (Max 2 clicks = 6 extra projects) -->
      <div style="margin-top:24px; text-align:center;">
        ${state.extraBatchesUsedA < 2 ? `
          <button type="button" class="btn-secondary" id="genMoreBtnA" onclick="handleGenerateMoreA()">
            Generate 3 More Projects (1 Easy, 1 Medium, 1 Hard) (${2 - state.extraBatchesUsedA} left)
          </button>
        ` : `
          <div class="card-subtle" style="display:inline-block; max-width:680px; text-align:center;">
            <strong style="color:var(--navy);">Maximum project limit reached (9 projects total).</strong>
            <p style="margin:4px 0 0; font-size:0.95rem; color:var(--ink-secondary);">
              You have generated the maximum of two additional project batches. Please try practicing one of the existing projects above first.
            </p>
          </div>
        `}
      </div>

      <p class="footer-note">
        Note: Illustrative AI-generated job analysis and project examples. These are representative possibilities, not verified projects from a particular employer.
      </p>
    </section>
  `;
};

window.handleGenerateMoreA = async function() {
  if (state.extraBatchesUsedA >= 2) return;
  const btn = document.getElementById("genMoreBtnA");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Generating 3 new projects (Easy, Medium, Hard)...";
  }

  const d = state.jdData;
  const batchIdx = state.extraBatchesUsedA;
  let newProjects = null;

  if (d.extraBatches && d.extraBatches[batchIdx] && d.extraBatches[batchIdx].length === 3) {
    newProjects = JSON.parse(JSON.stringify(d.extraBatches[batchIdx]));
  } else {
    newProjects = await generateThreeMoreProjectsForRole(d.title, d.orgType, d.plainResponsibilities, d.projects, batchIdx);
  }

  d.projects.push(...newProjects);
  state.extraBatchesUsedA += 1;
  renderPathAOverview();
};

window.selectProjectA = function(idx) {
  state.project = state.jdData.projects[idx];
  state.attemptNum = 1;
  state.retryTwist = null;
  renderProjectBrief();
};

/* ============================================================================
   SCREEN 2B: PATH B - EXPLORE CAREER PATHS (REFRESH 4 + CUSTOM INPUT)
   ============================================================================ */
window.openPathBGrid = function() {
  if (!getJobSimToken()) { renderEmailGate(""); return; }
  state.path = "B";
  state.screen = "pathB_grid";
  updateTopBar(2);

  const startIdx = (state.careerBatchIdxB * 4) % CAREERS_POOL_PATH_B.length;
  const visibleCareers = CAREERS_POOL_PATH_B.slice(startIdx, startIdx + 4);
  const batchNumber = (state.careerBatchIdxB % 3) + 1;

  app.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px;">
      <div>
        <div class="eyebrow">Path B : For Career Explorers</div>
        <h1 class="hero-title" style="font-size:clamp(1.75rem, 3vw, 2.25rem); margin-bottom:6px;">Explore different careers</h1>
        <p class="subtitle">Not sure what you want to do? Explore what different professionals actually do, switch the career set, or enter any role you want to test-drive.</p>
      </div>
      <button type="button" class="btn-secondary btn-sm" onclick="cycleCareerBatchB()">
        Show 4 Different Careers (Set ${batchNumber} of 3)
      </button>
    </div>

    <!-- Custom Career Role Input Box -->
    <section class="card-compact custom-career-box" style="margin-bottom:28px; background:var(--navy-light); border:2px solid var(--navy);" aria-labelledby="custom-career-heading">
      <div class="custom-career-head">
        <h2 id="custom-career-heading" class="section-title" style="font-size:1.1rem; margin:0;">
          Want to explore a specific career not shown below?
        </h2>
        <span class="badge badge-outline-navy">Custom Career Explorer</span>
      </div>
      <p class="custom-career-note">
        Note: Please spell out the full job title instead of using acronyms (e.g., "Product Manager" instead of "PM"), as the same acronym can mean different roles across industries.
      </p>
      <div class="custom-career-row">
        <input type="text" id="customCareerInput" placeholder="Enter any career title (e.g., UX Writer, Operations Analyst, Solutions Architect, Account Executive)..." aria-label="Enter a career role to explore">
        <button type="button" class="btn-primary" id="exploreCustomCareerBtn" onclick="handleCustomCareerSearch()">
          Explore This Career
        </button>
      </div>
    </section>

    <!-- 4 Career Cards Grid -->
    <div class="grid-2">
      ${visibleCareers.map(c => `
        <div class="interactive-card" role="button" tabindex="0" onclick="openCareerDetailB('${c.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openCareerDetailB('${c.id}');}">
          <div>
            <span class="badge badge-outline-navy" style="margin-bottom:12px;">Career Path</span>
            <h2 class="section-title" style="font-size:1.35rem; margin-bottom:8px;">${cleanText(c.title)}</h2>
            <p style="color:var(--ink-secondary); font-size:1rem; margin:0 0 24px;">${cleanText(c.shortDesc)}</p>
          </div>
          <span class="btn-primary btn-sm" style="width:fit-content; display:inline-flex; align-items:center;">Explore Role & Projects</span>
        </div>
      `).join("")}
    </div>
  `;

  const inputEl = document.getElementById("customCareerInput");
  if (inputEl) {
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCustomCareerSearch();
      }
    });
  }
};

window.cycleCareerBatchB = function() {
  state.careerBatchIdxB = (state.careerBatchIdxB + 1) % Math.ceil(CAREERS_POOL_PATH_B.length / 4);
  openPathBGrid();
};

window.handleCustomCareerSearch = async function() {
  const inputEl = document.getElementById("customCareerInput");
  if (!inputEl) return;
  const query = inputEl.value.trim();
  if (!query) {
    inputEl.focus();
    return;
  }

  // Check if query matches one of our 12 preloaded careers
  const existing = CAREERS_POOL_PATH_B.find(c => c.title.toLowerCase() === query.toLowerCase());
  if (existing) {
    openCareerDetailB(existing.id);
    return;
  }

  renderLoader(`Building Career Guide for "${query}"...`, "Generating role overview, typical workday, skills, and 3 leveled real-world projects (Easy, Medium, Hard).");

  const sys = `You are an expert career advisor and workplace simulation architect. Create a complete career exploration guide and 3 realistic workplace projects (1 Easy, 1 Medium, 1 Hard) for the career role: "${query}".
Do NOT use em dashes anywhere. Ensure every "simulationSetup.openingLine" ends with ONLY ONE clear question.
Return ONLY valid JSON matching this exact structure:
{
  "title": "Standardized Role Title",
  "shortDesc": "1 sentence plain description of what this role does.",
  "whatTheyDo": "2-3 sentences explaining what this professional actually does.",
  "typicalWorkday": "2 sentences describing a typical workday.",
  "typicalProjects": "1-2 sentences listing typical projects they work on.",
  "skillsAndTools": ["Skill 1", "Skill 2", "Tool 1", "Tool 2", "Skill 3"],
  "challenges": "1-2 sentences on key workplace challenges they face.",
  "relatedCareers": ["Related Role 1", "Related Role 2", "Related Role 3"],
  "projects": [
    {
      "id": "cust-1",
      "difficulty": "Easy",
      "title": "Project Title",
      "shortDesc": "1-2 sentence summary of the workplace scenario.",
      "tags": ["Skill Tag 1", "Skill Tag 2"],
      "businessContext": "2 sentences explaining the business situation with concrete numbers.",
      "objective": "1-2 sentences stating the goal of the meeting.",
      "yourRole": "Your role in the conversation.",
      "deliverables": "What decision or plan you need to deliver.",
      "challenges": "Why the stakeholder is pushing back.",
      "skillsApplied": ["Competency 1", "Competency 2", "Competency 3"],
      "rubric": [
        "Observable behavior 1 (Clarifies underlying problem before proposing solutions)",
        "Observable behavior 2 (Uses relevant data or evidence to support decisions)",
        "Observable behavior 3 (Prioritizes initiatives based on impact, effort, and constraints)",
        "Observable behavior 4 (Addresses stakeholder concerns and explains the rationale)"
      ],
      "simulationSetup": {
        "stakeholderName": "Full Name",
        "stakeholderRole": "Stakeholder Title",
        "setScene": "2-3 sentences setting the scene and metrics.",
        "openingLine": "Realistic opening statement ending with ONE clear question."
      }
    }
  ]
}`;

  let parsed = null;
  try {
    const cg = await jobSimFetch("/job-sim/llm/career-guide", {
      method: "POST",
      body: JSON.stringify({ query })
    });
    if (cg && cg.result) parsed = deepCleanObject(cg.result);
  } catch (e) {
    parsed = await callGeminiJSON(sys, `Generate career exploration guide and 3 leveled projects (Easy, Medium, Hard) for: ${query}`);
  }
  const diffs = ["Easy", "Medium", "Hard"];

  if (parsed && parsed.projects && parsed.projects.length) {
    const customCareerObj = {
      id: "custom_" + Date.now(),
      title: parsed.title || query,
      shortDesc: parsed.shortDesc || `Plan, execute, and deliver core initiatives as a ${query}.`,
      whatTheyDo: parsed.whatTheyDo,
      typicalWorkday: parsed.typicalWorkday,
      typicalProjects: parsed.typicalProjects,
      skillsAndTools: parsed.skillsAndTools || ["Problem Solving", "Stakeholder Alignment", "Data Analysis"],
      challenges: parsed.challenges,
      relatedCareers: parsed.relatedCareers || ["Product Manager", "Business Operations Manager", "Data Analyst"],
      projects: parsed.projects.slice(0, 3).map((p, i) => ({
        ...p,
        id: `cust-p-${i}`,
        difficulty: diffs[i] || "Easy"
      })),
      extraBatches: []
    };
    state.careerB = customCareerObj;
    state.extraBatchesUsedB = 0;
    renderCareerDetailViewB();
  } else {
    // Fallback custom career if offline
    const fallbackProjects = await generateThreeMoreProjectsForRole(query, "Enterprise Team", [
      `Diagnose operational and customer bottlenecks as a ${query}.`,
      `Prioritize high-impact initiatives and align cross-functional partners.`,
      `Use data and evidence to guide decisions and measure outcomes.`
    ], [], 0);
    state.careerB = {
      id: "custom_fb",
      title: query,
      shortDesc: `Drive core functional outcomes, collaborate across teams, and solve workplace problems as a ${query}.`,
      whatTheyDo: `${query} professionals bridge day-to-day execution with strategic business goals. They diagnose bottlenecks, align stakeholders on clear priorities, and deliver measurable outcomes.`,
      typicalWorkday: `Reviewing key operational metrics, collaborating with cross-functional partners to unblock projects, scoping solutions, and presenting recommendations to leadership.`,
      typicalProjects: `Fixing a high-friction workflow bottleneck, scoping a cross-team pilot initiative, and presenting a data-backed resource plan.`,
      skillsAndTools: ["Problem Diagnosis", "Stakeholder Alignment", "Data-Backed Decisions", "Project Scoping"],
      challenges: `Balancing urgent stakeholder requests against long-term quality and capacity constraints.`,
      relatedCareers: ["Product Manager", "Business Operations Manager", "Data Analyst"],
      projects: fallbackProjects,
      extraBatches: []
    };
    state.extraBatchesUsedB = 0;
    renderCareerDetailViewB();
  }
};

window.openCareerDetailB = function(id) {
  const found = CAREERS_POOL_PATH_B.find(c => c.id === id);
  if (found) {
    state.careerB = JSON.parse(JSON.stringify(found));
    state.extraBatchesUsedB = 0;
  }
  renderCareerDetailViewB();
};

window.renderCareerDetailViewB = function() {
  state.screen = "pathB_detail";
  updateTopBar(2);
  const c = state.careerB;

  app.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px;">
      <div>
        <div class="eyebrow">Career Exploration Guide</div>
        <h1 class="hero-title" style="font-size:clamp(1.75rem, 3vw, 2.25rem); margin-bottom:0;">${cleanText(c.title)}</h1>
      </div>
      <button type="button" class="btn-secondary btn-sm" onclick="openPathBGrid()">Back to All Careers</button>
    </div>

    <!-- 5-Part Structured Role Guide -->
    <div class="grid-2" style="margin-bottom:20px;">
      <div class="card-compact" style="margin:0;">
        <h2 class="section-title" style="font-size:1.05rem; margin-bottom:6px;">1. What does this professional actually do?</h2>
        <p style="font-size:0.98rem; color:var(--ink-secondary); margin:0;">${cleanText(c.whatTheyDo)}</p>
      </div>
      <div class="card-compact" style="margin:0;">
        <h2 class="section-title" style="font-size:1.05rem; margin-bottom:6px;">2. What does a typical workday look like?</h2>
        <p style="font-size:0.98rem; color:var(--ink-secondary); margin:0;">${cleanText(c.typicalWorkday)}</p>
      </div>
      <div class="card-compact" style="margin:0;">
        <h2 class="section-title" style="font-size:1.05rem; margin-bottom:6px;">3. What projects might they work on?</h2>
        <p style="font-size:0.98rem; color:var(--ink-secondary); margin:0;">${cleanText(c.typicalProjects)}</p>
      </div>
      <div class="card-compact" style="margin:0;">
        <h2 class="section-title" style="font-size:1.05rem; margin-bottom:8px;">4. What skills and tools do they use?</h2>
        <div>${(c.skillsAndTools || []).map(s => `<span class="tag">${cleanText(s)}</span>`).join("")}</div>
      </div>
    </div>

    <div class="card-compact" style="margin-bottom:32px;">
      <h2 class="section-title" style="font-size:1.05rem; margin-bottom:6px;">5. What challenges do they face?</h2>
      <p style="font-size:0.98rem; color:var(--ink-secondary); margin:0;">${cleanText(c.challenges)}</p>
    </div>

    <!-- Try a Real-World Project Section (3 Initial Projects: Easy, Medium, Hard + Generate More) -->
    <section aria-labelledby="career-projects-heading">
      <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:12px; margin-bottom:8px;">
        <div>
          <span class="badge badge-blue" style="margin-bottom:8px;">Try a real-world project</span>
          <h2 id="career-projects-heading" class="section-title" style="font-size:1.4rem;">Experience a Realistic ${cleanText(c.title)} Project</h2>
          <p class="section-desc">Choose an Easy, Medium, or Hard project below to step into the role.</p>
        </div>
        <span class="badge badge-outline-navy">${(c.projects || []).length} Projects Available</span>
      </div>

      <div class="grid-3">
        ${(c.projects || []).map((p, idx) => `
          <div class="interactive-card" role="button" tabindex="0" style="padding:24px;" onclick="selectProjectB(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectProjectB(${idx});}">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:10px;">
                <span style="font-size:0.82rem; font-weight:700; color:var(--navy); text-transform:uppercase;">
                  Project ${idx + 1}
                </span>
                <span class="badge ${getDifficultyBadgeClass(p.difficulty)}">${cleanText(p.difficulty || "Easy")}</span>
              </div>
              <h3 class="section-title" style="font-size:1.2rem; margin-bottom:10px;">${cleanText(p.title)}</h3>
              <p style="font-size:0.96rem; color:var(--ink-secondary); margin:0 0 18px;">${cleanText(p.shortDesc)}</p>
              <div style="margin-bottom:20px;">
                ${(p.tags || []).map(t => `<span class="tag">${cleanText(t)}</span>`).join("")}
              </div>
            </div>
            <span class="btn-primary btn-sm" style="width:100%; display:inline-flex; align-items:center; justify-content:center;">Explore this project</span>
          </div>
        `).join("")}
      </div>

      <!-- Generate More Projects Control (Max 2 clicks = 6 extra projects) -->
      <div style="margin-top:24px; text-align:center;">
        ${state.extraBatchesUsedB < 2 ? `
          <button type="button" class="btn-secondary" id="genMoreBtnB" onclick="handleGenerateMoreB()">
            Generate 3 More Projects (1 Easy, 1 Medium, 1 Hard) (${2 - state.extraBatchesUsedB} left)
          </button>
        ` : `
          <div class="card-subtle" style="display:inline-block; max-width:680px; text-align:center;">
            <strong style="color:var(--navy);">Maximum project limit reached (9 projects total).</strong>
            <p style="margin:4px 0 0; font-size:0.95rem; color:var(--ink-secondary);">
              You have generated the maximum of two additional project batches. Please try practicing one of the existing projects above first.
            </p>
          </div>
        `}
      </div>
    </section>
  `;
};

window.handleGenerateMoreB = async function() {
  if (state.extraBatchesUsedB >= 2) return;
  const btn = document.getElementById("genMoreBtnB");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Generating 3 new projects (Easy, Medium, Hard)...";
  }

  const c = state.careerB;
  const batchIdx = state.extraBatchesUsedB;
  let newProjects = null;

  if (c.extraBatches && c.extraBatches[batchIdx] && c.extraBatches[batchIdx].length === 3) {
    newProjects = JSON.parse(JSON.stringify(c.extraBatches[batchIdx]));
  } else {
    newProjects = await generateThreeMoreProjectsForRole(c.title, "Enterprise Team", [c.whatTheyDo, c.typicalProjects], c.projects, batchIdx);
  }

  c.projects.push(...newProjects);
  state.extraBatchesUsedB += 1;
  renderCareerDetailViewB();
};

window.selectProjectB = function(idx) {
  state.project = state.careerB.projects[idx];
  state.attemptNum = 1;
  state.retryTwist = null;
  renderProjectBrief();
};

/* ============================================================================
   SCREEN 3: FOCUSED PROJECT BRIEF (WITH COLLAPSED CLICKABLE RUBRIC ACCORDION)
   ============================================================================ */
window.renderProjectBrief = function() {
  state.screen = "brief";
  updateTopBar(2);
  const p = state.project;
  const roleName = state.path === "A" ? state.jdData.title : state.careerB.title;

  app.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
      <button type="button" class="btn-secondary btn-sm" onclick="${state.path === 'A' ? 'renderPathAOverview()' : 'renderCareerDetailViewB()'}">
        Back to ${state.path === 'A' ? 'Projects' : cleanText(roleName)}
      </button>
      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <span class="badge ${getDifficultyBadgeClass(p.difficulty)}">Difficulty: ${cleanText(p.difficulty || "Easy")}</span>
        <span class="badge badge-outline-navy">Estimated Time: 10 to 15 mins</span>
        <span class="badge badge-blue">Role: ${cleanText(roleName)}</span>
      </div>
    </div>

    <div class="card">
      <div class="eyebrow">Role & Project Context</div>
      <h1 class="hero-title" style="font-size:clamp(1.6rem, 3vw, 2.15rem); margin-bottom:20px;">${cleanText(p.title)}</h1>

      <!-- Business Context & Project Objective Highlight Box -->
      <div class="card-subtle" style="margin-bottom:24px; border-left:4px solid var(--navy);">
        <div style="font-family:var(--font-heading); font-size:0.95rem; font-weight:700; text-transform:uppercase; color:var(--navy); margin-bottom:8px;">
          Business Context & Project Objective
        </div>
        <p style="font-size:1rem; color:var(--ink); margin:0 0 12px;">
          <strong>Business context:</strong> ${cleanText(p.businessContext)}
        </p>
        <p style="font-size:1rem; color:var(--ink); margin:0;">
          <strong>Project objective:</strong> ${cleanText(p.objective)}
        </p>
      </div>

      <!-- 4-Dimension Grid: Your Role, Deliverables, Challenges, Skills Applied -->
      <div class="grid-2" style="margin-bottom:24px;">
        <div class="card-compact" style="margin:0;">
          <h2 class="section-title" style="font-size:1rem; margin-bottom:6px;">Your role</h2>
          <p style="font-size:1rem; color:var(--ink-secondary); margin:0;">${cleanText(p.yourRole)}</p>
        </div>
        <div class="card-compact" style="margin:0;">
          <h2 class="section-title" style="font-size:1rem; margin-bottom:6px;">Deliverables</h2>
          <p style="font-size:1rem; color:var(--ink-secondary); margin:0;">${cleanText(p.deliverables)}</p>
        </div>
        <div class="card-compact" style="margin:0;">
          <h2 class="section-title" style="font-size:1rem; margin-bottom:6px;">Challenges</h2>
          <p style="font-size:1rem; color:var(--ink-secondary); margin:0;">${cleanText(p.challenges)}</p>
        </div>
        <div class="card-compact" style="margin:0;">
          <h2 class="section-title" style="font-size:1rem; margin-bottom:8px;">Skills applied</h2>
          <div>${(p.skillsApplied || p.tags || []).map(s => `<span class="tag">${cleanText(s)}</span>`).join("")}</div>
        </div>
      </div>

      <!-- High-Affordance Clickable Accordion for Predefined Evaluation Rubric (Collapsed by Default) -->
      <details class="rubric-accordion">
        <summary>
          <span>Predefined Evaluation Rubric (Observable Workplace Behaviors)</span>
          <span class="accordion-toggle-pill" aria-hidden="true"></span>
        </summary>
        <div class="rubric-accordion-body">
          <p style="font-size:1rem; color:var(--ink-secondary); margin:0 0 12px;">
            During this 10 to 15 minute simulation, your conversation will be evaluated against these <strong>${p.rubric.length} observable behaviors</strong>, tracking whether you demonstrate them independently or with progressive coaching support:
          </p>
          <ul style="margin:0; padding-left:22px; font-size:1rem; color:var(--ink);">
            ${p.rubric.map(r => `<li style="margin-bottom:8px;">${cleanText(r)}</li>`).join("")}
          </ul>
        </div>
      </details>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
        <span style="font-size:0.95rem; color:var(--ink-secondary);">
          Need support during the scenario? Click <strong>"Need a hint?"</strong> anytime for progressive guidance.
        </span>
        <button type="button" class="btn-primary" onclick="startSimulation(false)">Start Simulation (10 to 15 min)</button>
      </div>
    </div>
  `;
};

/* ============================================================================
   SCREEN 4: FIXED-VIEWPORT SIMULATION WORKSPACE (PINNED BRIEF + PROGRESS BAR)
   ============================================================================ */
const HINT_LEVEL_LABELS = {
  1: "Level 1 of 5 : Open-Ended Prompt",
  2: "Level 2 of 5 : Directional Hint",
  3: "Level 3 of 5 : Structured Options",
  4: "Level 4 of 5 : Example Response",
  5: "Level 5 of 5 : Complete Model Answer"
};

window.startSimulation = async function(withRetryTwist = false) {
  state.screen = "sim";
  updateTopBar(3);

  const p = state.project;
  const roleName = state.path === "A" ? state.jdData.title : state.careerB.title;

  state.messages = [];
  state.turnCount = 0;
  state.hintDrawerOpen = false;
  state.currentHintLevel = 0;
  state.maxHintLevelUsed = 0;
  state.supportHistory = [];
  state.pinnedBriefVisible = true; // Open and visible at top by default

  let activeSetup = JSON.parse(JSON.stringify(p.simulationSetup));

  if (withRetryTwist && state.lastDebrief) {
    state.attemptNum += 1;
    renderLoader("Creating a fresh scenario twist...", "Keeping the same core competencies while introducing a new constraint so you can apply your feedback.");

    const twistSys = `You are designing a "Retry with New Twist" simulation opening for a ${roleName} working on "${p.title}".
Keep the same stakeholder (${activeSetup.stakeholderName}, ${activeSetup.stakeholderRole}) and same evaluation rubric, but introduce a realistic modified constraint (e.g., tighter timeline, new executive requirement, or fresh data point) so the user can practice transferring their improvements.
Never use em dashes. Ask ONLY ONE clear question at the end of "openingLine".
Return ONLY valid JSON:
{
  "twistBanner": "1 concise sentence describing what changed in this new scenario twist",
  "setScene": "2-3 concise sentences setting the updated scene",
  "openingLine": "The stakeholder's opening dialogue presenting the modified situation and asking ONE question"
}`;
    const twistRes = await callGeminiJSON(twistSys, `Original context: ${p.businessContext}\nPrevious feedback to apply: ${(state.lastDebrief.recommendations || []).join("; ")}`);
    if (twistRes && twistRes.openingLine) {
      state.retryTwist = cleanText(twistRes.twistBanner);
      activeSetup.setScene = cleanText(twistRes.setScene);
      activeSetup.openingLine = cleanText(twistRes.openingLine);
    } else {
      state.retryTwist = "New Twist: Leadership just shortened the delivery timeline by 50%, requiring a sharper scope trade-off.";
      activeSetup.openingLine = "Quick update before we dive in: leadership just cut our timeline in half this morning, so we have zero margin for error. How do you recommend we adjust our plan and still hit the core goal?";
    }
  } else {
    state.retryTwist = null;
  }

  state.activeSetup = activeSetup;
  state.messages.push({ role: "assistant", content: cleanText(activeSetup.openingLine) });
  renderSimWorkspace();
};

function getSimulationProgressPct() {
  return Math.min(100, Math.round((state.turnCount / 6) * 100));
}

function isEndDebriefUnlocked() {
  // Unlocked only when progress reaches at least 3/4 (75%)
  return getSimulationProgressPct() >= 75;
}

function renderSimWorkspace() {
  const p = state.project;
  const setup = state.activeSetup;
  const pct = getSimulationProgressPct();
  const canEnd = isEndDebriefUnlocked();

  app.innerHTML = `
    <div class="sim-viewport-shell">
      <!-- Always-Visible Pinned Header with Progress Bar & Project Brief Toggle -->
      <div class="sim-pinned-top">
        <div class="sim-top-row">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span class="badge ${getDifficultyBadgeClass(p.difficulty)}">${cleanText(p.difficulty || "Easy")}</span>
            <strong style="font-family:var(--font-heading); font-size:1.05rem; color:var(--navy);">${cleanText(p.title)}</strong>
          </div>

          <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
            <div class="pacing-bar-wrap" aria-label="Simulation Progress">
              <span>Simulation Progress</span>
              <div class="pacing-track">
                <div class="pacing-fill" id="pacingFill" style="width:${Math.max(8, pct)}%;"></div>
              </div>
            </div>
            <button type="button" class="btn-secondary btn-sm" id="togglePinnedBriefBtn" onclick="togglePinnedBrief()" style="min-height:38px; padding:6px 12px;">
              ${state.pinnedBriefVisible ? "Hide Project Brief" : "Show Project Brief"}
            </button>
          </div>
        </div>
      </div>

      <!-- Pinned Project Brief Panel (Stays visible while chatting unless user hides it) -->
      <div id="pinnedBriefPanel" class="pinned-brief-panel" style="display:${state.pinnedBriefVisible ? 'block' : 'none'};">
        <div class="pinned-brief-grid">
          <div class="pinned-brief-item">
            <strong>Business Context</strong>
            <span>${cleanText(p.businessContext)}</span>
          </div>
          <div class="pinned-brief-item">
            <strong>Project Objective</strong>
            <span>${cleanText(p.objective)}</span>
          </div>
          <div class="pinned-brief-item">
            <strong>Your Role & Deliverable</strong>
            <span>${cleanText(p.yourRole)} (${cleanText(p.deliverables)})</span>
          </div>
        </div>
      </div>

      ${state.retryTwist ? `
        <div style="background:var(--emerald-soft); border-bottom:1.5px solid var(--emerald-border); padding:8px 20px; font-size:0.88rem; color:var(--emerald); flex-shrink:0;">
          <strong>Transfer Practice (Attempt #${state.attemptNum}):</strong> ${cleanText(state.retryTwist)}
        </div>
      ` : ""}

      <!-- Independently Scrollable Message Stream -->
      <div class="chat-stream" id="chatStream">
        <div class="scene-context-box">
          <strong>Scene Context:</strong> ${cleanText(setup.setScene)}
        </div>
        <div id="messageList" style="display:flex; flex-direction:column; gap:14px;"></div>
      </div>

      <!-- Collapsible Progressive Hint Coach Drawer -->
      <div id="coachDrawer" class="coach-drawer" style="display:none;">
        <div class="coach-header">
          <span class="coach-title" id="coachLevelTitle">Coaching Hint</span>
          <div style="display:flex; gap:8px; align-items:center;">
            <button type="button" class="btn-amber btn-sm" id="nextHintBtn" onclick="stepUpHintLevel()" style="min-height:36px; padding:4px 12px;">Need more support? (Next hint level)</button>
            <button type="button" class="btn-ghost btn-sm" onclick="closeCoachDrawer()" style="min-height:36px; padding:4px 10px;">Dismiss</button>
          </div>
        </div>
        <div class="coach-body" id="coachBodyText"></div>
      </div>

      <!-- Pinned Bottom Composer Bar -->
      <div class="composer-bar">
        <textarea id="simInput" rows="2" placeholder="Type your response to ${cleanText(setup.stakeholderName)}..."></textarea>
        <div class="composer-actions">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <button type="button" class="btn-amber btn-sm" id="hintTriggerBtn" onclick="openOrAdvanceHint()">
              Need a hint?
            </button>
            <span id="hintStatusNote" style="font-size:0.82rem; font-weight:600; color:var(--ink-muted);">
              5-level progressive coaching available
            </span>
          </div>

          <div style="display:flex; align-items:center; gap:10px;">
            <button type="button" class="btn-ghost btn-sm" id="endDebriefBtn" onclick="finishAndDebrief()" style="display:${canEnd ? 'inline-flex' : 'none'};">
              End & View Debrief
            </button>
            <button type="button" class="btn-primary btn-sm" id="sendTurnBtn" onclick="submitUserTurn()">
              Send Response
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  renderMessagesList();

  const simInput = document.getElementById("simInput");
  if (simInput) {
    simInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        submitUserTurn();
      }
    });
  }
}

function renderMessagesList() {
  const listEl = document.getElementById("messageList");
  const streamEl = document.getElementById("chatStream");
  if (!listEl) return;
  const setup = state.activeSetup;
  const initials = getInitials(setup.stakeholderName);

  listEl.innerHTML = state.messages.map(m => {
    if (m.role === "assistant") {
      return `
        <div class="msg-row stakeholder">
          <div class="avatar stakeholder">${initials}</div>
          <div>
            <div class="msg-meta">
              <span>${cleanText(setup.stakeholderName)}</span>
              <span class="badge badge-neutral" style="font-size:0.75rem; padding:2px 8px;">${cleanText(setup.stakeholderRole)}</span>
            </div>
            <div class="msg-bubble">${cleanText(m.content)}</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="msg-row user">
          <div class="avatar user">You</div>
          <div>
            <div class="msg-meta" style="justify-content:flex-end;">You</div>
            <div class="msg-bubble">${cleanText(m.content).replace(/\n/g, "<br>")}</div>
          </div>
        </div>
      `;
    }
  }).join("");

  if (streamEl) streamEl.scrollTop = streamEl.scrollHeight;
}

window.togglePinnedBrief = function() {
  const panel = document.getElementById("pinnedBriefPanel");
  const btn = document.getElementById("togglePinnedBriefBtn");
  if (!panel || !btn) return;
  state.pinnedBriefVisible = !state.pinnedBriefVisible;
  panel.style.display = state.pinnedBriefVisible ? "block" : "none";
  btn.textContent = state.pinnedBriefVisible ? "Hide Project Brief" : "Show Project Brief";
};

window.closeCoachDrawer = function() {
  const drawer = document.getElementById("coachDrawer");
  if (drawer) drawer.style.display = "none";
  state.hintDrawerOpen = false;
};

window.openOrAdvanceHint = async function() {
  if (!state.hintDrawerOpen) {
    state.hintDrawerOpen = true;
    if (state.currentHintLevel === 0) {
      await fetchHintForLevel(1);
    } else {
      const drawer = document.getElementById("coachDrawer");
      if (drawer) drawer.style.display = "block";
    }
  } else {
    await stepUpHintLevel();
  }
};

window.stepUpHintLevel = async function() {
  const nextLvl = Math.min(5, state.currentHintLevel + 1);
  await fetchHintForLevel(nextLvl);
};

async function fetchHintForLevel(level, isAutoNudge = false) {
  state.currentHintLevel = level;
  state.maxHintLevelUsed = Math.max(state.maxHintLevelUsed, level);
  state.hintDrawerOpen = true;

  const drawer = document.getElementById("coachDrawer");
  const titleEl = document.getElementById("coachLevelTitle");
  const bodyEl = document.getElementById("coachBodyText");
  const nextBtn = document.getElementById("nextHintBtn");
  const noteEl = document.getElementById("hintStatusNote");

  if (drawer) drawer.style.display = "block";
  if (titleEl) titleEl.textContent = `${HINT_LEVEL_LABELS[level]}${isAutoNudge ? " (Support Nudge)" : ""}`;
  if (bodyEl) bodyEl.innerHTML = `<span style="color:var(--ink-secondary);">Generating coaching support...</span>`;
  if (nextBtn) {
    nextBtn.style.display = level < 5 ? "inline-flex" : "none";
    nextBtn.textContent = `Need more support? (Level ${level + 1} of 5)`;
  }
  if (noteEl) noteEl.textContent = `Highest support used: Level ${state.maxHintLevelUsed} of 5`;

  const p = state.project;
  const setup = state.activeSetup;
  const transcript = state.messages.map(m => `${m.role === "user" ? "USER" : setup.stakeholderName}: ${m.content}`).join("\n");

  const levelPrompts = {
    1: "LEVEL 1 (Open-ended prompt): Ask 1 concise, open-ended question that helps the user think about what data or problem root-cause they should clarify right now. Do NOT give away the answer.",
    2: "LEVEL 2 (Directional hint): Offer 1-2 specific considerations (e.g., customer impact, business metric, engineering/time constraint) without revealing the full answer.",
    3: "LEVEL 3 (Structured options): Present 2-3 clear strategic options with a 1-line trade-off for each, and ask the user to pick one and explain why.",
    4: "LEVEL 4 (Example response): Provide a short, adaptable 2-sentence professional response template with [brackets] where the user can fill in their own reasoning.",
    5: "LEVEL 5 (Model answer): Provide a complete, strong model answer the user can adapt or insert, plus 1 sentence explaining why it works."
  };

  const sys = `You are an encouraging workplace coach inside a career simulation.
Project: ${p.title}
Context: ${p.businessContext}
Goal: ${p.objective}
Instruction: ${levelPrompts[level]}
Never use em dashes.
Return ONLY valid JSON:
{
  "hint": "Concise coaching text matching the requested level",
  "sampleReply": "Only if Level 5, the plain model reply text that can be inserted into the input box; otherwise empty string"
}`;

  const res = await callGeminiJSON(sys, `Conversation so far:\n${transcript}`);

  const fallbacks = {
    1: `What underlying assumption is ${setup.stakeholderName} making right now, and what metric from the project brief would help you test whether their request solves the real problem?`,
    2: `Consider two angles in your reply: (1) Validate ${setup.stakeholderName}'s urgency around targets, and (2) Reference the key data bottleneck from the brief (${cleanText(p.businessContext.split(".")[0])}).`,
    3: `Choose one of these 3 approaches and explain why:<br>1. <strong>Diagnose First:</strong> Propose a quick root-cause check on the bottleneck data before committing full resources.<br>2. <strong>Targeted Pilot:</strong> Propose a lightweight 2-week pilot on the highest-impact segment.<br>3. <strong>Phased Trade-off:</strong> Address the immediate bottleneck now and schedule their broader request for Phase 2.`,
    4: `<strong>Adaptable Template:</strong> <em>"I agree that hitting our goal is urgent. Looking at the data, [cite key bottleneck from brief]. What if we start with [focused intervention] so we get measurable results without [stakeholder's constraint]?"</em>`,
    5: `<strong>Model Response:</strong> <em>"I share your urgency on improving our numbers quickly. Looking at the data, however, our biggest bottleneck is ${cleanText(p.objective.toLowerCase())}. Rather than committing full resources upfront to an unvalidated rollout, let's run a focused 2-week intervention targeting that bottleneck first and track our primary KPI."</em><br><span style="font-size:0.85rem;"><strong>Why this works:</strong> It aligns with ${setup.stakeholderName}'s goal while anchoring the decision on concrete evidence and risk reduction.</span>`
  };

  const hintHtml = (res && res.hint) ? cleanText(res.hint) : fallbacks[level];
  state.supportHistory.push({ turn: state.turnCount + 1, level, label: HINT_LEVEL_LABELS[level] });

  if (bodyEl) {
    let extraBtn = "";
    if (level === 5) {
      const cleanModel = (res && res.sampleReply)
        ? cleanText(res.sampleReply)
        : `I share your urgency on improving our numbers quickly. Looking at the data, however, our biggest bottleneck is ${cleanText(p.objective.toLowerCase())}. Let's run a focused two-week intervention on that bottleneck first and measure impact.`;
      window.__latestModelReply = cleanModel;
      extraBtn = `<div style="margin-top:8px;"><button type="button" class="btn-secondary btn-sm" onclick="insertModelReply()" style="min-height:36px; padding:4px 12px;">Copy to input box & adapt</button></div>`;
    }
    bodyEl.innerHTML = `${hintHtml}${extraBtn}`;
  }
}

window.insertModelReply = function() {
  const input = document.getElementById("simInput");
  if (input && window.__latestModelReply) {
    input.value = window.__latestModelReply;
    input.focus();
  }
};

function looksStuck(text) {
  const t = text.toLowerCase().trim();
  const phrases = ["i don't know", "not sure", "idk", "no idea", "help", "what should i do", "stuck", "不知道", "怎么回"];
  return phrases.some(p => t === p || t.includes(p)) || (t.split(/\s+/).length <= 2 && state.turnCount < 2);
}

window.submitUserTurn = async function() {
  const input = document.getElementById("simInput");
  const sendBtn = document.getElementById("sendTurnBtn");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  closeCoachDrawer();
  state.currentHintLevel = 0;

  state.messages.push({ role: "user", content: cleanText(text) });
  state.turnCount += 1;
  renderMessagesList();

  const pct = getSimulationProgressPct();
  const pacingFill = document.getElementById("pacingFill");
  if (pacingFill) {
    pacingFill.style.width = `${Math.max(8, pct)}%`;
  }

  // Reveal End & View Debrief button once progress reaches 3/4 (75%)
  const endBtn = document.getElementById("endDebriefBtn");
  if (endBtn && isEndDebriefUnlocked()) {
    endBtn.style.display = "inline-flex";
  }

  sendBtn.disabled = true;
  sendBtn.textContent = "Replying...";

  if (looksStuck(text)) {
    await fetchHintForLevel(Math.min(5, state.maxHintLevelUsed + 1), true);
  }

  const p = state.project;
  const setup = state.activeSetup;
  const roleName = state.path === "A" ? state.jdData.title : state.careerB.title;
  const transcript = state.messages.map(m => `${m.role === "user" ? "USER" : setup.stakeholderName}: ${m.content}`).join("\n");

  const sys = `You are playing ${setup.stakeholderName} (${setup.stakeholderRole}) in a focused workplace simulation.
The user is a ${roleName} working on "${p.title}".
Business Context: ${p.businessContext}
Objective: ${p.objective}
Rubric criteria being assessed: ${p.rubric.join(" | ")}
Current user turn: ${state.turnCount} of ${state.maxTurns}.

CRITICAL PACING & CONVERSATION RULES:
1. Stay in character as ${setup.stakeholderName}. Keep your response natural, concise, and realistic (2 to 3 sentences max).
2. Ask ONLY ONE single question per turn. Never bundle multiple questions in the same reply.
3. Never use em dashes.
4. Guide the conversation step-by-step toward a clear decision or agreement.
5. Only set "isComplete": true if state.turnCount >= 5 AND the user has addressed the core problem and proposed a concrete next step (or if state.turnCount >= ${state.maxTurns}).

Return ONLY valid JSON:
{
  "reply": "Your in-character 2-3 sentence response ending with at most ONE question",
  "isComplete": boolean
}`;

  const res = await callGeminiJSON(sys, `Conversation:\n${transcript}`);
  const fallbackReplies = [
    "That is a fair point about looking at the numbers first. Which specific metric from our brief gives you the most confidence that this is our primary bottleneck?",
    "I see how that impacts the timeline. How would you structure a lightweight two-week pilot so we don't disrupt our broader quarterly commitments?",
    "That phased trade-off makes sense on paper. How should we handle stakeholder expectations if they push back on waiting for Phase 2?",
    "Good point on protecting our core guardrail metric. What specific success threshold should we check at the 14-day mark to decide if we scale this?",
    "That addresses my main concern and gives us a clear, low-risk path forward. Let's lock in that plan and share the summary with the team."
  ];
  const reply = (res && res.reply)
    ? cleanText(res.reply)
    : fallbackReplies[Math.min(state.turnCount - 1, fallbackReplies.length - 1)];

  const isComplete = ((res && res.isComplete) && isEndDebriefUnlocked()) || state.turnCount >= state.maxTurns;

  state.messages.push({ role: "assistant", content: reply });
  renderMessagesList();

  sendBtn.disabled = false;
  sendBtn.textContent = "Send Response";

  if (isComplete) {
    if (endBtn) endBtn.style.display = "inline-flex";
    const streamEl = document.getElementById("chatStream");
    const doneBanner = document.createElement("div");
    doneBanner.className = "card-compact";
    doneBanner.style.cssText = "background:var(--emerald-soft); border-color:var(--emerald-border); margin-top:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;";
    doneBanner.innerHTML = `
      <span style="font-size:0.92rem; color:var(--emerald); font-weight:600;">You have reached a natural conclusion to this meeting. Ready for your evidence-based debrief?</span>
      <button type="button" class="btn-primary btn-sm" onclick="finishAndDebrief()">View AI Debrief</button>
    `;
    streamEl.appendChild(doneBanner);
    streamEl.scrollTop = streamEl.scrollHeight;
  }
};

/* ============================================================================
   SCREEN 5: VISUAL, SCANNABLE AI DEBRIEF
   ============================================================================ */
window.finishAndDebrief = async function() {
  state.screen = "debrief";
  updateTopBar(4);

  renderLoader("Generating your evidence-based debrief...", "Evaluating your conversation against the 4-level competency rubric.");

  const p = state.project;
  const setup = state.activeSetup;
  const roleName = state.path === "A" ? state.jdData.title : state.careerB.title;
  const transcript = state.messages.map((m, i) => `[Turn ${i + 1}] ${m.role === "user" ? "USER" : setup.stakeholderName}: ${m.content}`).join("\n");
  const supportSummary = state.supportHistory.length === 0
    ? "0 hints used (100% independent)."
    : `Highest hint level used: Level ${state.maxHintLevelUsed} of 5 (${state.supportHistory.map(s => s.label).join(", ")}).`;

  const sys = `You are an objective, encouraging workplace assessor generating a concise visual debrief.
Evaluate the user's conversation against these exact predefined competencies:
${p.rubric.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Assign one of these 4 exact levels to each competency:
- "Demonstrated Independently" (Shown clearly without hints/modeling)
- "Demonstrated with Support" (Shown after Level 1-3 hints/options)
- "Demonstrated after Modeling" (Adapted after Level 4-5 example/model answer)
- "Not Yet Demonstrated" (Not observed in this session or insufficient evidence)

Never use em dashes.
Return ONLY valid JSON:
{
  "summary": "2-3 warm, specific sentences summarizing what the user did well and how independently they performed.",
  "evaluations": [
    {
      "competency": "Exact rubric criterion string",
      "level": "Demonstrated Independently" | "Demonstrated with Support" | "Demonstrated after Modeling" | "Not Yet Demonstrated",
      "quote": "Short verbatim quote from USER in transcript, or 'Not yet observed in this session'",
      "explanation": "1 concise sentence explaining how the user's action relates to the criterion."
    }
  ],
  "recommendations": [
    "1st concrete, actionable recommendation to try on the next attempt",
    "2nd concrete, actionable recommendation to try on the next attempt"
  ]
}`;

  const parsed = await callGeminiJSON(sys, `Role: ${roleName}\nProject: ${p.title}\nSupport Used: ${supportSummary}\nTranscript:\n${transcript}`);

  const userMsgs = state.messages.filter(m => m.role === "user");
  const fallbackQuote = userMsgs.length ? `"${userMsgs[0].content.slice(0, 95)}..."` : "Not yet observed in this session.";
  const fallbackLevel = userMsgs.length === 0
    ? "Not Yet Demonstrated"
    : (state.maxHintLevelUsed === 0 ? "Demonstrated Independently" : (state.maxHintLevelUsed <= 3 ? "Demonstrated with Support" : "Demonstrated after Modeling"));

  const debrief = (parsed && parsed.evaluations && parsed.evaluations.length) ? parsed : {
    summary: userMsgs.length > 0
      ? `You stepped into the ${roleName} role and addressed ${setup.stakeholderName}'s core pushback directly. ${state.maxHintLevelUsed === 0 ? "You navigated the scenario completely independently without using hints." : `You productively integrated Level ${state.maxHintLevelUsed} coaching support to structure your recommendation.`}`
      : `You explored the simulation room but ended the session early. Complete 5 to 6 exchanges with ${setup.stakeholderName} on your retry to unlock full behavioral evidence.`,
    evaluations: p.rubric.map((crit, idx) => ({
      competency: crit,
      level: idx < userMsgs.length ? fallbackLevel : "Not Yet Demonstrated",
      quote: idx < userMsgs.length ? fallbackQuote : "No direct conversational evidence recorded in this session.",
      explanation: idx < userMsgs.length
        ? `Demonstrated during your dialogue with ${setup.stakeholderName}${state.maxHintLevelUsed > 0 ? ` using Level ${state.maxHintLevelUsed} support` : " independently"}.`
        : "Try explicitly addressing this behavior in your next practice run."
    })),
    recommendations: [
      `Anchor your opening response on a specific data point from the project brief before proposing a solution.`,
      `Frame your proposed solution as a low-risk pilot that directly addresses ${setup.stakeholderName}'s urgency.`
    ]
  };

  state.lastDebrief = debrief;
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
  renderDebriefScreen(debrief);
};

function getRubricStyle(level) {
  const l = (level || "").toLowerCase();
  if (l.includes("independently")) {
    return { badge: "badge-emerald", segCount: 4, segClass: "active-emerald", label: "Demonstrated Independently" };
  }
  if (l.includes("support")) {
    return { badge: "badge-teal", segCount: 3, segClass: "active-teal", label: "Demonstrated with Support" };
  }
  if (l.includes("modeling")) {
    return { badge: "badge-amber", segCount: 2, segClass: "active-amber", label: "Demonstrated after Modeling" };
  }
  return { badge: "badge-neutral", segCount: 1, segClass: "active-neutral", label: "Not Yet Demonstrated" };
}

function renderDebriefScreen(d) {
  const p = state.project;

  app.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:12px;">
      <div>
        <div class="eyebrow">AI Debrief : Attempt #${state.attemptNum}</div>
        <h1 class="hero-title" style="font-size:clamp(1.65rem, 3vw, 2.2rem); margin-bottom:0;">${cleanText(p.title)}</h1>
      </div>
      <span class="badge ${state.maxHintLevelUsed === 0 ? 'badge-emerald' : 'badge-amber'}">
        ${state.maxHintLevelUsed === 0 ? "0 Hints Used : Independent Run" : `Coaching Support Used: Level ${state.maxHintLevelUsed} of 5`}
      </span>
    </div>

    <!-- 1. Executive Summary Card -->
    <div class="card-compact" style="margin-bottom:24px;">
      <div style="font-size:0.82rem; font-weight:700; text-transform:uppercase; color:var(--primary); margin-bottom:6px;">
        Performance Summary
      </div>
      <p style="font-size:1rem; color:var(--ink); margin:0;">${cleanText(d.summary)}</p>
    </div>

    <!-- 2. Visual 4-Level Competency Rubric Cards -->
    <div style="margin-bottom:24px;">
      <h2 class="section-title">Competency Rubric & Conversation Evidence</h2>
      <p class="section-desc">Rated at the highest level of support-independent performance you demonstrated in the conversation.</p>

      ${(d.evaluations || []).map(ev => {
        const st = getRubricStyle(ev.level);
        const segs = [1, 2, 3, 4].map(n => `<div class="seg ${n <= st.segCount ? st.segClass : ''}"></div>`).join("");
        return `
          <div class="rubric-card">
            <div class="rubric-top">
              <div style="font-weight:700; font-size:1rem; color:var(--ink); flex:1;">${cleanText(ev.competency)}</div>
              <span class="badge ${st.badge}">${st.label}</span>
            </div>
            <div class="segment-bar">${segs}</div>
            <div class="quote-box">Evidence: ${cleanText(ev.quote)}</div>
            <div style="font-size:0.95rem; color:var(--ink-secondary);">${cleanText(ev.explanation)}</div>
          </div>
        `;
      }).join("")}
    </div>

    <!-- 3. High-Priority Next Step Box -->
    <div class="card" style="background:var(--primary-soft); border-color:var(--primary-border);">
      <div style="font-size:0.85rem; font-weight:700; text-transform:uppercase; color:var(--primary); margin-bottom:8px;">
        High-Priority Focus for Your Next Practice
      </div>
      <ul style="margin:0 0 20px; padding-left:20px; color:var(--ink); font-size:1rem;">
        ${(d.recommendations || []).map(r => `<li style="margin-bottom:6px;"><strong>${cleanText(r)}</strong></li>`).join("")}
      </ul>

      ${state.path === "B" && state.careerB ? `
        <div style="padding-top:14px; border-top:1px solid var(--primary-border); margin-bottom:18px;">
          <span style="font-size:0.9rem; font-weight:700; color:var(--ink-secondary); margin-right:8px;">Related Careers to Explore:</span>
          ${(state.careerB.relatedCareers || []).map(rc => `<span class="tag" style="background:#FFF;">${cleanText(rc)}</span>`).join("")}
        </div>
      ` : ""}

      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <button type="button" class="btn-primary" onclick="startSimulation(true)">Retry with New Twist (Apply Feedback)</button>
        <button type="button" class="btn-secondary" onclick="${state.path === 'A' ? 'renderPathAOverview()' : 'renderCareerDetailViewB()'}">Try Another Project</button>
        <button type="button" class="btn-ghost" onclick="goHome()">Back to Home</button>
      </div>
    </div>
  `;
}

// Initialize Home Screen (match prototype HTML — gate only when entering a path)
renderHome();

})();
