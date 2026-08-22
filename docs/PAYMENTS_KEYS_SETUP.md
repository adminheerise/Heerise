# 如何获取 Career Lab 支付密钥（Stripe / PayPal）

HeeRise 结账需要这些环境变量。没有它们，`/methods/card/` 等页面无法向公司账户收款。

| 变量 | 测试环境 | 生产（真收款） |
|------|----------|----------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...`（test webhook） | `whsec_...`（live webhook） |
| `PAYPAL_CLIENT_ID` | Sandbox app Client ID | Live app Client ID |
| `PAYPAL_CLIENT_SECRET` | Sandbox app Secret | Live app Secret |
| `PAYPAL_ENV` | `sandbox` | `live` |

**原则：** 测试密钥和正式密钥是两套，不要混用。`sk_test_` 不会从学员卡里扣真钱；`sk_live_` 会。

本仓库本地文件：`backend/.env`（不要提交 Git）。生产密钥放在 GitHub Secrets，部署时写入 Cloud Run。

---

## 1. Stripe：`STRIPE_SECRET_KEY`

Stripe 负责信用卡 / 借记卡、Apple Pay、Google Pay。钱先进入 **Stripe 余额**，再按 Stripe 的 payout 周期打到公司银行账户。

### 1.1 注册并开通账户

1. 打开 [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. 用 HeeRise 公司邮箱注册（建议 `admin@heeriseacademy.com`）
3. 进入 Dashboard 后，按提示完成 **Business details**：
   - 业务类型、公司法律名称、EIN / Tax ID
   - 经营地址、网站：`https://www.heeriseacademy.com`
   - 产品说明：Instructional Design / LXD bootcamp tuition
4. **连接公司银行账户**（Settings → Payouts / Bank accounts）  
   没有银行账户也能拿 test key 做联调，但 **live 模式无法把钱打到公司**。
5. 完成身份 / 业务验证后，Dashboard 右上角可以把 **Test mode** 关掉，进入 Live。

### 1.2 拿到 Secret Key

1. 打开 [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)  
   或：Dashboard → **Developers** → **API keys**
2. 右上角 **Test mode** 开关：
   - **打开（Test mode）** → 复制 **Secret key**，以 `sk_test_` 开头
   - **关闭（Live mode）** → 复制 **Secret key**，以 `sk_live_` 开头
3. 点 **Reveal live key** / **Reveal test key**，复制完整字符串

填入：

```bash
STRIPE_SECRET_KEY=sk_test_51xxxxxxxx   # 本地 / 测试
# 或
STRIPE_SECRET_KEY=sk_live_51xxxxxxxx   # 生产真收款
```

注意：

- 只要 **Secret key**（`sk_...`）。Publishable key（`pk_...`）本项目不需要，结账是服务端创建 Stripe Checkout Session。
- 不要把 `sk_live_` 写进仓库、聊天记录或截图。
- Restricted keys 也可以，但必须允许 `Checkout Sessions`、`Payment Intents`、`Webhooks` 读写。

### 1.3 本地测试卡

Test mode 下用：

| 卡号 | 结果 |
|------|------|
| `4242 4242 4242 4242` | 成功 |
| `4000 0000 0000 9995` | 余额不足（失败） |
| 有效期 | 任意未来日期，如 `12 / 30` |
| CVC | 任意 3 位，如 `123` |
| ZIP | 任意，如 `94107` |

Apple Pay / Google Pay 会在 Stripe Checkout 支持的浏览器上自动出现（Safari → Apple Pay，Chrome → Google Pay）。不需要单独的 Apple / Google 商户号；Stripe Checkout 托管页已验证。

---

## 2. Stripe：`STRIPE_WEBHOOK_SECRET`

Webhook 让 Stripe 在学员付款成功后通知我们的后端：标记订单已付、发确认邮件。密钥用于验证请求真的来自 Stripe。

### 2.1 生产环境（推荐先配这个）

1. 打开 [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)  
   或：Developers → **Webhooks**
