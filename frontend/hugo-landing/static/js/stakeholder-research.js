(function () {
  var lines = document.querySelectorAll(".sks-research-line");
  var btn = document.getElementById("sks-research-next");
  var nextWrap = document.getElementById("sks-research-next-wrap");
  var startWrap = document.getElementById("sks-research-start-wrap");
  if (!lines.length || !btn) return;

  var i = 0;
  var last = lines.length - 1;

  function showLine(idx) {
    lines.forEach(function (el, j) {
      el.hidden = j !== idx;
    });
    var onLast = idx >= last;
    if (onLast) {
      btn.hidden = true;
      btn.setAttribute("aria-hidden", "true");
      if (nextWrap) nextWrap.hidden = true;
      if (startWrap) startWrap.hidden = false;
    } else {
      btn.hidden = false;
      btn.removeAttribute("aria-hidden");
      if (nextWrap) nextWrap.hidden = false;
      if (startWrap) startWrap.hidden = true;
    }
  }

  btn.addEventListener("click", function () {
    if (i >= last) return;
    i += 1;
    showLine(i);
  });

  showLine(0);
})();
