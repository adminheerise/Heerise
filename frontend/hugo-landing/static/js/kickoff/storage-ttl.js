/**
 * localStorage wrapper with 6h TTL for Phase 5 keys.
 */
(function (global) {
  "use strict";

  var TTL_MS = 6 * 60 * 60 * 1000;

  function now() {
    return Date.now();
  }

  function readMeta() {
    try {
      var raw = localStorage.getItem("heerise_lumina_sim_ttl_v1");
      if (!raw) return { entries: {} };
      var o = JSON.parse(raw);
      return o && typeof o === "object" ? o : { entries: {} };
    } catch (e) {
      return { entries: {} };
    }
  }

  function writeMeta(meta) {
    try {
      localStorage.setItem("heerise_lumina_sim_ttl_v1", JSON.stringify(meta));
    } catch (e) {}
  }

  function isExpired(key) {
    var meta = readMeta();
    var ent = meta.entries && meta.entries[key];
    if (!ent || !ent.savedAt) return false;
    return now() - ent.savedAt > TTL_MS;
  }

  function touch(key) {
    var meta = readMeta();
    meta.entries = meta.entries || {};
    meta.entries[key] = { savedAt: now() };
    writeMeta(meta);
  }

  function getJSON(key) {
    if (isExpired(key)) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
      return null;
    }
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      touch(key);
    } catch (e) {}
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
    var meta = readMeta();
    if (meta.entries && meta.entries[key]) {
      delete meta.entries[key];
      writeMeta(meta);
    }
  }

  global.HeeriseStorageTTL = { getJSON: getJSON, setJSON: setJSON, remove: remove, isExpired: isExpired, TTL_MS: TTL_MS };
})(typeof window !== "undefined" ? window : globalThis);
