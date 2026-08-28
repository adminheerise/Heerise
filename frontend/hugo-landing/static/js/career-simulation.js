(function () {
  var form = document.getElementById("career-simulation-form");
  var input = document.getElementById("career-simulation-job");
  var status = document.getElementById("career-simulation-status");
  var loadingPanel = document.getElementById("career-simulation-loading");
  var app = document.getElementById("career-simulation-app");
  var restart = document.getElementById("career-simulation-restart");

  if (restart) {
    restart.addEventListener("click", function () { window.sessionStorage.removeItem("careerSimulationJobDescription"); });
  }

  if (form && input && status) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!input.value.trim()) { input.focus(); status.textContent = "Add a job description to begin."; return; }
      window.sessionStorage.setItem("careerSimulationJobDescription", input.value.trim());
      form.closest(".career-simulation__intake").classList.add("is-hidden");
      if (loadingPanel) loadingPanel.classList.remove("is-hidden");
      window.setTimeout(function () { window.location.replace("/career-simulation/casting/"); }, 1600);
    });
  }

  if (!app) return;

  var skills = ["Apply instructional design models such as ADDIE and backward design", "Use learning management systems such as Canvas, Moodle, or Blackboard to build and manage course content", "Experience with Articulate Storyline, Rise 360, Adobe Creative Suite, or similar tools", "Knowledge of accessibility standards such as WCAG", "Familiarity with learning analytics and AI-supported educational tools"];
  var scenarios = [
    { title: "Redesign a course module", description: "A subject matter expert wants to turn a dense training document into a clear, accessible online lesson." },
    { title: "Diagnose a learning gap", description: "Learner data shows a sharp drop-off in one module, and the team needs a practical improvement plan." },
    { title: "Build an accessible experience", description: "You are reviewing a new course before launch and must identify barriers across content and interaction." },
    { title: "Partner with a subject expert", description: "A busy expert has strong ideas but no time; you need to shape the material into an effective learning path." }
  ];
  var currentScenario = 0;
  var ratings = {};

  function setStage(label, step) {
    document.getElementById("career-simulation-scene").textContent = "SCENE \u2014 " + label.toUpperCase();
    document.querySelectorAll(".career-simulation__steps span").forEach(function (bar, index) { bar.classList.toggle("is-active", index <= step); });
  }

  function showLoading(message, next) {
    app.classList.add("is-transitioning");
    window.setTimeout(function () {
      app.innerHTML = '<div class="career-simulation__inline-loading"><div class="career-simulation__loading-dots" aria-hidden="true"><span></span><span></span><span></span></div><p>' + message + '</p></div>';
      app.classList.remove("is-transitioning");
      window.setTimeout(next, 1050);
    }, 180);
  }

  function renderMenu() {
    setStage("Choose A Scene", 2);
    app.innerHTML = "<h2>Pick a scenario to step into</h2>" + scenarios.map(function (item, index) { return '<button class="career-simulation__scenario" type="button" data-index="' + index + '"><b>SCENE ' + (index + 1) + '</b><strong>' + item.title + '</strong><span>' + item.description + '</span></button>'; }).join("");
    app.querySelectorAll("[data-index]").forEach(function (button) { button.addEventListener("click", function () { renderSimulation(Number(button.dataset.index)); }); });
  }

  function renderSimulation(index) {
    currentScenario = index;
    setStage("Scene " + (index + 1), 3);
    app.innerHTML = '<p class="career-simulation__stage-note">You are meeting with a subject matter expert to improve a learning experience. Your goal is to make the next step concrete and learner-focused.</p><div class="career-simulation__bubble career-simulation__bubble--character"><b>Your role for this scene</b>I am the subject matter expert. I know the content deeply, but I need your help turning it into an experience learners can actually use.</div><div id="career-simulation-thread"></div><div class="career-simulation__input-row"><input id="career-simulation-response" placeholder="Type your response..." type="text"><button class="btn-primary" id="career-simulation-respond" type="button">Respond</button></div><button class="btn-ghost" id="career-simulation-end" type="button">End simulation</button>';
    appendBubble("Character", "Where would you start? We have a lot of content and very little time.");
    document.getElementById("career-simulation-respond").addEventListener("click", respond);
    document.getElementById("career-simulation-response").addEventListener("keydown", function (event) { if (event.key === "Enter") respond(); });
    document.getElementById("career-simulation-end").addEventListener("click", function () { showLoading("Pulling notes together", renderAssessment); });
  }

  function appendBubble(who, text) {
    var bubble = document.createElement("div");
    bubble.className = "career-simulation__bubble career-simulation__bubble--" + (who === "You" ? "user" : "character");
    bubble.innerHTML = "<b>" + who + "</b>" + text;
    document.getElementById("career-simulation-thread").appendChild(bubble);
  }

  function respond() {
    var field = document.getElementById("career-simulation-response");
    var value = field.value.trim();
    if (!value) return;
    field.value = "";
    appendBubble("You", value);
    appendBubble("Character", "That is useful. How would you make that approach visible in the learner experience, and what evidence would tell you it worked?");
  }

  function renderAssessment() {
    setStage("Self-Assessment", 4);
    app.innerHTML = '<h2>Before we debrief &mdash; rate yourself</h2><p class="career-simulation__muted">No one\'s grading this. It just helps you notice the gap between how it felt and what came across.</p>' + skills.map(function (skill, index) { return '<div class="career-simulation__skill-rate"><strong>' + skill + '</strong><div>' + [1, 2, 3, 4, 5].map(function (value) { return '<button type="button" data-skill="' + index + '" data-value="' + value + '">' + value + '</button>'; }).join("") + '</div></div>'; }).join("") + '<label class="career-simulation__field-label" for="career-simulation-reflection">In your own words &mdash; how do you think that went?</label><textarea id="career-simulation-reflection" placeholder="Optional: what felt strong, what felt shaky..."></textarea><div class="career-simulation__actions"><button class="btn-primary" id="career-simulation-debrief" type="button">See the debrief</button><button class="btn-ghost" id="career-simulation-skip" type="button">Skip self-assessment</button></div>';
    app.querySelectorAll("[data-skill]").forEach(function (button) { button.addEventListener("click", function () { ratings[button.dataset.skill] = Number(button.dataset.value); button.parentElement.querySelectorAll("button").forEach(function (item) { item.classList.toggle("is-selected", Number(item.dataset.value) <= ratings[button.dataset.skill]); }); }); });
    document.getElementById("career-simulation-debrief").addEventListener("click", function () { showLoading("Pulling notes together", renderDebrief); });
    document.getElementById("career-simulation-skip").addEventListener("click", function () { showLoading("Pulling notes together", renderDebrief); });
  }

  function renderDebrief() {
    setStage("Notes Session", 5);
    app.innerHTML = '<h2>Scene. Let\'s debrief.</h2><div class="career-simulation__debrief-block"><h3>What happened</h3><p class="career-simulation__muted">You practiced entering a new learning problem with curiosity, then connected your recommendation to learner experience and evidence.</p></div><div class="career-simulation__debrief-block"><h3>Skills from the JD &mdash; how it went</h3><div class="career-simulation__eval"><b>What came through</b><p>You asked for context and moved the conversation toward a concrete learning outcome.</p></div><div class="career-simulation__eval"><b>What to strengthen</b><p>Make your success measure explicit earlier, then use it to prioritize the design decision.</p></div></div><div class="career-simulation__debrief-block"><h3>One thing to try on the retry</h3><div class="career-simulation__try">Name the learner, the behavior you want to change, and the evidence you will collect before proposing the solution.</div></div><div class="career-simulation__actions"><button class="btn-primary" id="career-simulation-retry" type="button">Retry &mdash; same scene</button><button class="btn-ghost" id="career-simulation-new" type="button">Different scenario</button></div>';
    document.getElementById("career-simulation-retry").addEventListener("click", function () { renderSimulation(currentScenario); });
    document.getElementById("career-simulation-new").addEventListener("click", renderMenu);
  }

  document.getElementById("career-simulation-build").addEventListener("click", function () { showLoading("Drafting four scenes for this role", renderMenu); });
})();