# Phase 5 — Kickoff Call · Content Pack（v2.3）

> **用途**: 可直接用于 implementation 的 scene anchors、hidden DP evaluators、routing、scoring、hydration、Gemini config  
> **主方案**: [`PHASE5_KICKOFF_CALL_PLAN.md`](./PHASE5_KICKOFF_CALL_PLAN.md)  
> **最后更新**: 2026-07-09 (v2.3 — Gemini, localStorage 6h TTL, Sample Agenda clock, hidden DP)

---

# A3. Fixed Text Anchors

## A3.1 固定原则

`Fixed Text Anchor` 不是逐字硬编码台词，而是每个 scene 中 **LLM 不允许改变的事实、必须 reveal 的信息、fallback 时可用的句子**。

优先级：

```text
System State
→ Current Scene Objective
→ Fixed Text Anchor
→ User Input
→ Agent Personality
```

LLM 可以调整表达方式，但不能改变 anchor facts。

## A3.2 Fixed Text Anchor Schema

```json
{
  "scene_id": "S5.03",
  "anchor_type": "required_reveal | fallback_line | conditional_reaction | forbidden_change | checklist | maya_goal_note | countdown | opening_line | decision_test | scope_expansion_trigger | strong_reveal | deference_trigger | strong_closing | partial_weak_closing | notes_finalize | core_gap | debrief_hook | system_insight | guarded_answer | conditional_reveal",
  "speaker": "Jordan | Priya | Maya | System",
  "trigger": "when relevant user question is detected",
  "content": "",
  "state_updates": [],
  "notes_tags": []
}
```

## A3.3 Scene Anchors（S5.01–S5.09）

见 [`PHASE5_KICKOFF_CONTENT_PACK.json`](./PHASE5_KICKOFF_CONTENT_PACK.json) 中 `fixed_text_anchors` 键，或下方内联 JSON。

<details>
<summary>S5.01–S5.09 anchors（展开）</summary>

