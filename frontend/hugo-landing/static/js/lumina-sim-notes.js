/**
 * LUMINA · SIM — persistent floating notes.
 *
 * Tabs are grouped by simulation PHASE (not per page), matching the step nav:
 *   Assignment Brief · Research · Outreach Email · Meeting Agenda · Kick-off Call · Manager Brief
 *
 * A phase tab appears only after the user has typed non-empty content for that phase.
 * Opening the docked panel shrinks #all so the main stage stays fully visible on the left.
 */
(function () {
  var STORAGE_KEY = "heerise_lumina_sim_notes_v1";
  var STORAGE_VERSION = 2;

  var PHASES = [
    { key: "phase-assignment-brief", label: "Assignment Brief" },
    { key: "phase-research", label: "Research" },
    { key: "phase-outreach-email", label: "Outreach Email" },
    { key: "phase-meeting-agenda", label: "Meeting Agenda" },
    { key: "phase-kickoff-call", label: "Kick-off Call" },
    { key: "phase-manager-brief", label: "Manager Brief" },
  ];

  var PHASE_BY_KEY = {};
  PHASES.forEach(function (p) {
    PHASE_BY_KEY[p.key] = p;
  });

  /** Map each simulation page id → phase key. Keep in sync with hugo.toml lumina_notes_page_ids. */
  var PAGE_TO_PHASE = {
    "stakeholder-kickoff-sim": "phase-assignment-brief",
    "stakeholder-kickoff-workspace": "phase-assignment-brief",
    "stakeholder-kickoff-brief-organize": "phase-assignment-brief",
    "stakeholder-kickoff-gap-analysis": "phase-assignment-brief",
    "stakeholder-kickoff-zoom-meeting": "phase-assignment-brief",
    "stakeholder-kickoff-brief-email": "phase-assignment-brief",

    "stakeholder-kickoff-research": "phase-research",
    "stakeholder-kickoff-research-workspace": "phase-research",

    "stakeholder-kickoff-outreach-intro": "phase-outreach-email",
    "stakeholder-kickoff-outreach-compose": "phase-outreach-email",
    "stakeholder-kickoff-outreach-feedback": "phase-outreach-email",
    "stakeholder-kickoff-email-intro": "phase-outreach-email",
    "stakeholder-kickoff-email-compose": "phase-outreach-email",
    "stakeholder-kickoff-email-result": "phase-outreach-email",

    "stakeholder-kickoff-agenda-intro": "phase-meeting-agenda",
    "stakeholder-kickoff-agenda-ready": "phase-meeting-agenda",
    "stakeholder-kickoff-agenda-build": "phase-meeting-agenda",
    "stakeholder-kickoff-agenda-result": "phase-meeting-agenda",

    "stakeholder-kickoff-kickoff-intro": "phase-kickoff-call",
    "stakeholder-kickoff-kickoff-notes-intro": "phase-kickoff-call",
    "stakeholder-kickoff-kickoff-countdown": "phase-kickoff-call",
    "stakeholder-kickoff-kickoff-live": "phase-kickoff-call",
    "stakeholder-kickoff-kickoff-result": "phase-kickoff-call",

    "stakeholder-kickoff-manager-brief": "phase-manager-brief",
  };

  function phaseKeyForPage(pageId) {
    return PAGE_TO_PHASE[pageId] || null;
  }

  function phaseLabel(phaseKey) {
    return (PHASE_BY_KEY[phaseKey] && PHASE_BY_KEY[phaseKey].label) || phaseKey;
  }

  /** Resolve a tab lookup key: phase key, or legacy page id → phase. */
  function resolveTabKey(key) {
    if (!key) return null;
    if (PHASE_BY_KEY[key]) return key;
    return phaseKeyForPage(key) || key;
  }

  var root = document.getElementById("lumina-sim-notes-root");
  if (!root) return;

  var pageId = (root.getAttribute("data-lumina-page-id") || "").trim();
  var phaseKey = phaseKeyForPage(pageId);
  if (!pageId || !phaseKey) return;

  var fab = root.querySelector(".lumina-sim-notes-fab");
  var badge = root.querySelector(".lumina-sim-notes-badge");
  var tooltip = root.querySelector(".lumina-sim-notes-tooltip");
  var panel = root.querySelector(".lumina-sim-notes-panel");
  var header = root.querySelector(".lumina-sim-notes-header");
  var closeBtn = root.querySelector(".lumina-sim-notes-close");
  var tabstrip = root.querySelector(".lumina-sim-notes-tabstrip");
  var editor = root.querySelector(".lumina-sim-notes-editor");
  var emptyHint = root.querySelector(".lumina-sim-notes-empty-hint");
  var gotItBtn = root.querySelector(".lumina-sim-notes-tooltip-gotit");

  if (!fab || !panel || !tabstrip || !editor) return;

  var currentDraft = "";
  var open = false;
  var hasFiredOpenEvent = false;
  var dragging = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var panelStartL = 0;
  var panelStartT = 0;

  function defaultState() {
    return { v: STORAGE_VERSION, tabs: [], activeTabKey: null, panelFloat: null, fabPos: null };
  }

  function migrateTabs(rawTabs) {
    var byPhase = {};
    (rawTabs || []).forEach(function (t) {
      if (!t || typeof t.key !== "string" || typeof t.text !== "string") return;
      var pk = resolveTabKey(t.key);
      if (!PHASE_BY_KEY[pk]) return;
      var text = t.text || "";
      if (!byPhase[pk]) {
        byPhase[pk] = { key: pk, label: phaseLabel(pk), text: text };
      } else if (text.trim()) {
        var cur = byPhase[pk].text || "";
        if (!cur.trim()) byPhase[pk].text = text;
        else if (cur.indexOf(text) < 0) byPhase[pk].text = cur.replace(/\s+$/, "") + "\n\n" + text;
      }
    });
    var ordered = [];
    PHASES.forEach(function (p) {
      if (byPhase[p.key] && (byPhase[p.key].text || "").trim()) {
        byPhase[p.key].label = p.label;
        ordered.push(byPhase[p.key]);
      }
    });
    return ordered;
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var o = JSON.parse(raw);
      if (!o || !Array.isArray(o.tabs)) return defaultState();
      var tabs = migrateTabs(o.tabs);
      var active = typeof o.activeTabKey === "string" ? resolveTabKey(o.activeTabKey) : null;
      if (active && !PHASE_BY_KEY[active]) active = null;
      var next = {
        v: STORAGE_VERSION,
        tabs: tabs,
        activeTabKey: active,
        panelFloat:
          o.panelFloat && typeof o.panelFloat.left === "number"
            ? { left: o.panelFloat.left, top: o.panelFloat.top, w: o.panelFloat.w, h: o.panelFloat.h }
            : null,
        fabPos:
          o.fabPos && typeof o.fabPos.left === "number" && typeof o.fabPos.top === "number"
            ? { left: o.fabPos.left, top: o.fabPos.top }
            : null,
      };
      if (o.v !== STORAGE_VERSION) {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    } catch (e) {
      return defaultState();
    }
  }

  /** Sample Agenda belongs in Kick-off notes only after Phase 4 completes. */
  var SAMPLE_AGENDA_MARKER = "[Sample Agenda · 14 minutes]";
  var KICKOFF_PHASE = "phase-kickoff-call";

  function phase4AgendaReady() {
    try {
      if (localStorage.getItem("heerise_phase4_sample_agenda_ready") === "1") return true;
      if (sessionStorage.getItem("heerise_agenda_result") || localStorage.getItem("heerise_agenda_result")) return true;
    } catch (e) {}
    return false;
  }

  function stripPrematureSampleAgenda(s) {
    if (!s || !Array.isArray(s.tabs) || phase4AgendaReady()) return s;
    /* Only strip while learner is still before Kick-off Call. */
    if (phaseKey === KICKOFF_PHASE || phaseKey === "phase-manager-brief") return s;
    var changed = false;
    var nextTabs = [];
    s.tabs.forEach(function (t) {
      if (!t || t.key !== KICKOFF_PHASE) {
        nextTabs.push(t);
        return;
      }
      var text = t.text || "";
      var idx = text.indexOf(SAMPLE_AGENDA_MARKER);
      if (idx < 0) {
        nextTabs.push(t);
        return;
      }
      changed = true;
      var cleaned = text.slice(0, idx).replace(/\s+$/, "").trim();
      if (cleaned) {
        t.text = cleaned;
        nextTabs.push(t);
      } else if (s.activeTabKey === KICKOFF_PHASE) {
        s.activeTabKey = null;
      }
    });
    if (changed) {
      s.tabs = nextTabs;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch (e) {}
    }
    return s;
  }

  var state = stripPrematureSampleAgenda(loadState());
  var floated = !!(state.panelFloat && state.panelFloat.w);

  function saveState() {
    try {
      state.v = STORAGE_VERSION;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function findTab(key) {
    var k = resolveTabKey(key);
    for (var i = 0; i < state.tabs.length; i++) {
      if (state.tabs[i].key === k) return state.tabs[i];
    }
    return null;
  }

  function activeTab() {
    var k = state.activeTabKey;
    if (!k) return null;
    return findTab(k);
  }

  function nonEmptyCount() {
    var n = 0;
    for (var i = 0; i < state.tabs.length; i++) {
      if ((state.tabs[i].text || "").trim().length > 0) n++;
    }
    return n;
  }

  function setBadgeCount() {
    var n = nonEmptyCount();
    if (!badge) return;
    badge.textContent = String(Math.min(99, n));
    badge.hidden = n <= 0;
  }

  function sortedVisibleTabs() {
    var visible = state.tabs.filter(function (t) {
      return (t.text || "").trim().length > 0;
    });
    var order = {};
    PHASES.forEach(function (p, i) {
      order[p.key] = i;
    });
    visible.sort(function (a, b) {
      var ia = order[a.key];
      var ib = order[b.key];
      if (ia == null) ia = 999;
      if (ib == null) ib = 999;
      return ia - ib;
    });
    return visible;
  }

  function renderTabs() {
    tabstrip.innerHTML = "";
    var visible = sortedVisibleTabs();
    if (emptyHint) emptyHint.hidden = visible.length > 0;
    for (var i = 0; i < visible.length; i++) {
      (function (tab) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "lumina-sim-notes-tab";
        btn.setAttribute("role", "tab");
        var isActive = tab.key === state.activeTabKey;
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
        if (isActive) btn.classList.add("lumina-sim-notes-tab--active");
        btn.setAttribute("data-tab-key", tab.key);
        btn.title = tab.label;

        var name = document.createElement("span");
        name.className = "lumina-sim-notes-tab-name";
        name.textContent = tab.label;
        btn.appendChild(name);

        btn.addEventListener("click", function () {
          commitEditor();
          state.activeTabKey = tab.key;
          saveState();
          syncEditorFromActive();
        });
        tabstrip.appendChild(btn);
      })(visible[i]);
    }
  }

  function commitEditor() {
    if (!editor) return;
    var text = editor.value;
    currentDraft = text;
    var trimmed = text.trim();
    var tab = activeTab();
    if (tab) {
      tab.text = text;
      tab.label = phaseLabel(tab.key);
      if (trimmed.length === 0) {
        state.tabs = state.tabs.filter(function (t) {
          return t.key !== tab.key;
        });
        state.activeTabKey = null;
      }
    } else if (trimmed.length > 0) {
      state.tabs.push({ key: phaseKey, label: phaseLabel(phaseKey), text: text });
      state.activeTabKey = phaseKey;
    }
    saveState();
  }

  function syncEditorFromActive() {
    var t = activeTab();
    if (t) {
      editor.value = t.text || "";
    } else {
      editor.value = currentDraft;
    }
    renderTabs();
  }

  var persistTimer = null;
  function schedulePersist() {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(function () {
      persistTimer = null;
      commitEditor();
      setBadgeCount();
      renderTabs();
    }, 150);
  }

  function applyPanelLayout() {
    if (!panel) return;
    panel.classList.remove("lumina-sim-notes-panel--floating");
    if (floated && state.panelFloat && state.panelFloat.w) {
      panel.classList.add("lumina-sim-notes-panel--floating");
      panel.style.width = state.panelFloat.w + "px";
      panel.style.height = state.panelFloat.h + "px";
      panel.style.left = state.panelFloat.left + "px";
      panel.style.top = state.panelFloat.top + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    } else {
      panel.style.width = "";
      panel.style.height = "";
      panel.style.left = "";
      panel.style.top = "";
      panel.style.right = "";
      panel.style.bottom = "";
    }
  }

  function setOpen(v) {
    open = v;
    document.body.classList.toggle("lumina-notes-open", open);
    document.documentElement.classList.toggle("lumina-notes-open", open);
    panel.classList.toggle("lumina-sim-notes-panel--visible", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    fab.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      applyPanelLayout();
      document.body.classList.toggle("lumina-notes-panel-floating", floated);
      document.documentElement.classList.toggle("lumina-notes-panel-floating", floated);
      var existingForPhase = findTab(phaseKey);
      if (existingForPhase) state.activeTabKey = phaseKey;
      syncEditorFromActive();
      try {
        editor.focus({ preventScroll: true });
      } catch (e) {}
      if (!hasFiredOpenEvent) {
        hasFiredOpenEvent = true;
        try {
          document.dispatchEvent(
            new CustomEvent("lumina-notes:opened", { detail: { pageId: pageId, phaseKey: phaseKey } })
          );
        } catch (e) {}
      }
    } else {
      document.body.classList.remove("lumina-notes-panel-floating");
      document.documentElement.classList.remove("lumina-notes-panel-floating");
    }
  }

  function hideLegacyTooltip() {
    if (tooltip) tooltip.hidden = true;
  }

  function startDrag(e) {
    if (!open) return;
    if (e.target && e.target.closest && e.target.closest(".lumina-sim-notes-close")) return;
    e.preventDefault();
    dragging = true;
    var rect = panel.getBoundingClientRect();
    if (!floated) {
      floated = true;
      state.panelFloat = { left: rect.left, top: rect.top, w: rect.width, h: rect.height };
      panel.classList.add("lumina-sim-notes-panel--floating");
      panel.style.width = state.panelFloat.w + "px";
      panel.style.height = state.panelFloat.h + "px";
      panel.style.left = state.panelFloat.left + "px";
      panel.style.top = state.panelFloat.top + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      document.body.classList.add("lumina-notes-panel-floating");
      document.documentElement.classList.add("lumina-notes-panel-floating");
    }
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    panelStartL = state.panelFloat.left;
    panelStartT = state.panelFloat.top;
    try {
      panel.setPointerCapture(e.pointerId);
    } catch (err) {}
  }

  function onMove(e) {
    if (!dragging || !state.panelFloat) return;
    var dx = e.clientX - dragStartX;
    var dy = e.clientY - dragStartY;
    var nl = panelStartL + dx;
    var nt = panelStartT + dy;
    var w = state.panelFloat.w;
    var h = state.panelFloat.h;
    var maxL = Math.max(8, window.innerWidth - w - 8);
    var maxT = Math.max(8, window.innerHeight - h - 8);
    nl = Math.min(maxL, Math.max(8, nl));
    nt = Math.min(maxT, Math.max(8, nt));
    state.panelFloat.left = nl;
    state.panelFloat.top = nt;
    panel.style.left = nl + "px";
    panel.style.top = nt + "px";
  }

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    saveState();
  }

  var existing = findTab(phaseKey);
  if (existing) {
    currentDraft = existing.text || "";
    state.activeTabKey = phaseKey;
  } else {
    state.activeTabKey = null;
  }

  setBadgeCount();
  renderTabs();
  syncEditorFromActive();
  applyPanelLayout();
  hideLegacyTooltip();

  /* Phase 5: pull Sample Agenda into notes if Phase 4→5 inject already wrote it
     (or inject now if the bridge runs slightly later). */
  if (phaseKey === KICKOFF_PHASE) {
    setTimeout(function () {
      if (window.HeeriseSampleAgendaNote && typeof window.HeeriseSampleAgendaNote.ensure === "function") {
        window.HeeriseSampleAgendaNote.ensure(true);
      }
      /* Reload tabs from storage in case inject wrote directly to localStorage */
      try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        var o = JSON.parse(raw);
        if (!o || !Array.isArray(o.tabs)) return;
        state.tabs = migrateTabs(o.tabs);
        if (o.activeTabKey) state.activeTabKey = resolveTabKey(o.activeTabKey);
        var active = findTab(phaseKey);
        if (active) {
          currentDraft = active.text || "";
          state.activeTabKey = phaseKey;
        }
        setBadgeCount();
        renderTabs();
        if (open) syncEditorFromActive();
      } catch (e) {}
    }, 150);
  }

  var FAB_DRAG_THRESHOLD = 6;
  var fabDragging = false;
  var fabDragStarted = false;
  var suppressNextFabClick = false;
  var fabDragStartX = 0;
  var fabDragStartY = 0;
  var fabStartLeft = 0;
  var fabStartTop = 0;

  function applyFabPosition() {
    if (!state.fabPos) return;
    var w = fab.offsetWidth || 56;
    var h = fab.offsetHeight || 56;
    var maxL = Math.max(4, window.innerWidth - w - 4);
    var maxT = Math.max(4, window.innerHeight - h - 4);
    var left = Math.min(maxL, Math.max(4, state.fabPos.left));
    var top = Math.min(maxT, Math.max(4, state.fabPos.top));
    state.fabPos = { left: left, top: top };
    fab.style.left = left + "px";
    fab.style.top = top + "px";
    fab.style.right = "auto";
    fab.style.bottom = "auto";
  }
  applyFabPosition();

  function endFabDragGesture() {
    if (!fabDragging) return;
    var didDrag = fabDragStarted;
    fabDragging = false;
    fabDragStarted = false;
    if (didDrag) {
      fab.classList.remove("lumina-sim-notes-fab--dragging");
      var r = fab.getBoundingClientRect();
      state.fabPos = { left: r.left, top: r.top };
      saveState();
      suppressNextFabClick = true;
    }
  }

  fab.addEventListener("pointerdown", function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    suppressNextFabClick = false;
    fabDragging = true;
    fabDragStarted = false;
    fabDragStartX = e.clientX;
    fabDragStartY = e.clientY;
    var rect = fab.getBoundingClientRect();
    fabStartLeft = rect.left;
    fabStartTop = rect.top;
    try {
      fab.setPointerCapture(e.pointerId);
    } catch (err) {}
  });

  window.addEventListener("pointermove", function (e) {
    if (!fabDragging) return;
    var dx = e.clientX - fabDragStartX;
    var dy = e.clientY - fabDragStartY;
    if (!fabDragStarted && Math.abs(dx) + Math.abs(dy) < FAB_DRAG_THRESHOLD) return;
    if (!fabDragStarted) {
      fabDragStarted = true;
      fab.classList.add("lumina-sim-notes-fab--dragging");
    }
    var w = fab.offsetWidth;
    var h = fab.offsetHeight;
    var nl = fabStartLeft + dx;
    var nt = fabStartTop + dy;
    nl = Math.min(window.innerWidth - w - 4, Math.max(4, nl));
    nt = Math.min(window.innerHeight - h - 4, Math.max(4, nt));
    fab.style.left = nl + "px";
    fab.style.top = nt + "px";
    fab.style.right = "auto";
    fab.style.bottom = "auto";
  });

  window.addEventListener("pointerup", endFabDragGesture);
  window.addEventListener("pointercancel", endFabDragGesture);

  fab.addEventListener("click", function (e) {
    if (suppressNextFabClick) {
      e.preventDefault();
      e.stopPropagation();
      suppressNextFabClick = false;
      return;
    }
    hideLegacyTooltip();
    setOpen(!open);
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      commitEditor();
      setOpen(false);
    });
  }

  if (gotItBtn) {
    gotItBtn.addEventListener("click", hideLegacyTooltip);
  }

  editor.addEventListener("input", schedulePersist);

  if (header) header.addEventListener("pointerdown", startDrag);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  window.addEventListener("beforeunload", function () {
    commitEditor();
    saveState();
  });

  function appendToPhase(targetKey, text) {
    if (!targetKey || typeof text !== "string" || text.length === 0) return false;
    var pk = resolveTabKey(targetKey);
    if (!PHASE_BY_KEY[pk]) return false;
    var tab = findTab(pk);
    var prefix = "";
    if (tab) {
      var current = tab.text || "";
      if (current.length > 0 && !/\n\n$/.test(current)) {
        prefix = /\n$/.test(current) ? "\n" : "\n\n";
      }
      tab.text = current + prefix + text;
      tab.label = phaseLabel(pk);
    } else {
      state.tabs.push({ key: pk, label: phaseLabel(pk), text: text });
    }
    state.activeTabKey = pk;
    saveState();
    if (pk === phaseKey) {
      currentDraft = (findTab(phaseKey) || {}).text || "";
      if (open) syncEditorFromActive();
    }
    setBadgeCount();
    renderTabs();
    return true;
  }

  /** @deprecated name kept for callers — accepts page id or phase key */
  function appendToPage(targetPageId, text) {
    return appendToPhase(targetPageId, text);
  }

  function resetFabToDefault() {
    state.fabPos = null;
    fab.style.left = "";
    fab.style.top = "";
    fab.style.right = "";
    fab.style.bottom = "";
    saveState();
  }

  window.LuminaSimNotes = window.LuminaSimNotes || {};
  window.LuminaSimNotes.appendToPage = appendToPage;
  window.LuminaSimNotes.appendToPhase = appendToPhase;
  window.LuminaSimNotes.appendHere = function (text) {
    return appendToPhase(phaseKey, text);
  };
  window.LuminaSimNotes.open = function () {
    if (!open) setOpen(true);
  };
  window.LuminaSimNotes.close = function () {
    if (open) setOpen(false);
  };
  window.LuminaSimNotes.resetFabToDefault = resetFabToDefault;
  window.LuminaSimNotes.phaseKeyForPage = phaseKeyForPage;
  window.LuminaSimNotes.PHASES = PHASES.slice();
})();
