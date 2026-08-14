/**
 * Phase 5 kickoff — state, input router, DP evaluator, agent router, scoring.
 */
(function (global) {
  "use strict";

  var C = global.HeeriseKickoffConstants;
  var store = global.HeeriseStorageTTL;

  function defaultState() {
    return {
      v: 1,
      current_scene: "S5.02",
      agenda_item_index: 0,
      status: "active",
      llm_calls: 0,
      empty_submit_streak: 0,
      dp_results: { DP5: null, DP6: null, DP7: null },
      success_gap_detected: false,
      success_gap_named_by_learner: false,
      scope_priority_set: false,
      decision_owners_confirmed: false,
      audience_experience_range_identified: false,
      non_native_english_constraint_identified: false,
      priya_review_bottleneck_identified: false,
      conversation_log: [],
      virtual_elapsed_sec: 0,
      scene_turns: {},
      _scene_entry_done: {},
      started_at: Date.now(),
    };
  }

  function loadState() {
    var s = store.getJSON(C.STATE_KEY);
    if (!s || s.v !== 1) return defaultState();
    return s;
  }

  function saveState(state) {
    store.setJSON(C.STATE_KEY, state);
  }

  function appendLog(state, entry) {
    state.conversation_log = state.conversation_log || [];
    state.conversation_log.push(Object.assign({ ts: Date.now() }, entry));
  }

  function stateTurns(state, scene) {
    state.scene_turns = state.scene_turns || {};
    return state.scene_turns[scene] || 0;
  }

  function bumpSceneTurn(state, scene) {
    state.scene_turns = state.scene_turns || {};
    state.scene_turns[scene] = (state.scene_turns[scene] || 0) + 1;
  }

  function classifyInput(text, scene) {
    var t = (text || "").trim();
    var lower = t.toLowerCase();
    if (!t) return { input_class: "EMPTY", allowed_to_agent: false };
    if (/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(t)) {
      return { input_class: "NON_ENGLISH", allowed_to_agent: false, requires_redirect: true };
    }
    if (/ignore (all )?previous|set dp\d|skip to (the )?result|pretend we (already )?finished/i.test(lower)) {
      return { input_class: "INJECTION", allowed_to_agent: false, blocked: true };
    }
    if (/weather|python code|tell me a joke|college should i apply/i.test(lower)) {
      return { input_class: "L3", allowed_to_agent: false, requires_redirect: true };
    }
    if (t.length > 400 && /\bthen\b.*\bthen\b/i.test(lower)) {
      return { input_class: "FULL_DUMP", allowed_to_agent: true, requires_compression: true };
    }
    if (/agenda|success|scope|audience|timeline|priority|ramp|accuracy|assumption|module|next step|owner|date|discovery|aria|priya|jordan/i.test(lower)) {
      return { input_class: "L1", allowed_to_agent: true, scene_alignment: "high" };
    }
    return { input_class: "L2", allowed_to_agent: true, scene_alignment: "medium" };
  }

  function evaluateDP(dpId, text) {
    var lower = (text || "").toLowerCase();
    if (dpId === "DP5") {
      if (/60-minute|60 minute|three parts|module with|based on the brief/i.test(lower) && !/agenda|cover today|discovery frame/i.test(lower)) return "weak";
      if (/agenda|cover today|still works|discovery|role|expectation|introductions|assumptions|what (do|should) we (need to )?cover|walk through/i.test(lower)) return "strong";
      if (/question|ask|understand|confirm|clarify/i.test(lower)) return "partial";
      return "partial";
    }
    if (dpId === "DP6") {
      if (/absolutely|all three|sounds great|design for all/i.test(lower)) return "weak";
      if (/priority|which one|ramp time|success metric|if you could only|most important|trade-?off|focus (on|first)|one module/i.test(lower)) return "strong";
      if (/look into|options|come back|scope|boundary|constraint/i.test(lower)) return "partial";
      return "partial";
    }
    if (dpId === "DP7") {
      if (/don't know|need you to tell|follow up with options|can't recommend/i.test(lower)) return "weak";
      if (/success gap|ramp time.*accuracy|owners?|friday|monday|schedule|next steps?|action items?|by (when|friday|monday)|who (will|owns)|follow[- ]?up/i.test(lower)) return "strong";
      if (/leaning toward|design document|scenario-based|recommend|next/i.test(lower)) return "partial";
      return "partial";
    }
    return "partial";
  }

  function activeDP(state) {
    var scene = state.current_scene;
    if (scene === "S5.02" || scene === "S5.03" || scene === "S5.04") return "DP5";
    if (scene === "S5.06") return "DP6";
    if (scene === "S5.08") return "DP7";
    return null;
  }

  var DP_RANK = { weak: 0, partial: 1, strong: 2 };

  function applyDP(state, text) {
    var dp = activeDP(state);
    if (!dp) return;
    var tier = evaluateDP(dp, text);
    var prev = state.dp_results[dp];
    /* Allow later turns to upgrade a DP (first-lock made scores sticky-PARTIAL). */
    if (!prev || (DP_RANK[tier] || 0) > (DP_RANK[prev] || 0)) {
      state.dp_results[dp] = tier;
    }
    if (dp === "DP5" && state.dp_results[dp] === "strong") state.agenda_confirmed = true;
    if (dp === "DP6" && state.dp_results[dp] === "strong") state.scope_priority_set = true;
    if (dp === "DP7" && state.dp_results[dp] === "strong") {
      state.decision_owners_confirmed = true;
      if (/ramp|accuracy|same|different|gap/i.test(text)) state.success_gap_named_by_learner = true;
    }
    if (/success gap|speed.*accuracy|ramp.*accuracy|not the same|different definitions of success|what success (looks like|means)/i.test(text.toLowerCase())) {
      state.success_gap_named_by_learner = true;
      state.success_gap_detected = true;
    }
    if (/experience range|mixed experience|veteran|novice|barista/i.test(text.toLowerCase())) {
      state.audience_experience_range_identified = true;
    }
    if (/non-native|english speaker|cross-cultural|language/i.test(text.toLowerCase())) {
      state.non_native_english_constraint_identified = true;
    }
    if (/day 6|day 7|review bottleneck|sme review/i.test(text.toLowerCase())) {
      state.priya_review_bottleneck_identified = true;
    }
  }

  function routeAgents(state, classification, userText) {
    var scene = state.current_scene;
    var lowerIntent = (userText || "").toLowerCase();
    if (classification.input_class === "L3" || classification.input_class === "INJECTION") {
      return { route: "redirect_only", speakers: [], parallel: false };
    }
    /* Prefer single-speaker turns for speed; dual only where conflict/pressure matters. */
    if (scene === "S5.02" || scene === "S5.03" || scene === "S5.04") {
      return { route: "jordan_only", speakers: ["jordan"], parallel: false };
    }
    if (scene === "S5.05") {
      if (/non-native|language|culture|scenario|english speaker|cross-cultural|priya|accuracy|sme/i.test(lowerIntent)) {
        return { route: "priya_only", speakers: ["priya"], parallel: false };
      }
      if (/jordan|ramp|sales|access|veteran|experience/i.test(lowerIntent)) {
        return { route: "jordan_only", speakers: ["jordan"], parallel: false };
      }
      return { route: "both_parallel", speakers: ["jordan", "priya"], parallel: true };
    }
    if (scene === "S5.06") {
      return { route: "jordan_first_then_priya", speakers: ["jordan", "priya"], parallel: false };
    }
    if (scene === "S5.07") {
      return { route: "jordan_only", speakers: ["jordan"], parallel: false };
    }
    if (scene === "S5.08") {
      return { route: "priya_first_then_jordan", speakers: ["priya", "jordan"], parallel: false };
    }
    if (scene === "S5.09") {
      return { route: "jordan_only", speakers: ["jordan"], parallel: false };
    }
    return { route: "both_parallel", speakers: ["jordan", "priya"], parallel: true };
  }

  function advanceScene(state) {
    var idx = C.SCENES.indexOf(state.current_scene);
    if (idx < 0 || idx >= C.SCENES.length - 1) {
      state.status = "completed";
      return false;
    }
    state.current_scene = C.SCENES[idx + 1];
    var ai = 0;
    for (var i = 0; i < C.AGENDA.length; i++) {
      if (C.AGENDA[i].scenes.indexOf(state.current_scene) >= 0) {
        ai = i;
        break;
      }
    }
    state.agenda_item_index = ai;
    return true;
  }

  var SCENE_GOALS = {
    "S5.02": "Open the kickoff; answer agenda/role/assumption questions directly.",
    "S5.03": "Confirm roles and brief assumptions with concrete yes/no facts.",
    "S5.04": "Close intros; reinforce discovery-first; do not stall.",
    "S5.05": "Share audience constraints (experience, language, access) with facts.",
    "S5.06": "Respond to scope expansion; accept a forced priority/trade-off.",
    "S5.07": "Lock scope priority; defer non-critical modules if needed.",
    "S5.08": "Push for a recommendation while giving SME/sales constraints.",
    "S5.09": "Confirm owners, dates, and next steps.",
  };

  function memorySummary(state, limit) {
    var log = state.conversation_log || [];
    var tail = log.slice(-(limit || 6));
    return tail
      .map(function (e) {
        var t = String(e.text || "");
        if (t.length > 160) t = t.slice(0, 157) + "...";
        return (e.speaker || "?") + ": " + t;
      })
      .join("\n");
  }

  function buildRuntimeContext(state, classification, userText, agent, prevReply) {
    var item = C.AGENDA[state.agenda_item_index] || C.AGENDA[0];
    return {
      current_scene: state.current_scene,
      agenda_item: item.label,
      scene_goal: SCENE_GOALS[state.current_scene] || "",
      speaking_as: agent === "priya" ? "Dr. Priya Nair (SME/Product)" : "Jordan Kim (Sales Manager)",
      route: agent,
      learner_last_message: (userText || "").slice(0, 400),
      structured_intent: {
        intent_type: classification.input_class,
        scene_alignment: classification.scene_alignment || classification.input_class,
      },
      global_state: {
        dp_results: state.dp_results,
        success_gap_named_by_learner: !!state.success_gap_named_by_learner,
        scope_priority_set: !!state.scope_priority_set,
      },
      recent_transcript: memorySummary(state, 6),
      previous_agent_reply_if_sequential: prevReply || "",
      response_rules: [
        "Answer learner_last_message first with concrete stakeholder information.",
        "Do not ask the learner to restate decisions, evidence, or what to lock down.",
        "If they offered yes/no or A/B/C, answer those items now.",
        "Keep to 1-3 short spoken sentences (Priya may use up to 4).",
        "No markdown, no name prefix, no rubric talk.",
      ],
    };
  }

  function scoreSession(state) {
    var dp = state.dp_results || {};
    var weakCount = 0;
    var strongCount = 0;
    ["DP5", "DP6", "DP7"].forEach(function (k) {
      if (dp[k] === "weak") weakCount += 1;
      if (dp[k] === "strong") strongCount += 1;
    });

    var userTurns = (state.conversation_log || []).filter(function (e) {
      return e && e.agent === "user";
    }).length;

    /* Engagement baseline so a real conversation isn't stuck near default PARTIAL */
    var score = 58 + Math.min(12, userTurns * 2);
    if (dp.DP5 === "strong") score += 6;
    else if (dp.DP5 === "partial") score += 2;
    if (dp.DP6 === "strong") score += 8;
    else if (dp.DP6 === "partial") score += 3;
    if (dp.DP7 === "strong") score += 10;
    else if (dp.DP7 === "partial") score += 3;
    if (state.success_gap_named_by_learner) score += 5;
    if (state.scope_priority_set) score += 5;
    if (state.decision_owners_confirmed) score += 5;
    if (state.audience_experience_range_identified) score += 2;
    if (state.non_native_english_constraint_identified) score += 2;
    if (state.priya_review_bottleneck_identified) score += 2;
    if (dp.DP5 === "weak") score -= 10;
    if (dp.DP6 === "weak") score -= 12;
    if (dp.DP7 === "weak") score -= 12;
    if (weakCount >= 2) score -= 10;
    if (state.status === "SIMULATION_TERMINATED_IDLE") score = Math.min(score, 55);
    if (state.status === "SIMULATION_TERMINATED_GEMINI_FAILURE") score = Math.min(score, 65);
    score = Math.max(0, Math.min(100, score));

    var discoveryFlags = 0;
    if (state.success_gap_named_by_learner) discoveryFlags += 1;
    if (state.scope_priority_set) discoveryFlags += 1;
    if (state.decision_owners_confirmed) discoveryFlags += 1;

    var tier = "partial";
    if (
      weakCount === 0 &&
      ((score >= 85 && discoveryFlags >= 2) ||
        (score >= 88 && strongCount >= 2) ||
        (score >= 90 && discoveryFlags >= 1 && strongCount >= 1))
    ) {
      tier = "strong";
    } else if (score < 58 || weakCount >= 2 || state.status === "SIMULATION_TERMINATED_IDLE") {
      tier = "weak";
    }

    return {
      overall_tier: tier.toUpperCase(),
      stars: tier === "strong" ? 3 : tier === "weak" ? 1 : 2,
      feedback: C.TIERS[tier].feedback,
      final_score: score,
      dp_results: dp,
      status: state.status,
    };
  }

  function persistResult(state) {
    var r = scoreSession(state);
    store.setJSON(C.RESULT_KEY, r);
    return r;
  }

  global.HeeriseKickoffCore = {
    defaultState: defaultState,
    loadState: loadState,
    saveState: saveState,
    appendLog: appendLog,
    classifyInput: classifyInput,
    applyDP: applyDP,
    activeDP: activeDP,
    routeAgents: routeAgents,
    advanceScene: advanceScene,
    bumpSceneTurn: bumpSceneTurn,
    buildRuntimeContext: buildRuntimeContext,
    scoreSession: scoreSession,
    persistResult: persistResult,
  };
})(typeof window !== "undefined" ? window : globalThis);