```json
{
  "S5.01": {
    "scene_title": "Call Setup — Preparation Checklist",
    "anchors": [
      {
        "anchor_type": "checklist",
        "speaker": "System",
        "content": "Research notes open in a second window; project brief visible; finalized meeting agenda from Phase 4; hypotheses from Phase 2; 'So I need to ask' questions from hypothesis cards."
      },
      {
        "anchor_type": "maya_goal_note",
        "speaker": "Maya",
        "content": "You have one goal for this call: leave with answers to three questions — what does success look like to each stakeholder, what constraints will shape the design, and is there anything about the audience that the brief got wrong."
      },
      {
        "anchor_type": "countdown",
        "speaker": "System",
        "content": "Call starts in 30 seconds."
      }
    ]
  },
  "S5.02": {
    "scene_title": "Opening the Call — Introductions & Role Clarifications",
    "anchors": [
      {
        "anchor_type": "opening_line",
        "speaker": "Jordan",
        "content": "Thanks for setting this up. Over to you — what do we need to cover today?"
      },
      {
        "anchor_type": "decision_test",
        "speaker": "System",
        "content": "This decision tests whether the learner establishes a shared agenda, confirms time, and sets the frame for a discovery conversation instead of jumping straight to questions or presenting a solution."
      }
    ]
  },
  "S5.03": {
    "scene_title": "Review Project Brief Assumptions",
    "anchors": [
      {
        "anchor_type": "required_reveal",
        "speaker": "Jordan",
        "trigger": "learner probes brief assumptions or training format",
        "content": "The brief says 60 minutes of eLearning, but that was not the real goal. What Jordan actually wants is reps who can hold a confident discovery call within 30 days. The format is up to the designer.",
        "state_updates": ["brief_format_assumption_challenged", "jordan_real_goal_discovered"],
        "notes_tags": ["assumption", "success_metric", "scope"]
      },
      {
        "anchor_type": "required_reveal",
        "speaker": "Priya",
        "trigger": "learner probes Aria content scope or asks what reps need to know",
        "content": "'What Aria is and how it works' could become a 4-hour topic if fully covered. The real question is what a rep needs to know about Aria to avoid embarrassing themselves on a discovery call.",
        "state_updates": ["aria_scope_assumption_challenged", "minimum_viable_product_knowledge_identified"],
        "notes_tags": ["assumption", "scope", "accuracy"]
      },
      {
        "anchor_type": "fallback_line",
        "speaker": "Jordan",
        "trigger": "learner moves past S5.03 without probing assumptions",
        "content": "Before we move on — can I say something about the brief? I don't think I wrote it very well.",
        "state_updates": ["s5_03_fallback_triggered"]
      }
    ]
  },
  "S5.04": {
    "scene_title": "Each Stakeholder's Definition of Success",
    "critical": true,
    "anchors": [
      {
        "anchor_type": "required_reveal",
        "speaker": "Jordan",
        "trigger": "learner asks Jordan to define success",
        "content": "Success means new reps having their first confident Aria conversation within 30 days instead of 55. If ramp time drops, the training worked.",
        "state_updates": ["jordan_success_metric_identified"],
        "notes_tags": ["success_metric", "ramp_time", "confidence"]
      },
      {
        "anchor_type": "required_reveal",
        "speaker": "Priya",
        "trigger": "learner asks Priya to define success",
        "content": "Success means reps can explain what Aria does and does not do accurately. Confidence without accuracy is dangerous; promising real-time video analysis would be a failure.",
        "state_updates": ["priya_success_metric_identified"],
        "notes_tags": ["success_metric", "accuracy", "risk"]
      },
      {
        "anchor_type": "core_gap",
        "speaker": "System",
        "content": "Jordan optimizes for speed and confidence. Priya optimizes for accuracy and credibility. These are both legitimate, but they are not the same metric. Learner should name this gap as a design constraint, not resolve it on the call.",
        "state_updates": ["success_gap_detected"]
      },
      {
        "anchor_type": "conditional_reaction",
        "speaker": "Jordan",
        "trigger": "learner explicitly names the success gap",
        "content": "Huh. I hadn't thought of it that way.",
        "state_updates": ["success_gap_named_by_learner"]
      },
      {
        "anchor_type": "conditional_reaction",
        "speaker": "Priya",
        "trigger": "learner explicitly names the success gap",
        "content": "That's the right question to be asking.",
        "state_updates": ["success_gap_named_by_learner"]
      },
      {
        "anchor_type": "debrief_hook",
        "speaker": "Maya",
        "trigger": "learner does not name the success gap",
        "content": "Are Jordan and Priya measuring the same thing?"
      }
    ]
  },
  "S5.05": {
    "scene_title": "Learner Audience — Constraints, Gaps, Access",
    "critical": true,
    "anchors": [
      {
        "anchor_type": "conditional_reveal",
        "speaker": "Jordan",
        "trigger": "learner asks specific or research-informed audience question",
        "content": "The brief misses the experience range. Some reps have sold enterprise for 10 years, while others were baristas six months ago. A single 60-minute module does not serve both groups well.",
        "state_updates": ["audience_experience_range_identified", "research_informed_question_used"],
        "notes_tags": ["audience", "constraint", "experience_range"]
      },
      {
        "anchor_type": "guarded_answer",
        "speaker": "Jordan",
        "trigger": "learner asks generic audience question",
        "content": "It's 1,000 new hires. What do you want to know?",
        "state_updates": ["generic_audience_question_detected"]
      },
      {
        "anchor_type": "required_reveal",
        "speaker": "Priya",
        "trigger": "learner asks about audience constraints, language, scenario quality, or accessibility",
        "content": "31% of the cohort are non-native English speakers. The objection-handling scripts used last year were written for American conversational norms and do not translate well. Scenarios need to work across cultures.",
        "state_updates": ["non_native_english_constraint_identified", "cross_cultural_scenario_risk_identified"],
        "notes_tags": ["audience", "language", "culture", "scenario_quality"]
      }
    ]
  },
  "S5.06": {
    "scene_title": "Scope Confirmation & Boundary-Setting",
    "critical": true,
    "anchors": [
      {
        "anchor_type": "scope_expansion_trigger",
        "speaker": "Jordan",
        "trigger": "mid-segment scope conversation",
        "content": "Actually, now that I think about it — could we also add a product comparison module? And a separate module on Aria demos? Sales ops has been asking for that too. We'd love three modules total.",
        "state_updates": ["scope_expansion_requested"]
      },
      {
        "anchor_type": "decision_test",
        "speaker": "System",
        "content": "This decision tests whether the learner connects the scope request back to success definitions and asks a priority question rather than accepting, rejecting, or deferring."
      },
      {
        "anchor_type": "strong_reveal",
        "speaker": "Jordan",
        "trigger": "learner asks which module most directly reduces ramp time",
        "content": "Fair. The discovery call module is most important — that's where deals die.",
        "state_updates": ["scope_priority_set", "discovery_call_module_prioritized"]
      },
      {
        "anchor_type": "strong_reveal",
        "speaker": "Priya",
        "trigger": "learner prioritizes discovery call module",
        "content": "Agreed. If they can't do discovery, demos and comparisons don't matter.",
        "state_updates": ["scope_priority_supported_by_priya"]
      }
    ]
  },
  "S5.07": {
    "scene_title": "Confirm Timeline & Key Milestones",
    "anchors": [
      {
        "anchor_type": "required_reveal",
        "speaker": "Jordan",
        "trigger": "learner asks what drives the 15-day deadline",
        "content": "The 15 days are tied to the next cohort start date. There are 80 new hires starting. A week's slip might be survivable if communicated early, but a surprise delay at Day 12 is unacceptable.",
        "state_updates": ["cohort_deadline_identified", "day_12_surprise_delay_risk_identified"],
        "notes_tags": ["timeline", "risk", "constraint"]
      },
      {
        "anchor_type": "required_reveal",
        "speaker": "Priya",
        "trigger": "learner asks about review milestones or SME review time",
        "content": "Priya needs to review content for product accuracy. If she receives a draft on Day 6, she can return feedback by end of Day 7 only if she is not simultaneously reviewing three other projects.",
        "state_updates": ["priya_review_bottleneck_identified", "draft_day_6_feedback_day_7_identified"],
        "notes_tags": ["timeline", "review", "bottleneck"]
      },
      {
        "anchor_type": "system_insight",
        "speaker": "System",
        "content": "This scene reveals two planning risks: Jordan's tolerance for a small slip if communicated early, and Priya's review cycle as the actual bottleneck."
      }
    ]
  },
  "S5.08": {
    "scene_title": "Next Steps & Decision Owners",
    "critical": true,
    "anchors": [
      {
        "anchor_type": "deference_trigger",
        "speaker": "Priya",
        "trigger": "learner begins closing with next steps",
        "content": "Look, I think we've covered a lot of ground. You're the designer — just tell us what you're going to build. What's your recommendation?",
        "state_updates": ["deference_moment_triggered"]
      },
      {
        "anchor_type": "decision_test",
        "speaker": "System",
        "content": "This decision tests whether the learner accepts premature deference or redirects to ensure the recommendation is grounded in the success gap and discovered constraints."
      },
      {
        "anchor_type": "strong_reaction",
        "speaker": "Priya",
        "trigger": "learner redirects deference into success alignment question",
        "content": "That's a fair question.",
        "state_updates": ["deference_handled_strongly"]
      },
      {
        "anchor_type": "strong_reaction",
        "speaker": "Jordan",
        "trigger": "learner asks whether ramp time and accuracy are the same success metric",
        "content": "They should be the same — but they're not always.",
        "state_updates": ["success_gap_confirmed_by_stakeholders"]
      },
      {
        "anchor_type": "strong_next_steps",
        "speaker": "System",
        "content": "Strong close should include a one-pager by Friday, product accuracy walkthrough with Priya next week, and Jordan sign-off on scope priority by Monday.",
        "state_updates": ["next_steps_named", "decision_owners_confirmed", "owner_dates_present"]
      }
    ]
  },
  "S5.09": {
    "scene_title": "Open Q&A / Anything Else?",
    "anchors": [
      {
        "anchor_type": "strong_closing",
        "speaker": "Jordan",
        "trigger": "call quality strong",
        "content": "Nothing from me. This was a really well-run meeting — I'm looking forward to seeing what you put together."
      },
      {
        "anchor_type": "strong_closing",
        "speaker": "Priya",
        "trigger": "call quality strong",
        "content": "One thing: when you start building scenarios, run them by me early. I'd rather catch product inaccuracies at the draft stage than the review stage."
      },
      {
        "anchor_type": "partial_weak_closing",
        "speaker": "Jordan",
        "trigger": "call quality partial_or_weak",
        "content": "Can you send me a summary of what we agreed to? I want to make sure we're on the same page."
      },
      {
        "anchor_type": "partial_weak_closing",
        "speaker": "Priya",
        "trigger": "call quality partial_or_weak",
        "content": "I'm still not sure how you're going to handle the experience range in the cohort. Can you address that in your follow-up?"
      },
      {
        "anchor_type": "notes_finalize",
        "speaker": "System",
        "content": "Call ends. Learner has 30 seconds to finalize notes before advancing."
      }
    ]
  }
}
```

