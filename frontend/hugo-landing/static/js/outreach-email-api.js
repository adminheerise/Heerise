/**
 * Phase 3 outreach email — Gemini API scoring (POST /api/sim/outreach-email-score).
 * Offline rule-based scoring is test-only (localStorage heerise_sim_test=1).
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "heeriseOutreachEmailFeedback";
  var DEFAULT_FEEDBACK_PATH = "/acc/stakeholder-kickoff/outreach-feedback/";
  var SCORE_TIMEOUT_MS = 90000;

  function isTestMode() {
    try {
      return global.localStorage.getItem("heerise_sim_test") === "1";
    } catch (e) {
      return false;
    }
  }

  function scoreUrl() {
    var host = global.location.hostname;
    var isLocal = host === "localhost" || host === "127.0.0.1";
    var b = global.HEERISE_API_BASE || (isLocal ? "http://localhost:8000" : "/api");
    if (b === "/api") {
      return "/api/sim/outreach-email-score";
    }
    return String(b).replace(/\/$/, "") + "/api/sim/outreach-email-score";
  }

  function parseApiResponse(res) {
    return res.text().then(function (text) {
      var payload = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch (e) {
        payload = null;
      }
      if (!res.ok) {
        var detail = payload && payload.detail;
        if (Array.isArray(detail)) {
          detail = detail
            .map(function (x) {
              return x.msg || String(x);
            })
            .join("; ");
        }
        var msg =
          detail ||
          (payload && payload.message) ||
          "Request failed (" + res.status + "). Is the API server running?";
        throw new Error(msg);
      }
      if (!payload || !payload.criteria) {
        throw new Error("Invalid response from scoring service.");
      }
      return payload;
    });
  }

  function fetchWithTimeout(url, options, ms) {
    var controller = new AbortController();
    var timer = global.setTimeout(function () {
      controller.abort();
    }, ms);
    return fetch(url, Object.assign({}, options, { signal: controller.signal })).finally(function () {
      global.clearTimeout(timer);
    });
  }

  function clientScoreToFeedbackPayload(subjectVal, bodyVal) {
    if (!global.HeeriseOutreachScorer) return null;
    var client = global.HeeriseOutreachScorer.score({ subject: subjectVal, body: bodyVal });
    var idMap = { context: "context_credibility" };
    var criteria = (client.scorecards || []).map(function (c) {
      var id = idMap[c.criterion] || c.criterion;
      var label = global.HeeriseOutreachScorer.tierLabel(c.score);
      var body = global.HeeriseOutreachScorer.tierBody(c.criterion, c.score);
      return {
        id: id,
        score: c.score,
        feedback: label + " \u2014 " + body,
      };
    });
    return {
      criteria: criteria,
      total_score: client.total || 0,
      overall_level: (client.tier || "proficient").toUpperCase(),
      stakeholder_response: "",
      word_count: client.body_word_count || 0,
    };
  }

  function feedbackUrl() {
    if (typeof global.SKS_OUTREACH_FEEDBACK_URL === "string" && global.SKS_OUTREACH_FEEDBACK_URL.trim()) {
      return global.SKS_OUTREACH_FEEDBACK_URL.trim();
    }
    return DEFAULT_FEEDBACK_PATH;
  }

  function saveFeedbackAndGo(payload, url) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      /* continue */
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e2) {
      /* continue */
    }
    global.location.assign(url || feedbackUrl());
  }

  function formatError(err) {
    var msg = (err && err.message) || "Could not score your email.";
    if (err && err.name === "AbortError") {
      msg = "Scoring timed out. Check that the API server is running, then try again.";
    }
    if (msg === "Failed to fetch" || msg.indexOf("NetworkError") !== -1) {
      msg =
        "Cannot reach the API server. In local dev run: cd backend && uvicorn app.main:app --port 8000";
    }
    return msg;
  }

  /**
   * @param {object} opts
   * @param {string} opts.subject
   * @param {string} opts.body
   * @param {function} [opts.onApiSuccess] — called with API payload before redirect
   * @param {function} [opts.onOfflineFallback] — test mode only
   * @param {function} [opts.onError] — called with Error when API fails (no redirect)
   * @param {boolean} [opts.redirect=true]
   * @param {string} [opts.feedbackUrl]
   */
  function submit(opts) {
    opts = opts || {};
    return fetchWithTimeout(
      scoreUrl(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: opts.subject || "", body: opts.body || "" }),
      },
      SCORE_TIMEOUT_MS
    )
      .then(parseApiResponse)
      .then(function (data) {
        if (opts.onApiSuccess) opts.onApiSuccess(data);
        if (opts.redirect !== false) {
          saveFeedbackAndGo(data, opts.feedbackUrl);
        }
        return data;
      })
      .catch(function (err) {
        if (isTestMode()) {
          var offline = clientScoreToFeedbackPayload(opts.subject, opts.body);
          if (offline) {
            if (opts.onOfflineFallback) opts.onOfflineFallback(offline);
            if (opts.redirect !== false) {
              saveFeedbackAndGo(offline, opts.feedbackUrl);
            }
            return offline;
          }
        }
        if (opts.onError) {
          opts.onError(err, formatError(err));
        }
        throw err;
      });
  }

  global.HeeriseOutreachEmailApi = {
    STORAGE_KEY: STORAGE_KEY,
    scoreUrl: scoreUrl,
    feedbackUrl: feedbackUrl,
    saveFeedbackAndGo: saveFeedbackAndGo,
    submit: submit,
    isTestMode: isTestMode,
    clientScoreToFeedbackPayload: clientScoreToFeedbackPayload,
    formatError: formatError,
  };
})(window);
