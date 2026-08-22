(function (global) {
  function pay(methodId, ctx) {
    var payload = {
      method: methodId,
      product_id: ctx.product_id,
      email: ctx.customer_email,
      first_name: ctx.first_name || "Student"
    };
    return fetch(global.HeeriseCheckout.paymentsUrl("/checkout/session"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (resp) {
      return resp.json().then(function (data) {
        if (!resp.ok) {
          var msg = data && data.detail ? data.detail : resp.statusText;
          if (Array.isArray(msg)) {
            msg = msg.map(function (item) { return item.msg || JSON.stringify(item); }).join(" ");
          }
          throw new Error(msg || "Could not start checkout");
        }
        return data;
      });
    }).then(function (data) {
      var next = Object.assign({}, ctx, { order_id: data.order_id });
      global.HeeriseCheckout.save(next);
      if (!data.redirect_url) throw new Error("Checkout did not return a payment URL");
      window.location.href = data.redirect_url;
    });
  }

  function loadProduct(ctx) {
    return fetch(global.HeeriseCheckout.paymentsUrl("/products/" + encodeURIComponent(ctx.product_id)))
      .then(function (resp) {
        if (!resp.ok) throw new Error("Product not found");
        return resp.json();
      })
      .then(function (product) {
        ctx.product_name = product.name;
        ctx.amount = product.amount_cents;
        ctx.currency = product.currency;
        ctx.amount_display = product.amount_display;
        global.HeeriseCheckout.save(ctx);
        return ctx;
      });
  }

  global.HeeriseCheckoutApi = { pay: pay, loadProduct: loadProduct };
})(window);
