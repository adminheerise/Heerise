/**
 * Phase 5 kickoff result page — read heerise_kickoff_result, fallback ?tier=
 */
(function () {
  "use strict";

  var C = window.HeeriseKickoffConstants;
  var store = window.HeeriseStorageTTL;

  function hydrate() {
    var root = document.querySelector("[data-kc-result-root]");
    if (!root || !C) return;

    var payload = store.getJSON(C.RESULT_KEY);
    var tierKey = "strong";
    if (payload && payload.overall_tier) {
      tierKey = payload.overall_tier.toLowerCase();
    } else {
      var params = new URLSearchParams(window.location.search);
      tierKey = (params.get("tier") || "strong").toLowerCase();
      if (payload && payload.feedback) {
        /* use stored */
      } else if (C.TIERS[tierKey]) {
        payload = {
          overall_tier: C.TIERS[tierKey].label,
          stars: C.TIERS[tierKey].stars,
          feedback: C.TIERS[tierKey].feedback,
        };
      }
    }

    if (!C.TIERS[tierKey]) tierKey = "strong";
    var tier = payload || {};
    var stars = tier.stars != null ? tier.stars : C.TIERS[tierKey].stars;
    var label = tier.overall_tier || C.TIERS[tierKey].label;
    var feedback = tier.feedback || C.TIERS[tierKey].feedback;
    if (payload && payload.status === "SIMULATION_TERMINATED_GEMINI_FAILURE") {
      feedback =
        feedback +
        " The simulation ended early because a stakeholder response could not be generated. Your rating reflects the conversation up to that point.";
    } else if (payload && payload.status === "SIMULATION_TERMINATED_IDLE") {
      feedback =
        feedback +
        " The call ended because there was no response for an extended period. In a real kickoff, keeping the conversation moving is part of meeting leadership.";
    }

    var labelEl = root.querySelector("[data-kc-tier-label]");
    var feedbackEl = root.querySelector("[data-kc-feedback]");
    var feedbackText = root.querySelector("[data-kc-feedback-text]");
    var starsMount = root.querySelector("[data-kc-stars-mount]");

    if (labelEl) labelEl.textContent = label;
    if (feedbackText) feedbackText.textContent = feedback;
    if (feedbackEl) {
      feedbackEl.classList.remove("sks-kcr-feedback--strong", "sks-kcr-feedback--partial", "sks-kcr-feedback--weak");
      feedbackEl.classList.add("sks-kcr-feedback--" + tierKey);
    }
    if (starsMount) {
      var starEls = starsMount.querySelectorAll(".sks-emr-star");
      for (var i = 0; i < starEls.length; i++) {
        starEls[i].classList.toggle("is-dim", i >= stars);
      }
    }

    var continueEl = root.querySelector("[data-kc-continue]");
    if (continueEl && C.MANAGER_BRIEF_PATH) {
      continueEl.setAttribute("href", C.MANAGER_BRIEF_PATH);
      continueEl.textContent = "Continue to Analysis";
    }
  }

  document.addEventListener("DOMContentLoaded", hydrate);
})();
