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
      if (/agenda|cover today|still works|discovery|role|expectation/i.test(lower)) return "strong";
      if (/question|ask|understand/i.test(lower)) return "partial";
      return "partial";
    }
    if (dpId === "DP6") {
      if (/absolutely|all three|sounds great|design for all/i.test(lower)) return "weak";
      if (/priority|which one|ramp time|success metric|if you could only/i.test(lower)) return "strong";
      if (/look into|options|come back/i.test(lower)) return "partial";
      return "partial";
    }
    if (dpId === "DP7") {
      if (/don't know|need you to tell|follow up with options|can't recommend/i.test(lower)) return "weak";
      if (/success gap|ramp time.*accuracy|owners|friday|monday|schedule|next step/i.test(lower)) return "strong";
      if (/leaning toward|design document|scenario-based/i.test(lower)) return "partial";
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

  function applyDP(state, text) {
    var dp = activeDP(state);
    if (!dp || state.dp_results[dp]) return;
    var tier = evaluateDP(dp, text);
    state.dp_results[dp] = tier;
    if (dp === "DP5" && tier === "strong") state.agenda_confirmed = true;
    if (dp === "DP6" && tier === "strong") state.scope_priority_set = true;
    if (dp === "DP7" && tier === "strong") {
      state.decision_owners_confirmed = true;
      if (/ramp|accuracy|same|different|gap/i.test(text)) state.success_gap_named_by_learner = true;
    }
    if (/success gap|speed.*accuracy|ramp.*accuracy|not the same/i.test(text.toLowerCase())) {
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
      return { route: "redirect_only", speakers: [] };
    }
    if (scene === "S5.02") return { route: "jordan_only", speakers: ["jordan"] };
    if (scene === "S5.08") return { route: "priya_first_then_jordan", speakers: ["priya", "jordan"] };
    if (scene === "S5.06") return { route: "jordan_first_then_priya", speakers: ["jordan", "priya"] };
    if (scene === "S5.05" && /non-native|language|culture|scenario|english speaker|cross-cultural/i.test(lowerIntent)) {
      return { route: "priya_only", speakers: ["priya"] };
    }
    return { route: "both_sequential", speakers: ["jordan", "priya"] };
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

  function memorySummary(state, limit) {
    var log = state.conversation_log || [];
    var tail = log.slice(-(limit || 8));
    return tail
      .map(function (e) {
        return (e.speaker || "?") + ": " + (e.text || "");
      })
      .join("\n");
  }

  function buildRuntimeContext(state, classification, userText, agent, prevReply) {
    var item = C.AGENDA[state.agenda_item_index] || C.AGENDA[0];
    return {
      current_scene: state.current_scene,
      agenda_item: item.label,
      route: agent,
      structured_intent: {
        intent_type: classification.input_class,
        user_goal: userText,
        scene_alignment: classification.scene_alignment || classification.input_class,
        relevant_user_excerpt: userText.slice(0, 500),
      },
      global_state: {
        dp_results: state.dp_results,
        success_gap_named_by_learner: state.success_gap_named_by_learner,
        scope_priority_set: state.scope_priority_set,
        audience_constraints_identified: [],
        timeline_risks_identified: [],
      },
      relevant_memory_summary: memorySummary(state, 10),
      fixed_text_anchors_for_scene: [],
      previous_agent_reply_if_both_sequential: prevReply || "",
    };
  }

  function scoreSession(state) {
    var dp = state.dp_results || {};
    var weakCount = 0;
    ["DP5", "DP6", "DP7"].forEach(function (k) {
      if (dp[k] === "weak") weakCount += 1;
    });
    var score = 70;
    if (dp.DP5 === "strong") score += 5;
    if (dp.DP6 === "strong") score += 8;
    if (dp.DP7 === "strong") score += 10;
    if (state.success_gap_named_by_learner) score += 5;
    if (state.scope_priority_set) score += 5;
    if (state.decision_owners_confirmed) score += 5;
    if (dp.DP5 === "weak") score -= 10;
    if (dp.DP6 === "weak") score -= 12;
    if (dp.DP7 === "weak") score -= 12;
    if (weakCount >= 2) score -= 10;
    if (state.status === "SIMULATION_TERMINATED_IDLE") score = Math.min(score, 55);
    if (state.status === "SIMULATION_TERMINATED_GEMINI_FAILURE") score = Math.min(score, 65);

    var tier = "partial";
    if (score >= 85 && weakCount === 0 && state.success_gap_named_by_learner && state.scope_priority_set && state.decision_owners_confirmed) {
      tier = "strong";
    } else if (score < 60 || weakCount >= 2 || state.status === "SIMULATION_TERMINATED_IDLE") {
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
