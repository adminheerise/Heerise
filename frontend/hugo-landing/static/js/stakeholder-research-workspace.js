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
      if (!qid) return;
      if (addedMap[qid]) ensureAddedTag(details);
      if (!doneMap[qid]) return;
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

  /* ------------------------------------------------------------------
   * Stakeholder Question modal: adds a "+ Add a Question for the Kick-off Call"
   * link to every question summary and, on submit, appends a formatted
   * "Stakeholder Questions" block to the Notes for this page.
   * ---------------------------------------------------------------- */

  var STAKEHOLDER_LABELS = {
    jordan: "Jordan Kim",
    priya: "Dr. Priya Nair",
    team: "The Whole Team",
  };

  var STAKEHOLDER_ROLES = {
    jordan: "Sales Manager (Client)",
    priya: "SME / Product Lead",
    team: "Jordan & Priya",
  };

  /**
   * Follow-up link placement:
   *   • ONE single active "+Add a follow-up question to the Stakeholder Interview"
   *     button exists. It is moved (via appendChild/insertBefore) into the summary
   *     row of the most recently opened, *unsubmitted* question. Opening a new
   *     unsubmitted question moves the button off the previous one automatically.
   *   • Every submitted question gets its own permanent green "Follow Up Question
   *     Added!" tag in its summary row (independent of the moving button).
   */
  var ADDED_KEY = "heeriseResearchWorkspaceFollowUps";
  var addedMap = loadAddedMap();

  function loadAddedMap() {
    try {
      var raw = localStorage.getItem(ADDED_KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return o && typeof o === "object" ? o : {};
    } catch (e) { return {}; }
  }

  function saveAddedMap() {
    try { localStorage.setItem(ADDED_KEY, JSON.stringify(addedMap)); } catch (e) {}
  }

  // Single active (unsubmitted) button — moves between questions.
  var activeAddBtn = document.createElement("a");
  activeAddBtn.href = "#";
  activeAddBtn.className = "sks-rw-q-follow sks-rw-q-follow--active";
  activeAddBtn.innerHTML = "+Add a follow-up question to the <strong>Stakeholder Interview</strong>";
  activeAddBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    var host = activeAddBtn.closest("details.sks-rw-q");
    if (!host) return;
    var qid = host.getAttribute("data-qid") || "";
    if (addedMap[qid]) return;
    openModal(qid);
  });

  function detachActiveBtn() {
    if (activeAddBtn.parentNode) {
      activeAddBtn.parentNode.removeChild(activeAddBtn);
    }
  }

  function attachActiveBtnTo(details) {
    if (!details) return;
    var qid = details.getAttribute("data-qid") || "";
    if (addedMap[qid]) return; // submitted questions keep only the green tag
    var summary = details.querySelector(".sks-rw-q-sum");
    if (!summary) return;
    var chev = summary.querySelector(".sks-rw-q-chev");
    if (chev) summary.insertBefore(activeAddBtn, chev);
    else summary.appendChild(activeAddBtn);
  }

  function ensureAddedTag(details) {
    if (!details) return;
    var summary = details.querySelector(".sks-rw-q-sum");
    if (!summary) return;
    if (summary.querySelector(".sks-rw-q-follow--added")) return;
    var qid = details.getAttribute("data-qid") || "";
    var tag = document.createElement("span");
    tag.className = "sks-rw-q-follow sks-rw-q-follow--added";
    tag.textContent = "Follow Up Question Added!";
    tag.setAttribute("data-for-qid", qid);
    var chev = summary.querySelector(".sks-rw-q-chev");
    if (chev) summary.insertBefore(tag, chev);
    else summary.appendChild(tag);
  }

  var modal = document.getElementById("sks-rw-qmodal");
  var form = document.getElementById("sks-rw-qmodal-form");
  var ddRoot = modal && modal.querySelector(".sks-rw-qmodal-dd");
  var ddBtn = document.getElementById("sks-rw-qmodal-who-btn");
  var ddList = modal && modal.querySelector(".sks-rw-qmodal-dd-list");
  var ddName = modal && modal.querySelector(".sks-rw-qmodal-dd-btn .sks-rw-qmodal-dd-name");
  var ddRole = modal && modal.querySelector(".sks-rw-qmodal-dd-btn .sks-rw-qmodal-dd-role");
  var ddAvatar = modal && modal.querySelector(".sks-rw-qmodal-dd-btn .sks-rw-qmodal-dd-avatar");
  var whatEl = document.getElementById("sks-rw-qmodal-what");
  var whyEl = document.getElementById("sks-rw-qmodal-why");
  var submitBtn = document.getElementById("sks-rw-qmodal-submit");

  var activeQid = null;
  function openModal(qid) {
    if (!modal) return;
    activeQid = qid || null;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("sks-rw-qmodal-open");
    setTimeout(function () {
      if (whatEl) {
        try { whatEl.focus({ preventScroll: true }); } catch (e) { whatEl.focus(); }
      }
    }, 30);
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("sks-rw-qmodal-open");
    closeDropdown();
  }

  function resetModal() {
    if (whatEl) whatEl.value = "";
    if (whyEl) whyEl.value = "";
    setSelectedStakeholder("jordan");
  }

  function setSelectedStakeholder(value) {
    if (!ddRoot) return;
    ddRoot.setAttribute("data-value", value);
    var label = STAKEHOLDER_LABELS[value] || value;
    var role = STAKEHOLDER_ROLES[value] || "";
    if (ddName) ddName.textContent = label;
    if (ddRole) ddRole.textContent = role;
    if (ddAvatar) {
      ddAvatar.className =
        "sks-rw-qmodal-dd-avatar sks-rw-qmodal-dd-avatar--" + value;
    }
    if (ddList) {
      ddList.querySelectorAll(".sks-rw-qmodal-dd-opt").forEach(function (o) {
        var on = o.getAttribute("data-value") === value;
        o.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
  }

  function openDropdown() {
    if (!ddList || !ddBtn) return;
    ddList.hidden = false;
    ddBtn.setAttribute("aria-expanded", "true");
  }

  function closeDropdown() {
    if (!ddList || !ddBtn) return;
    ddList.hidden = true;
    ddBtn.setAttribute("aria-expanded", "false");
  }

  function toggleDropdown() {
    if (!ddList) return;
    if (ddList.hidden) openDropdown();
    else closeDropdown();
  }

  function formatNoteBlock(whoValue, whatText, whyText) {
    var who = STAKEHOLDER_LABELS[whoValue] || whoValue;
    var role = STAKEHOLDER_ROLES[whoValue] || "";
    var whoLine = role ? who + " (" + role + ")" : who;
    var lines = [];
    lines.push("Stakeholder Questions");
    lines.push("Who:     " + whoLine);
    lines.push("What:    " + (whatText || "").trim());
    lines.push("Why Ask: " + (whyText || "").trim());
    return lines.join("\n");
  }

  function currentPageId() {
    var root = document.getElementById("lumina-sim-notes-root");
    return (root && root.getAttribute("data-lumina-page-id")) || "stakeholder-kickoff-research-workspace";
  }

  function appendToNotes(block) {
    var text = block + "\n\n";
    var api = window.LuminaSimNotes;
    if (api && typeof api.appendHere === "function") {
      api.appendHere(text);
      return true;
    }
    // Fallback: mutate localStorage directly so the note survives page reloads.
    try {
      var key = "heerise_lumina_sim_notes_v1";
      var raw = window.localStorage.getItem(key);
      var state = raw ? JSON.parse(raw) : { v: 1, tabs: [], activeTabKey: null, panelFloat: null };
      if (!state || state.v !== 1 || !Array.isArray(state.tabs)) {
        state = { v: 1, tabs: [], activeTabKey: null, panelFloat: null };
      }
      var pid = currentPageId();
      var tab = null;
      for (var i = 0; i < state.tabs.length; i++) {
        if (state.tabs[i].key === pid) { tab = state.tabs[i]; break; }
      }
      if (!tab) {
        tab = { key: pid, label: pid, text: "" };
        state.tabs.push(tab);
      }
      tab.text = (tab.text || "") + text;
      state.activeTabKey = pid;
      window.localStorage.setItem(key, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    var whoValue = (ddRoot && ddRoot.getAttribute("data-value")) || "jordan";
    var whatText = (whatEl && whatEl.value) || "";
    var whyText = (whyEl && whyEl.value) || "";
    if (!whatText.trim()) {
      if (whatEl) { whatEl.focus(); whatEl.classList.add("sks-rw-qmodal-textarea--err"); }
      return;
    }
    var block = formatNoteBlock(whoValue, whatText, whyText);
    appendToNotes(block);

    // Lock in the green "Added!" tag for this question, remove the active button
    // from this question (since it's now submitted).
    if (activeQid) {
      addedMap[activeQid] = true;
      saveAddedMap();
      detachActiveBtn();
      var host = document.querySelector('details.sks-rw-q[data-qid="' + activeQid + '"]');
      if (host) ensureAddedTag(host);
    }
    closeModal();
    resetModal();
    activeQid = null;
  }

  // Move the single active button to whichever question is most recently opened.
  // Submitted questions do not receive the active button (they keep the green tag).
  detailsList.forEach(function (details) {
    details.addEventListener("toggle", function () {
      if (!details.open) return;
      var qid = details.getAttribute("data-qid") || "";
      if (addedMap[qid]) {
        // Submitted: ensure the permanent tag exists, leave active button as-is.
        ensureAddedTag(details);
      } else {
        attachActiveBtnTo(details);
      }
    });
    if (details.open) {
      var qid0 = details.getAttribute("data-qid") || "";
      if (addedMap[qid0]) ensureAddedTag(details);
      else attachActiveBtnTo(details);
    }
  });

  if (modal) {
    modal.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.getAttribute && t.getAttribute("data-sks-rw-qmodal-close") !== null) {
        closeModal();
      }
    });
  }
  if (ddBtn) {
    ddBtn.addEventListener("click", function (e) {
      e.preventDefault();
      toggleDropdown();
    });
  }
  if (ddList) {
    ddList.querySelectorAll(".sks-rw-qmodal-dd-opt").forEach(function (opt) {
      opt.addEventListener("click", function () {
        setSelectedStakeholder(opt.getAttribute("data-value"));
        closeDropdown();
      });
    });
  }
  document.addEventListener("click", function (e) {
    if (!ddRoot || !ddList || ddList.hidden) return;
    if (!ddRoot.contains(e.target)) closeDropdown();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && !modal.hidden) closeModal();
  });
  if (whatEl) {
    whatEl.addEventListener("input", function () {
      whatEl.classList.remove("sks-rw-qmodal-textarea--err");
    });
  }
  if (form) form.addEventListener("submit", onSubmit);
  if (submitBtn) submitBtn.addEventListener("click", function (e) {
    // Guarantee submit works even if form's native submit is suppressed.
    if (!form) { e.preventDefault(); onSubmit(e); }
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
