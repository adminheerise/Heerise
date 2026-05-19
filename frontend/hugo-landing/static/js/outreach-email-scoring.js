/**
 * Phase 3 — Outreach Email · client-side rule-based scorer.
 *
 * This is a faithful port of the Python pseudocode in
 * docs/PHASE3_OUTREACH_EMAIL_GRADING_PLAN.md (sections §2.1 – §2.7).
 * It runs entirely in the browser — no API calls, no LLMs — so the
 * Phase-3 simulation is end-to-end functional before the backend
 * grading endpoint ships.
 *
 * Compromises vs. the spec (all called out in the plan, §10):
 *   - The current compose UI has a single body textarea, not five named
 *     sections. Each section rule therefore runs against the entire body;
 *     the keyword/regex signals are robust to that.
 *   - Typo detection is skipped (no spellchecker in the browser); the
 *     tone rule still applies its other caps.
 *
 * Output is exposed on the global object as `HeeriseOutreachScorer`:
 *   HeeriseOutreachScorer.score({subject, body}) →
 *     { subject, body_word_count, scorecards:[{criterion,score,failed_reasons}],
 *       total, tier, computed_at }
 *   HeeriseOutreachScorer.tierLabel(score)        // 1|2|3 → "Developing"…
 *   HeeriseOutreachScorer.tierBody(criterion, n)  // narrative copy for the result card
 *   HeeriseOutreachScorer.overallStars(tier)      // tier → 1|2|3 stars
 *
 * Persistence: on submission, the compose page writes the full result to
 * sessionStorage under STORAGE_KEY; the result page reads from there.
 */
