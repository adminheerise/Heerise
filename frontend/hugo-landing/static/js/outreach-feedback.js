(function () {
  "use strict";

  var STORAGE_KEY = "heeriseOutreachEmailFeedback";
  var STAKEHOLDER_KEY = "heeriseOutreachStakeholderResponse";

  var CRITERIA_META = [
    { id: "subject_line", title: "Subject line", subtitle: "Stakes & Urgency" },
    { id: "context_credibility", title: "Context & credibility", subtitle: "Research & data" },
    { id: "meeting_purpose", title: "Meeting purpose", subtitle: "Outcomes & deliverables" },
    { id: "pre_call_question", title: "Pre-call question", subtitle: "Hypothesis-driven" },
    { id: "scheduling", title: "Scheduling", subtitle: "Reduce friction" },
    { id: "close", title: "Close", subtitle: "Forward momentum" },
    { id: "tone_word_count", title: "Tone & word count", subtitle: "Language & length" },
  ];

  function scoreLevel(score) {
    if (score >= 3) return "EXEMPLARY";
    if (score >= 2) return "PROFICIENT";
    return "DEVELOPING";
  }

  function levelStars(level) {
    if (level === "EXEMPLARY") return 3;
    if (level === "PROFICIENT") return 2;
    return 1;
  }

  function renderStars(container, filled, sizeClass) {
    container.innerHTML = "";
    for (var i = 1; i <= 3; i++) {
      var span = document.createElement("span");
      span.className = "oe-fb-star" + (i <= filled ? " on" : "");
      span.textContent = "\u2605";
      container.appendChild(span);
    }
  }

  function parseFeedback(feedback, score) {
    var level = scoreLevel(score);
    var text = (feedback || "").trim();
    var m = text.match(/^(DEVELOPING|PROFICIENT|EXEMPLARY)\s*[—–-]\s*(.*)$/i);
    if (m) {
      level = m[1].toUpperCase();
      text = m[2].trim();
    }
    return { level: level, text: text || feedback };
  }

  function badgeClass(level) {
    if (level === "EXEMPLARY") return "oe-fb-badge--exemplary";
    if (level === "PROFICIENT") return "oe-fb-badge--proficient";
    return "oe-fb-badge--developing";
  }

  function render(data) {
    var summary = document.getElementById("oe-fb-summary");
    var detailHead = document.getElementById("oe-fb-detail-head");
    var cards = document.getElementById("oe-fb-cards");
    var actions = document.getElementById("oe-fb-actions");
    var loading = document.getElementById("oe-fb-loading");
    var levelEl = document.getElementById("oe-fb-level");
    var starsLg = document.getElementById("oe-fb-stars-lg");

    if (!summary || !cards || !data) return;

    loading.hidden = true;
    summary.hidden = false;
    detailHead.hidden = false;
    actions.hidden = false;

    var overall = data.overall_level || "PROFICIENT";
    levelEl.textContent = overall;
    renderStars(starsLg, levelStars(overall));

    cards.innerHTML = "";
    var byId = {};
    (data.criteria || []).forEach(function (c) {
      byId[c.id] = c;
    });

    CRITERIA_META.forEach(function (meta) {
      var c = byId[meta.id] || { score: 2, feedback: "" };
      var parsed = parseFeedback(c.feedback, c.score);
      var card = document.createElement("article");
      card.className = "oe-fb-card";

      var head = document.createElement("div");
      head.className = "oe-fb-card-head";

      var titles = document.createElement("div");
      var h = document.createElement("h3");
      h.className = "oe-fb-card-title";
      h.textContent = meta.title;
      var sub = document.createElement("p");
      sub.className = "oe-fb-card-sub";
      sub.textContent = meta.subtitle;
      titles.appendChild(h);
      titles.appendChild(sub);

      var stars = document.createElement("div");
      stars.className = "oe-fb-stars-sm";
      renderStars(stars, c.score || 1);

      head.appendChild(titles);
      head.appendChild(stars);

      var badge = document.createElement("div");
      badge.className = "oe-fb-badge " + badgeClass(parsed.level);
      badge.innerHTML =
        "<strong>" + parsed.level + "</strong> \u2014 " + (parsed.text || c.feedback || "");

      card.appendChild(head);
      card.appendChild(badge);
      cards.appendChild(card);
    });

    try {
      localStorage.setItem(
        STAKEHOLDER_KEY,
        JSON.stringify({
          level: overall.toLowerCase(),
          total_score: data.total_score,
          stakeholder_response: data.stakeholder_response || "",
        })
      );
    } catch (e) {
      /* ignore */
    }
  }

  function showError(msg) {
    var loading = document.getElementById("oe-fb-loading");
    var err = document.getElementById("oe-fb-error");
    var errTxt = document.getElementById("oe-fb-error-txt");
    if (loading) loading.hidden = true;
    if (err) err.hidden = false;
    if (errTxt && msg) errTxt.textContent = msg;
  }

  function init() {
    var sampleBtn = document.getElementById("oe-fb-sample-btn");
    var sampleModal = document.getElementById("oe-fb-sample-modal");
    var sampleClose = document.getElementById("oe-fb-sample-close");

    if (sampleBtn && sampleModal) {
      sampleBtn.addEventListener("click", function () {
        if (typeof sampleModal.showModal === "function") {
          sampleModal.showModal();
        }
      });
    }
    if (sampleClose && sampleModal) {
      sampleClose.addEventListener("click", function () {
        sampleModal.close();
      });
    }

    var raw;
    try {
      raw = sessionStorage.getItem(STORAGE_KEY);
    } catch (e) {
      raw = null;
    }

    if (!raw) {
      showError("No feedback found. Please send your email first.");
      return;
    }

    try {
      render(JSON.parse(raw));
    } catch (e) {
      showError("Could not read feedback data.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