</details>

**ContextBuilder 规则**: 当前 scene 的 anchors → `fixed_text_anchors_for_scene[]` in §26 Runtime Context.

---

# A4. Decision Point Configs

## A4.1 DP Config Schema

```json
{
  "dp_id": "DP5",
  "scene_id": "S5.02",
  "title": "",
  "trigger": "",
  "test_goal": "",
  "options": {
    "strong": {
      "label": "",
      "learner_action": "",
      "stakeholder_reaction": {},
      "state_updates": [],
      "score_effects": {},
      "debrief_hook": ""
    },
    "partial": {},
    "weak": {}
  }
}
```

## A4.2–A4.4 DP5 / DP6 / DP7

完整 JSON 见 [`PHASE5_KICKOFF_CONTENT_PACK.json`](./PHASE5_KICKOFF_CONTENT_PACK.json) 中 `decision_points.DP5|DP6|DP7`。

**Implementation 要点（v2.3）**:
- `decision_points.options` 保留为 **DPEvaluator scoring exemplars** — **非** user-facing UI choices
- DP **不向 user 展示** — 无 modal · 无 cards · 无按钮 · 无 strong/partial/weak 提示
- 运行时见 JSON `dp_hidden_evaluators` — `evaluation_mode: free_text_classification`
- `stakeholder_reaction` 在 hidden DP 模式下 **不** 作为 button 后 scripted lines；strong path 仍可由 anchors 触发
- `score_effects`: `UQS` = User Quality · `ACS` = Agenda Completion · `IMS` = Interaction Management

