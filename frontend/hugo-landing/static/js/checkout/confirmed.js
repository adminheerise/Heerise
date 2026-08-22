(function () {
  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  var params = new URLSearchParams(window.location.search);
  var ctx = HeeriseCheckout.readContext();
  var orderId = params.get("order_id") || ctx.order_id;
  var sessionId = params.get("session_id") || "";
  var payment = params.get("payment") || "";
  var surveyFallback = "https://www.heeriseacademy.com/contact/";

  function formatOrderNumber(raw) {
    if (!raw) return "";
    return String(raw).startsWith("#") ? String(raw) : "#" + String(raw);
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value || "";
    });
  }

  var today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  setText("[data-order-id]", formatOrderNumber(orderId));
  setText("[data-order-date]", today);
  setText("[data-amount]", ctx.amount_display || HeeriseCheckout.formatMoney(ctx.amount, ctx.currency));
  document.getElementById("survey-btn").href = surveyFallback;

  var heroH1 = document.querySelector(".success-hero h1");
  var heroP = document.querySelector(".success-hero p");
  if (!orderId) {
    if (heroH1) heroH1.textContent = "Order not found";
    if (heroP) heroP.textContent = "Please return to Career Lab and complete checkout again.";
    return;
  }
  if (payment === "canceled") {
    if (heroH1) heroH1.textContent = "Payment Canceled";
    if (heroP) heroP.textContent = "No charge was made. You can return to checkout and try again.";
    return;
  }

  async function fetchConfirmation() {
    var url = HeeriseCheckout.paymentsUrl("/orders/" + encodeURIComponent(orderId) + "/confirmation");
    if (sessionId) url += "?session_id=" + encodeURIComponent(sessionId);
    var resp = await fetch(url);
    if (!resp.ok) throw new Error("Could not load confirmation");
    return resp.json();
  }

  async function capturePaypalIfNeeded() {
    if (payment !== "paypal-approved") return;
    await fetch(HeeriseCheckout.paymentsUrl("/paypal/capture"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId })
    });
  }

  async function waitForPaid() {
    var last = null;
    for (var i = 0; i < 18; i++) {
      try {
        var data = await fetchConfirmation();
        last = data;
        if (data && data.status === "paid") return data;
      } catch (e) {}
      await sleep(900);
    }
    return last;
  }

  (async function () {
    try {
      await capturePaypalIfNeeded();
      var confirmation = await waitForPaid();
      if (!confirmation || !confirmation.web_summary) return;
      var web = confirmation.web_summary;
      setText("[data-order-id]", web.order_number || formatOrderNumber(orderId));
      setText("[data-order-date]", web.date_text || today);
      setText("[data-amount]", web.amount_paid || "");
      setText("[data-program]", web.program || "");
      setText("[data-program-detail]", web.program_detail || "");
      if (heroH1) heroH1.textContent = web.headline || "Payment Successful!";
      if (heroP) heroP.textContent = web.welcome || "Welcome to the LXD & ID Career Lab.";
      if (confirmation.survey_url) document.getElementById("survey-btn").href = confirmation.survey_url;
      if (confirmation.status !== "paid") {
        if (heroH1) heroH1.textContent = "Payment Processing";
        if (heroP) heroP.textContent = "We are confirming your payment. This page will update shortly. Check your inbox for the receipt.";
      }
    } catch (e) {
      console.warn("Payment confirmation render failed", e);
    }
  })();
})();
