/**
 * Hydrate kickoff notes review sidebar from Lumina Notes + session keys.
 */
(function (global) {
  "use strict";

  var C = global.HeeriseKickoffConstants;

  function readNotesTabs() {
    try {
      var raw = localStorage.getItem(C.NOTES_KEY);
      if (!raw) return [];
      var o = JSON.parse(raw);
      return o && Array.isArray(o.tabs) ? o.tabs : [];
    } catch (e) {
      return [];
    }
  }

  function tabText(keys) {
    var tabs = readNotesTabs();
    var parts = [];
    keys.forEach(function (key) {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].key === key && (tabs[i].text || "").trim()) {
          parts.push(tabs[i].text.trim());
        }
      }
    });
    return parts.join("\n\n");
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderAgendaFromMarker(text) {
    var marker = C.SAMPLE_AGENDA_MARKER;
    var idx = text.indexOf(marker);
    if (idx < 0) return null;
    var body = text.slice(idx + marker.length);
    var lines = body.split(/\n/).filter(function (l) {
      return /^\d{2}\s/.test(l.trim());
    });
    if (!lines.length) return null;
    var html = '<h4>Sample Agenda (14 minutes)</h4><ol class="sks-kc-notes-agenda">';
    lines.forEach(function (line) {
      var m = line.match(/^\s*(\d{2})\s+(.+?)\s*[·\.]+\s*(\d+)\s*min/i);
      if (!m) return;
      html +=
        "<li><span>" +
        escapeHtml(m[1] + " " + m[2]) +
        '</span><span class="sks-kc-notes-agenda-dash" aria-hidden="true"></span><span>' +
        escapeHtml(m[3] + " min") +
        "</span></li>";
    });
    html += "</ol>";
    return html;
  }

  function hydrateSidebar() {
    var root = document.querySelector(".sks-kc-notes-review-scroll");
    if (!root) return;

    var brief = tabText([
      "phase-assignment-brief",
      "stakeholder-kickoff-workspace",
      "stakeholder-kickoff-brief-organize",
      "stakeholder-kickoff-gap-analysis",
    ]);
    if (brief) {
      var briefCard = root.querySelector(".sks-kc-notes-section:nth-child(1) .sks-kc-notes-card p");
      if (briefCard) briefCard.textContent = brief.slice(0, 800);
    }

    var research = tabText([
      "phase-research",
      "stakeholder-kickoff-research-workspace",
      "stakeholder-kickoff-research",
    ]);
    if (research) {
      var researchSection = root.querySelector(".sks-kc-notes-section:nth-child(2)");
      if (researchSection) {
        var card = researchSection.querySelector(".sks-kc-notes-card p");
        if (card) card.textContent = research.slice(0, 600);
      }
    }

    var agendaText = tabText([
      C.SAMPLE_AGENDA_TAB,
      "phase-meeting-agenda",
      "phase-kickoff-call",
      "stakeholder-kickoff-agenda-result",
      "stakeholder-kickoff-kickoff-intro",
    ]);
    var agendaHtml = agendaText ? renderAgendaFromMarker(agendaText) : null;
    if (agendaHtml) {
      var agendaCard = root.querySelector(".sks-kc-notes-section:nth-child(3) .sks-kc-notes-card");
      if (agendaCard) agendaCard.innerHTML = agendaHtml;
    }
  }

  global.HeeriseKickoffNotesHydration = { hydrateSidebar: hydrateSidebar };
})(typeof window !== "undefined" ? window : globalThis);