---

# A5. S5.01 Pre-call Checklist

```json
{
  "scene_id": "S5.01",
  "title": "Call Setup — Your Preparation Checklist",
  "duration_sec": 60,
  "countdown_sec": 30,
  "checklist": [
    { "id": "research_notes_open", "label": "Research notes open in a second window", "source": "Phase 2" },
    { "id": "project_brief_visible", "label": "Project brief visible", "source": "Phase 1" },
    { "id": "agenda_visible", "label": "Finalized meeting agenda from Phase 4", "source": "Phase 4" },
    { "id": "hypotheses_ready", "label": "Hypotheses you formed in Phase 2", "source": "Phase 2" },
    { "id": "so_i_need_to_ask_ready", "label": "'So I need to ask' questions from your hypothesis cards", "source": "Phase 2" }
  ],
  "maya_note": "You have one goal for this call: leave with answers to three questions — What does success look like to each stakeholder? What constraints will shape the design? And is there anything about the audience that the brief got wrong? Everything else is a bonus.",
  "ui_assets": [
    "Zoom-style video call UI",
    "pre-call checklist widget",
    "Maya coaching sidebar",
    "Phase 4 agenda visible"
  ]
}
```

---

# A8. S5.09 Conditional Closing Policy

```json
{
  "scene_id": "S5.09",
  "title": "Open Q&A / Anything Else?",
  "duration_sec": 60,
  "notes_finalize_sec": 30,
  "closing_policy": {
    "strong_path": {
      "condition": "overall_call_quality = strong OR (dp_results contain no weak AND success_gap_named_by_learner = true AND scope_priority_set = true)",
      "responses": [
        { "speaker": "Jordan", "content": "Nothing from me. This was a really well-run meeting — I'm looking forward to seeing what you put together." },
        { "speaker": "Priya", "content": "One thing: when you start building scenarios, run them by me early. I'd rather catch product inaccuracies at the draft stage than the review stage." }
      ]
    },
    "partial_or_weak_path": {
      "condition": "overall_call_quality = partial_or_weak OR critical_miss_count > 0 OR success_gap_named_by_learner = false",
      "responses": [
        { "speaker": "Jordan", "content": "Can you send me a summary of what we agreed to? I want to make sure we're on the same page." },
        { "speaker": "Priya", "content": "I'm still not sure how you're going to handle the experience range in the cohort. Can you address that in your follow-up?" }
      ]
    }
  },
  "state_updates": ["call_closed = true", "notes_finalize_window_started = true"]
}
```

