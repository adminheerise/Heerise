/**
 * Phase 5 kickoff live call — conversation kernel controller.
 */
(function () {
  "use strict";

  var C;
  var core;
  var api;
  var state;
  var busy = false;
  var idleTimer = null;
  var idleWarnTimer = null;
  var inputEnabled = true;

  var transcriptEl;
  var formEl;
  var inputEl;
  var sendBtn;
  var statusEl;
  var clockEl;
  var endBtn;
  var rootEl;
  var resultUrl;

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || "";
  }

  function setInputEnabled(on) {
    inputEnabled = !!on;
    if (inputEl) inputEl.disabled = !on;
    if (sendBtn) sendBtn.disabled = !on;
  }

  function speakerLabel(agent) {
    if (agent === "priya") return "Dr. Priya Nair";
    if (agent === "jordan") return "Jordan Kim";
    if (agent === "user") return "You";
    return agent;
  }

  function renderTranscript() {
    if (!transcriptEl) return;
    transcriptEl.innerHTML = "";
    (state.conversation_log || []).forEach(function (entry) {
      var row = document.createElement("div");
      row.className = "sks-kc-transcript-line sks-kc-transcript-line--" + (entry.agent || "system");
      var who = document.createElement("strong");
      who.textContent = entry.speaker + ": ";
      var txt = document.createElement("span");
      txt.textContent = entry.text;
      row.appendChild(who);
      row.appendChild(txt);
      transcriptEl.appendChild(row);
    });
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
  }

  function renderClock() {
    if (!clockEl) return;
    var item = C.AGENDA[state.agenda_item_index] || C.AGENDA[0];
    var elapsedMin = Math.floor((state.virtual_elapsed_sec || 0) / 60);
    var itemMin = Math.max(1, Math.round((item.durationSec || 120) / 60));
    clockEl.textContent =
      "Agenda " +
      (state.agenda_item_index + 1) +
      "/" +
      C.AGENDA.length +
      ": " +
      item.label +
      " (~" +
      itemMin +
      " min) · Scene " +
      state.current_scene +
      " · ~" +
      elapsedMin +
      " min elapsed";
  }

  function postLine(speaker, text, agent) {
    core.appendLog(state, { speaker: speaker, text: text, agent: agent || "system" });
    renderTranscript();
  }

  function terminate(reason) {
    state.status = reason;
    core.persistResult(state);
    core.saveState(state);
    window.location.assign(resultUrl);
  }

  function geminiFail() {
    terminate("SIMULATION_TERMINATED_GEMINI_FAILURE");
  }

  function fallbackReply(agent, userText) {
    var scene = state.current_scene || "S5.02";
    var lower = (userText || "").toLowerCase();
    var jordanByScene = {
      "S5.02":
        "Yes — I'm Jordan, Sales. I own ramp and sales success metrics. Treat the brief assumption as confirmed: Aria just launched and we need reps ready under the 15-day pressure.",
      "S5.03":
        "Confirmed on my side: I own sales outcomes and ramp speed. My definition of good is reps running confident Aria discovery calls around the 30-day mark.",
      "S5.04":
        "I'm good locking roles — sales metrics with me, product accuracy with Priya. Let's keep this discovery-first and not turn today into a demo review.",
      "S5.05":
        "Audience-wise we've got a mixed experience range — some veterans, a lot of newer reps. Access is uneven, so keep enablement practical and short.",
      "S5.06":
        "If I have to prioritize one module first, put ramp / discovery conversations first. Product comparison and Aria demos can wait if we can't do all three.",
      "S5.07":
        "Scope trade-off from me: ship the highest-priority ramp module first. I'm fine deferring comparison and demo modules.",
      "S5.08":
        "I need next steps with owners and dates. I'll own sales success metrics; let's lock a follow-up this week.",
      "S5.09":
        "Agreed — send the action list with owners. I'll take sales metrics; don't leave timeline open-ended.",
    };
    var priyaByScene = {
      "S5.02":
        "I'm Priya — product/SME. I own accuracy and review quality. I won't greenlight content that overpromises Aria capabilities.",
      "S5.03":
        "From SME: good means reps speak accurately and credibly in discovery. Confirm any brief assumption that sounds like a feature promise before we teach it.",
      "S5.04":
        "Roles work for me: I own product accuracy and SME review; Jordan owns ramp pressure. Keep today discovery-first.",
      "S5.05":
        "About 31% of the cohort are non-native English speakers, so scenarios and language load matter. Mixed experience is real — don't design only for veterans.",
      "S5.06":
        "If we prioritize, choose accuracy over adding more modules. A thin demo or comparison module that teaches the wrong thing is worse than deferring it.",
      "S5.07":
        "I'm fine deferring extra modules. Whatever we keep must be accurate — no overpromising Aria capabilities.",
      "S5.08":
        "You're the designer — give a clear recommendation. Also plan for my review bottleneck: draft around Day 6, feedback Day 7 if workload allows.",
      "S5.09":
        "I'll own SME review. Put the Day 6/Day 7 review window on the plan so we don't slip accuracy for speed.",
    };

    if (/priority|a\)|b\)|c\)|trade-?off|defer|three modules|all three/i.test(lower)) {
      if (agent === "priya") {
        return "I'd pick accuracy first — option closer to demo credibility — and defer extra modules that we can't review well.";
      }
      return "I'd pick faster ramp / discovery first, and defer product comparison and a separate demo module for later.";
    }
    if (/non-native|english|language|experience range|veteran|audience|constraint/i.test(lower)) {
      if (agent === "priya") {
        return "Yes — roughly 31% non-native English speakers, mixed experience levels. Design for clarity and cross-cultural scenarios, not just veteran shortcuts.";
      }
      return "Mixed experience range on my team — veterans and newer reps. Keep it practical; access and time are limited.";
    }
    if (/role|jordan owns|priya owns|assumption|15-day|checklist|confirm these|yes or no/i.test(lower)) {
      if (agent === "priya") {
        return "Yes on my ownership of product accuracy and SME review. Discovery-first today is correct. I'll flag any brief assumption that overstates Aria.";
      }
      return "Yes — I own sales ramp/success metrics. Aria is new and the 15-day pressure is real. Discovery-first today works for me.";
    }
    if (/owner|friday|monday|next step|follow-?up|success gap|recommendation/i.test(lower)) {
      if (agent === "priya") {
        return "I'll own SME review timing. Give us a concrete recommendation, and put Day 6 draft / Day 7 review on the plan.";
      }
      return "I'll own sales metrics. Send next steps with owners and a follow-up date — Friday draft / Monday check-in works if you can hit it.";
    }

    var pool = agent === "priya" ? priyaByScene : jordanByScene;
    return pool[scene] || pool["S5.02"];
  }

  function looksLikeMetaLoop(text) {
    var t = (text || "").toLowerCase();
    if (!t.trim()) return true;
    return (
      /what('s| is) the decision you need/.test(t) ||
      /what should we lock down about/.test(t) ||
      /what specifically do you need from me on/.test(t) ||
      /what evidence would make you confident about/.test(t) ||
      /what do you need confirmed about/.test(t) ||
      /spell out what you want us to confirm on/.test(t) ||
      /need clarity on learner constraints and what evidence/.test(t)
    );
  }

  function maybeSceneEntry() {
    var entry = C.SCENE_ENTRY[state.current_scene];
    if (!entry || (state._scene_entry_done && state._scene_entry_done[state.current_scene])) return;
    state._scene_entry_done = state._scene_entry_done || {};
    if (state._scene_entry_done[state.current_scene]) return;
    state._scene_entry_done[state.current_scene] = true;
    postLine(entry.speaker, entry.text, entry.speaker.indexOf("Priya") >= 0 ? "priya" : "jordan");
  }

  function callAgent(agent, classification, userText, prevReply) {
    var ctx = core.buildRuntimeContext(state, classification, userText, agent, prevReply);
    state.llm_calls = (state.llm_calls || 0) + 1;
    if (state.llm_calls > C.MAX_LLM_CALLS) {
      terminate("SIMULATION_TERMINATED_GEMINI_FAILURE");
      return Promise.reject(new Error("over budget"));
    }
    function useFallback(reason) {
      if (reason) {
        setStatus("Stakeholders offline (" + reason + ") — using local replies. Check backend GEMINI_API_KEY.");
      }
      return fallbackReply(agent, userText);
    }
    if (!api) return Promise.resolve(useFallback("no API client"));
    var req =
      agent === "priya"
        ? api.priyaRespond(ctx)
        : api.jordanRespond(ctx);
    return req
      .then(function (reply) {
        if (looksLikeMetaLoop(reply)) return useFallback("meta-loop blocked");
        return reply;
      })
      .catch(function (err) {
        var msg = (err && err.message) || "request failed";
        if (/503|not configured/i.test(msg)) return useFallback("Gemini not configured");
        return useFallback("API error");
      });
  }

  function redirectLine(classification) {
    if (classification.input_class === "NON_ENGLISH") return C.NON_ENGLISH_PROMPT;
    return "Let's stay on the kickoff — from my side, ramp and discovery readiness are the priority.";
  }

  function handleEmpty() {
    state.empty_submit_streak = (state.empty_submit_streak || 0) + 1;
    if (state.empty_submit_streak === 1) {
      postLine("Jordan Kim", "I need a direction from you here — what do you want to confirm before we move on?", "jordan");
      return;
    }
    state.virtual_elapsed_sec += 30;
    core.advanceScene(state);
    maybeSceneEntry();
    renderClock();
    core.saveState(state);
  }

  function afterUserTurn(userText, classification) {
    core.applyDP(state, userText);
    core.bumpSceneTurn(state, state.current_scene);
    state.virtual_elapsed_sec += 45;
    state.empty_submit_streak = 0;

    var routing = core.routeAgents(state, classification, userText);
    if (!routing.speakers.length) {
      postLine("Jordan Kim", redirectLine(classification), "jordan");
      core.saveState(state);
      renderClock();
      return Promise.resolve();
    }

    var speakers = routing.speakers.slice(0, C.MAX_AGENT_CALLS_PER_TURN);
    var waitHintTimer = setTimeout(function () {
      setStatus("Still waiting on stakeholders — hang tight…");
    }, (C && C.WAIT_HINT_MS) || 8000);

    function finishTurn() {
      if ((state.scene_turns[state.current_scene] || 0) >= 2) {
        if (state.current_scene !== "S5.09") {
          core.advanceScene(state);
          maybeSceneEntry();
        } else {
          state.status = "completed";
        }
      }
      renderClock();
      core.saveState(state);
      if (state.status === "completed") {
        core.persistResult(state);
        setStatus("Call complete. You can end the call to see your rating.");
      }
    }

    var repliesPromise;
    if (routing.parallel && speakers.length > 1) {
      setStatus(
        speakers
          .map(speakerLabel)
          .join(" & ")
          .replace("Dr. Priya Nair", "Priya") + " are responding…"
      );
      repliesPromise = Promise.all(
        speakers.map(function (agent) {
          return callAgent(agent, classification, userText, null).then(function (reply) {
            return { agent: agent, reply: reply };
          });
        })
      ).then(function (results) {
        speakers.forEach(function (agent) {
          for (var i = 0; i < results.length; i++) {
            if (results[i].agent === agent) {
              postLine(speakerLabel(agent), results[i].reply, agent);
              break;
            }
          }
        });
      });
    } else {
      var chain = Promise.resolve(null);
      speakers.forEach(function (agent) {
        chain = chain.then(function (prev) {
          setStatus(speakerLabel(agent) + " is responding…");
          return callAgent(agent, classification, userText, prev).then(function (reply) {
            postLine(speakerLabel(agent), reply, agent);
            return reply;
          });
        });
      });
      repliesPromise = chain;
    }

    return repliesPromise
      .then(finishTurn)
      .catch(function () {
        geminiFail();
      })
      .finally(function () {
        clearTimeout(waitHintTimer);
      });
  }

  function clearIdle() {
    if (idleWarnTimer) clearTimeout(idleWarnTimer);
    if (idleTimer) clearTimeout(idleTimer);
    idleWarnTimer = null;
    idleTimer = null;
  }

  function onSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (busy) return;
    if (!inputEnabled || state.status !== "active") {
      setStatus("This call session has ended. Return to the countdown page to start a new call.");
      return;
    }
    var text = (inputEl && inputEl.value) || "";
    if (!text.trim()) {
      handleEmpty();
      return;
    }
    busy = true;
    clearIdle();
    setStatus("Stakeholders are responding…");
    if (inputEl) inputEl.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    postLine("You", text.trim(), "user");
    if (inputEl) inputEl.value = "";

    var classification = core.classifyInput(text, state.current_scene);
    if (classification.blocked) {
      postLine("Jordan Kim", "Let's stay on the kickoff agenda.", "jordan");
      busy = false;
      if (inputEl) inputEl.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      setStatus("");
      core.saveState(state);
      resetIdle();
      return;
    }
    if (!classification.allowed_to_agent) {
      postLine("Jordan Kim", redirectLine(classification), "jordan");
      busy = false;
      if (inputEl) inputEl.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      setStatus("");
      core.saveState(state);
      resetIdle();
      return;
    }

    afterUserTurn(text.trim(), classification).finally(function () {
      busy = false;
      if (inputEl) inputEl.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      if (state.status === "completed") {
        setStatus("Call complete. You can end the call to see your rating.");
      } else if (api && api.isGeminiUnavailable && api.isGeminiUnavailable()) {
        setStatus("Using local stakeholder replies (Gemini unavailable). Add GEMINI_API_KEY to backend/.env and restart.");
      } else {
        setStatus("");
      }
      resetIdle();
    });
  }

  function resetIdle() {
    if (state.status !== "active" || busy) return;
    clearIdle();
    idleWarnTimer = setTimeout(function () {
      if (busy || state.status !== "active") return;
      setStatus("The call is waiting for your response. Please reply to keep the meeting moving.");
    }, 60000);
    idleTimer = setTimeout(function () {
      if (busy || state.status !== "active") return;
      state.status = "SIMULATION_TERMINATED_IDLE";
      terminate("SIMULATION_TERMINATED_IDLE");
    }, 120000);
  }

  function ensureFreshLiveSession() {
    var fresh = false;
    try {
      if (sessionStorage.getItem("heerise_kickoff_enter_live") === "1") {
        sessionStorage.removeItem("heerise_kickoff_enter_live");
        fresh = true;
      }
    } catch (err) {}

    var midCallRefresh =
      state.status === "active" &&
      !fresh &&
      state.conversation_log &&
      state.conversation_log.length > 0;

    if (midCallRefresh) {
      setInputEnabled(true);
      return;
    }

    if (fresh || state.status !== "active") {
      state = core.defaultState();
      core.saveState(state);
      setInputEnabled(true);
    }
  }

  function boot() {
    if (!window.HeeriseKickoffCore || !window.HeeriseKickoffConstants) return;

    C = window.HeeriseKickoffConstants;
    core = window.HeeriseKickoffCore;
    api = window.HeeriseKickoffApi;
    state = core.loadState();

    transcriptEl = document.getElementById("sks-kc-transcript");
    formEl = document.getElementById("sks-kc-reply-form");
    inputEl = document.getElementById("sks-kc-reply-input");
    sendBtn = document.getElementById("sks-kc-reply-send");
    statusEl = document.getElementById("sks-kc-live-status");
    clockEl = document.getElementById("sks-kc-agenda-clock");
    endBtn = document.getElementById("sks-kc-end-call");
    rootEl = document.getElementById("sks-kc-live-root");
    if (!rootEl || !transcriptEl || !formEl || !inputEl) return;

    resultUrl = rootEl.dataset.resultUrl || "/acc/stakeholder-kickoff/kickoff/result/";

    ensureFreshLiveSession();

    if (!state.conversation_log || !state.conversation_log.length) {
      var opening = C.OPENING["S5.02"];
      postLine(opening.speaker, opening.text, "jordan");
      maybeSceneEntry();
      core.saveState(state);
    } else {
      renderTranscript();
    }
    renderClock();

    formEl.addEventListener("submit", onSubmit);
    if (endBtn) {
      endBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (state.status === "active") state.status = "completed";
        core.persistResult(state);
        core.saveState(state);
        window.location.assign(resultUrl);
      });
    }
    resetIdle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
