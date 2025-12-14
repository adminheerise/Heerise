# HeeRise（MVP）使用说明 / 开发指南

本仓库包含一个 **FastAPI 后端（认证 + Onboarding + Profile/Admin/Settings API）** 与一个 **Next.js 前端（Dashboard / Profile / Settings / Admin UI）**。

- **前端**：`frontend/`（Next.js 14，默认 `http://localhost:3000`）
- **后端**：`backend/`（FastAPI，默认 `http://localhost:8000`）
- **默认数据库**：SQLite（`backend/app.db`）

---

## 1. 快速开始（Windows PowerShell）

### 1.1 启动后端（FastAPI）

```powershell
cd E:\Heerise\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 建议设置 JWT 密钥（开发环境也建议）
$env:JWT_SECRET="dev_secret"

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

健康检查：
- `http://localhost:8000/health` 期望返回 `{"ok": true}`

### 1.2 启动前端（Next.js）

另开一个 PowerShell 窗口：

```powershell
cd E:\Heerise\frontend
npm install

# 可选：指定后端地址
$env:NEXT_PUBLIC_API_BASE="http://localhost:8000"

npm run dev
```

打开：
- 首页：`http://localhost:3000/`
- Dashboard：`http://localhost:3000/dashboard`
- Profile：`http://localhost:3000/profile`
- Settings：`http://localhost:3000/settings`
- Admin：`http://localhost:3000/admin`（需要 admin 角色）

---

## 2. 环境变量说明

### 2.1 后端（`backend/`）
- **`JWT_SECRET`**：JWT 签名密钥（强烈建议设置）
- **`ACCESS_EXPIRES_MIN`**：Access token 有效期（分钟，默认 30）
- **`REFRESH_EXPIRES_DAYS`**：Refresh token 有效期（天，默认 14）
- **`DATABASE_URL`**：数据库连接串（默认 `sqlite:///./app.db`）

> 注意：后端在启动时会 `create_all` 自动建表（适合 MVP 开发阶段）。

### 2.2 前端（`frontend/`）
- **`NEXT_PUBLIC_API_BASE`**：后端 API 基地址（默认 `http://localhost:8000`）

---

## 3. 业务流程（从用户视角）

### 3.1 注册 & 登录
1. 访问 `/register` 创建账号（email + password + full name + username）
2. 注册成功后会保存 token 并跳转 Onboarding
3. 也可以在 `/login` 登录，成功后跳转 `/dashboard`

前端 token 存储：
- Access token：`localStorage["access"]`
- Refresh token：`localStorage["refresh"]`

### 3.2 Onboarding（问卷）
1. 新用户注册后进入 `/onboarding/[step]`
2. 前端会请求：
   - `GET /onboarding/flows/current` 获取当前启用的 flow
   - `GET /onboarding/flows/{flow_id}/questions` 获取问题列表
3. 每一步提交：
   - `POST /onboarding/responses` 保存回答
4. 最后一步：
   - `POST /onboarding/complete` 将回答映射到 `UserProfile` / `Skill` 等表，并跳转 `/dashboard`

开发环境可用的种子数据接口：
- `POST /onboarding/dev/seed`：创建默认 onboarding flow（仅开发用）

### 3.3 Dashboard（用户首页）
路径：`/dashboard`
- 目前实现了与设计稿相近的布局：
  - Welcome + 指标卡（Pathway / Readiness / Weekly Goal）
  - Next Steps
  - Skill Gap（MVP 占位）
  - Quick Access（MVP 占位）
- 数据来源：
  - `GET /me`
  - `GET /me/profile`

> 说明：Readiness/Weekly Goal/Skill Gap 的“真实数据闭环”（课程、进度、测评）尚未实现，目前部分为占位数据，用于先对齐 UI 效果。

### 3.4 User Profile（个人档案）
路径：`/profile`
- 已按设计稿做“个人名片式布局”
  - Header（头像占位、姓名、headline、location）
  - About / Details / Goals
  - Learning Profile / Badges（Badges 目前为占位）
- 右上角 **⚙️** 可展开编辑表单，保存调用：
  - `PUT /me/profile`

### 3.5 Settings（订阅/隐私/删号）
路径：`/settings`
- Tab 1：Subscription（升级入口占位）
- Tab 2：Legal & Privacy
  - **Download My Data**：调用 `GET /me/export` 并下载 JSON
  - **Delete Account**：调用 `DELETE /me`（删除当前用户与关联数据）

### 3.6 Admin（内部管理）
路径：`/admin`
- 仅当当前用户 `role=admin` 才可访问
- 后端接口：
  - `GET /admin/stats`：KPI（Total Users / Active Users / Premium Conversion 占位）
  - `GET /admin/users?limit=20`：用户列表（MVP 简化）

---

## 4. 权限与 Admin 开启方法（开发环境）

系统使用 Bearer token 鉴权：`Authorization: Bearer <access_token>`

### 4.1 将某个用户设置为 admin（SQLite 开发环境）

当前阶段仅保留一种方式（推荐）：**双击运行 bat**（无需处理 PowerShell 引号）。

双击运行：
- `backend\tools\make_admin.bat`

按提示输入邮箱即可完成设置。

设置完成后：
- 刷新前端页面（或重新登录）
- 导航栏会出现 **Admin**，或直接访问 `http://localhost:3000/admin`

---

## 5. API 概览（MVP）

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### Me / Profile / Settings
- `GET /me`
- `GET /me/profile`
- `PUT /me/profile`
- `PUT /me/skills`
- `GET /me/export`
- `DELETE /me`

### Onboarding
- `POST /onboarding/dev/seed`（开发用）
- `GET /onboarding/flows/current`
- `GET /onboarding/flows/{flow_id}/questions`
- `POST /onboarding/responses`
- `POST /onboarding/complete`

### Admin（需要 admin）
- `GET /admin/stats`
- `GET /admin/users`

---

## 6. 常见问题排查

### 6.1 前端报 401 / Not authenticated
- 确认后端已启动：`http://localhost:8000/health`
- 前端 localStorage 中是否存在 `access/refresh`
- Access 过期会自动 refresh；refresh 失败请重新登录

### 6.2 后端启动时报 `ModuleNotFoundError: dotenv`
- 已在 `backend/requirements.txt` 添加 `python-dotenv`，重新安装依赖：

```powershell
cd E:\Heerise\backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 6.3 Admin 页面 403
- 需要将用户 `role` 设置为 `admin`（见上文“Admin 开启方法”）

---

## 7. 当前实现范围（与设计稿的关系）
- UI 已尽量对齐 `User Profile.md` 的 4 个页面示意图结构
- 课程内容/进度/测评/订阅支付等真实业务数据闭环尚未完成，部分模块为 MVP 占位


