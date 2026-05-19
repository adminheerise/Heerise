/**
 * Phase 4 — agenda builder: drag or click label to add;
 * 💡 hint toggles coaching tooltip (Figma Phase 4-5).
 */
(function () {
    var TIME_OPTIONS = [5, 10, 15, 20];

    var AGENDA_HINTS = {
        "design-concept": "Presenting a design concept before you've completed discovery tells stakeholders you've already decided what to build. It shifts the conversation from \"what do you need?\" to \"do you like this?\" — and that's a trap. You don't have the information to design anything yet. This item does not belong on a kickoff call agenda.",
        "learner-audience-constraints": "The brief tells you who the learners are on paper. This conversation tells you who they actually are — what they struggle with, how they access training, and what constraints will break your design assumptions. Skipping this means you're designing for a fictional audience. This item is critical and belongs in the first half of the call.",
        "communication-cadence": "Useful, but not urgent. Agreeing on how often you'll check in is important for project health — but it's the kind of item that can be handled by email after the call. If you include it, put it near the end. If time runs short, cut it. Never let logistics crowd out discovery.",
        "stakeholder-success": "This is the most important question on the entire agenda. If Jordan and Priya have different definitions of success — and they often do — every design decision you make will be contested. You cannot write valid learning objectives, define scope, or propose a format until you know what \"this worked\" looks like to each of them. This goes in the first half of the call, while attention is highest.",
        "open-qa": "A useful pressure valve at the end of a call — it signals to stakeholders that their concerns matter and that you haven't run a rigid script. Keep it short and budget only 5 minutes. If it grows too large, something earlier in the agenda failed to surface what people actually wanted to say.",
        "demo-walkthrough": "Running a product demo at the start of a kickoff call implies you've already decided the training is about the product features — before you've asked what the business problem actually is. It signals solution-first thinking and wastes 15–20 minutes you need for discovery. This item does not belong on a kickoff agenda.",
        "introductions": "A brief round of introductions earns its place — but only if it's genuinely brief. The purpose is not social; it's functional. Knowing that Jordan is an ex-AE and Priya leads sales methodology tells you how to frame your questions. Keep this to 2–3 minutes and move on. Extended introductions are a common way to burn time that belongs to discovery.",
        "signoff-objectives": "You cannot write valid learning objectives before you've completed discovery — and you certainly can't ask stakeholders to approve them in real time. This item creates the illusion of progress while bypassing the work that makes the objectives meaningful. Asking for live sign-off also puts stakeholders in an awkward position: they haven't had time to think. This item does not belong on a kickoff call agenda.",
        "scope-boundary": "Scope conversations earn their place on a kickoff agenda — but only after discovery. Once you know what success looks like and who the audience really is, you can have an intelligent conversation about what the training should and should not include. Scope before discovery leads to arbitrary decisions. Scope after discovery leads to defensible ones.",
        "brief-assumptions": "The brief is a starting point, not a contract. This item gives you permission to surface what might be wrong, incomplete, or assumed in the brief — before you spend days designing against it. It signals that you've read the brief carefully and that you're here to pressure-test it, not just execute it. A strong opener for the discovery phase.",
        "next-steps": "A call without agreed next steps is just a conversation. This item transforms the kickoff into a decision — it names who does what by when, and ensures everyone leaves with the same understanding of what happens next. Without this, projects stall in the gap between the call ending and the first follow-up email. This item is critical and belongs at the close of every kickoff call.",
        "timeline": "Timelines are not just logistics — they reveal pressure and priority. Confirming the 15-day deadline and asking what is driving it often surfaces a constraint (a product launch, an executive review) that should reshape your entire design approach. Include this item after scope confirmation, so that the timeline conversation is grounded in what you actually need to build."
    };

    var TOOLTIP_ID = "sks-ab-tooltip-panel";

    function clampTime(m) {
        if (m <= TIME_OPTIONS[0]) return TIME_OPTIONS[0];
        if (m >= TIME_OPTIONS[TIME_OPTIONS.length - 1]) return TIME_OPTIONS[TIME_OPTIONS.length - 1];
        var i = TIME_OPTIONS.indexOf(m);
        if (i !== -1) return m;
        var best = TIME_OPTIONS[0];
        var d = Math.abs(m - best);
        for (var j = 1; j < TIME_OPTIONS.length; j++) {
            var nd = Math.abs(m - TIME_OPTIONS[j]);
            if (nd < d) {
                d = nd;
                best = TIME_OPTIONS[j];
            }
        }
        return best;
    }

    function nextUp(m) {
        var i = TIME_OPTIONS.indexOf(m);
        if (i < 0) return clampTime(m);
        return TIME_OPTIONS[Math.min(TIME_OPTIONS.length - 1, i + 1)];
    }

    function nextDown(m) {
        var i = TIME_OPTIONS.indexOf(m);
        if (i < 0) return clampTime(m);
        return TIME_OPTIONS[Math.max(0, i - 1)];
    }

    function ensureTooltip() {
        var el = document.getElementById(TOOLTIP_ID);
        if (el) return el;
        el = document.createElement("div");
        el.id = TOOLTIP_ID;
        el.className = "sks-ab-tooltip";
        el.setAttribute("role", "tooltip");
        el.hidden = true;
        el.innerHTML =
            '<div class="sks-ab-tooltip-inner">' +
            '<p class="sks-ab-tooltip-body"></p>' +
            '<span class="sks-ab-tooltip-beak" aria-hidden="true"></span>' +
            "</div>";
        document.body.appendChild(el);
        return el;
    }

    function init(root) {
        var pool = root.querySelector(".sks-ab-pool");
        var drop = root.querySelector(".sks-ab-drop");
        var body = root.querySelector(".sks-ab-board-body");
        var countEl = root.querySelector("[data-ab-agenda-count]");
        var totalEl = root.querySelector("[data-ab-total-min]");
        var dropHint = root.querySelector(".sks-ab-drop-hint");
        var submit = root.querySelector("[data-ab-submit]");

        if (!pool || !drop || !body || !countEl || !totalEl || !submit) return;

        var tooltip = ensureTooltip();
        var tooltipBody = tooltip.querySelector(".sks-ab-tooltip-body");
        var openHintBtn = null;

        var agenda = [];

        function labelFor(id) {
            var chip = pool.querySelector('.sks-ab-pool-chip[data-ab-item-id="' + id + '"]');
            if (!chip) return id;
            var t = chip.querySelector(".sks-ab-pool-chip-label");
            return t ? t.textContent.trim().replace(/\s+/g, " ") : id;
        }

        function totalMinutes() {
            return agenda.reduce(function (s, r) {
                return s + r.minutes;
            }, 0);
        }

        function closeTooltip() {
            if (openHintBtn) {
                openHintBtn.setAttribute("aria-expanded", "false");
                openHintBtn.classList.remove("is-active");
                openHintBtn.removeAttribute("aria-describedby");
                openHintBtn = null;
            }
            tooltip.hidden = true;
            tooltipBody.textContent = "";
            tooltipBody.removeAttribute("id");
        }

        function positionTooltip(anchorEl) {
            if (tooltip.hidden) return;
            var margin = 8;
            var rect = anchorEl.getBoundingClientRect();
            var tw = tooltip.offsetWidth;
            var th = tooltip.offsetHeight;
            var left = rect.left + rect.width / 2 - tw / 2 + window.scrollX;
            var top = rect.top + window.scrollY - th - 10;
            if (left < margin + window.scrollX) left = margin + window.scrollX;
            if (left + tw > window.scrollX + window.innerWidth - margin) {
                left = window.scrollX + window.innerWidth - tw - margin;
            }
            if (top < margin + window.scrollY) {
                top = rect.bottom + window.scrollY + 10;
                tooltip.classList.add("sks-ab-tooltip--below");
            } else {
                tooltip.classList.remove("sks-ab-tooltip--below");
            }
            tooltip.style.left = left + "px";
            tooltip.style.top = top + "px";
        }

        function toggleHint(btn) {
            var chip = btn.closest(".sks-ab-pool-chip");
            if (!chip) return;
            var id = chip.getAttribute("data-ab-item-id");
            var text = AGENDA_HINTS[id] || "";

            if (openHintBtn === btn && !tooltip.hidden) {
                closeTooltip();
                return;
            }

            closeTooltip();
            if (!text) return;

            openHintBtn = btn;
            btn.setAttribute("aria-expanded", "true");
            btn.classList.add("is-active");
            tooltipBody.textContent = text;
            tooltipBody.id = TOOLTIP_ID + "-text";
            btn.setAttribute("aria-describedby", tooltipBody.id);
            tooltip.hidden = false;
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    positionTooltip(btn);
                });
            });
        }

        function syncPoolUsed() {
            var chips = pool.querySelectorAll(".sks-ab-pool-chip");
            for (var i = 0; i < chips.length; i++) {
                var c = chips[i];
                var id = c.getAttribute("data-ab-item-id");
                var used = agenda.some(function (r) {
                    return r.id === id;
                });
                c.classList.toggle("is-used", used);
                c.setAttribute("draggable", used ? "false" : "true");
                var lab = c.querySelector(".sks-ab-pool-chip-label");
                if (lab) {
                    lab.tabIndex = used ? -1 : 0;
                    lab.setAttribute("aria-disabled", used ? "true" : "false");
                }
            }
        }

        function updateChrome() {
            var n = agenda.length;
            var tot = totalMinutes();
            countEl.textContent = String(n);
            totalEl.textContent = String(tot);
            drop.classList.toggle("is-empty", n === 0);
            if (dropHint) dropHint.setAttribute("aria-hidden", n > 0 ? "true" : "false");
            submit.disabled = n === 0;
            submit.setAttribute("aria-disabled", n === 0 ? "true" : "false");
            syncPoolUsed();
            closeTooltip();
        }

        function renderRows() {
            body.innerHTML = "";
            for (var i = 0; i < agenda.length; i++) {
                (function (row) {
                    var rowEl = document.createElement("div");
                    rowEl.className = "sks-ab-row";

                    var left = document.createElement("div");
                    left.className = "sks-ab-row-topic";
                    var pill = document.createElement("div");
                    pill.className = "sks-ab-topic-pill";
                    pill.textContent = labelFor(row.id);
                    left.appendChild(pill);

                    var right = document.createElement("div");
                    right.className = "sks-ab-row-time";

                    var minus = document.createElement("button");
                    minus.type = "button";
                    minus.className = "sks-ab-step sks-ab-step--minus";
                    minus.setAttribute("aria-label", "Decrease time for " + labelFor(row.id));
                    minus.innerHTML =
                        '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

                    var val = document.createElement("div");
                    val.className = "sks-ab-time-val";
                    val.textContent = String(row.minutes);

                    var plus = document.createElement("button");
                    plus.type = "button";
                    plus.className = "sks-ab-step sks-ab-step--plus";
                    plus.setAttribute("aria-label", "Increase time for " + labelFor(row.id));
                    plus.innerHTML =
                        '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M9 4v10M4 9h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

                    minus.addEventListener("click", function () {
                        row.minutes = nextDown(row.minutes);
                        val.textContent = String(row.minutes);
                        updateChrome();
                    });
                    plus.addEventListener("click", function () {
                        row.minutes = nextUp(row.minutes);
                        val.textContent = String(row.minutes);
                        updateChrome();
                    });

                    right.appendChild(minus);
                    right.appendChild(val);
                    right.appendChild(plus);

                    rowEl.appendChild(left);
                    rowEl.appendChild(right);
                    body.appendChild(rowEl);
                })(agenda[i]);
            }
        }

        function addItem(id) {
            if (!id) return;
            if (agenda.some(function (r) {
                return r.id === id;
            })) return;
            agenda.push({ id: id, minutes: 5 });
            renderRows();
            updateChrome();
        }

        pool.addEventListener("click", function (ev) {
            var hint = ev.target.closest(".sks-ab-hint");
            if (hint && pool.contains(hint)) {
                ev.preventDefault();
                toggleHint(hint);
                return;
            }
            var label = ev.target.closest(".sks-ab-pool-chip-label");
            if (label && pool.contains(label)) {
                var ch = label.closest(".sks-ab-pool-chip");
                if (ch.classList.contains("is-used")) return;
                addItem(ch.getAttribute("data-ab-item-id"));
                return;
            }
            var chipOnly = ev.target.closest(".sks-ab-pool-chip");
            if (chipOnly && pool.contains(chipOnly) && !chipOnly.classList.contains("is-used")) {
                addItem(chipOnly.getAttribute("data-ab-item-id"));
            }
        });

        pool.addEventListener("keydown", function (ev) {
            var hint = ev.target.closest(".sks-ab-hint");
            if (hint && pool.contains(hint) && (ev.key === "Enter" || ev.key === " ")) {
                ev.preventDefault();
                toggleHint(hint);
                return;
            }
            var label = ev.target.closest(".sks-ab-pool-chip-label");
            if (label && pool.contains(label) && (ev.key === "Enter" || ev.key === " ")) {
                var ch = label.closest(".sks-ab-pool-chip");
                if (ch.classList.contains("is-used")) return;
                ev.preventDefault();
                addItem(ch.getAttribute("data-ab-item-id"));
            }
        });

        pool.addEventListener("dragstart", function (ev) {
            if (ev.target.closest(".sks-ab-hint")) {
                ev.preventDefault();
                return;
            }
            var chip = ev.target.closest(".sks-ab-pool-chip");
            if (!chip || chip.classList.contains("is-used")) {
                ev.preventDefault();
                return;
            }
            var id = chip.getAttribute("data-ab-item-id");
            ev.dataTransfer.setData("text/plain", id);
            ev.dataTransfer.effectAllowed = "copy";
        });

        ;["dragenter", "dragover"].forEach(function (evt) {
            drop.addEventListener(evt, function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                drop.classList.add("is-dragover");
            });
        });
        drop.addEventListener("dragleave", function (e) {
            if (!drop.contains(e.relatedTarget)) drop.classList.remove("is-dragover");
        });
        drop.addEventListener("drop", function (e) {
            e.preventDefault();
            drop.classList.remove("is-dragover");
            var id = e.dataTransfer.getData("text/plain");
            addItem(id);
        });

        document.addEventListener("click", function (ev) {
            if (tooltip.hidden) return;
            if (ev.target.closest(".sks-ab-hint")) return;
            if (ev.target.closest("#" + TOOLTIP_ID)) return;
            closeTooltip();
        });

        document.addEventListener("keydown", function (ev) {
            if (ev.key === "Escape" && !tooltip.hidden) {
                closeTooltip();
            }
        });

        window.addEventListener("resize", function () {
            if (!tooltip.hidden && openHintBtn) positionTooltip(openHintBtn);
        });
        window.addEventListener(
            "scroll",
            function () {
                if (!tooltip.hidden && openHintBtn) positionTooltip(openHintBtn);
            },
            true
        );

        submit.addEventListener("click", function () {
            if (submit.disabled) return;
            var rows = agenda.map(function (r) {
                return { id: r.id, minutes: r.minutes };
            });
            if (window.HeeriseAgendaScorer) {
                window.HeeriseAgendaScorer.persistFromBuilder(rows);
            } else {
                try {
                    sessionStorage.setItem(
                        "heerise_agenda_result",
                        JSON.stringify({
                            items: rows.map(function (r) {
                                return {
                                    id: r.id,
                                    label: labelFor(r.id),
                                    minutes: r.minutes
                                };
                            }),
                            totalMinutes: totalMinutes(),
                            savedAt: Date.now(),
                            tier: "partial",
                            stars: 2,
                            feedback: ""
                        })
                    );
                } catch (err) { /* ignore */ }
            }
            window.location.href =
                "/acc/stakeholder-kickoff/agenda/result/";
        });

        updateChrome();
    }

    document.addEventListener("DOMContentLoaded", function () {
        var root = document.querySelector(".sks-ab-root");
        if (root) init(root);
    });
})();
