/**
 * LUMINA · SIM — persistent floating notes.
 *
 * Behaviour:
 *  - Tabs live in a VERTICAL sidebar inside the panel (left column). The editor is the right column.
 *  - A tab for a stage is created LAZILY: it only appears in the sidebar after the user has typed
 *    at least one non-whitespace character on that stage.
 *  - Badge on the FAB = number of stages that currently have non-empty notes. 0 → hidden.
 *  - The FAB is persistent across eligible pages; the panel is draggable once the user drags it.
 *  - When the panel first opens on a page, a `lumina-notes:opened` custom event is fired so that
 *    other flows on that page (e.g. the Zoom meeting countdown) can react.
 *
 * Copy: use real LUMINA SIM stage names only. Do NOT ship placeholder academic examples
 * (e.g. "1. Identifying tacit…") — those were wireframe style references only.
 */
(function () {
  var STORAGE_KEY = "heerise_lumina_sim_notes_v1";

  /** Display labels per simulation page id — stage-based naming. */
  var PAGE_LABELS = {
    "stakeholder-kickoff-sim": "brief-sim intro",
    "stakeholder-kickoff-workspace": "brief-workspace",
    "stakeholder-kickoff-brief-organize": "brief-organize",
    "stakeholder-kickoff-gap-analysis": "brief-gap-analysis",
    "stakeholder-kickoff-zoom-meeting": "brief-zoom meeting",
    "stakeholder-kickoff-outreach-email": "brief-email",
    "stakeholder-kickoff-research": "research",
    "stakeholder-kickoff-research-workspace": "research-workspace",
  };

  var root = document.getElementById("lumina-sim-notes-root");
  if (!root) return;

  var pageId = (root.getAttribute("data-lumina-page-id") || "").trim();
  if (!pageId || !PAGE_LABELS[pageId]) return;

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

  var state = loadState();
  var currentDraft = ""; // editor buffer for the current page, even before a tab exists
  var open = false;
  var hasFiredOpenEvent = false;
  var dragging = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var panelStartL = 0;
  var panelStartT = 0;
  var floated = !!(state.panelFloat && state.panelFloat.w);

  function defaultState() {
    return { v: 1, tabs: [], activeTabKey: null, panelFloat: null, fabPos: null };
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var o = JSON.parse(raw);
      if (!o || o.v !== 1 || !Array.isArray(o.tabs)) return defaultState();
      return {
        v: 1,
        tabs: o.tabs.filter(function (t) {
          return t && typeof t.key === "string" && typeof t.text === "string";
        }),
        activeTabKey: typeof o.activeTabKey === "string" ? o.activeTabKey : null,
        panelFloat:
          o.panelFloat && typeof o.panelFloat.left === "number"
            ? { left: o.panelFloat.left, top: o.panelFloat.top, w: o.panelFloat.w, h: o.panelFloat.h }
            : null,
        fabPos:
          o.fabPos && typeof o.fabPos.left === "number" && typeof o.fabPos.top === "number"
            ? { left: o.fabPos.left, top: o.fabPos.top }
            : null,
      };
    } catch (e) {
      return defaultState();
    }
  }

  function saveState() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function findTab(key) {
    for (var i = 0; i < state.tabs.length; i++) {
      if (state.tabs[i].key === key) return state.tabs[i];
    }
    return null;
  }

  function activeTab() {
    var k = state.activeTabKey;
    if (!k) return null;
    return findTab(k);
  }

  /** Count of stages with non-empty notes (trimmed). */
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

  function renderTabs() {
    tabstrip.innerHTML = "";
    // only show tabs for stages that actually have non-empty content
    var visible = state.tabs.filter(function (t) { return (t.text || "").trim().length > 0; });
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

  /**
   * Persist whatever is in the editor. Rules:
   *  - If active tab exists in state → update its text (even to empty) and remove if now empty.
   *  - If no active tab AND editor has content → create the tab for current pageId.
   *  - If no active tab AND editor empty → do nothing (no tab yet).
   */
  function commitEditor() {
    if (!editor) return;
    var text = editor.value;
    currentDraft = text;
    var trimmed = text.trim();
    var tab = activeTab();
    if (tab) {
      tab.text = text;
      if (trimmed.length === 0) {
        // drop empty tab
        state.tabs = state.tabs.filter(function (t) { return t.key !== tab.key; });
        state.activeTabKey = null;
      }
    } else if (trimmed.length > 0) {
      // lazily create tab for current page
      var label = PAGE_LABELS[pageId];
      state.tabs.push({ key: pageId, label: label, text: text });
      state.activeTabKey = pageId;
    }
    saveState();
  }

  function syncEditorFromActive() {
    var t = activeTab();
    if (t) {
      editor.value = t.text || "";
    } else {
      // no active tab: if the active key is the current page and we have a draft, show it;
      // otherwise show the draft for this page (empty by default).
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
    panel.classList.toggle("lumina-sim-notes-panel--visible", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    fab.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      applyPanelLayout();
      document.body.classList.toggle("lumina-notes-panel-floating", floated);
      // when opening, prefer to show the tab for THIS page if it exists
      var existingForPage = findTab(pageId);
      if (existingForPage) state.activeTabKey = pageId;
      syncEditorFromActive();
      try { editor.focus({ preventScroll: true }); } catch (e) {}
      if (!hasFiredOpenEvent) {
        hasFiredOpenEvent = true;
        try {
          document.dispatchEvent(new CustomEvent("lumina-notes:opened", { detail: { pageId: pageId } }));
        } catch (e) {}
      }
    } else {
      document.body.classList.remove("lumina-notes-panel-floating");
    }
  }

  function hideLegacyTooltip() { if (tooltip) tooltip.hidden = true; }

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
    }
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    panelStartL = state.panelFloat.left;
    panelStartT = state.panelFloat.top;
    try { panel.setPointerCapture(e.pointerId); } catch (err) {}
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

  // Prime editor draft from any existing tab for this page (so user sees previous notes).
  var existing = findTab(pageId);
  if (existing) {
    currentDraft = existing.text || "";
    state.activeTabKey = pageId;
  } else {
    state.activeTabKey = null;
  }

  setBadgeCount();
  renderTabs();
  syncEditorFromActive();
  applyPanelLayout();
  hideLegacyTooltip();

  /* ------------------------------------------------------------------
   * FAB drag — press + hold and move to reposition the icon anywhere on
   * the viewport. Small movements are still treated as taps (toggle panel).
   * ---------------------------------------------------------------- */
  var FAB_DRAG_THRESHOLD = 6; // px
  var fabDragging = false;
  var fabDragStarted = false;
  var fabDragStartX = 0;
  var fabDragStartY = 0;
  var fabStartLeft = 0;
  var fabStartTop = 0;

  function applyFabPosition() {
    if (!state.fabPos) return;
    fab.style.left = state.fabPos.left + "px";
    fab.style.top = state.fabPos.top + "px";
    fab.style.right = "auto";
    fab.style.bottom = "auto";
  }
  applyFabPosition();

  fab.addEventListener("pointerdown", function (e) {
    if (e.button !== undefined && e.button !== 0) return; // left-click / primary only
    fabDragging = true;
    fabDragStarted = false;
    fabDragStartX = e.clientX;
    fabDragStartY = e.clientY;
    var rect = fab.getBoundingClientRect();
    fabStartLeft = rect.left;
    fabStartTop = rect.top;
    try { fab.setPointerCapture(e.pointerId); } catch (err) {}
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

  window.addEventListener("pointerup", function () {
    if (!fabDragging) return;
    fabDragging = false;
    if (fabDragStarted) {
      fab.classList.remove("lumina-sim-notes-fab--dragging");
      var r = fab.getBoundingClientRect();
      state.fabPos = { left: r.left, top: r.top };
      saveState();
    }
  });

  fab.addEventListener("click", function (e) {
    // Suppress click when it was really a drag gesture.
    if (fabDragStarted) {
      e.preventDefault();
      e.stopPropagation();
      fabDragStarted = false;
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

  /**
   * Public API so other page scripts (e.g. research-workspace stakeholder-question
   * modal) can append formatted note blocks to the correct stage's tab.
   */
  function appendToPage(targetPageId, text) {
    if (!targetPageId || typeof text !== "string" || text.length === 0) return false;
    if (!PAGE_LABELS[targetPageId]) return false;
    var tab = findTab(targetPageId);
    var prefix = "";
    if (tab) {
      var current = tab.text || "";
      if (current.length > 0 && !/\n\n$/.test(current)) {
        prefix = /\n$/.test(current) ? "\n" : "\n\n";
      }
      tab.text = current + prefix + text;
    } else {
      state.tabs.push({ key: targetPageId, label: PAGE_LABELS[targetPageId], text: text });
    }
    state.activeTabKey = targetPageId;
    saveState();
    // Reflect in live UI if the panel is open on this page.
    if (targetPageId === pageId) {
      currentDraft = (findTab(pageId) || {}).text || "";
      if (open) syncEditorFromActive();
    }
    setBadgeCount();
    renderTabs();
    return true;
  }

  window.LuminaSimNotes = window.LuminaSimNotes || {};
  window.LuminaSimNotes.appendToPage = appendToPage;
  window.LuminaSimNotes.appendHere = function (text) { return appendToPage(pageId, text); };
  window.LuminaSimNotes.open = function () { if (!open) setOpen(true); };
  window.LuminaSimNotes.close = function () { if (open) setOpen(false); };
})();
