# Heerise 完整部署指南

从零到上线：部署环境 → GCP → Firebase → 最终部署

---

## 总览

```
阶段一：部署环境准备（本地）
    ↓
阶段二：GCP 设置
    ↓
阶段三：Firebase 设置
    ↓
阶段四：代码修改（Backend + Nginx）
    ↓
阶段五：部署 Backend（Cloud Run）
    ↓
阶段六：部署 Frontend（Firebase Hosting）
    ↓
阶段七：自定义域名（可选）
```

---

## 阶段一：部署环境准备（本地）

### 1.1 安装 Node.js

Firebase CLI 需要 Node.js。

- 下载：https://nodejs.org/
- 安装后验证：
  ```powershell
  node -v
  npm -v
  ```

### 1.2 安装 gcloud CLI

- 下载：https://cloud.google.com/sdk/docs/install
- 选择 Windows 安装包，按向导完成安装
- 验证：
  ```powershell
  gcloud --version
  ```

### 1.3 安装 Firebase CLI

```powershell
npm install -g firebase-tools
firebase --version
```

### 1.4 安装 Hugo（如未安装）

```powershell
# 或从 https://gohugo.io/installation/ 下载
# 验证
hugo version
```

### 1.5 检查项目

```powershell
cd e:\Heerise
dir backend\app\main.py
dir frontend\hugo-landing\hugo.toml
```

---

## 阶段二：GCP 设置

### 2.1 登录 Google 账号

```powershell
gcloud auth login
```

浏览器会打开，用 Google 账号登录并授权。

### 2.2 创建 / 选择项目

**新建项目：**
```powershell
gcloud projects create heerise-prod --name="Heerise Production"
gcloud config set project heerise-prod
```

**使用已有项目：**
```powershell
gcloud projects list
gcloud config set project 你的项目ID
```

### 2.3 启用计费（Billing）

1. 打开 https://console.cloud.google.com/billing
2. 选择或创建 Billing Account
3. 将项目关联到该 Billing Account

> 新账号通常有免费额度，Cloud Run 和 Firebase Hosting 都有免费额度。

### 2.4 启用所需 API

```powershell
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

或一条命令：
```powershell
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

### 2.5 验证

```powershell
gcloud config get-value project
gcloud services list --enabled
```

---

## 阶段三：Firebase 设置

### 3.1 登录 Firebase

```powershell
firebase login
```

浏览器会打开，用 Google 账号登录。

### 3.2 创建 Firebase 项目（关联到同一 GCP 项目）

1. 打开 https://console.firebase.google.com
2. 点击 **Add project** / **添加项目**
3. 输入项目名称（如 `heerise-prod`）
4. **重要**：选择 **Use an existing Google Cloud project**（使用现有 Google Cloud 项目）
5. 选择你在 2.2 中创建的 GCP 项目（如 `heerise-prod`）
6. 完成创建

### 3.3 在项目目录初始化 Firebase Hosting

```powershell
cd e:\Heerise
firebase init hosting
```

按提示选择：

| 提示 | 选择 |
|------|------|
| Please select an option | Use an existing project |
| Select a default Firebase project | 选择刚创建的 heerise-prod |
| What do you want to use as your public directory? | `frontend/hugo-landing/public` |
| Configure as a single-page app? | **N** |
| Set up automatic builds with GitHub? | **N** |
| File frontend/hugo-landing/public/index.html already exists. Overwrite? | **N** |

### 3.4 编辑 firebase.json

确保 `firebase.json` 包含 rewrites，将 `/api/**` 转发到 Cloud Run：

```json
{
  "hosting": {
    "public": "frontend/hugo-landing/public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "heerise-backend",
          "region": "us-central1"
        }
      }
    ],
    "headers": [
      {
        "source": "**/*.@(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)",
        "headers": [{ "key": "Cache-Control", "value": "max-age=31536000,immutable" }]
      }
    ]
  }
}
```

> `serviceId` 必须与后续 Cloud Run 部署时的服务名一致（`heerise-backend`）。

---

## 阶段四：代码修改（Backend + Nginx）

### 4.1 修改 Backend（main.py）

Cloud Run 收到的请求路径为 `/api/health`、`/api/auth/login` 等，需在 FastAPI 中增加 `/api` 前缀。

**修改 `backend/app/main.py`：**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .routers import auth, onboarding, me, admin, contact, syllabus, career_lab
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Heerise API", debug=False)

