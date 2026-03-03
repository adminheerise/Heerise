# HeeRise（MVP）使用说明 / 开发指南

本仓库包含一个 **FastAPI 后端（认证 + Onboarding + Profile/Admin/Settings API）** 和一个 **Hugo 前端（hugo-universal-theme，包含落地页、博客及全部应用页面）**。

> **架构说明**：项目最终前端统一采用 **Hugo Universal Theme**。`frontend/pages/`（Next.js）为早期原型，将在 Hugo 侧页面重建后移除。所有新页面开发请在 Hugo 中进行。

- **前端**：`frontend/hugo-landing/`（Hugo + hugo-universal-theme，默认 `http://localhost:1313`）
- **前端（过渡）**：`frontend/pages/`（Next.js 14，默认 `http://localhost:3000`）— 逐步迁移到 Hugo 后删除
- **Career Lab Bootcamp 原型**：`Bootcamp/`（React + Vite + Tailwind，独立单页应用，待集成至 Hugo）
- **后端**：`backend/`（FastAPI，默认 `http://localhost:8000`）
- **默认数据库**：SQLite（`backend/app.db`）

---

## 1. 快速开始（Windows / macOS / Linux）

### 1.1 启动后端（FastAPI）
#### window
```powershell
cd E:\Heerise\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 建议设置 JWT 密钥（开发环境也建议）
$env:JWT_SECRET="dev_secret"

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
#### macOS / Linux
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  
pip install -r requirements.txt
export JWT_SECRET="dev_secret" 
uvicorn app.main:app --reload --port 8000
```
健康检查：
- `http://localhost:8000/health` 期望返回 `{"ok": true}`

### 1.2 启动前端（Hugo — 主前端）

另开一个 PowerShell 窗口：
Window:
```powershell
cd E:\Heerise\frontend\hugo-landing

# 使用项目内置的 Hugo 可执行文件
E:\Heerise\tools\hugo\hugo.exe server -w
```

macOS / Linux: 
安装 Hugo（首次需要，建议 Extended）:
```bash
brew install hugo
hugo version
```
启动 Hugo:
```bash
cd ~/Heerise/frontend/hugo-landing
hugo server -w
```

打开：
- Home：`http://localhost:1313/`（Hero + Featured Event）
- About：`http://localhost:1313/about/`
- Contact：`http://localhost:1313/contact/`（表单 + 后端集成）
- Career Lab：`http://localhost:1313/career-lab/`（placeholder）
- AI Career Co-pilot：`http://localhost:1313/acc/`（placeholder）
- Blog：`http://localhost:1313/blog/`
- （后续迁移完成后）Login / Dashboard / Profile / Settings / Admin 等页面也将在此

> **依赖说明**：Hugo 是独立二进制文件（已下载到 `tools/hugo/hugo.exe`），无需 pip/npm 安装。(仅限window)

#### Hugo 生产构建
##### window
```powershell
cd E:\Heerise\frontend\hugo-landing
E:\Heerise\tools\hugo\hugo.exe --minify
# 输出到 frontend/hugo-landing/public/ 目录
```
##### macOS / Linux
```bash
cd ~/Heerise/frontend/hugo-landing
hugo --minify
# 输出到 frontend/hugo-landing/public/ 目录
```

### 1.3 启动 Next.js（过渡期，迁移完成后移除）

> 以下 Next.js 开发服务器仅在 Hugo 侧页面尚未重建时使用。当 Hugo 中对应页面就绪后，此步骤将不再需要。
#### window
```powershell
cd E:\Heerise\frontend
npm install
$env:NEXT_PUBLIC_API_BASE="http://localhost:8000"
npm run dev
```
#### macOS / Linux
```bash
cd ~/Heerise/frontend
npm install
export NEXT_PUBLIC_API_BASE="http://localhost:8000"
npm run dev
```
打开：http://localhost:3000/

---
过渡期间两者并行：Hugo `:1313`（落地页 + 已迁移页面），Next.js `:3000`（尚未迁移的动态页面）。
## 2. 环境变量说明

### 2.1 后端（`backend/`）
- **`JWT_SECRET`**：JWT 签名密钥（强烈建议设置）
- **`ACCESS_EXPIRES_MIN`**：Access token 有效期（分钟，默认 30）
- **`REFRESH_EXPIRES_DAYS`**：Refresh token 有效期（天，默认 14）
- **`DATABASE_URL`**：数据库连接串（默认 `sqlite:///./app.db`）
- **`FRONTEND_BASE`**：前端基地址（用于生成邮箱验证链接，默认 `http://localhost:3000`）
- **`EMAIL_VERIFY_EXPIRES_MIN`**：邮箱验证链接有效期（分钟，默认 1440=24h）

