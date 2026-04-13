(function () {
  var STORAGE_KEY = "heeriseResearchWorkspaceQ";
  var cards = document.querySelectorAll(".sks-rw-card");
  var panels = document.querySelectorAll(".sks-rw-panel");
  var detailsList = document.querySelectorAll(".sks-rw-q[data-qid]");
  var continueEl = document.getElementById("sks-rw-continue");
  var TOTAL_PER = 4;
  var CATS = ["product", "audience", "stakeholders", "constraints"];

  if (!cards.length || !panels.length) return;

  function loadDone() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return o && typeof o === "object" ? o : {};
    } catch (e) {
      return {};
    }
  }

  function saveDone(doneMap) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doneMap));
    } catch (e) {}
  }

  /** doneMap: { "product-0": true, ... } */
  var doneMap = loadDone();

  function countFor(cat) {
    var n = 0;
    for (var i = 0; i < TOTAL_PER; i++) {
      if (doneMap[cat + "-" + i]) n += 1;
    }
    return n;
  }

  function allCategoriesComplete() {
    return CATS.every(function (c) {
      return countFor(c) >= TOTAL_PER;
    });
  }

  function syncCardLabels() {
    cards.forEach(function (card) {
      var cat = card.getAttribute("data-category");
      if (!cat) return;
      var el = card.querySelector(".sks-rw-card-n");
      if (el) el.textContent = String(countFor(cat));
    });
  }

  function syncContinue() {
    if (!continueEl) return;
    var ok = allCategoriesComplete();
    continueEl.classList.toggle("sks-rw-continue--ready", ok);
    continueEl.setAttribute("aria-disabled", ok ? "false" : "true");
    continueEl.tabIndex = ok ? 0 : -1;
  }

  function markDetailsDone(details) {
    details.classList.add("sks-rw-q--done");
  }

  function applyRestoredState() {
    detailsList.forEach(function (details) {
      var qid = details.getAttribute("data-qid");
      if (!qid || !doneMap[qid]) return;
      details.dataset.counted = "1";
      markDetailsDone(details);
    });
    syncCardLabels();
    syncContinue();
  }

  function onQuestionOpened(details) {
    var qid = details.getAttribute("data-qid");
    if (!qid || details.dataset.counted === "1") return;
    details.dataset.counted = "1";
    doneMap[qid] = true;
    saveDone(doneMap);
    markDetailsDone(details);
    syncCardLabels();
    syncContinue();
  }

  /** Show only the four questions for the selected module; collapse open rows in other modules. */
  function activate(id) {
    if (!id) return;
    cards.forEach(function (c) {
      var on = c.getAttribute("data-category") === id;
      c.classList.toggle("sks-rw-card--active", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
    panels.forEach(function (p) {
      var match = p.getAttribute("data-panel") === id;
      p.hidden = !match;
      if (!match) {
        p.querySelectorAll("details.sks-rw-q").forEach(function (d) {
          d.removeAttribute("open");
        });
      }
    });
  }

  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      var cid = card.getAttribute("data-category");
      if (cid) activate(cid);
    });
  });

  detailsList.forEach(function (details) {
    details.addEventListener("toggle", function () {
      if (details.open) onQuestionOpened(details);
    });
  });

  document.querySelectorAll(".sks-rw-q-add").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
    });
  });

  if (continueEl && continueEl.tagName === "A") {
    continueEl.addEventListener("click", function (ev) {
      if (!continueEl.classList.contains("sks-rw-continue--ready")) {
        ev.preventDefault();
      }
    });
  }

  applyRestoredState();
  activate("product");
})();
