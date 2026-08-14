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
          ["phase-research", "stakeholder-kickoff-research", "stakeholder-kickoff-research-workspace"],
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

  var PHASE_REVIEW = {
    1: { href: "/acc/stakeholder-kickoff/gap-analysis/", label: "Review Gap Analysis" },
    2: { href: "/acc/stakeholder-kickoff/research/workspace/", label: "Review Research" },
    3: { href: "/acc/stakeholder-kickoff/outreach/compose/", label: "Review Outreach Email" },
    4: { href: "/acc/stakeholder-kickoff/agenda/build/", label: "Review Agenda Design" },
    5: { href: "/acc/stakeholder-kickoff/kickoff/intro/", label: "Retry Kick-off Call" },
  };

  function needsRevise(tier) {
    return tier === "weak" || tier === "partial";
  }

  function tierFromStrip(debrief, phase) {
    var strip = Array.isArray(debrief.score_strip) ? debrief.score_strip : [];
    for (var i = 0; i < strip.length; i++) {
      if (Number(strip[i].phase) === Number(phase)) return String(strip[i].tier || "partial").toLowerCase();
    }
    return "partial";
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
        var tier = String(row.tier || "partial").toLowerCase();
        var revise = needsRevise(tier);
        var badge = revise
          ? '<span class="sks-mb-revise-badge">' +
            (tier === "weak" ? "Needs revision" : "Room to improve") +
            "</span>"
          : "";
        var review = PHASE_REVIEW[row.phase];
        var reviseLink =
          revise && review
            ? '<a class="sks-mb-revise-link" href="' +
              escapeHtml(review.href) +
              '">' +
              escapeHtml(review.label) +
              " →</a>"
            : "";
        html +=
          '<li class="sks-mb-score-strip-item' +
          (revise ? " sks-mb-score-strip-item--revise sks-mb-score-strip-item--" + tier : "") +
          '">' +
          '<span class="sks-mb-score-phase">' +
          escapeHtml(row.label || "Phase " + row.phase) +
          badge +
          "</span>" +
          '<span class="sks-mb-score-tier sks-mb-score-tier--' +
          escapeHtml(tier) +
          '">' +
          escapeHtml(tier) +
          "</span>" +
          '<span class="sks-mb-score-line">' +
          escapeHtml(row.one_liner || "") +
          reviseLink +
          "</span></li>";
      });
      html += "</ul>";
    }

    html += '<div class="sks-mb-phase-list">';
    sections.forEach(function (sec, idx) {
      var id = "sks-mb-phase-" + (sec.phase || idx + 1);
      var phase = sec.phase || idx + 1;
      var tier = tierFromStrip(debrief, phase);
      var revise = needsRevise(tier);
      var openAttr = revise ? " open" : "";
      var review = PHASE_REVIEW[phase];
      var bodyExtra =
        revise && review
          ? '\n\n<a class="sks-mb-revise-link" href="' +
            escapeHtml(review.href) +
            '">' +
            escapeHtml(review.label) +
            " →</a>"
          : "";
      html +=
        '<details class="sks-mb-phase-card' +
        (revise ? " sks-mb-phase-card--revise sks-mb-phase-card--" + tier : "") +
        '"' +
        openAttr +
        ">" +
        '<summary class="sks-mb-phase-summary">' +
        '<span class="sks-mb-phase-title">' +
        escapeHtml(sec.title || "Phase " + phase) +
        (revise
          ? ' <span class="sks-mb-revise-badge">' +
            (tier === "weak" ? "Needs revision" : "Room to improve") +
            "</span>"
          : "") +
        "</span>" +
        '<span class="sks-mb-phase-collapsed">' +
        escapeHtml(sec.collapsed_summary || "") +
        "</span></summary>" +
        '<div class="sks-mb-phase-body" id="' +
        id +
        '">' +
        escapeHtml(sec.body || "") +
        bodyExtra +
        "</div></details>";
    });
    html += "</div>";

    html +=
      '<p class="sks-mb-closing" data-mb-maya-copy>' + escapeHtml(FIXED_CLOSING) + "</p>";

    host.innerHTML = html;
  }

  function countTiers(debrief) {
    var counts = { strong: 0, partial: 0, weak: 0 };
    (debrief.score_strip || []).forEach(function (row) {
      var t = String(row.tier || "partial").toLowerCase();
      if (counts[t] == null) counts.partial += 1;
      else counts[t] += 1;
    });
    return counts;
  }

  function renderClosingStats(el, debrief) {
    if (!el) return;
    var c = countTiers(debrief);
    el.innerHTML =
      '<li class="sks-mb-closing-stat sks-mb-closing-stat--strong"><span class="sks-mb-closing-stat-n">' +
      c.strong +
      '</span><span class="sks-mb-closing-stat-l">Strong</span></li>' +
      '<li class="sks-mb-closing-stat sks-mb-closing-stat--partial"><span class="sks-mb-closing-stat-n">' +
      c.partial +
      '</span><span class="sks-mb-closing-stat-l">Partial</span></li>' +
      '<li class="sks-mb-closing-stat sks-mb-closing-stat--weak"><span class="sks-mb-closing-stat-n">' +
      c.weak +
      '</span><span class="sks-mb-closing-stat-l">Weak</span></li>';
  }

  function startFireworks(canvas) {
    if (!canvas || !canvas.getContext) return function () {};
    var ctx = canvas.getContext("2d");
    var particles = [];
    var rockets = [];
    var running = true;
    var raf = 0;
    var colors = ["#017AFF", "#67E8F9", "#FBBF24", "#F472B6", "#34D399", "#A78BFA", "#F87171"];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function spawnRocket() {
      rockets.push({
        x: Math.random() * canvas.width * 0.7 + canvas.width * 0.15,
        y: canvas.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(Math.random() * 5 + 8),
        color: colors[(Math.random() * colors.length) | 0],
      });
    }

    function explode(x, y, color) {
      for (var i = 0; i < 36; i++) {
        var a = (Math.PI * 2 * i) / 36 + Math.random() * 0.2;
        var sp = Math.random() * 3.5 + 1.2;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          color: color,
        });
      }
    }

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (rockets.length < 3 && Math.random() < 0.06) spawnRocket();

      for (var r = rockets.length - 1; r >= 0; r--) {
        var rocket = rockets[r];
        rocket.x += rocket.vx;
        rocket.y += rocket.vy;
        rocket.vy += 0.08;
        ctx.beginPath();
        ctx.fillStyle = rocket.color;
        ctx.arc(rocket.x, rocket.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        if (rocket.vy >= -1 || rocket.y < canvas.height * 0.28) {
          explode(rocket.x, rocket.y, rocket.color);
          rockets.splice(r, 1);
        }
      }

      for (var p = particles.length - 1; p >= 0; p--) {
        var part = particles[p];
        part.x += part.vx;
        part.y += part.vy;
        part.vy += 0.04;
        part.life -= 0.016;
        if (part.life <= 0) {
          particles.splice(p, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, part.life);
        ctx.beginPath();
        ctx.fillStyle = part.color;
        ctx.arc(part.x, part.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    for (var i = 0; i < 2; i++) spawnRocket();
    tick();

    return function stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
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

  function openClosing(root, debrief) {
    var screen = root.querySelector("#sks-mb-closing");
    var canvas = root.querySelector("#sks-mb-fireworks");
    var stats = root.querySelector("[data-mb-closing-stats]");
    if (!screen) return;
    renderClosingStats(stats, debrief);
    screen.hidden = false;
    screen.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    startFireworks(canvas);
  }

  async function boot() {
    var root = document.querySelector("[data-mb-root]");
    if (!root) return;

    var report = buildReport();
    var svg = root.querySelector(".sks-mb-radar-svg");
    renderRadar(svg, report.scores);

    var host = root.querySelector("[data-mb-analysis-body]");
    var debrief = await fetchDebrief(report);
    renderAnalysis(host, debrief);

    var finishBtn = root.querySelector("[data-mb-finish]");
    if (finishBtn) {
      finishBtn.addEventListener("click", function () {
        openClosing(root, debrief);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
