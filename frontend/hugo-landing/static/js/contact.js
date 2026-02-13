/**
 * Contact form handler.
 * Submits the form via fetch() to the FastAPI backend POST /contact endpoint.
 * Shows success/error feedback inline.
 */
(function () {
  "use strict";

  // API base: same origin in production (/api), explicit in dev
  var API_BASE = window.HEERISE_API_BASE || "http://localhost:8000";

  var form = document.getElementById("contact-form");
  if (!form) return;

  var msgEl = document.getElementById("contact-message");
  var submitBtn = form.querySelector('button[type="submit"]');
  var originalBtnText = submitBtn ? submitBtn.textContent : "SEND";

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Collect form data
    var payload = {
      first_name: form.querySelector("#first-name").value.trim(),
      last_name: form.querySelector("#last-name").value.trim(),
      email: form.querySelector("#email").value.trim(),
      phone: form.querySelector("#phone").value.trim() || null,
      hear_about: form.querySelector("#hear-about").value || null,
      service_interest: null,
      message: form.querySelector("#message").value.trim(),
    };

    // Get selected service interests (checkboxes)
    var checkedBoxes = form.querySelectorAll('input[name="service_interest"]:checked');
    if (checkedBoxes.length > 0) {
      var interests = [];
      checkedBoxes.forEach(function (cb) { interests.push(cb.value); });
      payload.service_interest = interests.join(", ");
    }

    // Validate required fields
    if (!payload.first_name || !payload.last_name || !payload.email || !payload.message) {
      showMessage("Please fill in all required fields.", "error");
      return;
    }

    // Disable button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    fetch(API_BASE + "/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (data) {
            throw new Error(data.detail || "Something went wrong. Please try again.");
          });
        }
        return res.json();
      })
      .then(function (data) {
        showMessage(
          "Thank you! Your message has been sent. We'll get back to you within 24-48 hours.",
          "success"
        );
        form.reset();
      })
      .catch(function (err) {
        showMessage(err.message || "Failed to send. Please try again later.", "error");
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      });
  });

  function showMessage(text, type) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = "contact-feedback contact-feedback-" + type;
    msgEl.style.display = "block";
    // Scroll into view
    msgEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
})();
