/**
 * Phase 5 kickoff — backend API client.
 */
(function (global) {
  "use strict";

  var C = global.HeeriseKickoffConstants;

  function apiBase() {
    var host = global.location && global.location.hostname;
    var isLocal = host === "localhost" || host === "127.0.0.1";
    var b = global.HEERISE_API_BASE || global.API_BASE || (isLocal ? "http://localhost:8000" : "/api");
    b = String(b).replace(/\/$/, "");
    return b === "/api" ? "/api/sim" : b + "/api/sim";
  }

  function postJson(path, body) {
    var url = apiBase() + path;
    var timeoutMs = (C && C.API_TIMEOUT_MS) || 60000;
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
            throw new Error(t || "Request failed " + r.status);
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
      if (!C.RETRY_ON_FAILURE) throw err;
      return fn();
    });
  }

  function jordanRespond(runtimeContext) {
    return withRetry(function () {
      return postJson("/kickoff/jordan/respond", { runtime_context: runtimeContext }).then(function (d) {
        return d.spoken_response || "";
      });
    });
  }

  function priyaRespond(runtimeContext) {
    return withRetry(function () {
      return postJson("/kickoff/priya/respond", { runtime_context: runtimeContext }).then(function (d) {
        return d.spoken_response || "";
      });
    });
  }

  global.HeeriseKickoffApi = { jordanRespond: jordanRespond, priyaRespond: priyaRespond, apiBase: apiBase };
})(typeof window !== "undefined" ? window : globalThis);
