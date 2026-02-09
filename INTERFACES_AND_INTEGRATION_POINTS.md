# 接口与预留接入点说明（本地 Demo 阶段：只做接口，不接入云）

本文档用于解释我在仓库中新增/调整的“接口层（interfaces）”与“未来上线接入点（integration points）”。  
目标是：**本地 Demo 继续正常运行**，同时为后续上线阶段接入 **Firebase Auth / Firestore / 更换邮件服务 / CI/CD / 监控** 留出清晰边界。

> 重要说明：目前仍默认使用你现有的本地实现（SQLAlchemy + SQLite、后端自发 JWT、SMTP 发邮件）。  
> 如果你误开启某些上线开关（例如 `USE_FIREBASE_AUTH=true`），后端会返回 **501 Not Implemented** 并给出明确提示，避免静默失败。

---

## 1）Auth 接口（为 Firebase Auth 预留）

### 1.1 新增文件
- `backend/app/interfaces/auth_provider.py`
  - 定义 `AuthIdentity`（最小身份载体：`user_id/email/raw claims`）
  - 定义 `AuthProvider` 协议（接口）：`verify_bearer_token(token) -> AuthIdentity`

### 1.2 现有实现（已接入）
- `backend/app/integrations/local_jwt_auth.py`
  - `LocalJwtAuthProvider`：使用你现有的 `backend/app/security.py::decode_token()` 解析 HS256 JWT
  - 从 token claims 里拿 `sub` 作为 `user_id`（这与现有数据库 `User.id` 对齐）

### 1.3 Firebase 占位实现（未接入，仅预留）
- `backend/app/integrations/firebase_auth.py`
  - `FirebaseAuthProvider`：目前 `verify_bearer_token` 直接 `raise NotImplementedError`
  - 目的：上线时在这里接入 Firebase ID Token 校验（Admin SDK / public keys 校验）

### 1.4 在哪里切换 Auth Provider
- `backend/app/deps.py` 的 `get_current_user()` 已改为“可插拔”：
  - 默认：`LocalJwtAuthProvider()`（本地 demo）
  - 当环境变量 `USE_FIREBASE_AUTH=true` 时：切换为 `FirebaseAuthProvider()`（但目前会报未实现）

#### 相关环境变量
- `USE_FIREBASE_AUTH`：
  - 默认不设置 / false：使用本地 JWT
  - true：尝试使用 Firebase（当前会返回 501，detail 为 “Firebase Auth is not integrated yet”）

---

## 2）Mailer 接口（为 SendGrid / Gmail API 等预留）

### 2.1 新增文件（接口定义）
- `backend/app/interfaces/mailer.py`
  - 定义 `Mailer` 协议（接口）：`send(to_email, subject, text_body, from_email?, reply_to?)`

### 2.2 现有 SMTP 发送实现（已在业务里使用）
当前项目真实发邮件依旧走 SMTP：
- `backend/app/emailer.py::send_email(...)`

我对它做的“功能性增强”（用于你当前需求）：
- **支持 `from_email`**：使不同业务场景可以用不同的发件人地址（noreply/support/sales…）
- **支持 `reply_to`**：后续可用于“From 固定，但 Reply-To 不同”的策略（防策略限制）
- **支持 587/STARTTLS 与 465/SSL**：通过 `SMTP_SSL` 或 `SMTP_PORT=465` 自动选择

#### SMTP 相关环境变量（当前实现实际读取的）
- 必填：
  - `SMTP_HOST`
  - `SMTP_PORT`（默认 587）
  - `SMTP_USER`
  - `SMTP_PASS`
- 可选：
  - `SMTP_SSL`（`1/true/yes` 或 `SMTP_PORT=465` 时走 SSL）
  - `SMTP_FROM`（未传 `from_email` 时的默认 From）

> 说明：`backend/app/interfaces/mailer.py` 目前只是“接口定义”，没有强制替换当前 SMTP 实现。  
> 你现在的 verification 邮件发送功能不依赖 Mailer 接口，仍由 `send_email()` 完成。

