(function () {
  /** Answer key aligned with CC-01 (Confirmed Facts / Research / Stakeholder) */
  var CORRECT = {
    c1: "known",
    c2: "research",
    c3: "stakeholder",
    c4: "research",
    c5: "research",
    c6: "stakeholder",
    c7: "research",
    c8: "known",
  };

  /** Under each incorrect card (partial success) */
  var FEEDBACK = {
    c1:
      "This is a confirmed product fact from the brief—it belongs under Known Information.",
    c2:
      "This is organizational benchmark data that should be researched independently before the call.",
    c3:
      "This is a stakeholder-specific expectation that must be surfaced directly during the kickoff call.",
    c4:
      "This is demographic data that can be investigated through independent research before the meeting.",
    c5:
      "You can look for existing internal training records or documentation to find this information independently.",
    c6:
      "Dr. Nair’s view of ‘good’ training is a stakeholder perspective—ask her in the kickoff, not a generic fact.",
    c7:
      "What’s already been tried can be uncovered from documents, SMEs, and history—Research.",
    c8:
      "Review the project brief to see if you can find this information.",
  };

  var grid = document.getElementById("sks-gap-mid-grid");
  var gapBody = document.getElementById("sks-gap-body");
  var midLabel = document.getElementById("sks-gap-mid-label");
  var actionBtn = document.getElementById("sks-gap-action");
  var successPanel = document.getElementById("sks-gap-success-panel");
  var zonesShell = document.getElementById("sks-gap-zones-shell");
  var coachTop = document.getElementById("sks-gap-coach-top");
  var coachTopCc02 = document.getElementById("sks-gap-coach-top-cc02");
  var coachTopCc03 = document.getElementById("sks-gap-coach-top-cc03");
  var zones = document.querySelectorAll(".sks-gap-zone");
  var slots = document.querySelectorAll(".sks-gap-slot");
  var submitted = false;

  if (!grid || !actionBtn) return;

  function setActionRetry() {
    actionBtn.hidden = false;
    actionBtn.dataset.phase = "retry";
    actionBtn.textContent = "RETRY";
    actionBtn.setAttribute("aria-label", "Retry and reset categorization");
    actionBtn.classList.add("sks-gap-action--retry");
  }

  function setActionSubmit() {
    actionBtn.hidden = false;
    actionBtn.dataset.phase = "submit";
    actionBtn.textContent = "SUBMIT";
    actionBtn.setAttribute("aria-label", "Submit categorization");
    actionBtn.classList.remove("sks-gap-action--retry");
  }

  function allowDrop(e) {
    e.preventDefault();
  }

  function handleDragStart(e) {
    if (submitted) {
      e.preventDefault();
      return;
    }
    var card = e.target.closest(".sks-gap-card");
    if (!card) return;
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.effectAllowed = "move";
    card.classList.add("sks-gap-card--dragging");
  }

  function handleDragEnd(e) {
    var card = e.target.closest(".sks-gap-card");
    if (card) card.classList.remove("sks-gap-card--dragging");
  }

  function handleDrop(e) {
    e.preventDefault();
    if (submitted) return;
    var id = e.dataTransfer.getData("text/plain");
    var dragged = document.getElementById(id);
    if (!dragged) return;
    var target = e.currentTarget;

    if (target.classList.contains("sks-gap-card")) {
      e.stopPropagation();
      if (dragged === target) return;
      target.parentNode.insertBefore(dragged, target);
      updateCounts();
      return;
    }

    if (target.classList.contains("sks-gap-slot")) {
      var existing = target.querySelector(".sks-gap-card");
      if (existing && existing !== dragged) {
        var from = dragged.parentElement;
        if (from.classList.contains("sks-gap-zone")) {
          from.appendChild(existing);
        } else if (from.classList.contains("sks-gap-slot")) {
          from.appendChild(existing);
        }
      }
      target.appendChild(dragged);
      updateCounts();
      return;
    }

    if (target.classList.contains("sks-gap-zone")) {
      target.appendChild(dragged);
      updateCounts();
    }
  }

  function updateCounts() {
    zones.forEach(function (zone) {
      var n = zone.querySelectorAll(".sks-gap-card").length;
      var el = zone.querySelector(".sks-gap-zone-count");
      if (el) el.textContent = n > 0 ? "(" + n + ")" : "";
    });
  }

  function clearFeedback(card) {
    var fb = card.querySelector(".sks-gap-card-feedback");
    if (fb) fb.remove();
    card.classList.remove(
      "sks-gap-card--correct",
      "sks-gap-card--incorrect",
      "sks-gap-card--unplaced"
    );
  }

  function hideSuccessPanel() {
    if (successPanel) successPanel.hidden = true;
    if (zonesShell) zonesShell.classList.remove("sks-gap-zones-shell--success");
    if (gapBody) gapBody.classList.remove("sks-gap-body--success-all");
  }

  function hideCoachTop() {
    if (coachTop) coachTop.hidden = true;
    if (coachTopCc02) coachTopCc02.hidden = true;
    if (coachTopCc03) coachTopCc03.hidden = true;
    if (gapBody) {
      gapBody.classList.remove("sks-gap-body--post-submit");
    }
    if (midLabel) midLabel.hidden = false;
    if (grid) grid.hidden = false;
  }

  function showCoachTopPartial() {
    hideSuccessPanel();
    hideCoachTop();
    if (coachTop) coachTop.hidden = false;
    if (coachTopCc02) coachTopCc02.hidden = false;
    if (gapBody) gapBody.classList.add("sks-gap-body--post-submit");
    if (midLabel) midLabel.hidden = true;
    if (grid) grid.hidden = true;
    if (coachTop) coachTop.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showCoachTopRetry() {
    hideSuccessPanel();
    hideCoachTop();
    if (coachTop) coachTop.hidden = false;
    if (coachTopCc03) coachTopCc03.hidden = false;
    if (gapBody) gapBody.classList.add("sks-gap-body--post-submit");
    if (midLabel) midLabel.hidden = true;
    if (grid) grid.hidden = true;
    if (coachTop) coachTop.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showSuccessPanel() {
    hideCoachTop();
    if (successPanel) successPanel.hidden = false;
    if (gapBody) {
      gapBody.classList.add("sks-gap-body--post-submit");
      gapBody.classList.add("sks-gap-body--success-all");
    }
    if (midLabel) midLabel.hidden = true;
    if (grid) grid.hidden = true;
    if (zonesShell) zonesShell.classList.add("sks-gap-zones-shell--success");
    if (successPanel)
      successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function hideAllCoaching() {
    hideSuccessPanel();
    hideCoachTop();
  }

  function runSubmit() {
    if (submitted) return;
    submitted = true;

    var anyUnplaced = false;
    var anyIncorrect = false;

    document.querySelectorAll(".sks-gap-card").forEach(function (card) {
      clearFeedback(card);
      var id = card.id;
      var expected = CORRECT[id];
      var inSlot = card.closest(".sks-gap-slot");

      if (inSlot) {
        card.classList.add("sks-gap-card--unplaced");
        anyUnplaced = true;
        return;
      }

      var zoneEl = card.closest(".sks-gap-zone");
      if (!zoneEl) return;
      var got = zoneEl.getAttribute("data-zone");
      if (got === expected) {
        card.classList.add("sks-gap-card--correct");
      } else {
        anyIncorrect = true;
        card.classList.add("sks-gap-card--incorrect");
        var wrap = document.createElement("div");
        wrap.className = "sks-gap-card-feedback";
        wrap.setAttribute("role", "status");
        var msg = FEEDBACK[id] || "Try moving this to a different column.";
        wrap.innerHTML =
          '<span class="sks-gap-card-feedback-ico" aria-hidden="true">\u00d7</span><span class="sks-gap-card-feedback-txt"></span>';
        wrap.querySelector(".sks-gap-card-feedback-txt").textContent = msg;
        card.appendChild(wrap);
      }
    });

    if (anyUnplaced) {
      showCoachTopRetry();
      setActionRetry();
    } else if (!anyIncorrect) {
      showSuccessPanel();
      setActionRetry();
    } else {
      showCoachTopPartial();
      setActionRetry();
    }
  }

  function runRetry() {
    submitted = false;
    hideAllCoaching();
    document.querySelectorAll(".sks-gap-card").forEach(function (card) {
      clearFeedback(card);
    });
    var order = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];
    order.forEach(function (cid, i) {
      var card = document.getElementById(cid);
      var slot = slots[i];
      if (card && slot) slot.appendChild(card);
    });
    updateCounts();
    setActionSubmit();
  }

  function wireCard(card) {
    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("dragend", handleDragEnd);
    card.addEventListener("dragover", allowDrop);
    card.addEventListener("drop", handleDrop);
    card.setAttribute("draggable", "true");
  }

  document.querySelectorAll(".sks-gap-card").forEach(wireCard);

  Array.prototype.forEach.call(slots, function (slot) {
    slot.addEventListener("dragover", allowDrop);
    slot.addEventListener("drop", handleDrop);
  });

  Array.prototype.forEach.call(zones, function (zone) {
    zone.addEventListener("dragover", allowDrop);
    zone.addEventListener("drop", handleDrop);
  });

  actionBtn.addEventListener("click", function () {
    if (actionBtn.dataset.phase === "retry") {
      runRetry();
      return;
    }
    runSubmit();
  });

  updateCounts();
})();
