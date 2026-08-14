(function () {
  var lines = document.querySelectorAll(".sks-research-line");
  var btn = document.getElementById("sks-research-next");
  var nextWrap = document.getElementById("sks-research-next-wrap");
  var startWrap = document.getElementById("sks-research-start-wrap");
  var startBtn = document.querySelector(".sks-research-start-btn");
  if (!lines.length || !btn) return;

  var RESEARCH_KEYS = [
    "heeriseResearchWorkspaceQ",
    "heeriseResearchWorkspaceFollowUps",
    "heerise_phase2_hypothesis",
  ];

  var i = 0;
  var last = lines.length - 1;

  function showLine(idx) {
    lines.forEach(function (el, j) {
      el.hidden = j !== idx;
      el.classList.remove("sks-research-line--peek");
    });
    var onLast = idx >= last;
    if (onLast) {
      if (nextWrap) nextWrap.hidden = true;
      if (startWrap) startWrap.hidden = false;
    } else {
      if (nextWrap) nextWrap.hidden = false;
      if (startWrap) startWrap.hidden = true;
    }
  }

  function clearResearchProgress() {
    RESEARCH_KEYS.forEach(function (key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    });
  }

  btn.addEventListener("click", function () {
    if (i >= last) return;
    i += 1;
    showLine(i);
  });

  /* Entering the research intro starts a fresh attempt (e.g. after redoing Phase 1).
     Phase-nav review links to workspace, so mid-run resume is preserved. */
  clearResearchProgress();

  if (startBtn) {
    startBtn.addEventListener("click", function () {
      clearResearchProgress();
    });
  }

  showLine(0);
})();
