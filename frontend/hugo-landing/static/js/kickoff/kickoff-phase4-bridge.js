/**
 * Phase 4 result → Phase 5 bridge + sample agenda note on all Phase 5 entry points.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.HeeriseSampleAgendaNote) return;
    if (document.querySelector(".sks-page--agenda-result")) {
      window.HeeriseSampleAgendaNote.bindPhase4Links();
    }
    if (
      document.querySelector(
        ".sks-page--kickoff-intro, .sks-page--kickoff-notes-intro, .sks-page--kickoff-countdown, .sks-page--kickoff-live"
      )
    ) {
      window.HeeriseSampleAgendaNote.ensure();
    }
  });
})();