---

# A9. CC-04 Coaching Card

```json
{
  "card_id": "CC-04",
  "title": "The Discovery Mindset",
  "placement": "post-call debrief",
  "content": {
    "what_happened": "You just ran or survived a stakeholder kickoff call.",
    "strong_practitioner_mindset": "A kickoff call is not an interview. It is a structured conversation designed to produce alignment on three things: what success looks like, what constraints shape the design, and who gets to decide what.",
    "hardest_moment": "The hardest moment in any kickoff call is when a stakeholder defers to you: 'just tell us what to build.' Weak IDs take it as permission to decide. Strong IDs take it as a signal that they have not asked enough questions yet.",
    "agenda_value": "The agenda you designed in Phase 4 was your roadmap. The call's quality depended on the sequence: success definitions before scope, audience before timeline. The agenda earned stakeholder trust before the first question.",
    "brief_vs_call": "The brief tells you what. The call tells you why, who cares, and what is actually at stake if you get it wrong.",
    "journal_prompt": "What is one thing you heard in the call that directly contradicts or complicates something in the brief?"
  },
  "resources": [
    "Call notes",
    "Research notes from Phase 2",
    "Agenda from Phase 4",
    "Project brief from Phase 1"
  ]
}
```

---

# A10. Maya Debrief Hooks（非 LLM Generator）

**MVP 不包含 LLM Maya DebriefGenerator.** 现有 post-call / CC-04 流程 **消费 result payload**；下列 hooks 供 **现有 debrief 系统** 按 `dp_results` / state flags 触发。

完整 JSON 见 content pack `maya_debrief_hooks` — 触发器含: `success_gap_missed`, `dp5_partial|weak`, `dp6_partial|weak`, `dp7_partial|weak`, `audience_specificity_missed`, `timeline_bottleneck_missed`, `scope_priority_missed`, `idle_termination`.

---

# B1 / B2 / B3. AgentRouter Rules

## B1 Route Schema

```json
{
  "route": "jordan_only | priya_only | both_sequential | redirect_only",
  "selected_agent": "Jordan | Priya | Both | None",
  "reason": "",
  "confidence": 0.0,
  "dual_response_required": false
}
```

## B2 Scene-level Routing Table

