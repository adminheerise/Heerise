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

  function fallbackReply(agent) {
    var item = C.AGENDA[state.agenda_item_index] || C.AGENDA[0];
    if (agent === "priya") {
      return "Before I can commit, I need clarity on learner constraints and what evidence you need from us on " + item.label + ".";
    }
    return "That helps — can you spell out what you want us to confirm on " + item.label + " before we move on?";
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
    if (!api) return Promise.resolve(fallbackReply(agent));
    if (agent === "priya") {
      return api.priyaRespond(ctx).catch(function () {
        return fallbackReply("priya");
      });
    }
    return api.jordanRespond(ctx).catch(function () {
      return fallbackReply("jordan");
    });
  }

  function redirectLine(classification) {
    if (classification.input_class === "NON_ENGLISH") return C.NON_ENGLISH_PROMPT;
    return "Let's stay focused on the kickoff agenda — what do you need from us on " + (C.AGENDA[state.agenda_item_index] || C.AGENDA[0]).label + "?";
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
    var chain = Promise.resolve(null);
    speakers.forEach(function (agent) {
      chain = chain.then(function (prev) {
        return callAgent(agent, classification, userText, prev).then(function (reply) {
          postLine(speakerLabel(agent), reply, agent);
          return reply;
        });
      });
    });

    return chain
      .then(function () {
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
      })
      .catch(function () {
        geminiFail();
      });
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
    setStatus("Stakeholders are responding…");
    postLine("You", text.trim(), "user");
    if (inputEl) inputEl.value = "";

    var classification = core.classifyInput(text, state.current_scene);
    if (classification.blocked) {
      postLine("Jordan Kim", "Let's stay on the kickoff agenda.", "jordan");
      busy = false;
      setStatus("");
      core.saveState(state);
      return;
    }
    if (!classification.allowed_to_agent) {
      postLine("Jordan Kim", redirectLine(classification), "jordan");
      busy = false;
      setStatus("");
      core.saveState(state);
      return;
    }

    afterUserTurn(text.trim(), classification).finally(function () {
      busy = false;
      setStatus(state.status === "completed" ? "Call complete. You can end the call to see your rating." : "");
      resetIdle();
    });
  }

  function resetIdle() {
    if (state.status !== "active") return;
    if (idleWarnTimer) clearTimeout(idleWarnTimer);
    if (idleTimer) clearTimeout(idleTimer);
    idleWarnTimer = setTimeout(function () {
      setStatus("The call is waiting for your response. Please reply to keep the meeting moving.");
    }, 60000);
    idleTimer = setTimeout(function () {
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
