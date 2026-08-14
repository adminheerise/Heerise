/**

 * Phase 5 kickoff — backend API client.

 */

(function (global) {

  "use strict";



  var C = global.HeeriseKickoffConstants;

  var geminiUnavailable = false;



  function apiBase() {

    var host = global.location && global.location.hostname;

    var isLocal = host === "localhost" || host === "127.0.0.1";

    var b = global.HEERISE_API_BASE || global.API_BASE || (isLocal ? "http://localhost:8000" : "/api");

    b = String(b).replace(/\/$/, "");

    return b === "/api" ? "/api/sim" : b + "/api/sim";

  }



  function isUnconfiguredError(err) {

    var msg = (err && err.message) || String(err || "");

    return /503|not configured|GEMINI_API_KEY/i.test(msg);

  }



  function isRetryableError(err) {

    if (isUnconfiguredError(err)) return false;

    var msg = (err && err.message) || String(err || "");

    var name = (err && err.name) || "";

    return name === "AbortError" || /Failed to fetch|NetworkError|502|504|timeout|aborted/i.test(msg);

  }



  function postJson(path, body) {

    var url = apiBase() + path;

    var timeoutMs = (C && C.API_TIMEOUT_MS) || 45000;

    var controller = new AbortController();

    var timer = setTimeout(function () {

      controller.abort();

    }, timeoutMs);

    return fetch(url, {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      credentials: "same-origin",

      body: JSON.stringify(body || {}),

      signal: controller.signal,

    })

      .then(function (r) {

        clearTimeout(timer);

        if (!r.ok) {

          return r.text().then(function (t) {

            var err = new Error(t || "Request failed " + r.status);

            err.status = r.status;

            throw err;

          });

        }

        return r.json();

      })

      .catch(function (e) {

        clearTimeout(timer);

        throw e;

      });

  }



  function withRetry(fn) {

    return fn().catch(function (err) {

      if (isUnconfiguredError(err)) {

        geminiUnavailable = true;

        throw err;

      }

      if (!(C && C.RETRY_ON_FAILURE) || !isRetryableError(err)) throw err;

      return fn();

    });

  }



  function jordanRespond(runtimeContext) {

    if (geminiUnavailable && C && C.FAIL_FAST_ON_UNCONFIGURED) {

      return Promise.reject(new Error("GEMINI_API_KEY is not configured"));

    }

    return withRetry(function () {

      return postJson("/kickoff/jordan/respond", { runtime_context: runtimeContext }).then(function (d) {

        return d.spoken_response || "";

      });

    });

  }



  function priyaRespond(runtimeContext) {

    if (geminiUnavailable && C && C.FAIL_FAST_ON_UNCONFIGURED) {

      return Promise.reject(new Error("GEMINI_API_KEY is not configured"));

    }

    return withRetry(function () {

      return postJson("/kickoff/priya/respond", { runtime_context: runtimeContext }).then(function (d) {

        return d.spoken_response || "";

      });

    });

  }



  global.HeeriseKickoffApi = {

    jordanRespond: jordanRespond,

    priyaRespond: priyaRespond,

    apiBase: apiBase,

    isGeminiUnavailable: function () {

      return geminiUnavailable;

    },

  };

})(typeof window !== "undefined" ? window : globalThis);


