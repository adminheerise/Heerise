/**
 * Phase 4 → Phase 5: ensure Sample Agenda note in Lumina Notes.
 */
(function (global) {
  "use strict";

  var C = global.HeeriseKickoffConstants;

  function notesHasMarker() {
    try {
      var raw = localStorage.getItem(C.NOTES_KEY);
      if (!raw) return false;
      var o = JSON.parse(raw);
      if (!o || !Array.isArray(o.tabs)) return false;
      for (var i = 0; i < o.tabs.length; i++) {
        var t = o.tabs[i];
        if (t && t.key === C.SAMPLE_AGENDA_TAB && (t.text || "").indexOf(C.SAMPLE_AGENDA_MARKER) >= 0) return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  function ensureSampleAgendaNote() {
    if (!C) return false;
    if (notesHasMarker()) return false;
    var block = C.sampleAgendaBlock();
    if (global.LuminaSimNotes && typeof global.LuminaSimNotes.appendToPage === "function") {
      return global.LuminaSimNotes.appendToPage(C.SAMPLE_AGENDA_TAB, block);
    }
    try {
      var raw = localStorage.getItem(C.NOTES_KEY);
      var state = raw ? JSON.parse(raw) : { v: 1, tabs: [], activeTabKey: null, panelFloat: null, fabPos: null };
      if (!state.tabs) state.tabs = [];
      var tab = null;
      for (var i = 0; i < state.tabs.length; i++) {
        if (state.tabs[i].key === C.SAMPLE_AGENDA_TAB) tab = state.tabs[i];
      }
      if (tab) tab.text = (tab.text ? tab.text + "\n\n" : "") + block;
      else state.tabs.push({ key: C.SAMPLE_AGENDA_TAB, label: "kickoff intro", text: block });
      localStorage.setItem(C.NOTES_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  function bindPhase4Links() {
    var path = C.KICKOFF_INTRO_PATH;
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href.indexOf(path) < 0 && href.indexOf("kickoff/intro") < 0) return;
      a.addEventListener("click", function () {
        ensureSampleAgendaNote();
      });
    });
  }

  function initIntroPage() {
    ensureSampleAgendaNote();
  }

  global.HeeriseSampleAgendaNote = {
    ensure: ensureSampleAgendaNote,
    bindPhase4Links: bindPhase4Links,
    initIntroPage: initIntroPage,
  };
})(typeof window !== "undefined" ? window : globalThis);