---

## 3）Verification 邮件（noreply 发件人）是怎么实现的（当前已完成）

### 3.1 发送入口
- `backend/app/routers/auth.py` 的 `_send_verify_email(to_email, token)`
  - 生成验证链接：`{FRONTEND_BASE}/verify?token=...`
  - 发送邮件：调用 `send_email(..., from_email=...)`

#### 本地验证（不配置 SMTP 也能走通）
在 `_send_verify_email` 内部：
- 如果没有配置 `SMTP_HOST`：不会调用 SMTP，而是 **把验证链接打印到后端日志** 并作为 `dev_verify_url` 返回给前端（用于本地点击验证）
- 如果配置了 SMTP 但发送失败：同样会打印链接作为 fallback（开发友好）

### 3.2 发件人选择逻辑（From mapping）
verification 会优先读取：
- `MAIL_FROM_VERIFICATION`（建议 `noreply@heeriseacademy.com`）

如果没有设置，会回退到：
- `SMTP_FROM`（若不设则退回 `SMTP_USER`）

### 3.3 后续预留（接口已留，但暂未在业务中使用）
已预留环境变量（等功能实现时接入）：
- `MAIL_FROM_SUPPORT`
- `MAIL_FROM_INVOICE`
- `MAIL_FROM_SALES`

未来实现 support/invoice/sales 功能时，你只需要在对应路由里选择正确的 `from_email` 并调用：
- `send_email(...)`（当前 SMTP 实现）
或未来替换为：
- 你实现的 `Mailer.send(...)`

---

## 4）如何使用这些接口（本地 Demo）

### 4.1 默认行为（推荐）
不设置 `USE_FIREBASE_AUTH`：
- 后端鉴权继续用本地 JWT（不受影响）
- verification 邮件继续走 SMTP（如已配置 Google App Password，则真实发邮件）

### 4.2 Firebase Auth（仅占位，不要开启）
不要在本地 demo 阶段设置：
- `USE_FIREBASE_AUTH=true`

原因：`FirebaseAuthProvider` 目前是占位，会直接报 “Firebase Auth is not integrated yet”。

---

## 5）未来上线时如何补实现（接入点清单）

### 5.1 Firebase Auth（替换或并行）
要做的工作：
- 在 `backend/app/integrations/firebase_auth.py` 中实现 Firebase ID Token 校验
- 返回 `AuthIdentity(user_id, email, raw_claims)`
- 决定 `user_id` 对齐策略（Firebase UID vs 你数据库 User.id）

### 5.2 Firestore（替换 SQLite）
（当前仅预留思路，尚未实现 StorageProvider；你要求“先做接口”，后续可再加）
- 建议新增 `StorageProvider` 接口（User/Profile/Progress/Assessment 等读写抽象）
- 本地 demo 用 SQLite，线上切 Firestore

### 5.3 更换邮件服务（可选）
如果未来不用 SMTP：
- 实现一个 `Mailer`（例如 `SendGridMailer` / `GmailApiMailer`）
- 在业务层统一调用该 mailer（或通过工厂函数注入）

---

## 6）涉及的文件清单（便于你 review）

### Auth
- `backend/app/interfaces/auth_provider.py`
- `backend/app/integrations/local_jwt_auth.py`
- `backend/app/integrations/firebase_auth.py`（占位）
- `backend/app/deps.py`（切换点：`USE_FIREBASE_AUTH`）
- `backend/app/interfaces/__init__.py`
- `backend/app/integrations/__init__.py`

### Mail / Verification
- `backend/app/interfaces/mailer.py`（接口定义，当前未替换 SMTP）
- `backend/app/emailer.py`（SMTP 发送实现，支持 from/reply-to/ssl）
- `backend/app/routers/auth.py`（verification From mapping：`MAIL_FROM_VERIFICATION`）
