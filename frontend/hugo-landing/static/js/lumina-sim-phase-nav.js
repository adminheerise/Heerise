/**
 * LUMINA SIM — overall phase navigation.
 * Visited phases become jump links in the top step bar so learners can
 * go back and review completed work, then jump forward again to visited phases.
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "heerise_lumina_phase_progress_v1";

  var PHASES = [
    {
      id: "assignment-brief",
      label: "Assignment Brief",
      review: "/acc/stakeholder-kickoff/brief-organize/",
      paths: [
        "/acc/stakeholder-kickoff/sim/",
        "/acc/stakeholder-kickoff/workspace/",
        "/acc/stakeholder-kickoff/zoom-meeting/",
        "/acc/stakeholder-kickoff/outreach-email/",
        "/acc/stakeholder-kickoff/brief-email/",
        "/acc/stakeholder-kickoff/brief-organize/",
        "/acc/stakeholder-kickoff/gap-analysis/",
      ],
    },
    {
      id: "research",
      label: "Research",
      review: "/acc/stakeholder-kickoff/research/workspace/",
      paths: [
        "/acc/stakeholder-kickoff/research/",
        "/acc/stakeholder-kickoff/research/workspace/",
      ],
    },
    {
      id: "outreach-email",
      label: "Outreach Email",
      review: "/acc/stakeholder-kickoff/outreach/compose/",
      paths: [
        "/acc/stakeholder-kickoff/outreach-intro/",
        "/acc/stakeholder-kickoff/outreach/compose/",
        "/acc/stakeholder-kickoff/outreach-feedback/",
        "/acc/stakeholder-kickoff/email/intro/",
        "/acc/stakeholder-kickoff/email/compose/",
        "/acc/stakeholder-kickoff/email/result/",
      ],
    },
    {
      id: "meeting-agenda",
      label: "Meeting Agenda",
      review: "/acc/stakeholder-kickoff/agenda/build/",
      paths: [
        "/acc/stakeholder-kickoff/agenda/intro/",
        "/acc/stakeholder-kickoff/agenda/ready/",
        "/acc/stakeholder-kickoff/agenda/build/",
        "/acc/stakeholder-kickoff/agenda/result/",
      ],
    },
    {
      id: "kickoff-call",
      label: "Kick-off Call",
      review: "/acc/stakeholder-kickoff/kickoff/intro/",
      paths: [
        "/acc/stakeholder-kickoff/kickoff/intro/",
        "/acc/stakeholder-kickoff/kickoff/call/",
        "/acc/stakeholder-kickoff/kickoff/call/countdown/",
        "/acc/stakeholder-kickoff/kickoff/call/live/",
        "/acc/stakeholder-kickoff/kickoff/result/",
      ],
    },
    {
      id: "manager-brief",
      label: "Manager Brief",
      review: "/acc/stakeholder-kickoff/manager-brief/",
      paths: ["/acc/stakeholder-kickoff/manager-brief/"],
    },
  ];

  var LABEL_TO_ID = {};
  PHASES.forEach(function (p) {
    LABEL_TO_ID[normalizeLabel(p.label)] = p.id;
  });

  function normalizeLabel(s) {
    return String(s || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function normPath(path) {
    var p = (path || "/").split("?")[0].split("#")[0];
    if (!p.endsWith("/")) p += "/";
    return p;
  }

  function loadProgress() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { v: 1, visited: {} };
      var o = JSON.parse(raw);
      if (!o || typeof o !== "object") return { v: 1, visited: {} };
      return {
        v: 1,
        visited: o.visited && typeof o.visited === "object" ? o.visited : {},
      };
    } catch (e) {
      return { v: 1, visited: {} };
    }
  }

  function saveProgress(prog) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
    } catch (e) {}
  }

  function findPhaseByPath(pathname) {
    var path = normPath(pathname);
    var best = null;
    for (var i = 0; i < PHASES.length; i++) {
      var phase = PHASES[i];
      for (var j = 0; j < phase.paths.length; j++) {
        var candidate = normPath(phase.paths[j]);
        if (path === candidate || path.indexOf(candidate) === 0) {
          if (!best || candidate.length > best.pathLen) {
            best = { phase: phase, index: i, pathLen: candidate.length };
          }
        }
      }
    }
    return best;
  }

  function markVisited(phaseId) {
    if (!phaseId) return;
    var prog = loadProgress();
    if (!prog.visited[phaseId]) {
      prog.visited[phaseId] = true;
      saveProgress(prog);
    }
  }

  /** Unlock current phase and every earlier phase (arrived here ⇒ earlier work is reviewable). */
  function unlockThrough(index) {
    var prog = loadProgress();
    var changed = false;
    for (var i = 0; i <= index; i++) {
      var id = PHASES[i].id;
      if (!prog.visited[id]) {
        prog.visited[id] = true;
        changed = true;
      }
    }
    if (changed) saveProgress(prog);
    return prog;
  }

  function isVisited(phaseId, prog) {
    return !!(prog && prog.visited && prog.visited[phaseId]);
  }

  function phaseById(id) {
    for (var i = 0; i < PHASES.length; i++) {
      if (PHASES[i].id === id) return PHASES[i];
    }
    return null;
  }

  function enhanceStep(el, phase, currentId, prog) {
    if (!phase || !phase.review) return;
    var isCurrent = phase.id === currentId;
    var visited = isVisited(phase.id, prog);

    el.setAttribute("data-phase-id", phase.id);

    if (isCurrent) {
      el.setAttribute("aria-current", "step");
      return;
    }

    if (!visited) {
      el.classList.add("sks-step--locked");
      el.setAttribute("aria-disabled", "true");
      el.title = "Complete earlier stages to unlock this phase";
      return;
    }

    // Already an anchor (idempotent remount)
    if (el.tagName === "A") {
      el.setAttribute("href", phase.review);
      el.classList.add("sks-step--jump");
      el.title = "Review " + phase.label;
      return;
    }

    var a = document.createElement("a");
    a.href = phase.review;
    a.className = el.className;
    a.classList.add("sks-step--jump");
    a.classList.remove("sks-step--locked");
    a.classList.remove("sks-kc-step--dim");
    a.classList.remove("sks-zm-step--dim");
    a.textContent = el.textContent;
    a.setAttribute("data-phase-id", phase.id);
    a.title = "Review " + phase.label;
    a.setAttribute("aria-label", "Review " + phase.label);
    el.parentNode.replaceChild(a, el);
  }

  function enhanceNav(prog, current) {
    var currentId = current ? current.phase.id : null;
    var nodes = document.querySelectorAll(
      ".sks-nav .sks-step, .sks-kc-nav .sks-kc-step, .sks-zm-nav .sks-zm-step, nav[aria-label='Simulation steps'] .sks-step, nav[aria-label='Simulation steps'] .sks-kc-step, nav[aria-label='Simulation steps'] .sks-zm-step"
    );
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var label = normalizeLabel(el.textContent);
      if (label === "results") continue;
      var id = LABEL_TO_ID[label];
      if (!id) continue;
      var phase = phaseById(id);
      enhanceStep(el, phase, currentId, prog);
    }
  }

  function mount() {
    var hit = findPhaseByPath(global.location.pathname);
    var prog = hit ? unlockThrough(hit.index) : loadProgress();
    enhanceNav(prog, hit);
  }

  global.HeeriseLuminaPhaseNav = {
    phases: PHASES,
    markVisited: markVisited,
    unlockThrough: function (phaseId) {
      for (var i = 0; i < PHASES.length; i++) {
        if (PHASES[i].id === phaseId) return unlockThrough(i);
      }
      return loadProgress();
    },
    getProgress: loadProgress,
    reviewUrl: function (phaseId) {
      var p = phaseById(phaseId);
      return p ? p.review : null;
    },
    remount: mount,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(typeof window !== "undefined" ? window : this);