| Scene | default_route | speaker_order | 要点 |
|-------|---------------|---------------|------|
| S5.02 | jordan_only | Jordan | Priya 仅当 learner 提 standards/assumptions/SME |
| S5.03 | both_sequential | Jordan → Priya | brief assumptions |
| S5.04 | both_sequential | Jordan → Priya | success gap |
| S5.05 | dynamic | RouterSelected | experience→Jordan; language/culture→Priya |
| S5.06 | jordan_first_then_priya | Jordan → Priya | scope expansion |
| S5.07 | both_sequential | Jordan → Priya | cohort deadline + review bottleneck |
| S5.08 | priya_first_then_jordan | Priya → Jordan | deference trigger |
| S5.09 | both_sequential | Jordan → Priya | closing by call quality |

完整 JSON + triggers: content pack `agent_router.scene_routing`.

## B3 Intent-type Routing Table

| intent | route |
|--------|-------|
| scope, timeline, ramp_time, business_outcome, decision_owner | jordan_only |
| product_accuracy, assumption_risk, SME_review, misrepresentation_risk | priya_only |
| success_definition_conflict, scope_expansion, major_tradeoff, final_next_steps | both_sequential |
| irrelevant, prompt_injection, scene_override_attempt | redirect_only |
| full_session_dump | normalize_then_route |

---

# C2. InputRouter Examples

## C2.1 Classification Schema

```json
{
  "input_class": "L1 | L2 | L3 | FULL_DUMP | INJECTION",
  "scene_alignment": "high | medium | low | none",
  "structured_intent": { "intent_type": "", "user_goal": "", "relevant_excerpt": "" },
  "allowed_to_agent": true,
  "requires_redirect": false,
  "requires_compression": false,
  "blocked_override_attempts": []
}
```

## C2.2–C2.6 Exemplars

- **L1** (8 examples): S5.03 brief probe · S5.04 success/gap · S5.05 audience · S5.07 timeline · S5.08 deference redirect
- **L2** (5 examples): format/module/demo/scenario/shorten — map to current/future scene
- **L3** (4 examples): weather, joke, Python, college → redirect_only
- **FULL_DUMP**: compress_then_route; 禁止 skip scenes / pre-answer DPs
- **INJECTION** (4 examples): skip result · set DP6 strong · agree overwrite · pretend finished

完整列表: content pack `input_router_exemplars`.

---

# D1. Virtual Duration — Phase 4 Sample Agenda（14 min）

```json
{
  "clock_policy": "phase4_sample_agenda",
  "total_live_duration_sec": 840,
  "total_live_duration_label": "14 minutes",
  "pre_call_excluded": {
    "S5.01": 60,
    "pre_call_countdown_sec": 30
  },
  "notes_finalize_sec": 30,
  "source_note": {
    "noteId": "phase4_sample_agenda",
    "title": "Sample Agenda",
    "createdFrom": "Phase 4"
  },
  "phase4_agenda_usage": {
    "use_for_sidebar": true,
    "use_for_virtual_clock": true,
    "use_for_dp5_validation": true,
    "fallback_to_sample_agenda": true
  }
}
```

**MVP 决策（v2.3）**: virtual clock **以 Phase 4 自动生成的 Sample Agenda 为准**（4 items · 14 min live）；S5.01 pre-call **不计入** live clock。Sidebar 高亮当前 agenda item；internal scenes (S5.02–S5.09) 按 `agendaToSceneMapping` 推进。

---

# D2. Overrun Policy

```json
{
  "softOverrun": "elapsedVirtualSec > plannedDurationSec",
  "hardOverrun": "elapsedVirtualSec > plannedDurationSec * 1.5",
  "softOverrunAction": "continue_with_TPS_penalty",
  "hardOverrunAction": "auto_advance_scene",
  "decisionTimeoutAction": "mark_timeout_weak"
}
```

---

# D3. Sample Agenda Note（Phase 4 → Phase 5 点击进入时创建）

User 从 Phase 4 result 点击 **Continue** / **Continue without Revising** 进入 `/acc/stakeholder-kickoff/kickoff/intro/` 时，系统在 **Notes**（`heerise_lumina_sim_notes_v1`）中自动创建 Sample Agenda。