2. 确认右上角是 **Live mode**（生产）或 **Test mode**（测试），和 `STRIPE_SECRET_KEY` 同一套
3. 点 **Add endpoint**
4. Endpoint URL 填：

   ```
   https://www.heeriseacademy.com/api/payments/webhooks/stripe
   ```

5. 选事件（Select events），至少勾选：
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
6. 保存后打开这个 endpoint，找到 **Signing secret**
7. 点 **Reveal**，复制以 `whsec_` 开头的字符串

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
```

Test mode 和 Live mode 各有一个 **不同的** `whsec_`。必须和当前 `STRIPE_SECRET_KEY` 匹配。

### 2.2 本地开发（可选）

本机没有公网 HTTPS 时，用 Stripe CLI 把 webhook 转到 localhost：

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:8000/api/payments/webhooks/stripe
```

终端会打印：

```
Ready! Your webhook signing secret is whsec_...
```

把这串填进本地 `backend/.env` 的 `STRIPE_WEBHOOK_SECRET`。每次 `stripe listen` 的 secret 可能不同，以当前终端为准。

没有 webhook 时，学员付完款回到 `/checkout/confirmed/`，后端仍会向 Stripe 查询 session；webhook 是更可靠的补单通道，生产必须配。

---

## 3. PayPal：`PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_ENV`

PayPal 负责 `/methods/paypal/`。钱进入 **PayPal Business 余额**，再转到公司银行。

### 3.1 准备 Business 账户

