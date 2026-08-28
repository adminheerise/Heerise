(function () {
  var ctx = HeeriseCheckout.readContext();
  var methods = [
    { id: "card", href: "/methods/card/", title: "Credit / Debit Card", desc: "Visa, Mastercard, Amex — charged securely via Stripe", cls: "card", icon: "CARD" },
    { id: "paypal", href: "/methods/paypal/", title: "PayPal", desc: "Pay with your PayPal balance or linked account", cls: "paypal", icon: "PP" },
    { id: "google_pay", href: "/methods/google-pay/", title: "Google Pay", desc: "Pay faster with Google Pay on supported devices", cls: "wallet", icon: "G" },
    { id: "apple_pay", href: "/methods/apple-pay/", title: "Apple Pay", desc: "Pay with Face ID or Touch ID on Apple devices", cls: "wallet", icon: "AP" }
  ];

  var firstNameInput = document.getElementById("first-name");
  var emailInput = document.getElementById("email");
  var list = document.getElementById("method-list");
  var err = document.getElementById("checkout-error");

  if (firstNameInput) firstNameInput.value = ctx.first_name || "";
  if (emailInput) emailInput.value = ctx.customer_email || "";

  function persist() {
    ctx.first_name = (firstNameInput && firstNameInput.value.trim()) || "";
    ctx.customer_email = (emailInput && emailInput.value.trim()) || "";
    HeeriseCheckout.save(ctx);
  }

  function showError(message) {
    if (!err) return;
    err.textContent = message;
    err.classList.add("is-visible");
  }

  function validEmail() {
    persist();
    return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(ctx.customer_email);
  }

  function go(method) {
    if (!validEmail()) {
      showError("Please enter a valid email so we can send your receipt and confirmation.");
      if (emailInput) emailInput.focus();
      return;
    }
    if (!ctx.first_name) {
      showError("Please enter your first name.");
      if (firstNameInput) firstNameInput.focus();
      return;
    }
    window.location.href = method.href + "?" + HeeriseCheckout.buildQuery(ctx);
  }

  methods.forEach(function (m) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "method-card";
    btn.innerHTML =
      '<span class="method-icon method-icon--' + m.cls + '">' + m.icon + "</span>" +
      '<span class="method-copy"><h2>' + m.title + "</h2><p>" + m.desc + "</p></span>" +
      '<span class="method-card-chevron" aria-hidden="true">›</span>';
    btn.addEventListener("click", function () { go(m); });
    list.appendChild(btn);
  });

  ["input", "change"].forEach(function (evt) {
    firstNameInput && firstNameInput.addEventListener(evt, persist);
    emailInput && emailInput.addEventListener(evt, persist);
  });

  HeeriseCheckoutApi.loadProduct(ctx).then(function () {
    HeeriseCheckout.hydrateSummary(document.getElementById("order-summary"), ctx);
  }).catch(function () {
    HeeriseCheckout.hydrateSummary(document.getElementById("order-summary"), ctx);
  });
})();