#### 邮件发送（SMTP，可选）
如果你配置了 SMTP，注册后会真实发出验证邮件；如果没配置，后端会在控制台打印 `[DEV] Verification link ...` 方便开发测试。

- **`SMTP_HOST`**：SMTP 服务器地址（不设置则不真实发邮件）
- **`SMTP_PORT`**：端口（默认 587）
- **`SMTP_SSL`**：是否使用 SSL（`true/1` 开启；若端口为 465 会自动视为开启）
- **`SMTP_USER`**：账号
- **`SMTP_PASS`**：密码/授权码
- **`SMTP_FROM`**：发件人邮箱（默认与 `SMTP_USER` 相同）

#### 多发件人（预留：support/invoice/sales）
你可以通过环境变量为不同业务场景指定不同的 From（适用于 Google Workspace alias 场景）：
- **`MAIL_FROM_VERIFICATION`**：验证邮件 From（建议 `noreply@...`）
- **`MAIL_FROM_SUPPORT`**：客服邮件 From（预留）
- **`MAIL_FROM_INVOICE`**：账单邮件 From（预留）
- **`MAIL_FROM_SALES`**：销售邮件 From（预留）

目前项目只在验证邮件中使用 `MAIL_FROM_VERIFICATION`；其余变量已预留，等对应功能实现时接入。

> 注意：后端在启动时会 `create_all` 自动建表（适合 MVP 开发阶段）。

### 2.2 前端（`frontend/`）
- **`NEXT_PUBLIC_API_BASE`**：后端 API 基地址（默认 `http://localhost:8000`）

---

## 3. 业务流程（从用户视角）

> **注意**：以下业务流程中的前端路径（如 `/register`、`/dashboard`）目前由 Next.js (`:3000`) 提供。迁移到 Hugo 后，同样的路径将由 Hugo (`:1313` / 生产域名) 提供，业务逻辑和后端 API 不变。

### 3.1 注册 & 登录
1. 访问 `/register` 创建账号（email + password + full name + username）
2. 注册成功后会发送邮箱验证链接，并跳转到“已发送验证邮件”提示页
3. 用户点击邮箱中的验证链接完成验证
4. 然后在 `/login` 登录，成功后跳转 `/dashboard`

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

---

## 8. 网站 Redesign（Figma → Hugo 落地实现）

基于 Figma 设计稿（`Career Lab & ACC.pdf`、`Heerise Ecosystem Info Arch.png`）对 Hugo 前端进行了全面重设计。

### 8.1 设计系统（Design System）

| 项 | 值 |
|---|---|
| **主字体** | Inter（Google Fonts），权重 100–900 |
| **主色** | `#017AFF`（蓝） |
| **辅助色** | `#5A0199`（紫）、`#F07850`（橙） |
| **渐变** | `linear-gradient(98.78deg, #017AFF -5.07%, #5A0199 108.39%)` |
| **深色底** | `#001021`（页脚） |
| **文字色** | `#2C2C2C`（正文）、`#3C3C3C`（副文）、`#364153`（表单标签） |
| **内容区最大宽度** | 1280px（居中） |
| **导航栏高度** | 72px |

### 8.2 导航（全局）

- 5 个菜单项：**HOME、ABOUT、AI CAREER CO-PILOT、CAREER LAB、CONTACT**
- Logo：`logo-silver.png`（64×64px），左上角
- Active 态：8px solid `#017AFF` 顶边 + `rgba(1,122,255,0.8)` 背景 + 白色文字
- 非 active 态：透明背景 + `#2C2C2C` 文字

### 8.3 已完成页面

#### Home（`/`）

| 区域 | 描述 |
|---|---|
| **Hero** | 蓝紫渐变背景（98.78deg），叠加 topographic-bg.png（`mix-blend-mode: screen`，opacity 0.6），三行白色大标题 "Harvest / Empowerment / Excellence"（Inter 900, 64px），tagline 副标题 |
| **Featured Event** | 两列布局：左侧 `homepic.jpg`（455×312px，圆角 4px，叠加 "Featured" badge），右侧 "ID/LXD Career Lab" 信息区（标题、描述、4 个 stats 卡片、APPLY NOW CTA 按钮） |
| **Footer** | 深色 `#001021`，3 列（COMPANY 链接、FOLLOW US 社交、空间），newsletter 栏，版权 "© 2026 Heerise Academy" |

#### About（`/about/`）

