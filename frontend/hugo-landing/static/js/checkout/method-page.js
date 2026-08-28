(function (global) {
  function showError(message) {
    var el = document.getElementById("checkout-error");
    if (!el) {
      alert(message);
      return;
    }
    el.textContent = message;
    el.classList.add("is-visible");
  }

  function init(opts) {
    var ctx = global.HeeriseCheckout.readContext();
    var q = global.HeeriseCheckout.buildQuery(ctx);
    var back = document.getElementById("back-link");
    if (back) back.href = "/select-method/?" + q;

    var aside = document.getElementById("order-summary");
    function renderSummary() {
      if (!aside) return;
      aside.innerHTML =
        '<h2 style="margin:0 0 16px;font-size:16px;color:#011f5b;">Order Summary</h2>' +
        '<div class="summary-row"><span>Product</span><strong data-product-name></strong></div>' +
        '<div class="summary-total"><span>Total</span><span data-amount></span></div>';
      global.HeeriseCheckout.hydrateSummary(aside, ctx);
    }
    renderSummary();

    global.HeeriseCheckoutApi.loadProduct(ctx).then(renderSummary).catch(function () {
      renderSummary();
    });

    function runPay(methodId, btn) {
      var email = (ctx.customer_email || "").trim();
      if (!email.includes("@")) {
        showError("Please go back and enter a valid email so we can send your receipt.");
        return;
      }
      if (btn) {
        btn.disabled = true;
        btn.dataset.originalLabel = btn.textContent;
        btn.textContent = "Redirecting to secure checkout…";
      }
      return global.HeeriseCheckoutApi.pay(methodId, ctx).catch(function (err) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = btn.dataset.originalLabel || "Pay";
        }
        showError(err.message || "Payment could not be started. Please try again.");
      });
    }

    if (opts && opts.onReady) opts.onReady({ ctx: ctx, runPay: runPay });
  }

  global.HeeriseMethodPage = { init: init };
})(window);