# 生产环境 CORS 需包含实际域名
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:1313",
        "http://localhost:8080",
        "https://heerise.com",
        "https://www.heerise.com",
        "https://heerise-prod.web.app",  # Firebase 默认域名
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 所有路由统一加 /api 前缀
API_PREFIX = "/api"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(onboarding.router, prefix=API_PREFIX)
app.include_router(me.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(contact.router, prefix=API_PREFIX)
app.include_router(syllabus.router, prefix=API_PREFIX)
app.include_router(career_lab.router, prefix=API_PREFIX)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get(f"{API_PREFIX}/health")
def health():
    return {"ok": True}
```

### 4.2 修改 Nginx（Docker 本地）

使本地 Docker 与生产一致：`/api/health` 原样转发到后端。

**修改 `frontend/hugo-landing/nginx.conf`：**

```nginx
location /api/ {
    proxy_pass http://backend:8000;   # 去掉末尾斜杠，保留 /api 路径
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

将 `proxy_pass http://backend:8000/` 改为 `proxy_pass http://backend:8000`（去掉末尾 `/`）。

---

## 阶段五：部署 Backend（Cloud Run）

### 5.1 准备环境变量

生成强随机 JWT_SECRET，例如：

```powershell
# PowerShell 生成随机字符串
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 5.2 部署到 Cloud Run

```powershell
cd e:\Heerise\backend
gcloud run deploy heerise-backend ^
  --source . ^
  --region us-central1 ^
  --allow-unauthenticated ^
  --set-env-vars "JWT_SECRET=你的32位随机字符串,FRONTEND_BASE=https://heerise-prod.web.app"
```

> 首次部署会构建镜像，可能需要几分钟。

### 5.3 记录部署结果

部署成功后会输出类似：

```
Service URL: https://heerise-backend-xxxxx-uc.a.run.app
```

### 5.4 验证 Backend

```powershell
curl https://heerise-backend-xxxxx-uc.a.run.app/api/health
```

应返回：`{"ok":true}`

---

## 阶段六：部署 Frontend（Firebase Hosting）

### 6.1 构建 Hugo

```powershell
cd e:\Heerise\frontend\hugo-landing
hugo --minify
```

确认 `public/` 目录已生成。

### 6.2 部署到 Firebase Hosting

```powershell
cd e:\Heerise
firebase deploy --only hosting
```

### 6.3 记录部署结果

部署成功后会输出类似：

```
Hosting URL: https://heerise-prod.web.app
```

### 6.4 验证

1. 访问 `https://heerise-prod.web.app`，应能看到首页
2. 访问 `https://heerise-prod.web.app/api/health`，应返回 `{"ok":true}`

---

## 阶段七：自定义域名（可选）

### 7.1 在 Firebase 添加域名

1. 打开 https://console.firebase.google.com
2. 选择项目 → **Hosting** → **Add custom domain**
3. 输入域名（如 `heerise.com`）
4. 按提示添加 DNS 记录

### 7.2 在域名服务商配置 DNS

在域名注册商（GoDaddy、Cloudflare、阿里云等）添加 Firebase 提供的 A 记录或 CNAME 记录。

### 7.3 更新环境变量

若使用自定义域名，重新部署 Backend 并更新 FRONTEND_BASE：

```powershell
gcloud run deploy heerise-backend ^
  --source e:\Heerise\backend ^
  --region us-central1 ^
  --allow-unauthenticated ^
  --set-env-vars "JWT_SECRET=xxx,FRONTEND_BASE=https://heerise.com"
```

### 7.4 等待 SSL

DNS 生效后，Firebase 会自动签发 SSL 证书，通常 24 小时内完成。

---

## 后续更新部署

### 更新 Backend

```powershell
cd e:\Heerise\backend
gcloud run deploy heerise-backend --source . --region us-central1
```

### 更新 Frontend

```powershell
cd e:\Heerise\frontend\hugo-landing
hugo --minify
cd e:\Heerise
firebase deploy --only hosting
```

---

## 完整检查清单

| 阶段 | 步骤 | 状态 |
|------|------|------|
| 一 | 安装 Node.js、gcloud、Firebase CLI、Hugo | ⬜ |
| 二 | 登录 gcloud、创建项目、启用 Billing、启用 API | ⬜ |
| 三 | 登录 Firebase、创建项目、firebase init hosting、配置 firebase.json | ⬜ |
| 四 | 修改 main.py（/api 前缀 + CORS）、修改 nginx.conf | ⬜ |
| 五 | 部署 Backend 到 Cloud Run、验证 /api/health | ⬜ |
| 六 | 构建 Hugo、部署到 Firebase Hosting、验证首页和 API | ⬜ |
| 七 | 添加自定义域名、配置 DNS、更新 FRONTEND_BASE | ⬜ |

---

## 常见问题

**Q: gcloud 提示 "Permission denied"？**  
A: 确认登录账号有项目 Owner 或 Editor 权限。

**Q: Cloud Run 部署失败？**  
A: 检查 `backend/requirements.txt` 和 `backend/Dockerfile` 是否存在。

**Q: Firebase Hosting 访问 /api/health 返回 404？**  
A: 确认 firebase.json 中 rewrites 的 serviceId 与 Cloud Run 服务名一致，且 Backend 已部署。

**Q: 本地 Docker 仍可访问吗？**  
A: 可以。修改 nginx 后，`docker compose up` 仍会正确转发 `/api/**` 到后端。
