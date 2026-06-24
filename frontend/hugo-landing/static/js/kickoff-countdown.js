/**
 * PHASE 5 — P5.3: meeting countdown before live call
 */
(function () {
  var numEl = document.getElementById("sks-kc-countdown-num");
  var skipBtn = document.getElementById("sks-kc-countdown-skip");
  if (!numEl) return;

  var liveUrl = window.SKS_KC_LIVE_URL || "/acc/stakeholder-kickoff/kickoff/call/live/";
  var remaining = 30;
  var timer = null;

  function goLive() {
    if (timer) window.clearInterval(timer);
    window.location.assign(liveUrl);
  }

  function tick() {
    numEl.textContent = String(remaining);
    if (remaining <= 0) {
      goLive();
      return;
    }
    remaining -= 1;
  }

  numEl.textContent = String(remaining);
  timer = window.setInterval(tick, 1000);

  if (skipBtn) skipBtn.addEventListener("click", goLive);
})();
