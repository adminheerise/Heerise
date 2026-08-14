/**
 * Phase 4 → Phase 5: inject Sample Agenda into Kick-off Call notes.
 */
(function (global) {
  "use strict";

  var READY_FLAG = "heerise_phase4_sample_agenda_ready";
  var AGENDA_RESULT_KEY = "heerise_agenda_result";

  function C() {
    return global.HeeriseKickoffConstants;
  }

  function readAgendaResult() {
    try {
      var raw = sessionStorage.getItem(AGENDA_RESULT_KEY) || localStorage.getItem(AGENDA_RESULT_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function phase4Complete() {
    if (readAgendaResult()) return true;
    try {
      return localStorage.getItem(READY_FLAG) === "1";
    } catch (e) {
      return false;
    }
  }

  function markPhase4Ready() {
    try {
      localStorage.setItem(READY_FLAG, "1");
    } catch (e) {}
  }

  function notesHasMarker() {
    var consts = C();
    if (!consts) return false;
    try {
      var raw = localStorage.getItem(consts.NOTES_KEY);
      if (!raw) return false;
      var o = JSON.parse(raw);
      if (!o || !Array.isArray(o.tabs)) return false;
      for (var i = 0; i < o.tabs.length; i++) {
        var t = o.tabs[i];
        if (t && t.key === consts.SAMPLE_AGENDA_TAB && (t.text || "").indexOf(consts.SAMPLE_AGENDA_MARKER) >= 0) {
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  function writeSampleToStorage(block) {
    var consts = C();
    if (!consts) return false;
    try {
      var raw = localStorage.getItem(consts.NOTES_KEY);
      var state = raw ? JSON.parse(raw) : { v: 2, tabs: [], activeTabKey: null, panelFloat: null, fabPos: null };
      if (!state.tabs) state.tabs = [];
      var tab = null;
      for (var i = 0; i < state.tabs.length; i++) {
        if (state.tabs[i].key === consts.SAMPLE_AGENDA_TAB) {
          tab = state.tabs[i];
          break;
        }
      }
      if (tab) {
        if ((tab.text || "").indexOf(consts.SAMPLE_AGENDA_MARKER) >= 0) return false;
        tab.text = (tab.text ? tab.text.replace(/\s+$/, "") + "\n\n" : "") + block;
        tab.label = "Kick-off Call";
      } else {
        state.tabs.push({ key: consts.SAMPLE_AGENDA_TAB, label: "Kick-off Call", text: block });
      }
      if (!state.activeTabKey) state.activeTabKey = consts.SAMPLE_AGENDA_TAB;
      localStorage.setItem(consts.NOTES_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Inject Sample Agenda into Kick-off Call notes.
   * @param {boolean} [force] - when true (Phase 5 pages), skip Phase 4 gate
   */
  function ensureSampleAgendaNote(force) {
    var consts = C();
    if (!consts || typeof consts.sampleAgendaBlock !== "function") return false;
    if (!force && !phase4Complete()) return false;
    if (notesHasMarker()) return true;

    var block = consts.sampleAgendaBlock();
    var ok = false;

    if (global.LuminaSimNotes && typeof global.LuminaSimNotes.appendToPage === "function") {
      ok = !!global.LuminaSimNotes.appendToPage(consts.SAMPLE_AGENDA_TAB, block);
    }
    if (!ok) ok = writeSampleToStorage(block);

    if (ok) markPhase4Ready();
    return ok;
  }

  /** Phase 4 result: arm flag, inject now, and again on Continue → Phase 5. */
  function bindPhase4Links() {
    markPhase4Ready();
    ensureSampleAgendaNote(true);

    var path = (C() && C().KICKOFF_INTRO_PATH) || "/acc/stakeholder-kickoff/kickoff/intro/";
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href.indexOf("kickoff/intro") < 0 && href.indexOf(path) < 0) return;
      a.addEventListener("click", function () {
        markPhase4Ready();
        ensureSampleAgendaNote(true);
      });
    });
  }

  /** Phase 5 entry — always ensure Sample Agenda is present. */
  function initIntroPage() {
    ensureSampleAgendaNote(true);
  }

  function stripPrematureSampleAgenda() {
    var consts = C();
    if (!consts || phase4Complete()) return false;
    try {
      var raw = localStorage.getItem(consts.NOTES_KEY);
      if (!raw) return false;
      var state = JSON.parse(raw);
      if (!state || !Array.isArray(state.tabs)) return false;
      var changed = false;
      var next = [];
      for (var i = 0; i < state.tabs.length; i++) {
        var t = state.tabs[i];
        if (!t || t.key !== consts.SAMPLE_AGENDA_TAB) {
          next.push(t);
          continue;
        }
        var text = t.text || "";
        var idx = text.indexOf(consts.SAMPLE_AGENDA_MARKER);
        if (idx < 0) {
          next.push(t);
          continue;
        }
        changed = true;
        var cleaned = text.slice(0, idx).replace(/\s+$/, "").trim();
        if (cleaned) {
          t.text = cleaned;
          next.push(t);
        } else if (state.activeTabKey === consts.SAMPLE_AGENDA_TAB) {
          state.activeTabKey = null;
        }
      }
      if (!changed) return false;
      state.tabs = next;
      localStorage.setItem(consts.NOTES_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  global.HeeriseSampleAgendaNote = {
    ensure: ensureSampleAgendaNote,
    bindPhase4Links: bindPhase4Links,
    initIntroPage: initIntroPage,
    stripPremature: stripPrematureSampleAgenda,
    phase4Complete: phase4Complete,
    markPhase4Ready: markPhase4Ready,
  };
})(typeof window !== "undefined" ? window : globalThis);
