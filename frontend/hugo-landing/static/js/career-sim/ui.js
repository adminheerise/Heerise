/* Presentation-only components. No API schema, token storage or network calls. */
(function (global) {
  "use strict";

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // Presentation input: { title, summary, details: [{ label, text }] }.
  // The API integration layer can map its eventual schema to this structure.
  function scenarioBar(model) {
    var bar = element("section", "career-sim-context");
    bar.setAttribute("aria-label", "Current scenario");
    bar.appendChild(element("p", "career-sim-context__eyebrow", "YOUR SCENARIO"));
    bar.appendChild(element("h2", "career-sim-context__title", model.title));
    var summary = element("p", "career-sim-context__summary", model.summary);
    bar.appendChild(summary);
    var details = model.details || [];
    if (details.length || String(model.summary || "").length > 120) {
      var disclosure = element("details", "career-sim-context__details");
      var toggle = element("summary", "", "Expand scenario");
      disclosure.appendChild(toggle);
      var content = element("div", "career-sim-context__body");
      content.appendChild(element("p", "", model.summary));
      details.forEach(function (item) {
        content.appendChild(element("h3", "", item.label));
        content.appendChild(element("p", "", item.text));
      });
      disclosure.appendChild(content);
      disclosure.addEventListener("toggle", function () {
        toggle.textContent = disclosure.open ? "Collapse scenario" : "Expand scenario";
        summary.hidden = disclosure.open;
      });
      bar.appendChild(disclosure);
    }
    return bar;
  }

  var messages = {
    EMPTY_JD: ["Add a job description", "Paste a job description so you can start your rehearsal."],
    EMPTY_MESSAGE: ["Write a response first", "Tell your colleague what you would say next."],
    STORAGE: ["Your browser could not save this draft", "Allow site storage or try another browser, then submit again. Your text is still here."],
    CONTENT_BLOCKED: ["Please revise your message", "This message could not be accepted. Edit it and try again."],
    SESSION_EXPIRED: ["Please enter your email again", "Your session has expired. Re-enter your email to continue."],
    RATE_LIMITED: ["Take a short break", "You have made several requests. Wait a little before trying again."],
    UNAVAILABLE: ["The rehearsal is temporarily unavailable", "Please try again shortly. Keep your draft open."],
    NETWORK: ["We could not connect", "Check your internet connection, then try again."],
    UNKNOWN: ["Something went wrong", "Please try again. Keep your draft open."]
  };

  // Callers supply a presentation code and optional action; HTTP mapping belongs
  // to the future API client. Raw server messages are never rendered as HTML.
  function showError(host, code, options) {
    options = options || {};
    host.replaceChildren();
    host.classList.add("career-sim-error");
    host.hidden = false;
    host.setAttribute("role", "alert");
    host.setAttribute("tabindex", "-1");
    var message = messages[code] || messages.UNKNOWN;
    host.appendChild(element("strong", "", message[0]));
    host.appendChild(element("p", "", message[1]));
    if (typeof options.onAction === "function" && options.actionLabel) {
      var button = element("button", "", options.actionLabel);
      button.type = "button";
      button.addEventListener("click", options.onAction);
      host.appendChild(button);
    }
    if (options.focus) host.focus();
  }

  function clearError(host) {
    host.replaceChildren();
    host.hidden = true;
  }

  function observeNavbar() {
    var nav = document.querySelector(".navbar-affixed-top");
    if (!nav) return;
    function update() {
      document.documentElement.style.setProperty("--career-sim-navbar-height", Math.ceil(nav.getBoundingClientRect().height) + "px");
    }
    update();
    if (global.ResizeObserver) new ResizeObserver(update).observe(nav);
    global.addEventListener("resize", update);
  }

  global.CareerSimUI = { scenarioBar: scenarioBar, showError: showError, clearError: clearError };
  document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector(".career-simulation")) observeNavbar();
  });
})(window);