| 区域 | 描述 |
|---|---|
| **Who Are We?** | 白色背景，两列：左侧 "Who Are We?"（Inter 900, 64px, `#017AFF`）+ 正文描述，右侧 `aboutpic.png`（606×414px, 圆角 8px） |
| **Mission** | `#017AFF` 蓝色背景，左侧 `looper-1.png` 装饰 + "MISSION" 标签，右侧使命宣言文字（白色，20px） |
| **分割线** | 白色半透明线条 |
| **Vision** | `#017AFF` 蓝色背景，左侧 `looper-3.png` 装饰（opacity 0.5）+ "VISION" 标签，右侧愿景文字（白色，20px），三个要点以 bullet list 呈现 |

#### Contact（`/contact/`）

| 区域 | 描述 |
|---|---|
| **Hero Banner** | 蓝紫渐变（91.16deg, `#017AFF` → `#1F0199`），190px 高，"Let's work together."（40px/700）+ 副标题，右侧叠加 `looper-1.png`（350×340px, opacity 0.4） |
| **Form Card** | 居中卡片（669px 宽），border `#DADADA`，shadow `0px 4px 4.8px rgba(0,0,0,0.08)`，圆角 8px |
| **表单字段** | First Name + Last Name（并排 300px），Email + Phone Number（并排），How did you hear about us?（dropdown），Service interest（3 个 checkbox：Job Assessment / Bootcamp / Consultation），Your Message（textarea 116px），SEND 按钮（全宽 `#017AFF`） |
| **后端集成** | `POST /contact` → FastAPI，发送回执邮件（`noreply@heeriseacademy.com`）+ 团队通知邮件 |

#### Career Lab（`/career-lab/`）、AI Career Co-pilot（`/acc/`）

- 目前为 placeholder 页面（"Coming Soon"），待后续集成 Bootcamp 独立应用内容
- `Bootcamp/` 文件夹包含 Larry 开发的 React + Vite + Tailwind 原型（tab 切换式单页应用：Outcomes / Projects / Instructors / Pricing / Apply），待适配至 Hugo 站点

### 8.4 Contact Form 后端

| 文件 | 描述 |
|---|---|
| `backend/app/routers/contact.py` | FastAPI router，`POST /contact`，接收 `ContactIn` schema（first_name, last_name, email, phone, hear_about, service_interest, message），使用 `send_email()` 发送回执 + 团队通知 |
| `backend/app/main.py` | 已注册 `contact.router`，CORS 已添加 `http://localhost:1313` |
| `frontend/hugo-landing/static/js/contact.js` | 客户端表单提交处理，`fetch()` 到 FastAPI，支持多选 checkbox |

---

## 9. Hugo 前端说明（主前端）

Hugo Universal Theme 是本项目的 **唯一确定前端方案**，承载所有页面（落地页、博客、FAQ，以及登录、Dashboard、Profile 等应用页面）。

### 9.1 目录结构（当前）

```
frontend/hugo-landing/
├── hugo.toml                          # 站点配置（菜单/参数/组件开关）
├── content/                           # Markdown 页面内容
│   ├── blog/                          # 博客文章
│   │   ├── first-post.md
│   │   └── career-tips.md
│   ├── about.md                       # ★ About 页面 (id="about")
│   ├── contact.md                     # ★ Contact 页面 (id="contact")
│   ├── career-lab.md                  # Career Lab placeholder
│   └── acc.md                         # AI Career Co-pilot placeholder
├── layouts/                           # ★ 自定义页面模板（覆盖主题默认）
│   ├── index.html                     # ★ 首页模板覆盖（hero + featured event）
│   ├── page/
│   │   └── single.html                # ★ 页面模板覆盖（id 分发 + 去掉 breadcrumbs）
│   └── partials/
│       ├── custom_headers.html        # ★ 注入 Google Fonts (Inter)
│       ├── hero_home.html             # ★ 首页 Hero 区域
│       ├── featured_event.html        # ★ 首页 Featured Event 区域
│       ├── footer.html                # ★ 页脚覆盖（新 3 列布局）
│       ├── about.html                 # ★ About 页面完整内容
│       └── contact.html               # ★ Contact 页面（hero banner + form card）
├── static/                            # 静态资源
│   ├── css/
│   │   └── custom.css                 # ★ 全站自定义 CSS（~1200 行，设计系统 + 各页面样式）
│   ├── img/                           # ★ 图片资源（详见下表）
│   └── js/
│       └── contact.js                 # ★ Contact 表单 fetch() 提交处理
├── data/                              # YAML 数据驱动组件（主题原有，部分已禁用）
├── themes/
│   └── hugo-universal-theme/          # 主题（git clone，不要直接修改）
└── HUGO_THEME_README.md               # 详细使用文档
```

