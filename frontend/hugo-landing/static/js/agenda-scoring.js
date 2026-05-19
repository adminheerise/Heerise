/**
 * Phase 4 — agenda quality verdict (S4.03): STRONG / PARTIAL / WEAK.
 * Used by the builder (persist) and the result page (load + display).
 */
(function () {
    var STORAGE_KEY = "heerise_agenda_result";

    var CRITICAL_IDS = [
        "stakeholder-success",
        "learner-audience-constraints",
        "scope-boundary",
        "next-steps"
    ];

    var RISKY_IDS = ["demo-walkthrough", "design-concept", "signoff-objectives"];

    var LABELS = {
        "stakeholder-success": "Each stakeholder’s definition of success",
        "learner-audience-constraints": "Learner audience — constraints, gaps, access",
        "demo-walkthrough": "Immediate product demo walkthrough",
        "design-concept": "Present initial design concept",
        "communication-cadence": "Agree on communication and review cadence",
        "open-qa": "Open Q&A / anything else?",
        "introductions": "Introductions & role clarifications",
        "signoff-objectives": "Stakeholder sign-off on learning objectives (live)",
        "scope-boundary": "Scope confirmation and boundary-setting",
        "brief-assumptions": "Review project brief assumptions",
        "next-steps": "Next steps and decision owners",
        "timeline": "Confirm timeline and key milestones"
    };

    var FEEDBACK = {
        strong:
            "You’ve designed a thoughtful, discovery-first agenda that sets the conversation up for success. It clearly defines what success looks like, who’s involved, what’s in scope, and how to move forward, all within a well-paced timeframe. You’ve also avoided jumping into solutions too early. This is a strong, client-ready agenda that signals confidence and clarity. Good Job!",
        partial:
            "You’re on the right track! Your agenda covers most of the essentials. There are just a few gaps (like a missing key item or slightly off timing) that could weaken the flow of the conversation. With a small tweak or two, you can make this agenda more complete and effective. Take a moment to refine it before sending.",
        weak:
            "Your agenda signals solution-first thinking or skips the highest-stakes discovery work — for example risky items (demo, design concept, live sign-off) before alignment, or omitting how stakeholders define success. Before you send, revise so discovery leads and those risky items wait until after you’ve earned the right to propose solutions."
    };

    function labelFor(id) {
        return LABELS[id] || id;
    }

    /**
     * S4.03 rubric (PHASE4_MEETING_AGENDA_DESIGN.md):
     *
     * STRONG — Discovery-first, no risky: all 4 critical, zero risky, 40–50 min,
     *          order puts discovery (esp. success + audience) before scope;
     *          sample flow also scopes timeline after scope, next steps after
     *          scope work, open Q&A after next steps when those pairs exist.
     *
     * PARTIAL — Missing 1–2 critical and/or time outside STRONG band but not
     *           WEAK timing (doc: may include one risky; >55 or <35 min called
     *           out as partial patterns). Any non-STRONG, non-WEAK result.
     *
     * WEAK — ≥2 risky; OR omits definition of success; OR any risky item
     *         placed before stakeholder success (solution-first signal,
     *         cf. Maya interrupt); OR “checklist” proxied by scope before
     *         either core discovery item when both exist.
     */
    function score(items) {
        var ids = items.map(function (i) {
            return i.id;
        });
        var total = items.reduce(function (s, i) {
            return s + (i.minutes || 0);
        }, 0);

        function has(id) {
            return ids.indexOf(id) !== -1;
        }
        function idx(id) {
            return ids.indexOf(id);
        }

        var criticalCount = CRITICAL_IDS.filter(has).length;
        var riskyCount = RISKY_IDS.filter(has).length;

        function anyRiskyBeforeSuccess() {
            if (!has("stakeholder-success")) return false;
            var iSucc = idx("stakeholder-success");
            for (var r = 0; r < RISKY_IDS.length; r++) {
                var rid = RISKY_IDS[r];
                if (has(rid) && idx(rid) < iSucc) return true;
            }
            return false;
        }

        /**
         * Scope before either critical discovery pillar = not a designed
         * sequence (aligned with WEAK “checklist” / scope-before-discovery).
         */
        function scopeBeforeCoreDiscovery() {
            if (!has("scope-boundary")) return false;
            var iScope = idx("scope-boundary");
            if (has("stakeholder-success") && iScope < idx("stakeholder-success")) {
                return true;
            }
            if (has("learner-audience-constraints") && iScope < idx("learner-audience-constraints")) {
                return true;
            }
            return false;
        }

        if (
            riskyCount >= 2 ||
            !has("stakeholder-success") ||
            anyRiskyBeforeSuccess() ||
            scopeBeforeCoreDiscovery()
        ) {
            return { tier: "weak", stars: 1, feedback: FEEDBACK.weak };
        }

        var orderStrong = true;
        if (has("scope-boundary")) {
            var iSc = idx("scope-boundary");
            if (has("stakeholder-success") && idx("stakeholder-success") > iSc) orderStrong = false;
            if (has("learner-audience-constraints") && idx("learner-audience-constraints") > iSc) {
                orderStrong = false;
            }
        }
        if (has("timeline") && has("scope-boundary") && idx("timeline") < idx("scope-boundary")) {
            orderStrong = false;
        }
        if (has("next-steps") && has("scope-boundary") && idx("next-steps") < idx("scope-boundary")) {
            orderStrong = false;
        }
        if (has("open-qa") && has("next-steps") && idx("open-qa") < idx("next-steps")) {
            orderStrong = false;
        }

        if (
            criticalCount === 4 &&
            riskyCount === 0 &&
            total >= 40 &&
            total <= 50 &&
            orderStrong
        ) {
            return { tier: "strong", stars: 3, feedback: FEEDBACK.strong };
        }

        return { tier: "partial", stars: 2, feedback: FEEDBACK.partial };
    }

    function persistFromBuilder(agendaRows) {
        var items = agendaRows.map(function (r) {
            return {
                id: r.id,
                label: labelFor(r.id),
                minutes: r.minutes
            };
        });
        var total = items.reduce(function (s, i) {
            return s + i.minutes;
        }, 0);
        var verdict = score(items);
        var payload = {
            items: items,
            totalMinutes: total,
            savedAt: Date.now(),
            tier: verdict.tier,
            stars: verdict.stars,
            feedback: verdict.feedback
        };
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (e) { /* ignore */ }
        return payload;
    }

    function loadResult() {
        try {
            var raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    window.HeeriseAgendaScorer = {
        CRITICAL_IDS: CRITICAL_IDS,
        RISKY_IDS: RISKY_IDS,
        labelFor: labelFor,
        score: score,
        persistFromBuilder: persistFromBuilder,
        loadResult: loadResult,
        STORAGE_KEY: STORAGE_KEY
    };
})();
