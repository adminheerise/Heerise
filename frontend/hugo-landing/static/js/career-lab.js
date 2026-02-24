/**
 * Career Lab page — tab switching + modal handlers.
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

  // Bootcamp apply modal
  const API_BASE = window.HEERISE_API_BASE || "http://localhost:8000";
  const bootcampModal = $("#cl-bootcamp-modal");
  const bootcampOpenBtns = $$(".cl-bootcamp-open");
  const bootcampCloseBtns = $$("[data-bootcamp-close]");
  const bootcampForm = $("#cl-bootcamp-form");
  const bootcampErr = $("#cl-bootcamp-error");
  const bootcampStep2Err = $("#cl-bootcamp-step2-error");
  const bootcampStep3Err = $("#cl-bootcamp-step3-error");
  const bootcampStep4Err = $("#cl-bootcamp-step4-error");
  const bootcampStep5Err = $("#cl-bootcamp-step5-error");
  const bootcampStep6Err = $("#cl-bootcamp-step6-error");
  const bootcampStep7Err = $("#cl-bootcamp-step7-error");
  const bootcampStep8Err = $("#cl-bootcamp-step8-error");
  const bootcampStep9Err = $("#cl-bootcamp-step9-error");
  const bootcampSteps = $$(".cl-bootcamp-step");
  const bootcampProgressSegs = $$("#cl-bootcamp-form .cl-bootcamp-progress .ob-seg");
  const bootcampNextStepBtn = $("#cl-bootcamp-next-step");
  const bootcampNextStep2Btn = $("#cl-bootcamp-next-step-2");
  const bootcampNextStep3Btn = $("#cl-bootcamp-next-step-3");
  const bootcampNextStep4Btn = $("#cl-bootcamp-next-step-4");
  const bootcampNextStep5Btn = $("#cl-bootcamp-next-step-5");
  const bootcampNextStep6Btn = $("#cl-bootcamp-next-step-6");
  const bootcampNextStep7Btn = $("#cl-bootcamp-next-step-7");
  const bootcampNextStep8Btn = $("#cl-bootcamp-next-step-8");
  const bootcampPrevStepBtn = $("#cl-bootcamp-prev-step");
  const bootcampPrevStep2Btn = $("#cl-bootcamp-prev-step-2");
  const bootcampPrevStep3Btn = $("#cl-bootcamp-prev-step-3");
  const bootcampPrevStep4Btn = $("#cl-bootcamp-prev-step-4");
  const bootcampPrevStep5Btn = $("#cl-bootcamp-prev-step-5");
  const bootcampPrevStep6Btn = $("#cl-bootcamp-prev-step-6");
  const bootcampPrevStep7Btn = $("#cl-bootcamp-prev-step-7");
  const bootcampPrevStep8Btn = $("#cl-bootcamp-prev-step-8");
  const bootcampTopics = $$("#cl-bootcamp-topics .ob-option");
  const bootcampEducation = $$("#cl-bootcamp-education .ob-option");
  const bootcampWorkExp = $$("#cl-bootcamp-work-exp .ob-option");
  const bootcampHours = $$("#cl-bootcamp-hours .ob-option");
  const bootcampLearningStyle = $$("#cl-bootcamp-learning-style .ob-option");
  const proficiencyFields = [
    { label: "Articulate Storyline", el: $("#cl-bootcamp-tool-storyline") },
    { label: "Adobe Captivate", el: $("#cl-bootcamp-tool-captivate") },
    { label: "Camtasia", el: $("#cl-bootcamp-tool-camtasia") },
    { label: "Learning Management Systems (LMS)", el: $("#cl-bootcamp-tool-lms") },
    { label: "Graphic design tools", el: $("#cl-bootcamp-tool-graphic") },
    { label: "H5P", el: $("#cl-bootcamp-tool-h5p") },
  ];
  let bootcampStep = 1;

  const setBootcampStep = (step) => {
    bootcampStep = step;
    bootcampSteps.forEach((panel) => {
      panel.hidden = Number(panel.dataset.step) !== step;
    });
    bootcampProgressSegs.forEach((seg, idx) => {
      seg.classList.toggle("is-active", idx < step);
    });
    bootcampErr && (bootcampErr.textContent = "");
    bootcampStep2Err && (bootcampStep2Err.textContent = "");
    bootcampStep3Err && (bootcampStep3Err.textContent = "");
    bootcampStep4Err && (bootcampStep4Err.textContent = "");
    bootcampStep5Err && (bootcampStep5Err.textContent = "");
    bootcampStep6Err && (bootcampStep6Err.textContent = "");
    bootcampStep7Err && (bootcampStep7Err.textContent = "");
    bootcampStep8Err && (bootcampStep8Err.textContent = "");
    bootcampStep9Err && (bootcampStep9Err.textContent = "");
  };

  const openBootcamp = () => {
    bootcampModal?.classList.add("is-open");
    bootcampModal?.setAttribute("aria-hidden", "false");
    document.body.classList.add("cl-modal-open");
    setBootcampStep(1);
  };
  const closeBootcamp = () => {
    bootcampModal?.classList.remove("is-open");
    bootcampModal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cl-modal-open");
    bootcampForm?.reset();
    bootcampTopics.forEach((topic) => topic.classList.remove("ob-selected"));
    bootcampEducation.forEach((item) => item.classList.remove("ob-selected"));
    bootcampWorkExp.forEach((item) => item.classList.remove("ob-selected"));
    bootcampHours.forEach((item) => item.classList.remove("ob-selected"));
    bootcampLearningStyle.forEach((item) => item.classList.remove("ob-selected"));
    setBootcampStep(1);
  };

  bootcampOpenBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openBootcamp();
    });
  });
  bootcampCloseBtns.forEach((btn) => btn.addEventListener("click", closeBootcamp));
  bootcampPrevStepBtn?.addEventListener("click", () => setBootcampStep(1));
  bootcampPrevStep2Btn?.addEventListener("click", () => setBootcampStep(2));
  bootcampPrevStep3Btn?.addEventListener("click", () => setBootcampStep(3));
  bootcampPrevStep4Btn?.addEventListener("click", () => setBootcampStep(4));
  bootcampPrevStep5Btn?.addEventListener("click", () => setBootcampStep(5));
  bootcampPrevStep6Btn?.addEventListener("click", () => setBootcampStep(6));
  bootcampPrevStep7Btn?.addEventListener("click", () => setBootcampStep(7));
  bootcampPrevStep8Btn?.addEventListener("click", () => setBootcampStep(8));

  bootcampNextStepBtn?.addEventListener("click", () => {
    const firstName = $("#cl-bootcamp-first-name")?.value.trim();
    const lastName = $("#cl-bootcamp-last-name")?.value.trim();
    const email = $("#cl-bootcamp-email")?.value.trim();
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");

    if (!firstName || !lastName || !okEmail) {
      if (bootcampErr) bootcampErr.textContent = "Please complete all fields with a valid email.";
      return;
    }

    setBootcampStep(2);
  });

  bootcampNextStep2Btn?.addEventListener("click", () => {
    const selectedTopics = Array.from($$("#cl-bootcamp-topics .ob-option.ob-selected")).map((item) => item.dataset.value);
    if (!selectedTopics.length) {
      if (bootcampStep2Err) bootcampStep2Err.textContent = "Please select at least 1 topic (up to 2).";
      return;
    }
    setBootcampStep(3);
  });
  bootcampNextStep3Btn?.addEventListener("click", () => {
    const selectedEducation = $("#cl-bootcamp-education .ob-option.ob-selected")?.dataset.value;
    if (!selectedEducation) {
      if (bootcampStep3Err) bootcampStep3Err.textContent = "Please select your highest education level.";
      return;
    }
    setBootcampStep(4);
  });
  bootcampNextStep4Btn?.addEventListener("click", () => {
    const major = $("#cl-bootcamp-major")?.value.trim();
    if (!major) {
      if (bootcampStep4Err) bootcampStep4Err.textContent = "Please enter your academic major.";
      return;
    }
    setBootcampStep(5);
  });
  bootcampNextStep5Btn?.addEventListener("click", () => {
    const selectedWorkExp = $("#cl-bootcamp-work-exp .ob-option.ob-selected")?.dataset.value;
    if (!selectedWorkExp) {
      if (bootcampStep5Err) bootcampStep5Err.textContent = "Please select your years of work experience.";
      return;
    }
    setBootcampStep(6);
  });
  bootcampNextStep6Btn?.addEventListener("click", () => {
    const hasEmpty = proficiencyFields.some((field) => !field.el?.value);
    if (hasEmpty) {
      if (bootcampStep6Err) bootcampStep6Err.textContent = "Please rate all tools before continuing.";
      return;
    }
    setBootcampStep(7);
  });
  bootcampNextStep7Btn?.addEventListener("click", () => {
    const selectedHours = $("#cl-bootcamp-hours .ob-option.ob-selected")?.dataset.value;
    if (!selectedHours) {
      if (bootcampStep7Err) bootcampStep7Err.textContent = "Please select hours per week.";
      return;
    }
    setBootcampStep(8);
  });
  bootcampNextStep8Btn?.addEventListener("click", () => {
    const selectedLearningStyle = $("#cl-bootcamp-learning-style .ob-option.ob-selected")?.dataset.value;
    if (!selectedLearningStyle) {
      if (bootcampStep8Err) bootcampStep8Err.textContent = "Please select your preferred learning style.";
      return;
    }
    setBootcampStep(9);
  });

  bootcampTopics.forEach((topic) => {
    topic.addEventListener("click", () => {
      const selected = $$("#cl-bootcamp-topics .ob-option.ob-selected");
      if (topic.classList.contains("ob-selected")) {
        topic.classList.remove("ob-selected");
        return;
      }
      if (selected.length >= 2) return;
      topic.classList.add("ob-selected");
    });
  });

  bootcampEducation.forEach((item) => {
    item.addEventListener("click", () => {
      bootcampEducation.forEach((el) => el.classList.remove("ob-selected"));
      item.classList.add("ob-selected");
    });
  });
  bootcampWorkExp.forEach((item) => {
    item.addEventListener("click", () => {
      bootcampWorkExp.forEach((el) => el.classList.remove("ob-selected"));
      item.classList.add("ob-selected");
    });
  });
  bootcampHours.forEach((item) => {
    item.addEventListener("click", () => {
      bootcampHours.forEach((el) => el.classList.remove("ob-selected"));
      item.classList.add("ob-selected");
    });
  });
  bootcampLearningStyle.forEach((item) => {
    item.addEventListener("click", () => {
      bootcampLearningStyle.forEach((el) => el.classList.remove("ob-selected"));
      item.classList.add("ob-selected");
    });
  });

  bootcampForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (bootcampStep !== 9) return;

    const selectedTopics = Array.from($$("#cl-bootcamp-topics .ob-option.ob-selected")).map((item) => item.dataset.value);
    if (!selectedTopics.length) {
      if (bootcampStep2Err) bootcampStep2Err.textContent = "Please select at least 1 topic (up to 2).";
      return;
    }
    const selectedEducation = $("#cl-bootcamp-education .ob-option.ob-selected")?.dataset.value;
    if (!selectedEducation) {
      if (bootcampStep3Err) bootcampStep3Err.textContent = "Please select your highest education level.";
      return;
    }
    const major = $("#cl-bootcamp-major")?.value.trim();
    if (!major) {
      if (bootcampStep4Err) bootcampStep4Err.textContent = "Please enter your academic major.";
      return;
    }
    const selectedWorkExp = $("#cl-bootcamp-work-exp .ob-option.ob-selected")?.dataset.value;
    if (!selectedWorkExp) {
      if (bootcampStep5Err) bootcampStep5Err.textContent = "Please select your years of work experience.";
      return;
    }
    const hasEmpty = proficiencyFields.some((field) => !field.el?.value);
    if (hasEmpty) {
      if (bootcampStep6Err) bootcampStep6Err.textContent = "Please rate all tools before continuing.";
      return;
    }
    const selectedHours = $("#cl-bootcamp-hours .ob-option.ob-selected")?.dataset.value;
    if (!selectedHours) {
      if (bootcampStep7Err) bootcampStep7Err.textContent = "Please select hours per week.";
      return;
    }
    const selectedLearningStyle = $("#cl-bootcamp-learning-style .ob-option.ob-selected")?.dataset.value;
    if (!selectedLearningStyle) {
      if (bootcampStep8Err) bootcampStep8Err.textContent = "Please select your preferred learning style.";
      return;
    }
    const why = $("#cl-bootcamp-why")?.value.trim();
    if (!why) {
      if (bootcampStep9Err) bootcampStep9Err.textContent = "Please share a short answer.";
      return;
    }
    const proficiencySummary = proficiencyFields
      .map((field) => `${field.label}: ${field.el?.value || ""}`)
      .join("\n");

    const firstName = $("#cl-bootcamp-first-name")?.value.trim();
    const lastName = $("#cl-bootcamp-last-name")?.value.trim();
    const email = $("#cl-bootcamp-email")?.value.trim();
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");

    if (!firstName || !lastName || !okEmail) {
      if (bootcampErr) bootcampErr.textContent = "Please complete all fields with a valid email.";
      return;
    }

    const submitBtn = bootcampForm.querySelector('button[type="submit"]');
    const oldLabel = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "SUBMITTING...";
    }

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone: null,
          hear_about: null,
          service_interest: "bootcamp",
          message: `Career Lab Bootcamp Application\n\nTopics: ${selectedTopics.join(", ")}\nHighest Education Level: ${selectedEducation}\nAcademic Major: ${major}\nYears of Work Experience: ${selectedWorkExp}\nHours Per Week: ${selectedHours}\nPreferred Learning Style: ${selectedLearningStyle}\nWhy Interested: ${why}\n\nSoftware Proficiency:\n${proficiencySummary}`,
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.detail || "Something went wrong.");
      closeBootcamp();
      alert("Thanks! Your application has been received.");
    } catch (error) {
      if (bootcampErr) bootcampErr.textContent = error.message || "Failed to submit.";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = oldLabel;
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && bootcampModal?.classList.contains("is-open")) closeBootcamp();
  });
})();
