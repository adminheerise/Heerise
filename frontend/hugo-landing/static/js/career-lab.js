/**
 * Career Lab page — tab switching + apply form handler.
 */
(function () {
  "use strict";

  var tabs = document.querySelectorAll(".cl-tab");
  var tabContents = document.querySelectorAll(".cl-tab-content");

  // Tab click handler
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var targetTab = this.getAttribute("data-tab");
      _switchTab(targetTab);
    });
  });

  function _switchTab(tabId) {
    tabs.forEach(function (t) { t.classList.remove("active"); });
    tabContents.forEach(function (c) { c.classList.remove("active"); });

    var targetContent = document.getElementById(tabId);
    if (targetContent) {
      targetContent.classList.add("active");
      // Scroll to tabs nav
      var nav = document.querySelector(".cl-tabs-nav");
      if (nav) nav.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    tabs.forEach(function (t) {
      if (t.getAttribute("data-tab") === tabId) {
        t.classList.add("active");
      }
    });
  }

  // Expose globally for onclick attributes on CTA buttons
  window.switchTab = _switchTab;

  // Apply form submission
  var API_BASE = window.HEERISE_API_BASE || "http://localhost:8000";
  var applyForm = document.getElementById("cl-apply-form");
  if (applyForm) {
    applyForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var msgEl = document.getElementById("cl-apply-message");
      var submitBtn = applyForm.querySelector('button[type="submit"]');
      var originalText = submitBtn ? submitBtn.textContent : "";

      var payload = {
        first_name: document.getElementById("cl-name").value.trim(),
        last_name: "",
        email: document.getElementById("cl-email").value.trim(),
        phone: null,
        hear_about: null,
        service_interest: "career_lab",
        message: "Career Lab Application:\n\n" + document.getElementById("cl-essay").value.trim(),
      };

      if (!payload.first_name || !payload.email || !document.getElementById("cl-essay").value.trim()) {
        showMsg("Please fill in all required fields.", "error");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
      }

      fetch(API_BASE + "/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (d) {
              throw new Error(d.detail || "Something went wrong.");
            });
          }
          return res.json();
        })
        .then(function () {
          showMsg("Thank you for your application! We'll review it and get back to you within 24-48 hours.", "success");
          applyForm.reset();
        })
        .catch(function (err) {
          showMsg(err.message || "Failed to submit. Please try again later.", "error");
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        });

      function showMsg(text, type) {
        if (!msgEl) return;
        msgEl.textContent = text;
        msgEl.className = "cl-apply-feedback cl-apply-feedback-" + type;
        msgEl.style.display = "block";
        msgEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }
})();