1. 注册 [PayPal Business](https://www.paypal.com/us/business)（公司账户，不要用个人账户做生产收款）
2. 完成商户验证、绑定公司银行账户（提现用）

### 3.2 创建 REST App

1. 打开 [https://developer.paypal.com/dashboard/](https://developer.paypal.com/dashboard/)
2. 登录同一个 PayPal 账户
3. 左侧 **Apps & Credentials**
4. 页面上有两个 Tab：**Sandbox** 和 **Live**  
   - 本地 / 联调选 **Sandbox**
   - 网站真收款选 **Live**
5. 点 **Create App**
   - App Name：`HeeRise Academy Checkout`
   - App Type：Merchant（默认）
6. 创建后页面上会显示：
   - **Client ID** → `PAYPAL_CLIENT_ID`
   - **Secret** → 点 **Show** 复制 → `PAYPAL_CLIENT_SECRET`

```bash
# 本地
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=AXxxxxxxxx
PAYPAL_CLIENT_SECRET=ELxxxxxxxx

# 生产
PAYPAL_ENV=live
PAYPAL_CLIENT_ID=AYxxxxxxxx
PAYPAL_CLIENT_SECRET=ELxxxxxxxx
```

注意：

- Sandbox 的 Client ID / Secret **不能**配 `PAYPAL_ENV=live`，会报认证失败。
- Live tab 在账户未完全验证时可能看不到，先完成 Business 验证。
- Sandbox 付款要用 [Sandbox 测试买家账号](https://developer.paypal.com/dashboard/accounts)，不是你自己的真实 PayPal 登录。

### 3.3 PayPal Webhook（生产建议配）

1. 同一个 App 页面 → **Webhooks** → **Add Webhook**
2. URL：

   ```
   https://www.heeriseacademy.com/api/payments/webhooks/paypal
   ```

3. 建议勾选：
   - `CHECKOUT.ORDER.APPROVED`
   - `PAYMENT.CAPTURE.COMPLETED`
4. 保存

PayPal 的 webhook 验证比 Stripe 复杂；本项目会用 API **回查订单** 再标记已付。学员从 PayPal 返回确认页时，前端也会调用 `/api/payments/paypal/capture`。Webhook 是防止用户关页面后订单卡住的备份。

---

## 4. 填到哪里

### 4.1 本地开发 — `backend/.env`

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env`（不要 commit）：

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_ENV=sandbox
FRONTEND_BASE=http://localhost:1313
```

然后重启 FastAPI：

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Hugo：`http://localhost:1313/select-method/?product_id=bootcamp-premium`

### 4.2 生产 — GitHub Secrets

仓库：[https://github.com/adminheerise/Heerise](https://github.com/adminheerise/Heerise)

1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. 逐个添加（生产必须用 live / `sk_live_`）：

| Secret 名称 | 值 |
|-------------|-----|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Live webhook 的 `whsec_...` |
| `PAYPAL_CLIENT_ID` | Live app Client ID |
| `PAYPAL_CLIENT_SECRET` | Live app Secret |
| `PRE_BOOTCAMP_SURVEY_URL` | Pre-Bootcamp Survey 的真实链接 |
| `MAIL_FROM_INVOICE` | 建议 `admin@heeriseacademy.com` |
| `PAYMENTS_NOTIFY_EMAIL` | 内部入账通知邮箱 |

`PAYPAL_ENV` 已在 `.github/workflows/deploy-production.yml` 里写成 `live`，不用再加 Secret。

3. 推送到 `main` 或手动跑 **Deploy Production** workflow，Cloud Run 会带上这些变量。

推送前确认：Stripe / PayPal webhook URL 已经保存，否则付完款可能不发邮件。

### 4.3 生产 — 直接写 Cloud Run（备用）

如果暂时不走 GitHub Secrets：

```bash
gcloud run services update heerise-backend \
  --region us-central1 \
  --update-env-vars STRIPE_SECRET_KEY=sk_live_...,STRIPE_WEBHOOK_SECRET=whsec_...,PAYPAL_CLIENT_ID=...,PAYPAL_CLIENT_SECRET=...,PAYPAL_ENV=live
```

注意：之后若 GitHub Actions 用 `--set-env-vars` 部署，可能覆盖控制台里的变量。长期应以 GitHub Secrets 为准。

---

## 5. 怎么确认配好了

| 检查 | 期望 |
|------|------|
| `GET https://www.heeriseacademy.com/api/health` | `{"ok": true}` |
| 打开 `/select-method/?product_id=bootcamp-premium` → Pay with Card | 跳转到 `checkout.stripe.com` |
| Test mode 用 `4242...` 付款 | 回到 `/checkout/confirmed/`，标题 **Payment Successful!** |
| Stripe Dashboard → Payments | 出现一笔成功支付 |
| 学员邮箱 | Subject: `Order Confirmation & Next Steps: LXD & ID Career Lab` |
| PayPal Sandbox 买家完成批准 | 同样进入成功页 |

若点击 Pay 后接口返回 `Stripe is not configured on the server` / `PayPal is not configured on the server`：Cloud Run 或本地 `.env` 里对应变量为空或没重启服务。

---

## 6. 钱怎么进公司账户

```
学员卡 / Apple Pay / Google Pay
        → Stripe Checkout 扣款
        → Stripe 商户余额
        → Payout（通常 T+2）到你在 Stripe 绑定的公司银行账户

学员 PayPal
        → PayPal 批准并 capture
        → PayPal Business 余额
        → 提现到绑定的公司银行账户
```

Stripe：Settings → **Payouts** 查看到账节奏和银行账号。  
PayPal：PayPal Business → **Wallet / Transfer** 提到银行。

---

## 7. 官方文档

- Stripe API keys: [https://docs.stripe.com/keys](https://docs.stripe.com/keys)
- Stripe webhooks: [https://docs.stripe.com/webhooks](https://docs.stripe.com/webhooks)
- Stripe Checkout: [https://docs.stripe.com/payments/checkout](https://docs.stripe.com/payments/checkout)
- Stripe test cards: [https://docs.stripe.com/testing](https://docs.stripe.com/testing)
- PayPal REST apps: [https://developer.paypal.com/dashboard/applications](https://developer.paypal.com/dashboard/applications)
- PayPal Orders API: [https://developer.paypal.com/docs/api/orders/v2/](https://developer.paypal.com/docs/api/orders/v2/)