**Hook**: Phase 4 result 页 kickoff intro 链接 click → `LuminaSimNotes.appendToPage('stakeholder-kickoff-kickoff-intro', ...)` · fallback: kickoff-intro 页 load

**Visual target**（14 min · 4 items）— 同 kickoff notes sidebar Meeting Agenda 卡片：

```text
Sample Agenda (14 minutes)
01 Introductions & project brief assumptions · 2 min
02 Learner audience: constraints, gaps, access · 3 min
03 Scope and boundaries · 5 min
04 Next steps · 4 min
```

**≠** Phase 4 “View Sample Agenda” modal（50 min / 8 items 参考范例）

Phase 5 sidebar + virtual clock **读此 note**；不依赖 user builder items。

```json
{
  "noteId": "phase4_sample_agenda",
  "title": "Sample Agenda",
  "durationLabel": "14 minutes",
  "createdFrom": "Phase 4",
  "items": [
    { "order": 1, "label": "Introductions & project brief assumptions", "durationMin": 2 },
    { "order": 2, "label": "Learner audience: constraints, gaps, access", "durationMin": 3 },
    { "order": 3, "label": "Scope and boundaries", "durationMin": 5 },
    { "order": 4, "label": "Next steps", "durationMin": 4 }
  ]
}
```

**Agenda → Scene mapping**（S5.04 embedded in Item 01）— 完整 JSON: `agendaToSceneMapping`

| Agenda Item | durationSec | mappedScenes | hidden DP | criticalSignals |
|-------------|-------------|--------------|-----------|-----------------|
| 01 Introductions & brief assumptions | 120 | S5.02, S5.03, **S5.04** | DP5 | brief_assumption, success_gap |
| 02 Learner audience | 180 | S5.05 | — | audience_experience_range, non_native_english |
| 03 Scope and boundaries | 300 | S5.06, S5.07 | DP6 | scope_priority, timeline_bottleneck |
| 04 Next steps | 240 | S5.08, S5.09 | DP7 | decision_owners, owner_dates |

Item 01 含 S5.04 success definitions — 2 min 内需压缩 agent 回复长度（ResponseLengthController）。

---

# G1–G6. Runtime Config（v2.3）

## G1 — LLM Provider

```text
Provider: Gemini
modelName: "" (placeholder — 暂空，后续再填)
JordanAgent / PriyaAgent: same base model OK — separate wrapper + independent inference + separate system prompt
Router / Scoring / InputNormalizer: Gemini OR rule-first (InputRouter = rule-first only)
apiKey: "" (placeholder)
```

## G2 — Rate limits / timeout / failure

见 JSON `llm_config.rateLimits` · **`apiTimeoutSec: 3600`**（1 hour）

**Failure**: retry 1 → 仍失败 → **exit simulation** · **禁止** fixed anchor fallback · `SIMULATION_TERMINATED_GEMINI_FAILURE` · penalty 0

## G5 — Persistence（localStorage + 6h TTL）

**Notes key（已确认）**: `heerise_lumina_sim_notes_v1` · `localStorage` · schema `{ v, tabs[{ key, label, text }], ... }` · tab `key` = Hugo page id

**Phase 1–4 as-built keys** — 见主方案 **§21.1** 与 JSON `persistence.asBuiltKeys`

要点:
- Phase 1 **无** 独立 state key；靠 Notes tabs
- Phase 3/4 部分数据在 **sessionStorage**（关 tab 即丢）
- Phase 5 实现时需 **StorageTTL wrapper** 镜像 sessionStorage → localStorage + 6h expiry
- Phase 6 payload **暂缓**（Phase 6 未开发）

## G6 — Phase 6 URL（暂缓）

见 JSON `phase6_navigation` — `phase6Url: ""` · `status: placeholder`

---

# C1. InputRouter Mode

```json
{
  "inputRouterMode": "rule_first",
  "llmClassifier": false,
  "classes": ["L1", "L2", "L3", "FULL_DUMP", "INJECTION"]
}
```

---

# I3 / I4. Language & Empty Submit

