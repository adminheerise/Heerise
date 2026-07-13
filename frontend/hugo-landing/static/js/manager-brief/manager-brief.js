/**
 * Phase 6 — Manager Brief: Maya debrief + performance radar snapshot.
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

  var DEFAULT_SCORES = [3, 2, 3, 2, 2];
  var MAX_SCORE = 3;
  var RADAR_KEY = "heerise_manager_brief_radar";

  function readJSON(storage, key) {
    try {
      var raw = storage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function outreachScore() {
    var data = readJSON(sessionStorage, "heeriseOutreachEmailFeedback");
    if (!data) return null;
    var total = data.total_score;
    if (typeof total !== "number") return null;
    if (total >= 18) return 3;
    if (total >= 14) return 2;
    return 1;
  }

  function agendaScore() {
    var data = readJSON(sessionStorage, "heerise_agenda_result");
    if (!data || data.stars == null) return null;
    return Math.max(1, Math.min(3, Number(data.stars) || 2));
  }

  function kickoffScore() {
    var data = readJSON(localStorage, "heerise_kickoff_result");
    if (!data || data.stars == null) return null;
    return Math.max(1, Math.min(3, Number(data.stars) || 2));
  }

  function computeScores() {
    var scores = DEFAULT_SCORES.slice();
    var outreach = outreachScore();
    var agenda = agendaScore();
    var kickoff = kickoffScore();

    if (outreach != null) scores[2] = outreach;
    if (agenda != null) scores[3] = agenda;
    if (kickoff != null) scores[4] = kickoff;

    try {
      localStorage.setItem(
        RADAR_KEY,
        JSON.stringify({ v: 1, dimensions: DIMENSIONS, scores: scores, savedAt: Date.now() })
      );
    } catch (e) {}

    return scores;
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
    });

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
  }

  function boot() {
    var root = document.querySelector("[data-mb-root]");
    if (!root) return;

    var scores = computeScores();
    var svg = root.querySelector(".sks-mb-radar-svg");
    renderRadar(svg, scores);

    wireBubbleScroll(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