**`static/img/` 资源清单**：

| 文件 | 用途 | 来源 |
|---|---|---|
| `logo-silver.png` | 导航栏 Logo（64×64） | Figma 设计稿 |
| `logo-transparent.png` | 透明 Logo（备用） | 项目原有 |
| `logo.png` / `logo-1.png` | 其他 Logo 版本 | 项目原有 |
| `topographic-bg.png` | Home Hero 区域背景纹理（1328×963px，mix-blend-mode: screen） | Figma 设计稿 |
| `homepic.jpg` | Home Featured Event 左侧图片（455×312px） | 项目提供 |
| `aboutpic.png` | About "Who Are We?" 右侧图片（606×414px） | 项目提供 |
| `looper-1.png` | 装饰图案（Mission 区域 + Contact hero 右侧） | Figma 设计稿 |
| `looper-3.png` | 装饰图案（Vision 区域，opacity 0.5） | Figma 设计稿 |

### 9.2 常见操作

| 操作 | 方法 |
|---|---|
| 添加博客文章 | 创建 `content/blog/xxx.md` |
| 添加轮播页 | 创建 `data/carousel/xxx.yaml` |
| 添加特性卡片 | 创建 `data/features/xxx.yaml` |
| 换颜色主题 | 修改 `hugo.toml` 中 `params.style` |
| 关闭某区域 | 在 `hugo.toml` 中设置对应 `enable = false` |
| 新增应用页面 | 创建 `content/xxx.md` + `layouts/page/xxx.html` + `static/js/xxx.js` |

### 9.3 动态页面开发模式

Hugo 中的动态页面由三部分组成：

```
content/login.md              → 定义页面元数据（title, layout）
layouts/page/login.html       → HTML 模板（使用主题导航/页脚 + 自定义内容区）
static/js/auth.js             → JavaScript（表单处理、API 调用、DOM 渲染）
```

示例模板结构：
```html
{{ partial "headers.html" . }}
{{ partial "nav.html" . }}

<section id="login-page">
  <div class="container">
    <div id="login-form">
      <!-- JS 动态渲染 -->
    </div>
  </div>
</section>

{{ partial "footer.html" . }}
{{ partial "scripts.html" . }}
<script src="/js/auth.js"></script>
```

详细文档见：[`frontend/hugo-landing/HUGO_THEME_README.md`](frontend/hugo-landing/HUGO_THEME_README.md)

---

## 10. 架构方向与云端部署

### 10.1 确定架构：Hugo + FastAPI（两层）

项目最终架构为 **Hugo 前端 + FastAPI 后端**，共两个服务：

| 层 | 技术 | 职责 |
|---|---|---|
| **前端** | Hugo (hugo-universal-theme) | 全部页面：落地页、博客、FAQ、Login、Register、Dashboard、Profile、Settings、Admin |
| **后端** | FastAPI | REST API：认证、用户数据、Onboarding、AI 功能 |

**Hugo 如何承载动态页面**：
- Hugo 模板系统负责页面结构（导航栏、页脚、布局、CSS）— 所有页面风格统一
- 动态交互（登录表单、Dashboard 数据、Profile 编辑）由 **页面内嵌的 JavaScript** 完成，通过 `fetch()` 调用 FastAPI API
- Token 管理（Access/Refresh）在 JS 中通过 `localStorage` 处理
- 可引入轻量级 JS 库（如 Alpine.js、htmx）提升开发效率，无需 React/Next.js

**对比之前的三层架构**：

| | 之前（过渡期） | 最终 |
|---|---|---|
| 落地页/博客 | Hugo `:1313` | Hugo |
| 应用页面 | Next.js `:3000` | Hugo + JavaScript |
| API | FastAPI `:8000` | FastAPI |
| 服务数量 | 3 个 | **2 个** |
| 部署复杂度 | 高（3 个容器/服务） | **低（静态文件 + 1 个容器）** |

### 10.2 Next.js → Hugo 迁移路径

| 阶段 | 说明 |
|---|---|
| **当前** | Hugo 落地页已就绪；Next.js 承载 Login/Register/Dashboard/Profile/Settings/Admin |
| **迁移中** | 逐页在 Hugo 中重建动态页面（Hugo 模板 + JS），每完成一个删除对应 Next.js 页面 |
| **完成** | 删除 `frontend/pages/`、`frontend/lib/`、`package.json` 等 Next.js 文件，仅保留 `frontend/hugo-landing/` |

迁移顺序建议（按依赖关系）：
1. Login / Register（认证基础）
2. Dashboard（登录后首页）
3. Profile / Settings
4. Onboarding
5. Admin

