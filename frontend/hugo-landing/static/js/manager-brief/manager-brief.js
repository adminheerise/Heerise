/**
 * Phase 6 — Manager Brief: scoring report → Gemini analysis in Maya bubble + radar.
 */
(function () {
  "use strict";

  var DIMENSIONS = [
    "Knowing What You Don't Know",
    "Hypothesis-driven Research",
    "Stakeholder Credibility",
    "Agenda Design",
    "Discovery Facilitation",
  ];

  var DEFAULT_SCORES = [2, 2, 2, 2, 2];
  var MAX_SCORE = 3;
  var RADAR_KEY = "heerise_manager_brief_radar";
  var EVIDENCE_KEY = "heerise_manager_brief_evidence";
  var DEBRIEF_CACHE_KEY = "heerise_manager_brief_debrief";

  var FIXED_CLOSING =
    "A kickoff call plays a key role in the success and direction of a project. You have now run one. Whatever score you got today, you are more prepared for the real one than you were an hour ago. The habits you built here: the gap analysis, the hypotheses, the agenda, the questions. Those are yours now. Use them.";

  function readJSON(storage, key) {
    try {
      var raw = storage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeJSON(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function clampScore(n, fallback) {
    var v = Number(n);
    if (!isFinite(v)) return fallback;
    return Math.max(1, Math.min(3, Math.round(v)));
  }

  function notesExcerpt(tabKeys, maxLen) {
    maxLen = maxLen || 600;
    var notes = readJSON(localStorage, "heerise_lumina_sim_notes_v1");
    if (!notes || !Array.isArray(notes.tabs)) return "";
    var parts = [];
    tabKeys.forEach(function (key) {
      for (var i = 0; i < notes.tabs.length; i++) {
        if (notes.tabs[i].key === key && (notes.tabs[i].text || "").trim()) {
          parts.push(String(notes.tabs[i].text).trim());
        }
      }
    });
    var text = parts.join("\n\n");
    if (text.length > maxLen) text = text.slice(0, maxLen) + "…";
    return text;
  }

  function phase1Score(p1) {
    if (!p1) return null;
    if (typeof p1.score === "number") return clampScore(p1.score, 2);
    if (p1.passed) return 3;
    if (p1.coach === "CC-03") return 1;
    if (p1.coach === "CC-02") return 2;
    return 2;
  }

  function phase2Score(p2) {
    if (!p2) return null;
    if (typeof p2.score === "number") return clampScore(p2.score, 2);
    var hyp = (p2.hypothesis || "").trim();
    if (!hyp) return 1;
    return hyp.length >= 40 ? 3 : 2;
  }

  function outreachScore(data) {
    if (!data) return null;
    var total = data.total_score;
    if (typeof total !== "number") return null;
    if (total >= 18) return 3;
    if (total >= 14) return 2;
    return 1;
  }

  function agendaScore(data) {
    if (!data || data.stars == null) return null;
    return clampScore(data.stars, 2);
  }

  function kickoffScore(data) {
    if (!data || data.stars == null) return null;
    return clampScore(data.stars, 2);
  }

  function buildReport() {
    var p1 = readJSON(localStorage, "heerise_phase1_cc01");
    var p2 = readJSON(localStorage, "heerise_phase2_hypothesis");
    var outreach =
      readJSON(sessionStorage, "heeriseOutreachEmailFeedback") ||
      readJSON(localStorage, "heeriseOutreachEmailFeedback");
    var agenda =
      readJSON(sessionStorage, "heerise_agenda_result") ||
      readJSON(localStorage, "heerise_agenda_result");
    var kickoff = readJSON(localStorage, "heerise_kickoff_result");

    var scores = DEFAULT_SCORES.slice();
    var s1 = phase1Score(p1);
    var s2 = phase2Score(p2);
    var s3 = outreachScore(outreach);
    var s4 = agendaScore(agenda);
    var s5 = kickoffScore(kickoff);
    if (s1 != null) scores[0] = s1;
    if (s2 != null) scores[1] = s2;
    if (s3 != null) scores[2] = s3;
    if (s4 != null) scores[3] = s4;
    if (s5 != null) scores[4] = s5;

    var report = {
      v: 1,
      scores: scores,
      dimensions: DIMENSIONS,
      phase1: p1 || { missing: true },
      phase2: {
        hypothesis: (p2 && p2.hypothesis) || "",
        score: s2,
        tier: p2 && p2.tier,
        coverage: (p2 && p2.coverage) || null,
        notes_excerpt: notesExcerpt(
          ["stakeholder-kickoff-research", "stakeholder-kickoff-research-workspace"],
          500
        ),
        missing: !p2,
      },
      phase3: outreach
        ? {
            overall_level: outreach.overall_level,
            total_score: outreach.total_score,
            criteria: outreach.criteria || [],
          }
        : { missing: true },
      phase4: agenda
        ? {
            tier: agenda.tier,
            stars: agenda.stars,
            feedback: agenda.feedback || "",
            mayaLine: agenda.mayaLine || "",
            diagnostics: agenda.diagnostics || [],
            items: agenda.items || [],
          }
        : { missing: true },
      phase5: kickoff
        ? {
            overall_tier: kickoff.overall_tier,
            stars: kickoff.stars,
            feedback: kickoff.feedback || "",
            dp_results: kickoff.dp_results || {},
            final_score: kickoff.final_score,
          }
        : { missing: true },
      savedAt: Date.now(),
    };

    writeJSON(localStorage, EVIDENCE_KEY, report);
    writeJSON(localStorage, RADAR_KEY, {
      v: 1,
      dimensions: DIMENSIONS,
      scores: scores,
      savedAt: Date.now(),
    });
    return report;
  }

  function polar(cx, cy, radius, angleRad) {
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    };
  }

  function polygonPoints(cx, cy, radius, count, values, maxVal) {
    var pts = [];
    for (var i = 0; i < count; i++) {
      var angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
      var val = Math.max(0, Math.min(maxVal, values[i] || 0));
      var r = (val / maxVal) * radius;
      var p = polar(cx, cy, r, angle);
      pts.push(p.x.toFixed(2) + "," + p.y.toFixed(2));
    }
    return pts.join(" ");
  }

  function ringPoints(cx, cy, radius, count, scale) {
    var pts = [];
    for (var i = 0; i < count; i++) {
      var angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
      var p = polar(cx, cy, radius * scale, angle);
      pts.push(p.x.toFixed(2) + "," + p.y.toFixed(2));
    }
    return pts.join(" ");
  }

  function renderRadar(svg, scores) {
    if (!svg) return;
    var cx = 200;
    var cy = 200;
    var maxR = 120;
    var n = scores.length;
    var ns = "http://www.w3.org/2000/svg";

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    for (var r = 1; r <= MAX_SCORE; r++) {
      var ring = document.createElementNS(ns, "polygon");
      ring.setAttribute("points", ringPoints(cx, cy, maxR, n, r / MAX_SCORE));
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke", "rgba(0, 0, 26, 0.15)");
      ring.setAttribute("stroke-width", "2.75");
      svg.appendChild(ring);
    }

    for (var a = 0; a < n; a++) {
      var angle = -Math.PI / 2 + (2 * Math.PI * a) / n;
      var end = polar(cx, cy, maxR, angle);
      var line = document.createElementNS(ns, "line");
      line.setAttribute("x1", String(cx));
      line.setAttribute("y1", String(cy));
      line.setAttribute("x2", String(end.x));
      line.setAttribute("y2", String(end.y));
      line.setAttribute("stroke", "rgba(0, 0, 26, 0.15)");
      line.setAttribute("stroke-width", "2.75");
      svg.appendChild(line);
    }

    var area = document.createElementNS(ns, "polygon");
    area.setAttribute("points", polygonPoints(cx, cy, maxR, n, scores, MAX_SCORE));
    area.setAttribute("fill", "rgba(1, 122, 255, 0.6)");
    area.setAttribute("stroke", "#017AFF");
    area.setAttribute("stroke-width", "4");
    svg.appendChild(area);

    for (var j = 0; j < n; j++) {
      var ang = -Math.PI / 2 + (2 * Math.PI * j) / n;
      var val = Math.max(0, Math.min(MAX_SCORE, scores[j] || 0));
      var nodeR = (val / MAX_SCORE) * maxR;
      var node = polar(cx, cy, nodeR, ang);
      var dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", String(node.x));
      dot.setAttribute("cy", String(node.y));
      dot.setAttribute("r", "8");
      dot.setAttribute("fill", "#017AFF");
      dot.setAttribute("stroke", "#ffffff");
      dot.setAttribute("stroke-width", "2.75");
      svg.appendChild(dot);
    }
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function localFallbackDebrief(report) {
    var scores = report.scores || DEFAULT_SCORES;
    var strip = [];
    var sections = [];
    for (var i = 0; i < 5; i++) {
      var score = clampScore(scores[i], 2);
      var tier = score >= 3 ? "strong" : score >= 2 ? "partial" : "weak";
      strip.push({
        phase: i + 1,
        label: DIMENSIONS[i],
        tier: tier,
        one_liner: "Rated " + tier + " from Phase " + (i + 1) + " evidence.",
      });
      sections.push({
        phase: i + 1,
        title: "Phase " + (i + 1) + " · " + DIMENSIONS[i],
        collapsed_summary: strip[i].one_liner,
        body: strip[i].one_liner + " Expand after the coach write-up loads, or review that phase’s results.",
      });
    }
    return {
      headline: "Simulation Complete — Your Performance Summary",
      score_strip: strip,
      sections: sections,
      source: "local-fallback",
    };
  }

  function renderAnalysis(host, debrief) {
    if (!host) return;
    var headline = escapeHtml(debrief.headline || "Simulation Complete — Your Performance Summary");
    var strip = Array.isArray(debrief.score_strip) ? debrief.score_strip : [];
    var sections = Array.isArray(debrief.sections) ? debrief.sections : [];

    var html = "";
    html += '<h3 class="sks-mb-analysis-headline">' + headline + "</h3>";

    if (strip.length) {
      html += '<ul class="sks-mb-score-strip">';
      strip.forEach(function (row) {
        html +=
          '<li class="sks-mb-score-strip-item">' +
          '<span class="sks-mb-score-phase">' +
          escapeHtml(row.label || "Phase " + row.phase) +
          "</span>" +
          '<span class="sks-mb-score-tier sks-mb-score-tier--' +
          escapeHtml(row.tier || "partial") +
          '">' +
          escapeHtml(row.tier || "partial") +
          "</span>" +
          '<span class="sks-mb-score-line">' +
          escapeHtml(row.one_liner || "") +
          "</span></li>";
      });
      html += "</ul>";
    }

    html += '<div class="sks-mb-phase-list">';
    sections.forEach(function (sec, idx) {
      var id = "sks-mb-phase-" + (sec.phase || idx + 1);
      html +=
        '<details class="sks-mb-phase-card"' +
        (idx === 0 ? "" : "") +
        ">" +
        '<summary class="sks-mb-phase-summary">' +
        '<span class="sks-mb-phase-title">' +
        escapeHtml(sec.title || "Phase " + (sec.phase || idx + 1)) +
        "</span>" +
        '<span class="sks-mb-phase-collapsed">' +
        escapeHtml(sec.collapsed_summary || "") +
        "</span></summary>" +
        '<div class="sks-mb-phase-body" id="' +
        id +
        '">' +
        escapeHtml(sec.body || "") +
        "</div></details>";
    });
    html += "</div>";

    html +=
      '<p class="sks-mb-closing" data-mb-maya-copy>' + escapeHtml(FIXED_CLOSING) + "</p>";

    host.innerHTML = html;

    host.querySelectorAll("details.sks-mb-phase-card").forEach(function (el) {
      el.addEventListener("toggle", function () {
        var evt = new CustomEvent("sks-mb-analysis-resize");
        document.dispatchEvent(evt);
      });
    });
  }

  function wireBubbleScroll(root) {
    var inner = root.querySelector(".sks-mb-bubble-inner");
    var bubble = root.querySelector(".sks-mb-bubble");
    var btn = root.querySelector("[data-mb-scroll-bubble]");
    if (!inner || !btn) return;

    function checkOverflow() {
      var overflow = inner.scrollHeight > inner.clientHeight + 2;
      if (bubble) bubble.classList.toggle("has-overflow", overflow);
      btn.hidden = !overflow;
    }

    btn.addEventListener("click", function () {
      inner.classList.add("is-expanded");
      if (bubble) bubble.classList.add("is-expanded");
      checkOverflow();
    });

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    document.addEventListener("sks-mb-analysis-resize", checkOverflow);
    return checkOverflow;
  }

  function apiBase() {
    return window.HEERISE_API_BASE || "http://localhost:8000";
  }

  async function fetchDebrief(report) {
    var cached = readJSON(sessionStorage, DEBRIEF_CACHE_KEY);
    if (cached && cached.reportSavedAt === report.savedAt && cached.debrief) {
      return cached.debrief;
    }

    try {
      var res = await fetch(apiBase() + "/api/sim/manager-debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: report }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var data = await res.json();
      writeJSON(sessionStorage, DEBRIEF_CACHE_KEY, {
        reportSavedAt: report.savedAt,
        debrief: data,
      });
      return data;
    } catch (e) {
      return localFallbackDebrief(report);
    }
  }

  async function boot() {
    var root = document.querySelector("[data-mb-root]");
    if (!root) return;

    var report = buildReport();
    var svg = root.querySelector(".sks-mb-radar-svg");
    renderRadar(svg, report.scores);

    var checkOverflow = wireBubbleScroll(root);
    var host = root.querySelector("[data-mb-analysis-body]");

    var debrief = await fetchDebrief(report);
    renderAnalysis(host, debrief);
    if (typeof checkOverflow === "function") checkOverflow();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
