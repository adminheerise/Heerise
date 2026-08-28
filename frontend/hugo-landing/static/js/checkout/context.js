(function (global) {
  var STORAGE_KEY = "heeriseCheckout";

  function readSaved() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function save(ctx) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx || {}));
    } catch (e) {}
  }

  function readContext() {
    var params = new URLSearchParams(window.location.search);
    var saved = readSaved();
    return {
      product_id: params.get("product_id") || saved.product_id || "bootcamp-premium",
      product_name: params.get("product_name") || saved.product_name || "LXD & ID Career Lab — Premium Tier",
      amount: Number(saved.amount || 249700),
      currency: (params.get("currency") || saved.currency || "USD").toUpperCase(),
      customer_email: params.get("email") || saved.customer_email || "",
      first_name: params.get("first_name") || saved.first_name || "",
      order_id: params.get("order_id") || saved.order_id || "",
      amount_display: saved.amount_display || ""
    };
  }

  function formatMoney(cents, currency) {
    var cur = currency || "USD";
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format((cents || 0) / 100);
    } catch (e) {
      return "$" + ((cents || 0) / 100).toFixed(2);
    }
  }

  function buildQuery(ctx, extra) {
    var p = new URLSearchParams();
    p.set("product_id", ctx.product_id || "");
    if (ctx.customer_email) p.set("email", ctx.customer_email);
    if (ctx.first_name) p.set("first_name", ctx.first_name);
    if (ctx.order_id) p.set("order_id", ctx.order_id);
    if (extra) {
      Object.keys(extra).forEach(function (k) {
        if (extra[k] != null && extra[k] !== "") p.set(k, extra[k]);
      });
    }
    return p.toString();
  }

  function hydrateSummary(root, ctx) {
    if (!root) return;
    var money = ctx.amount_display || formatMoney(ctx.amount, ctx.currency);
    root.querySelectorAll("[data-order-id]").forEach(function (el) {
      el.textContent = ctx.order_id || "Assigned at checkout";
    });
    root.querySelectorAll("[data-product-name]").forEach(function (el) {
      el.textContent = ctx.product_name || "Career Lab";
    });
    root.querySelectorAll("[data-amount]").forEach(function (el) {
      el.textContent = money;
    });
  }

  function getApiBase() {
    var host = window.location.hostname;
    var isLocal = host === "localhost" || host === "127.0.0.1";
    var b = (window.HEERISE_API_BASE || (isLocal ? "http://localhost:8000" : "/api")).replace(/\/$/, "");
    return b;
  }

  function paymentsUrl(path) {
    var b = getApiBase();
    if (path.charAt(0) !== "/") path = "/" + path;
    if (b.endsWith("/api")) return b + "/payments" + path;
    return b + "/api/payments" + path;
  }

  global.HeeriseCheckout = {
    readContext: readContext,
    save: save,
    formatMoney: formatMoney,
    buildQuery: buildQuery,
    hydrateSummary: hydrateSummary,
    paymentsUrl: paymentsUrl
  };
})(window);