每个页面迁移模式：
```
Hugo 模板 (layouts/page/xxx.html)
  └── 页面布局 (nav + footer + 主题 CSS)
      └── <div id="app-root"></div>
          └── <script src="/js/xxx.js"></script>
              └── fetch("/api/auth/login", ...) → render DOM
```

### 10.3 本地开发

**迁移完成后**，本地只需启动 2 个服务：

| 服务 | 端口 | 启动命令 |
|---|---|---|
| Hugo 前端 | `:1313` | `tools/hugo/hugo.exe server -w` |
| FastAPI 后端 | `:8000` | `uvicorn app.main:app --reload` |

**过渡期间**，Hugo 和 Next.js 可以并行运行（`:1313` + `:3000` + `:8000`），逐步迁移。

### 10.4 云端部署（统一方案）

部署到云端后，统一到一个域名：

```
heerise.com
├── /                → Hugo 静态文件（全部页面）
├── /blog/           → Hugo 静态文件
├── /login/          → Hugo 静态页面 + JS
├── /dashboard/      → Hugo 静态页面 + JS
├── /profile/        → Hugo 静态页面 + JS
└── /api/            → FastAPI 后端（Cloud Run）
    ├── /api/auth/...
    ├── /api/me/...
    └── /api/admin/...
```

**部署方式：Firebase Hosting + Cloud Run**

| 组件 | 部署目标 | 说明 |
|---|---|---|
| Hugo 输出 (`public/`) | Firebase Hosting | 纯静态，CDN 全球加速，成本极低 |
| FastAPI | Cloud Run | 按需扩缩容，处理 API 请求 |

Firebase Hosting 通过 `rewrites` 将 `/api/**` 代理到 Cloud Run，其余全部由 CDN 提供静态文件：

```json
{
  "hosting": {
    "public": "frontend/hugo-landing/public",
    "rewrites": [
      { "source": "/api/**", "run": { "serviceId": "heerise-backend" } }
    ],
    "headers": [
      { "source": "**/*.@(css|js|png|jpg|svg)", "headers": [{ "key": "Cache-Control", "value": "max-age=31536000" }] }
    ]
  }
}
```

**优势**：
- 前端纯静态 → CDN 加载极快，即使后端宕机落地页/博客仍可访问
- 只需管理 1 个 Cloud Run 服务（FastAPI），运维简单
- 无需 Next.js 服务器，无 Node.js 运行时成本
- 所有页面共享同一套 Hugo Universal Theme CSS，风格 100% 统一

### 10.5 构建与部署脚本

```bash
#!/bin/bash
# build-and-deploy.sh

# 1. Hugo 前端构建
cd frontend/hugo-landing
hugo --minify        # 输出到 public/
cd ../..

# 2. 部署静态文件到 Firebase Hosting
firebase deploy --only hosting

# 3. 后端部署到 Cloud Run（Docker）
gcloud run deploy heerise-backend \
  --source backend/ \
  --region us-central1
```

### 10.6 部署时的路由调整

| 调整项 | 说明 |
|---|---|
| FastAPI `root_path` | 设置为 `/api`（`uvicorn app.main:app --root-path /api`） |
| Hugo 中 JS 的 API 地址 | 使用相对路径 `/api/...`（同域，无跨域问题） |
| Hugo 页面中的链接 | "Get Started" → `/login`，"Dashboard" → `/dashboard`（都在同一 Hugo 站点内） |

这些调整在准备部署时一次性完成，不影响当前本地开发（本地 JS 仍可用 `http://localhost:8000` 作为 API 地址）。

## 11. Docker 部署（推荐本地/服务器一键启动）

新增了 Docker 配置，默认启动 2 个容器：
- `frontend`（Nginx，端口 `8080`）
- `backend`（FastAPI，内部端口 `8000`，由前端反向代理 `/api`）

### 11.1 启动
```bash
cd Heerise
docker compose up -d --build
```

访问：
- 前端：`http://localhost:8080`
- 后端健康检查：`http://localhost:8080/api/health`

### 11.2 停止
```bash
docker compose down
```

如需同时删除数据库卷（会清空数据）：
```bash
docker compose down -v
```

### 11.3 环境变量（生产建议）
可在项目根目录放 `.env`（供 `docker compose` 读取）：

```env
JWT_SECRET=replace_with_a_strong_secret
FRONTEND_BASE=https://your-domain.com
```

说明：
- SQLite 数据库持久化在 Docker volume：`backend_data`
- 前端静态资源由 Hugo 构建后交给 Nginx 提供
- 前端请求 `/api/*` 会自动转发到 FastAPI（同域，无跨域问题）
