/**
 * Career Lab page — tab switching + apply form handler.
 */
(() => {
  const $$ = (s) => document.querySelectorAll(s);
  const $ = (s) => document.querySelector(s);

  // Tabs
  const tabs = $$(".cl-tab");
  const contents = $$(".cl-tab-content");

  const switchTab = (id) => {
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === id));
    contents.forEach(c => c.classList.toggle("active", c.id === id));
    $(".cl-tabs-nav")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  tabs.forEach(t => t.addEventListener("click", () => switchTab(t.dataset.tab)));
  window.switchTab = switchTab;

  // Syllabus modal
  const modal = $("#cl-syllabus-modal");
  const openBtn = $(".cl-syllabus-open");
  const closeBtns = $$("[data-syllabus-close]");
  const form = $("#cl-syllabus-form");
  const stepForm = $("#cl-syllabus-step-form");
  const stepPdf = $("#cl-syllabus-step-pdf");
  const err = $("#cl-syllabus-error");

  const open = () => {
    modal?.classList.add("is-open");
    modal?.setAttribute("aria-hidden", "false");
    document.body.classList.add("cl-modal-open");
    stepForm && (stepForm.hidden = false);
    stepPdf && (stepPdf.hidden = true);
    err && (err.textContent = "");
  };
  const close = () => {
    modal?.classList.remove("is-open");
    modal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cl-modal-open");
    stepForm && (stepForm.hidden = false);
    stepPdf && (stepPdf.hidden = true);
    form?.reset();
    err && (err.textContent = "");
  };

  openBtn?.addEventListener("click", (e) => (e.preventDefault(), open()));
  closeBtns.forEach(b => b.addEventListener("click", close));
  document.addEventListener("keydown", (e) => e.key === "Escape" && modal?.classList.contains("is-open") && close());

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const first = $("#cl-syllabus-first-name")?.value.trim();
    const last = $("#cl-syllabus-last-name")?.value.trim();
    const email = $("#cl-syllabus-email")?.value.trim();
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
    if (!first || !last || !okEmail) return err && (err.textContent = "Please complete all fields with a valid email.");
    err && (err.textContent = "");
    stepForm && (stepForm.hidden = true);
    stepPdf && (stepPdf.hidden = false);
  });

  // Apply form
  const API_BASE = window.HEERISE_API_BASE || "http://localhost:8000";
  const applyForm = $("#cl-apply-form");
  const msgEl = $("#cl-apply-message");

  const showMsg = (text, type) => {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = `cl-apply-feedback cl-apply-feedback-${type}`;
    msgEl.style.display = "block";
  };

  applyForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#cl-name")?.value.trim();
    const email = $("#cl-email")?.value.trim();
    const essay = $("#cl-essay")?.value.trim();
    if (!name || !email || !essay) return showMsg("Please fill in all required fields.", "error");

    const btn = applyForm.querySelector('button[type="submit"]');
    const old = btn?.textContent;
    if (btn) (btn.disabled = true, btn.textContent = "Submitting...");

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: name,
          last_name: "",
          email,
          phone: null,
          hear_about: null,
          service_interest: "bootcamp",
          message: `Career Lab Application:\n\n${essay}`,
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.detail || "Something went wrong.");
      showMsg("Thank you! We'll get back to you within 24-48 hours.", "success");
      applyForm.reset();
    } catch (err) {
      showMsg(err.message || "Failed to submit.", "error");
    } finally {
      if (btn) (btn.disabled = false, btn.textContent = old);
    }
  });
})();