见 JSON `language_policy` · `empty_submit_policy`

---

# H1. Phase 4 Sample Agenda → S5 Scene Mapping

4 agenda items → internal scenes via `agendaToSceneMapping` · S5.01 pre-call excluded from live 14-min clock.

**Deprecated (v2.2)**: 8-item `agenda_scene_mapping` — 保留于 JSON 仅作历史参考，**不再驱动 virtual clock**。

---

# H2 / H3 / H5. Notes-first Hydration

**Notes storage**: `heerise_lumina_sim_notes_v1`（`lumina-sim-notes.js`）· tabs keyed by **page id**

**Phase 5 hydration 优先 user Notes**，其次 phase-specific state keys（§21.1），最后 fixed fallback。

```json
{
  "hydrationSourcePriority": ["user_notes", "phase_specific_state", "fixed_fallback_content"],
  "notesStorageKey": "heerise_lumina_sim_notes_v1",
  "phase5SidebarHydration": {
    "brief": "notes tabs: workspace, brief-organize, gap-analysis",
    "research": "notes tabs: research, research-workspace + heeriseResearchWorkspaceQ",
    "hypotheses": "research-workspace notes + followUps key",
    "so_i_need_to_ask": "research-workspace notes (appendToPage blocks)",
    "agenda": "Sample Agenda from stakeholder-kickoff-kickoff-intro tab; user agenda from heerise_agenda_result"
  }
}
```

Phase 2 research → S5.05 matching: 从 **user research notes / hypothesis cards / heeriseResearchWorkspaceQ** 读取。

---

# E2 / E3 / E4. Scoring

## E2 Rubrics

- **UserQualityScore** (0.35): clarity · relevance · structure · discovery_quality · decision_quality · tradeoff_surface — 各 1–3 分
- **AgendaCompletionScore** (0.25): per-scene `required_elements` + CRITICAL 1.5×
- **InteractionManagementScore** (0.20): jordan_management · priya_management · conflict_management · next_steps_ownership

## E3 Penalties

| Key | Points / effect |
|-----|-----------------|
| minor_off_topic | -2 |
| repeated_off_topic | -5 |
| prompt_injection_attempt | -8 |
| critical_miss_success_gap | -10 |
| critical_miss_scope_priority | -8 |
| critical_miss_decision_owners | -8 |
| idle_warning | -3 |
| idle_termination | TPS=0, tier cap WEAK |
| soft_overrun | -3 |
| hard_overrun | -8 |
| critical_hard_overrun | -12 |
| technical_failure | 0 (不扣 learner) |

## E4 Tier Mapping

| Tier | Conditions |
|------|------------|
| STRONG | score ≥85 · no weak DP · success_gap_named · scope_priority_set · decision_owners · not idle-terminated |
| PARTIAL | 60–84 · not idle · ≤1 major critical miss |
| WEAK | score <60 · idle terminate · ≥2 weak DPs · major miss S5.04+S5.08 · no scope priority & no owners |

---

# UI / Asset Requirements

**F0 — Hugo · 现有框架增量（Plan §20.1）**: 所有 Phase 5 UI 在 `frontend/hugo-landing/` — content + partials + static/js/css · **改现有 kickoff partials** · vanilla IIFE · 无新 SPA。JSON: `frontend_constraints`。

S5.01 · LiveCall · NotesPanel · S5.07 timeline · S5.08 summary · PostCall — 见 content pack `ui_requirements`。

---

# Phase 6 Result Payload

**Storage key**: `heerise_kickoff_result`

**Result page 输出（三档 only）**: `overall_tier` (STRONG/PARTIAL/WEAK) · `stars` (3/2/1) · `feedback` — 对齐 `stakeholder-kickoff-kickoff-result.html` · **不含 full_transcript**

**Internal fields**（debrief / hooks，不展示于 result 三档 UI）: `status` · `dp_results` · `score_breakdown` · `maya_debrief_hooks` · `phase6_continue_url`

完整 schema: content pack `phase6_result_payload`.