(function (global) {
    'use strict';

    var STORAGE_KEY = 'heerise.outreach_email.result.v1';

    // ============================================================
    // helpers
    // ============================================================
    function lower(s) { return (s || '').toLowerCase(); }
    function words(s) { return (s || '').trim().split(/\s+/).filter(Boolean); }
    function wordCount(s) { return words(s).length; }

    function countDistinctKeywords(text, list) {
        var t = lower(text);
        var n = 0;
        list.forEach(function (kw) { if (t.indexOf(kw.toLowerCase()) !== -1) n++; });
        return n;
    }
    function countDistinctRegex(text, regexMap) {
        var n = 0;
        Object.keys(regexMap).forEach(function (k) {
            if (regexMap[k].test(text)) n++;
        });
        return n;
    }
    function anyRegex(text, patterns) {
        for (var i = 0; i < patterns.length; i++) {
            if (patterns[i].test(text)) return true;
        }
        return false;
    }

    // ============================================================
    // §2.1 Subject Line
    // ============================================================
    function scoreSubjectLine(subject) {
        var s = (subject || '').trim();
        var sLower = s.toLowerCase();
        var w = words(s);

        var PROJECT = /\b(aria|kickoff|discovery)\b/i;
        var STAKES = /\b(rep readiness|readiness|ramp|ramp-time|performance|field enablement|enablement|deal|go-to-market)\b/i;
        var GENERIC = ['kickoff meeting', 'meeting', 'hello', 'intro', 'hi'];

        if (GENERIC.indexOf(sLower) !== -1) return { score: 1, failed_reasons: ['generic_only'] };
        if (w.length > 15)                 return { score: 1, failed_reasons: ['too_long'] };
        if (!PROJECT.test(sLower))         return { score: 1, failed_reasons: ['no_anchor'] };
        if (!STAKES.test(sLower))          return { score: 2, failed_reasons: ['no_stakes'] };
        if (w.length <= 10)                return { score: 3, failed_reasons: [] };
        return { score: 2, failed_reasons: ['too_long'] };
    }

    // ============================================================
    // §2.2 Context & Credibility
    // ============================================================
    function scoreContext(text) {
        var ANCHORS = {
            ramp_data:      /7\.?2|seven\s*point\s*two|ramp[- ]?time/i,
            wiki:           /\bwiki\b/i,
            manager_led:    /manager[- ]?(led|sessions?)/i,
            product:        /\baria\b/i,
            stakeholders:   /\b(jordan|priya)\b/i,
            prior_attempts: /prior (training|attempts?)|previously tried/i
        };
        var INTRO = [
            /\bI[' \u2019]?m\b/i, /\bI am\b/i, /\bmy role\b/i,
            /learning designer/i, /\bLXD\b/, /instructional designer/i
        ];

        var hits     = countDistinctRegex(text, ANCHORS);
        var hasIntro = anyRegex(text, INTRO);

        if (!hasIntro) return { score: 1, failed_reasons: ['no_intro'] };
        if (hits >= 4) return { score: 3, failed_reasons: [] };
        if (hits >= 2) return { score: 2, failed_reasons: ['few_specifics'] };
        return { score: 1, failed_reasons: ['no_specifics'] };
    }

    // ============================================================
    // §2.3 Meeting Purpose
    // ============================================================
    function scoreMeetingPurpose(text) {
        var DELIV = ['objective', 'scope', 'success', 'definition', 'constraint', 'boundary'];
        var VERBS = ['agree', 'confirm', 'align', 'establish', 'walk away with', 'discover'];

        var dn = countDistinctKeywords(text, DELIV);
        var vn = countDistinctKeywords(text, VERBS);

        if (dn >= 3 && vn >= 1) return { score: 3, failed_reasons: [] };
        if (dn >= 1 && vn >= 1) return { score: 2, failed_reasons: ['vague_purpose'] };
        return { score: 1, failed_reasons: ['no_purpose'] };
    }

    // ============================================================
    // §2.4 Pre-Call Question (rules-based proxy — see plan §10)
    // ============================================================
    function scorePreCallQuestion(text) {
        if (text.indexOf('?') === -1) return { score: 1, failed_reasons: ['no_question'] };

        var GOOGLEABLE = [
            /what (does|is) aria/i,
            /what are your goals/i,
            /tell me about yourself/i,
            /what'?s your timeline/i,
            /what do you do/i,
            /how does .* work/i,
            /can you (explain|describe) (the )?(product|aria)/i,
            /what'?s the budget/i
        ];
        if (anyRegex(text, GOOGLEABLE)) return { score: 1, failed_reasons: ['googleable'] };

        var SIGNALS = {
            scenario:    /\b(deal|discovery|demo|objection|onboard|pitch)\b/i,
            temporal:    /\b(first \d+ days?|in the field|day one|week \d+|first \d+ months?)\b/i,
            stakeholder: /\b(jordan|priya|you|your team)\b/i,
            hypothesis:  /\b(when|if|what if|what tends to|usually|most often|in your experience)\b/i,
            loss:        /\b(loses?|fails?|struggles?|breaks? down|goes wrong|trips up|stalls?)\b/i
        };
        var n = countDistinctRegex(text, SIGNALS);

        if (n >= 3) return { score: 3, failed_reasons: [] };
        if (n >= 1) return { score: 2, failed_reasons: ['few_signals'] };
        return { score: 1, failed_reasons: ['no_signals'] };
    }

    // ============================================================
    // §2.5 Scheduling
    // ============================================================
    function scoreScheduling(text) {
        // Pattern A: "Mon 5 May ... 10am-11am"
        var WIN_A = /(Mon|Tue|Wed|Thu|Fri)[a-z]*\s+\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\S]{0,30}?\d{1,2}(:\d{2})?\s*(AM|PM|am|pm)/g;
        // Pattern B: "Tuesday at 3:00 PM" / "Wed 2pm"
        var WIN_B = /(Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?)[a-z]*[\s,]+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)/g;

        var DEFER = [
            /let me know what works/i, /whatever works for you/i,
            /your call/i, /flexible on time/i, /you tell me/i
        ];

        var found = (text.match(WIN_A) || []).concat(text.match(WIN_B) || []);

        if (found.length >= 2)         return { score: 3, failed_reasons: [] };
        if (found.length === 1)        return { score: 2, failed_reasons: ['single_window'] };
        if (anyRegex(text, DEFER))     return { score: 1, failed_reasons: ['deferred'] };
        return { score: 1, failed_reasons: ['no_windows'] };
    }

    // ============================================================
    // §2.6 Close
    // ============================================================
    function scoreClose(text) {
        var sharedGoal = /\b(ramp|readiness|team|aria|rep)\b/i.test(text);
        var partner    = /\b(partner|together|collaborate|alongside|both of you)\b/i.test(text);
        var forward    = /\b(looking forward|excited|appreciate|can'?t wait)\b/i.test(text);
        var signature  = /\b(Best|Thanks|Regards|Sincerely|Cheers)[,\s\n]/.test(text);

        var n = (sharedGoal ? 1 : 0) + (partner ? 1 : 0) + (forward ? 1 : 0);
        var score;
        if (n === 3) score = 3;
        else if (n === 2) score = 2;
        else score = 1;

        if (!signature) score = Math.min(score, 2);

        var failed = [];
        if (!signature) failed.push('no_signature');
        if (!sharedGoal) failed.push('no_shared_goal');
        if (!partner)    failed.push('no_partner_lang');
        if (!forward)    failed.push('no_forward_looking');

        return { score: score, failed_reasons: failed };
    }

    // ============================================================
    // §2.7 Tone & Word Count
    // ============================================================
    function scoreToneWordCount(text) {
        var WORDS_EXEMPLARY_MAX = 270;
        var WORDS_PROFICIENT_MAX = 300;

        var JARGON = ['synergy', 'leverage', 'modality', 'ilt', 'scorm',
                      'stakeholdering', 'actionable', 'ideate',
                      'deliverable', 'operationalize'];
        var CASUAL = ['hey ', 'yo ', 'guys', 'gonna', 'wanna', 'kinda',
                      'btw', 'lol', 'asap', 'k thx'];
        var PRESUMP = [/\bI'?ll need you to\b/i, /\byou must\b/i,
                       /\bmake sure to\b/i, /\bby EOD\b/i, /\bnon-negotiable\b/i];
        var STIFF   = [/\bpursuant to\b/i, /\bper our discussion\b/i,
                       /\bplease be advised\b/i, /\bhereby\b/i, /\bwhereas\b/i];

        var w        = wordCount(text);
        var jargonN  = countDistinctKeywords(text, JARGON);
        var casualN  = countDistinctKeywords(text, CASUAL);
        var presumpN = PRESUMP.reduce(function (n, r) { return n + (r.test(text) ? 1 : 0); }, 0);
        var stiffN   = STIFF.reduce(function (n, r) { return n + (r.test(text) ? 1 : 0); }, 0);

        var cap;
        if (w > WORDS_PROFICIENT_MAX)       cap = 1;
        else if (w > WORDS_EXEMPLARY_MAX)   cap = 2;
        else                                cap = 3;

        if (jargonN >= 2)                   cap = Math.min(cap, 1);
        else if (jargonN >= 1)              cap = Math.min(cap, 2);
        if (casualN >= 1 || presumpN >= 1 || stiffN >= 1) cap = Math.min(cap, 2);

        var outcomeLang = /\b(outcome|ramp|readiness|performance|field|rep)\b/i.test(text);
        if (cap === 3 && !outcomeLang) cap = 2;

        var failed = [];
        if (w > WORDS_PROFICIENT_MAX) failed.push('exceeds_word_cap');
        else if (w > WORDS_EXEMPLARY_MAX) failed.push('near_word_cap');
        if (jargonN >= 1)  failed.push('jargon');
        if (casualN >= 1)  failed.push('too_casual');
        if (presumpN >= 1) failed.push('presumptuous');
        if (stiffN >= 1)   failed.push('too_stiff');
        if (cap < 3 && !outcomeLang) failed.push('no_outcome_language');

        return { score: cap, failed_reasons: failed };
    }

    // ============================================================
    // orchestrator
    // ============================================================
    function score(input) {
        var subject = (input && input.subject) || '';
        var body    = (input && input.body) || '';

        var specs = [
            { criterion: 'subject_line',      fn: function () { return scoreSubjectLine(subject); } },
            { criterion: 'context',           fn: function () { return scoreContext(body); } },
            { criterion: 'meeting_purpose',   fn: function () { return scoreMeetingPurpose(body); } },
            { criterion: 'pre_call_question', fn: function () { return scorePreCallQuestion(body); } },
            { criterion: 'scheduling',        fn: function () { return scoreScheduling(body); } },
            { criterion: 'close',             fn: function () { return scoreClose(body); } },
            { criterion: 'tone_word_count',   fn: function () { return scoreToneWordCount(body); } }
        ];
        var scorecards = specs.map(function (s) {
            var r = s.fn();
            return { criterion: s.criterion, score: r.score, failed_reasons: r.failed_reasons };
        });
        var total = scorecards.reduce(function (a, c) { return a + c.score; }, 0);
        var tier;
        if (total >= 18)      tier = 'exemplary';
        else if (total >= 12) tier = 'proficient';
        else                  tier = 'developing';

        return {
            subject: subject,
            body_word_count: wordCount(body),
            scorecards: scorecards,
            total: total,
            tier: tier,
            computed_at: new Date().toISOString()
        };
    }

    // ============================================================
    // narrative copy for the result page
    // ============================================================
    var TIER_LABELS = { 1: 'Developing', 2: 'Proficient', 3: 'Exemplary' };
    var TIER_CLASSES = {
        1: 'sks-emr-tier--developing',
        2: 'sks-emr-tier--proficient',
        3: 'sks-emr-tier--exemplary'
    };
    /* Card body copy mirrors the Phase 3 rubric in
       docs/PHASE3_OUTREACH_EMAIL_GRADING_PLAN.md (§2.1 – §2.7). */
    var TIER_BODY = {
        subject_line: {
            1: 'Generic title with no reference to Aria or business problem.',
            2: 'Names the project but does not communicate stakes.',
            3: 'Communicates stakes in under 10 words. Would stand out in a busy inbox.'
        },
        context: {
            1: 'Generic self-intro with no evidence of research.',
            2: 'Names project and general goal. Aware but lacks specific Phase 2 data points.',
            3: 'Cites specific findings and shows understanding of stakeholder priorities.'
        },
        meeting_purpose: {
            1: 'Vague purpose: "discuss the project" without specifics.',
            2: 'General purpose with topics, but not specific deliverables.',
            3: 'Names deliverables: agreed objectives, confirmed scope, each stakeholder\u2019s definition of success.'
        },
        pre_call_question: {
            1: 'Googleable or already in the brief. Generic ("What are your goals?").',
            2: 'Relevant and somewhat targeted, but not hypothesis-driven.',
            3: 'Only answerable by Jordan or Priya personally. Tests a Phase 2 hypothesis. Makes the kickoff more productive.'
        },
        scheduling: {
            1: 'Defers entirely ("Let me know what works") or no concrete window.',
            2: 'Provides one window or a general timeframe.',
            3: 'Provides specific availability windows; flexible and considerate of stakeholder calendars.'
        },
        close: {
            1: 'Abrupt or generic. No forward-looking statement.',
            2: 'Mentions looking forward to the call. Adequate but unremarkable.',
            3: 'Ties back to shared goal (rep readiness). Positions as partner. Leaves them wanting to reply.'
        },
        tone_word_count: {
            1: 'L&D jargon, overly casual or stiff. Exceeds 300 words.',
            2: 'Professional and clear. Near or at the 300-word limit.',
            3: 'Speaks stakeholder language (outcomes, not modalities). Confident, not presumptuous. Well under 300 words.'
        }
    };
    /* Tier → number of stars on the overall verdict block. */
    var OVERALL_STARS = { developing: 1, proficient: 2, exemplary: 3 };
    var OVERALL_LABELS = { developing: 'DEVELOPING', proficient: 'PROFICIENT', exemplary: 'EXEMPLARY' };

    // ============================================================
    // session persistence
    // ============================================================
    function save(result) {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result)); }
        catch (e) { /* private mode etc. — fall through silently */ }
    }
    function load() {
        try {
            var raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var o = JSON.parse(raw);
            if (!o || !o.scorecards || !Array.isArray(o.scorecards)) return null;
            return o;
        } catch (e) { return null; }
    }
    function clear() { try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {} }

    // ============================================================
    // public API
    // ============================================================
    global.HeeriseOutreachScorer = {
        STORAGE_KEY: STORAGE_KEY,
        score: score,
        save: save,
        load: load,
        clear: clear,
        tierLabel:     function (n) { return TIER_LABELS[n] || ''; },
        tierClass:     function (n) { return TIER_CLASSES[n] || ''; },
        tierBody:      function (criterion, n) { return (TIER_BODY[criterion] || {})[n] || ''; },
        overallStars:  function (tier) { return OVERALL_STARS[tier] || 1; },
        overallLabel:  function (tier) { return OVERALL_LABELS[tier] || ''; }
    };
})(window);
