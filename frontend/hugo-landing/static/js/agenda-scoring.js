/**
 * Phase 4 — agenda quality verdict (S4.03): STRONG / PARTIAL / WEAK.
 * Diagnostics + Maya lines for builder persist and result page.
 */
(function () {
    var STORAGE_KEY = "heerise_agenda_result";
    var SCHEMA_VERSION = 1;

    var CRITICAL_IDS = [
        "stakeholder-success",
        "learner-audience-constraints",
        "scope-boundary",
        "next-steps"
    ];

    var RISKY_IDS = ["demo-walkthrough", "design-concept", "signoff-objectives"];

    var CATEGORIES = {
        "stakeholder-success": "discovery",
        "learner-audience-constraints": "discovery",
        "brief-assumptions": "discovery",
        introductions: "discovery",
        "scope-boundary": "scope",
        timeline: "scope",
        "communication-cadence": "scope",
        "next-steps": "admin",
        "open-qa": "admin",
        "demo-walkthrough": "risky",
        "design-concept": "risky",
        "signoff-objectives": "risky"
    };

    var LABELS = {
        "stakeholder-success": "Each stakeholder’s definition of success",
        "learner-audience-constraints": "Learner audience — constraints, gaps, access",
        "demo-walkthrough": "Immediate product demo walkthrough",
        "design-concept": "Present initial design concept",
        "communication-cadence": "Agree on communication and review cadence",
        "open-qa": "Open Q&A / anything else?",
        introductions: "Introductions & role clarifications",
        "signoff-objectives": "Stakeholder sign-off on learning objectives (live)",
        "scope-boundary": "Scope confirmation and boundary-setting",
        "brief-assumptions": "Review project brief assumptions",
        "next-steps": "Next steps and decision owners",
        timeline: "Confirm timeline and key milestones"
    };

    var FEEDBACK = {
        strong:
            "You’ve designed a thoughtful, discovery-first agenda that sets the conversation up for success. It clearly defines what success looks like, who’s involved, what’s in scope, and how to move forward, all within a well-paced timeframe. You’ve also avoided jumping into solutions too early. This is a strong, client-ready agenda that signals confidence and clarity. Good Job!",
        partial:
            "You’re on the right track! Your agenda covers most of the essentials. There are just a few gaps (like a missing key item or slightly off timing) that could weaken the flow of the conversation. With a small tweak or two, you can make this agenda more complete and effective. Take a moment to refine it before sending.",
        weak:
            "Your agenda signals solution-first thinking or skips the highest-stakes discovery work. Before you send, revise so discovery leads and risky items wait until after you’ve earned the right to propose solutions."
    };

    var MAYA = {
        strong: "Send this to Jordan and Priya today. This is the right structure.",
        partial: "You’re close — review the item feedback below, then tighten the agenda before you share it 24 hours ahead of the call.",
        weakDemoBeforeSuccess:
            "Before you send this — look at the demo item. What signal does it send to Jordan that you want to demo the product before you’ve even asked her what success looks like?",
        weakMissingSuccess:
            "Before you send this — you skipped how each stakeholder defines success. That conversation has to lead everything else on a kickoff call.",
        weakGeneric:
            "Before you send this — reorder and cut the risky items. Discovery has to come before solutions on this call."
    };

    var MISSING_CRITICAL_MSG = {
        "stakeholder-success":
            "Critical: Each stakeholder’s definition of success must be on the agenda — it anchors every other decision.",
        "learner-audience-constraints":
            "Critical: Learner audience constraints are missing — without them you’re designing for a fictional audience.",
        "scope-boundary":
            "Critical: Scope confirmation is missing — you need a defensible boundary after discovery, not assumptions.",
        "next-steps":
            "Critical: Next steps and decision owners are missing — without them the call has no output."
    };

    var RISKY_ITEM_MSG =
        "This item does not belong on a discovery kickoff agenda — it signals solution-first thinking or premature commitment.";

    function labelFor(id) {
        return LABELS[id] || id;
    }

    function categoryFor(id) {
        return CATEGORIES[id] || "discovery";
    }

    function has(ids, id) {
        return ids.indexOf(id) !== -1;
    }

    function idx(ids, id) {
        return ids.indexOf(id);
    }

    function anyRiskyBeforeSuccess(ids) {
        if (!has(ids, "stakeholder-success")) return false;
        var iSucc = idx(ids, "stakeholder-success");
        for (var r = 0; r < RISKY_IDS.length; r++) {
            var rid = RISKY_IDS[r];
            if (has(ids, rid) && idx(ids, rid) < iSucc) return true;
        }
        return false;
    }

    function scopeBeforeCoreDiscovery(ids) {
        if (!has(ids, "scope-boundary")) return false;
        var iScope = idx(ids, "scope-boundary");
        if (has(ids, "stakeholder-success") && iScope < idx(ids, "stakeholder-success")) return true;
        if (has(ids, "learner-audience-constraints") && iScope < idx(ids, "learner-audience-constraints")) {
            return true;
        }
        return false;
    }

    function isOrderStrong(ids) {
        if (has(ids, "scope-boundary")) {
            var iSc = idx(ids, "scope-boundary");
            if (has(ids, "stakeholder-success") && idx(ids, "stakeholder-success") > iSc) return false;
            if (has(ids, "learner-audience-constraints") && idx(ids, "learner-audience-constraints") > iSc) {
                return false;
            }
        }
        if (has(ids, "timeline") && has(ids, "scope-boundary") && idx(ids, "timeline") < idx(ids, "scope-boundary")) {
            return false;
        }
        if (has(ids, "next-steps") && has(ids, "scope-boundary") && idx(ids, "next-steps") < idx(ids, "scope-boundary")) {
            return false;
        }
        if (has(ids, "open-qa") && has(ids, "next-steps") && idx(ids, "open-qa") < idx(ids, "next-steps")) {
            return false;
        }
        return true;
    }

    function weakReasonCode(ids, riskyCount) {
        if (!has(ids, "stakeholder-success")) return "MISSING_SUCCESS";
        if (anyRiskyBeforeSuccess(ids)) return "RISKY_BEFORE_SUCCESS";
        if (scopeBeforeCoreDiscovery(ids)) return "SCOPE_BEFORE_DISCOVERY";
        if (riskyCount >= 2) return "MULTIPLE_RISKY";
        return "WEAK_OTHER";
    }

    function pickMayaLine(tier, weakCode) {
        if (tier === "strong") return MAYA.strong;
        if (tier === "partial") return MAYA.partial;
        if (weakCode === "RISKY_BEFORE_SUCCESS") return MAYA.weakDemoBeforeSuccess;
        if (weakCode === "MISSING_SUCCESS") return MAYA.weakMissingSuccess;
        return MAYA.weakGeneric;
    }

    function buildDiagnostics(items, ids, total) {
        var diagnostics = [];
        var i;

        for (i = 0; i < CRITICAL_IDS.length; i++) {
            var cid = CRITICAL_IDS[i];
            if (!has(ids, cid)) {
                diagnostics.push({
                    id: cid,
                    label: labelFor(cid),
                    inAgenda: false,
                    status: "fail",
                    code: "MISSING_CRITICAL",
                    message: MISSING_CRITICAL_MSG[cid] || "This critical item is missing from your agenda."
                });
            }
        }

        for (i = 0; i < items.length; i++) {
            var item = items[i];
            var id = item.id;
            var entry = {
                id: id,
                label: item.label || labelFor(id),
                inAgenda: true,
                status: "pass",
                code: "OK",
                message: "Good placement for a discovery-first kickoff agenda."
            };

            if (RISKY_IDS.indexOf(id) !== -1) {
                entry.status = "fail";
                entry.code = "RISKY_ITEM";
                entry.message = RISKY_ITEM_MSG;
                if (has(ids, "stakeholder-success") && idx(ids, id) < idx(ids, "stakeholder-success")) {
                    entry.message =
                        "Placed before success definition — signals you want to demo or decide solutions before alignment.";
                }
            } else if (id === "scope-boundary" && scopeBeforeCoreDiscovery(ids)) {
                entry.status = "fail";
                entry.code = "ORDER_SCOPE";
                entry.message = "Scope is scheduled before core discovery — confirm success and audience before boundaries.";
            } else if (id === "stakeholder-success" && !isOrderStrong(ids) && has(ids, "scope-boundary")) {
                if (idx(ids, "stakeholder-success") > idx(ids, "scope-boundary")) {
                    entry.status = "fail";
                    entry.code = "ORDER_SUCCESS";
                    entry.message = "Success definition should come before scope on the agenda.";
                }
            } else if (id === "timeline" && has(ids, "scope-boundary") && idx(ids, "timeline") < idx(ids, "scope-boundary")) {
                entry.status = "warn";
                entry.code = "ORDER_TIMELINE";
                entry.message = "Timeline works best after scope is grounded in discovery.";
            } else if (id === "next-steps" && has(ids, "scope-boundary") && idx(ids, "next-steps") < idx(ids, "scope-boundary")) {
                entry.status = "warn";
                entry.code = "ORDER_NEXT_STEPS";
                entry.message = "Next steps belong near the close, after scope and timeline conversations.";
            } else if (id === "open-qa" && has(ids, "next-steps") && idx(ids, "open-qa") < idx(ids, "next-steps")) {
                entry.status = "warn";
                entry.code = "ORDER_QA";
                entry.message = "Keep open Q&A as a short buffer at the end of the call.";
            } else if (id === "communication-cadence") {
                entry.status = "warn";
                entry.code = "OPTIONAL_ADMIN";
                entry.message = "Fine near the end, but this can often be handled by email after the call.";
            }

            diagnostics.push(entry);
        }

        if (total < 40) {
            diagnostics.push({
                id: "_time",
                label: "Total duration",
                inAgenda: false,
                status: "warn",
                code: "TIME_UNDER",
                message: "Agenda is under 40 minutes — you may not have enough time for discovery and alignment."
            });
        } else if (total > 50) {
            diagnostics.push({
                id: "_time",
                label: "Total duration",
                inAgenda: false,
                status: "warn",
                code: "TIME_OVER",
                message: "Agenda exceeds 50 minutes — trim or defer lower-priority items so the call stays focused."
            });
        } else if (total >= 40 && total <= 50) {
            diagnostics.push({
                id: "_time",
                label: "Total duration",
                inAgenda: false,
                status: "pass",
                code: "TIME_OK",
                message: "Total time sits in the 40–50 minute target band."
            });
        }

        return diagnostics;
    }

    function score(items) {
        var ids = items.map(function (i) {
            return i.id;
        });
        var total = items.reduce(function (s, i) {
            return s + (i.minutes || 0);
        }, 0);

        var criticalCount = CRITICAL_IDS.filter(function (id) {
            return has(ids, id);
        }).length;
        var riskyCount = RISKY_IDS.filter(function (id) {
            return has(ids, id);
        }).length;

        var weakCode = null;
        var tier;
        var stars;

        if (
            riskyCount >= 2 ||
            !has(ids, "stakeholder-success") ||
            anyRiskyBeforeSuccess(ids) ||
            scopeBeforeCoreDiscovery(ids)
        ) {
            tier = "weak";
            stars = 1;
            weakCode = weakReasonCode(ids, riskyCount);
        } else if (
            criticalCount === 4 &&
            riskyCount === 0 &&
            total >= 40 &&
            total <= 50 &&
            isOrderStrong(ids)
        ) {
            tier = "strong";
            stars = 3;
        } else {
            tier = "partial";
            stars = 2;
        }

        var diagnostics = buildDiagnostics(items, ids, total);
        var mayaLine = pickMayaLine(tier, weakCode);

        return {
            tier: tier,
            stars: stars,
            feedback: FEEDBACK[tier],
            mayaLine: mayaLine,
            weakCode: weakCode,
            diagnostics: diagnostics,
            totalMinutes: total,
            criticalCount: criticalCount,
            riskyCount: riskyCount
        };
    }

    function persistFromBuilder(agendaRows) {
        var items = agendaRows.map(function (r) {
            return {
                id: r.id,
                label: labelFor(r.id),
                minutes: r.minutes,
                category: categoryFor(r.id)
            };
        });
        var verdict = score(items);
        var payload = {
            schemaVersion: SCHEMA_VERSION,
            items: items,
            totalMinutes: verdict.totalMinutes,
            savedAt: Date.now(),
            tier: verdict.tier,
            stars: verdict.stars,
            feedback: verdict.feedback,
            mayaLine: verdict.mayaLine,
            weakCode: verdict.weakCode,
            diagnostics: verdict.diagnostics
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
        SCHEMA_VERSION: SCHEMA_VERSION,
        STORAGE_KEY: STORAGE_KEY,
        CRITICAL_IDS: CRITICAL_IDS,
        RISKY_IDS: RISKY_IDS,
        CATEGORIES: CATEGORIES,
        labelFor: labelFor,
        categoryFor: categoryFor,
        score: score,
        persistFromBuilder: persistFromBuilder,
        loadResult: loadResult
    };
})();
