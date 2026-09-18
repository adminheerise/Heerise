/**
 * Lumina test-user admin dashboard (X-Lumina-Admin-Key).
 * Remembers key on this device so the desktop/URL shortcut can open the DB view directly.
 */
(function () {
  "use strict";

  var KEY_STORE = "heerise_lumina_admin_key";
  var REMEMBER_STORE = "heerise_lumina_admin_remember";
  var searchTimer = null;

  function apiBase() {
    var host = window.location && window.location.hostname;
    var isLocal = host === "localhost" || host === "127.0.0.1";
    var b = window.HEERISE_API_BASE || window.API_BASE || (isLocal ? "http://localhost:8000" : "/api");
    b = String(b).replace(/\/$/, "");
    return b === "/api" ? "/api" : b + (b.endsWith("/api") ? "" : "/api");
  }

  function rememberEnabled() {
    try {
      return localStorage.getItem(REMEMBER_STORE) !== "0";
    } catch (e) {
      return true;
    }
  }

  function setRememberEnabled(on) {
    try {
      localStorage.setItem(REMEMBER_STORE, on ? "1" : "0");
    } catch (e) {}
  }

  function getKey() {
    try {
      var s = sessionStorage.getItem(KEY_STORE);
      if (s) return s;
      if (rememberEnabled()) return localStorage.getItem(KEY_STORE) || "";
      return "";
    } catch (e) {
      return "";
    }
  }

  function setKey(k) {
    var val = k || "";
    try {
      sessionStorage.setItem(KEY_STORE, val);
      if (rememberEnabled() && val) {
        localStorage.setItem(KEY_STORE, val);
      } else {
        localStorage.removeItem(KEY_STORE);
      }
    } catch (e) {}
  }

  function clearKey() {
    try {
      sessionStorage.removeItem(KEY_STORE);
      localStorage.removeItem(KEY_STORE);
    } catch (e) {}
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString();
    } catch (e) {
      return iso;
    }
  }

  function show(el, on) {
    if (!el) return;
    el.hidden = !on;
  }

  function adminFetch(path) {
    return fetch(apiBase() + path, {
      method: "GET",
      headers: {
        "X-Lumina-Admin-Key": getKey(),
      },
      credentials: "same-origin",
    }).then(function (r) {
      return r.text().then(function (t) {
        var data = {};
        try {
          data = t ? JSON.parse(t) : {};
        } catch (err) {
          data = { detail: t || "Request failed" };
        }
        if (!r.ok) {
          var detail = data.detail;
          if (Array.isArray(detail)) {
            detail = detail.map(function (d) {
              return d.msg || JSON.stringify(d);
            }).join(" ");
          }
          var err = new Error(detail || "Request failed (" + r.status + ")");
          err.status = r.status;
          throw err;
        }
        return data;
      });
    });
  }

  function renderStats(stats) {
    var total = (stats && stats.total_users) || 0;
    var sub = (stats && stats.email_subscribers) || 0;
    var month = (stats && stats.this_month) || 0;
    var elTotal = document.getElementById("lum-adm-stat-total");
    var elSub = document.getElementById("lum-adm-stat-sub");
    var elMonth = document.getElementById("lum-adm-stat-month");
    var meta = document.getElementById("lum-adm-meta");
    if (elTotal) elTotal.textContent = String(total);
    if (elSub) elSub.textContent = String(sub);
    if (elMonth) elMonth.textContent = String(month);
    if (meta) meta.textContent = total + " registered · " + sub + " subscribed";
  }

  function renderUsers(rows) {
    var tbody = document.getElementById("lum-adm-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!rows || !rows.length) {
      var empty = document.createElement("tr");
      empty.className = "lum-adm-empty-row";
      empty.innerHTML = '<td colspan="5">No users registered yet.</td>';
      tbody.appendChild(empty);
      return;
    }
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td><input type="checkbox" aria-label="Select user" /></td>' +
        "<td></td><td></td><td></td><td></td>";
      var cells = tr.querySelectorAll("td");
      cells[1].textContent = row.full_name || "—";
      cells[2].textContent = row.email || "—";
      cells[3].textContent = row.subscribed ? "Yes" : "No";
      cells[4].textContent = fmtDate(row.registered_at);
      tbody.appendChild(tr);
    });
  }

  function loadAll(q) {
    var query = q ? "?q=" + encodeURIComponent(q) : "";
    return Promise.all([
      adminFetch("/lumina-test-users/admin/stats"),
      adminFetch("/lumina-test-users/admin/users" + query),
    ]).then(function (pair) {
      renderStats(pair[0]);
      renderUsers(pair[1]);
    });
  }

  function unlockUI(ok) {
    show(document.getElementById("lum-adm-lock"), !ok);
    show(document.getElementById("lum-adm-panel"), ok);
  }

  function run() {
    var lockErr = document.getElementById("lum-adm-lock-error");
    var unlockBtn = document.getElementById("lum-adm-unlock");
    var lockBtn = document.getElementById("lum-adm-lock-btn");
    var keyInput = document.getElementById("lum-adm-key");
    var rememberEl = document.getElementById("lum-adm-remember");
    var search = document.getElementById("lum-adm-search");

    if (rememberEl) rememberEl.checked = rememberEnabled();

    function tryLoad() {
      if (lockErr) {
        lockErr.hidden = true;
        lockErr.textContent = "";
      }
      return loadAll((search && search.value) || "")
        .then(function () {
          unlockUI(true);
        })
        .catch(function (err) {
          unlockUI(false);
          if (err && err.status === 401) clearKey();
          if (lockErr) {
            lockErr.hidden = false;
            lockErr.textContent = (err && err.message) || "Could not unlock.";
          }
        });
    }

    if (unlockBtn) {
      unlockBtn.addEventListener("click", function () {
        var k = (keyInput && keyInput.value) || "";
        if (!k.trim()) {
          if (lockErr) {
            lockErr.hidden = false;
            lockErr.textContent = "Enter the admin key.";
          }
          return;
        }
        setRememberEnabled(!!(rememberEl && rememberEl.checked));
        setKey(k.trim());
        tryLoad();
      });
    }

    if (lockBtn) {
      lockBtn.addEventListener("click", function () {
        clearKey();
        unlockUI(false);
        if (keyInput) keyInput.value = "";
      });
    }

    if (keyInput) {
      keyInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (unlockBtn) unlockBtn.click();
        }
      });
    }

    if (search) {
      search.addEventListener("input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          if (!getKey()) return;
          loadAll(search.value || "").catch(function () {});
        }, 280);
      });
    }

    if (getKey()) {
      tryLoad();
    } else {
      unlockUI(false);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
