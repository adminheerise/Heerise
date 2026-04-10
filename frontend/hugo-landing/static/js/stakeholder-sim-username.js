(function () {
  var KEY = "heeriseStakeholderKickoffDisplayName";

  function safeTrim(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  function getName() {
    try {
      var v = localStorage.getItem(KEY);
      var t = safeTrim(v);
      if (t) return t;
    } catch (e) {}
    return "";
  }

  function setName(s) {
    var t = safeTrim(s);
    if (!t) t = "there";
    try {
      localStorage.setItem(KEY, t);
    } catch (e) {}
    return t;
  }

  function applyNames() {
    var n = getName();
    if (!n) n = "there";
    document.querySelectorAll(".sks-kickoff-name").forEach(function (el) {
      el.textContent = n;
    });
  }

  function initBegin() {
    var btn = document.getElementById("skc-begin");
    var input = document.getElementById("skc-name-input");
    if (!btn || !input) return;

    var saved = getName();
    if (saved) input.value = saved;

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      setName(input.value);
      var href = btn.getAttribute("href");
      if (href) window.location.href = href;
    });
  }

  function run() {
    applyNames();
    initBegin();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
