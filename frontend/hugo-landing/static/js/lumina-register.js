/**
 * Lumina register form → POST /api/lumina-test-users/register → gate token → kickoff landing.
 */
(function () {
  "use strict";

  var GATE_KEY = "heerise_lumina_gate_token";
  var NAME_KEY = "heeriseStakeholderKickoffDisplayName";
  var NEXT_URL = "/acc/stakeholder-kickoff/";

  try {
    var params = new URLSearchParams(window.location.search || "");
    var next = params.get("next") || "";
    if (next.indexOf("/acc/stakeholder-kickoff") === 0 && next.indexOf("/register") < 0) {
      NEXT_URL = next;
    }
  } catch (e) {}

  function apiBase() {
    var host = window.location && window.location.hostname;
    var isLocal = host === "localhost" || host === "127.0.0.1";
    var b = window.HEERISE_API_BASE || window.API_BASE || (isLocal ? "http://localhost:8000" : "/api");
    b = String(b).replace(/\/$/, "");
    return b === "/api" ? "/api" : b + (b.endsWith("/api") ? "" : "/api");
  }

  function showError(el, msg) {
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  }

  function run() {
    var form = document.getElementById("lum-reg-form");
    if (!form) return;
    var errEl = document.getElementById("lum-reg-error");
    var submitBtn = document.getElementById("lum-reg-submit");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      showError(errEl, "");

      var fullName = (document.getElementById("lum-reg-name").value || "").trim();
      var email = (document.getElementById("lum-reg-email").value || "").trim();
      var terms = !!(document.getElementById("lum-reg-terms") || {}).checked;
      var subscribed = !!(document.getElementById("lum-reg-subscribe") || {}).checked;

      if (!fullName) {
        showError(errEl, "Please enter your full name.");
        return;
      }
      if (!email) {
        showError(errEl, "Please enter your email address.");
        return;
      }
      if (!terms) {
        showError(errEl, "Please agree to the Terms of Service and Privacy Policy.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Continuing…";
      }

      fetch(apiBase() + "/lumina-test-users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          terms_accepted: true,
          subscribed: subscribed,
        }),
      })
        .then(function (r) {
          return r.text().then(function (t) {
            var data = {};
            try {
              data = t ? JSON.parse(t) : {};
            } catch (err) {
              data = { detail: t || "Request failed" };
            }
            if (!r.ok) {
              var detail = data.detail;
              if (Array.isArray(detail)) {
                detail = detail.map(function (d) { return d.msg || JSON.stringify(d); }).join(" ");
              }
              throw new Error(detail || "Registration failed (" + r.status + ")");
            }
            return data;
          });
        })
        .then(function (data) {
          try {
            sessionStorage.setItem(GATE_KEY, data.gate_token || "");
            localStorage.setItem(NAME_KEY, data.full_name || fullName);
          } catch (err) {}
          window.location.href = NEXT_URL;
        })
        .catch(function (err) {
          showError(errEl, (err && err.message) || "Could not continue. Please try again.");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Continue <span aria-hidden="true">→</span>';
          }
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
