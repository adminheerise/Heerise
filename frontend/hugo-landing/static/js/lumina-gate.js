/**
 * Require Lumina registration before Stakeholder Kickoff pages.
 * Skips the register route itself.
 */
(function () {
  "use strict";

  var GATE_KEY = "heerise_lumina_gate_token";
  var REGISTER_URL = "/acc/stakeholder-kickoff/register/";

  function path() {
    return (window.location && window.location.pathname) || "";
  }

  function isKickoffPath(p) {
    return p.indexOf("/acc/stakeholder-kickoff") === 0;
  }

  function isRegisterPath(p) {
    return p.indexOf("/acc/stakeholder-kickoff/register") === 0;
  }

  function hasGate() {
    try {
      var t = sessionStorage.getItem(GATE_KEY);
      return !!(t && String(t).indexOf(".") > 0);
    } catch (e) {
      return false;
    }
  }

  var p = path();
  if (!isKickoffPath(p) || isRegisterPath(p)) return;
  if (hasGate()) return;

  var next = encodeURIComponent(p + (window.location.search || ""));
  window.location.replace(REGISTER_URL + (next ? "?next=" + next : ""));
})();
