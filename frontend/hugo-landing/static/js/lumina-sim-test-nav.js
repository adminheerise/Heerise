/**
 * LUMINA SIM — internal QA toolbar (not for learners).
 * Enable:
 *   - localhost / 127.0.0.1 — always on (local dev)
 *   - production — add ?sim_test=1 (persists in localStorage)
 * Disable: ?sim_test=0
 * Remove this script + partial before public launch.
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "heerise_sim_test";
  var EXIT_URL = "/acc/stakeholder-kickoff/";

  var PHASES = [
    {
      id: "assignment-brief",
      label: "Phase 1 · Assignment Brief",
      paths: [
        "/acc/stakeholder-kickoff/sim/",
        "/acc/stakeholder-kickoff/workspace/",
        "/acc/stakeholder-kickoff/zoom-meeting/",
        "/acc/stakeholder-kickoff/outreach-email/",
        "/acc/stakeholder-kickoff/brief-organize/",
        "/acc/stakeholder-kickoff/gap-analysis/",
      ],
      next: "/acc/stakeholder-kickoff/research/",
    },
    {
      id: "research",
      label: "Phase 2 · Research",
      paths: ["/acc/stakeholder-kickoff/research/", "/acc/stakeholder-kickoff/research/workspace/"],
      next: "/acc/stakeholder-kickoff/outreach-intro/",
    },
    {
      id: "outreach",
      label: "Phase 3 · Outreach Email",
      paths: [
        "/acc/stakeholder-kickoff/outreach-intro/",
        "/acc/stakeholder-kickoff/outreach/compose/",
        "/acc/stakeholder-kickoff/outreach-feedback/",
        "/acc/stakeholder-kickoff/email/intro/",
        "/acc/stakeholder-kickoff/email/compose/",
        "/acc/stakeholder-kickoff/email/result/",
      ],
      next: "/acc/stakeholder-kickoff/agenda/intro/",
    },
    {
      id: "agenda",
      label: "Phase 4 · Meeting Agenda",
      paths: [
        "/acc/stakeholder-kickoff/agenda/intro/",
        "/acc/stakeholder-kickoff/agenda/ready/",
        "/acc/stakeholder-kickoff/agenda/build/",
        "/acc/stakeholder-kickoff/agenda/result/",
      ],
      next: "/acc/stakeholder-kickoff/kickoff/intro/",
    },
    {
      id: "kickoff",
      label: "Phase 5 · Kick-off Call",
      paths: [
        "/acc/stakeholder-kickoff/kickoff/intro/",
        "/acc/stakeholder-kickoff/kickoff/call/",
        "/acc/stakeholder-kickoff/kickoff/call/countdown/",
        "/acc/stakeholder-kickoff/kickoff/call/live/",
        "/acc/stakeholder-kickoff/kickoff/result/",
      ],
      next: EXIT_URL,
    },
  ];

  function normPath(path) {
    var p = (path || "/").split("?")[0].split("#")[0];
    if (!p.endsWith("/")) p += "/";
    return p;
  }

  function isLocalDev() {
    var host = global.location.hostname;
    return host === "localhost" || host === "127.0.0.1";
  }

  function readQueryFlag() {
    try {
      var q = new URLSearchParams(global.location.search);
      if (q.has("sim_test")) {
        var v = q.get("sim_test");
        if (v === "1" || v === "true") {
          global.localStorage.setItem(STORAGE_KEY, "1");
        } else if (v === "0" || v === "false") {
          global.localStorage.setItem(STORAGE_KEY, "0");
        }
      }
    } catch (e) {
      /* ignore */
    }
  }

  function isEnabled() {
    try {
      var stored = global.localStorage.getItem(STORAGE_KEY);
      if (stored === "0") return false;
      if (stored === "1") return true;
    } catch (e) {
      /* ignore */
    }
    return isLocalDev();
  }

  function disable() {
    try {
      global.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
    var bar = document.getElementById("lumina-sim-test-nav");
    if (bar) bar.hidden = true;
  }

  function currentPhase() {
    var path = normPath(global.location.pathname);
    for (var i = 0; i < PHASES.length; i++) {
      var phase = PHASES[i];
      for (var j = 0; j < phase.paths.length; j++) {
        if (normPath(phase.paths[j]) === path) {
          return { phase: phase, index: i };
        }
      }
    }
    return null;
  }

  function skipPhase() {
    var cur = currentPhase();
    if (!cur) {
      global.location.assign(EXIT_URL);
      return;
    }
    global.location.assign(cur.phase.next);
  }

  function exitSim() {
    global.location.assign(EXIT_URL);
  }

  function mount() {
    var root = document.getElementById("lumina-sim-test-nav");
    if (!root || !isEnabled()) {
      if (root) root.hidden = true;
      return;
    }

    root.hidden = false;
    var label = root.querySelector("[data-test-phase-label]");
    var cur = currentPhase();
    if (label) {
      label.textContent = cur ? cur.phase.label : "LUMINA SIM (unknown page)";
    }

    var skipBtn = root.querySelector("[data-test-skip]");
    var exitBtn = root.querySelector("[data-test-exit]");

    if (skipBtn) {
      skipBtn.disabled = !cur;
      skipBtn.title = cur
        ? "Jump to start of next phase"
        : "Not on a mapped sim page";
    }
    if (exitBtn && !exitBtn._bound) {
      exitBtn._bound = true;
      exitBtn.addEventListener("click", exitSim);
    }
    if (skipBtn && !skipBtn._bound) {
      skipBtn._bound = true;
      skipBtn.addEventListener("click", skipPhase);
    }
  }

  readQueryFlag();

  global.HeeriseSimTest = {
    isEnabled: isEnabled,
    disable: disable,
    skipPhase: skipPhase,
    exitSim: exitSim,
    phases: PHASES,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(window);
