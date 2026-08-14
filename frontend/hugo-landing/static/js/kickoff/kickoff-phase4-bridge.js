/**
 * Phase 4 result → Phase 5: inject Sample Agenda into notes on that transition
 * and whenever a Phase 5 entry page loads.
 */
(function () {
  "use strict";

  function run() {
    if (!window.HeeriseSampleAgendaNote) return;

    if (document.querySelector(".sks-page--agenda-result")) {
      window.HeeriseSampleAgendaNote.bindPhase4Links();
      return;
    }

    /* Any Phase 5 entry surface */
    if (
      document.querySelector(
        ".sks-page--kickoff-intro, .sks-page--kickoff-notes-intro, .sks-page--kickoff-countdown"
      )
    ) {
      window.HeeriseSampleAgendaNote.initIntroPage();
      /* Notes script may still be initializing — retry once */
      setTimeout(function () {
        window.HeeriseSampleAgendaNote.initIntroPage();
      }, 100);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
