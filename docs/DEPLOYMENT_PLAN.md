# Heerise Deployment Plan: Google Cloud + Firebase

Deploy the Heerise site (Hugo frontend + FastAPI backend) to a custom domain using **Firebase Hosting** and **Google Cloud Run**.

---

## 1. Architecture Overview

```
                    heerise.com (your domain)
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Firebase Hosting   │
                    │  (CDN + SSL)        │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        / (static)      /blog/...       /api/**
        Hugo files      Hugo files      Rewrite to Cloud Run
              │               │               │
              └───────────────┴───────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   Cloud Run         │
                    │   (FastAPI)         │
                    └─────────────────────┘
```

| Component | Technology | Purpose |
|-----------|------------|---------|
| Static site (Hugo) | Firebase Hosting | CDN, SSL, low cost |
| API (FastAPI) | Cloud Run | Serverless, auto-scale |
| Domain | Firebase / Google Domains | Custom domain + SSL |

---

## 2. Prerequisites Checklist

- [ ] **Google Cloud account** – [console.cloud.google.com](https://console.cloud.google.com)
- [ ] **Firebase project** – linked to the same GCP project
- [ ] **Domain** – either owned or ready to purchase
- [ ] **gcloud CLI** – [Install](https://cloud.google.com/sdk/docs/install)
- [ ] **Firebase CLI** – `npm install -g firebase-tools`

---

## 3. Step-by-Step Plan

### Phase A: Google Cloud Setup

#### A1. Create / select GCP project

```bash
gcloud projects create heerise-prod --name="Heerise Production"
gcloud config set project heerise-prod
```

Or link to an existing project.

#### A2. Enable required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### A3. Link Firebase to GCP project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project or select existing
3. Ensure it uses the same GCP project (Settings → Project settings → Your apps)

---

### Phase B: Backend (Cloud Run)

#### B1. Prepare FastAPI for `/api` prefix

Cloud Run receives requests at `/api/**`. The backend must handle this. Two options:

**Option A – Mount at `/api` (recommended)**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# ... existing imports ...

app = FastAPI(title="Heerise API", root_path="/api")

# Add production origins for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://localhost:1313",
        "https://heerise.com", "https://www.heerise.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routes under /api via a sub-app or router prefix
# Easiest: use APIRouter with prefix="/api" and include in app
```

**Option B – Use a reverse proxy**  
Firebase Hosting rewrites to Cloud Run. Cloud Run receives the full path. You need to either:
- Mount the app at `/api`, or
- Use an ASGI middleware to strip `/api` before routing

#### B2. Environment variables for production

Create `backend/.env.production` (do not commit secrets):

```env
JWT_SECRET=<strong-random-secret>
DATABASE_URL=sqlite:////app/data/app.db
FRONTEND_BASE=https://heerise.com
```

For production, consider **Cloud SQL** or **Firestore** instead of SQLite if you need multi-instance scaling.

#### B3. Deploy to Cloud Run

```bash
cd backend
gcloud run deploy heerise-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "JWT_SECRET=xxx,FRONTEND_BASE=https://heerise.com"
```

Note the Cloud Run service URL (e.g. `https://heerise-backend-xxxxx-uc.a.run.app`).

---

### Phase C: Frontend (Firebase Hosting)

#### C1. Initialize Firebase in project

```bash
cd Heerise
firebase login
firebase init hosting
```

When prompted:
- Select existing project (or create)
- Public directory: `frontend/hugo-landing/public`
- Single-page app: No
- Don’t overwrite `index.html`

#### C2. Configure `firebase.json`

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

#### C3. Build Hugo before deploy

```bash
cd frontend/hugo-landing
hugo --minify
cd ../..
firebase deploy --only hosting
```

---

### Phase D: Custom Domain

#### D1. Add domain in Firebase

1. Firebase Console → Hosting → Add custom domain
2. Enter `heerise.com` (and optionally `www.heerise.com`)
3. Follow DNS instructions (add A/CNAME records at your registrar)

#### D2. SSL

Firebase provisions SSL automatically after DNS propagates (can take up to 24 hours).

---

## 4. Build & Deploy Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "1. Building Hugo..."
cd frontend/hugo-landing
hugo --minify
cd ../..

echo "2. Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "3. Deploying backend to Cloud Run..."
gcloud run deploy heerise-backend \
  --source backend/ \
  --region us-central1 \
  --allow-unauthenticated

echo "Done."
```

---

## 5. Backend Path Handling (Important)

**Local (Docker):** Nginx strips `/api` when proxying → backend receives `/health`, `/auth/login`, etc.

**Production (Firebase → Cloud Run):** Firebase rewrites preserve the path → Cloud Run receives `/api/health`, `/api/auth/login`, etc.

**Recommended approach:** Make the backend always serve under `/api` so both Docker and Cloud Run behave the same:

1. **Backend:** Add `prefix="/api"` to all routers and the health route.
2. **Nginx (Docker):** Change `proxy_pass http://backend:8000/` to `proxy_pass http://backend:8000` (no trailing slash) so `/api/health` is forwarded as-is to the backend.
3. **Cloud Run:** Receives `/api/health` directly from Firebase — no extra config.

This keeps one backend configuration for all environments.

---

## 6. Checklist Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | GCP project + enable APIs | ⬜ |
| 2 | Firebase project linked to GCP | ⬜ |
| 3 | Backend: add `/api` prefix for Cloud Run | ⬜ |
| 4 | Backend: production CORS origins | ⬜ |
| 5 | Deploy backend to Cloud Run | ⬜ |
| 6 | `firebase init hosting` + `firebase.json` | ⬜ |
| 7 | Build Hugo + `firebase deploy` | ⬜ |
| 8 | Add custom domain in Firebase | ⬜ |
| 9 | Configure DNS at registrar | ⬜ |
| 10 | Verify SSL + full site | ⬜ |

---

## 7. Cost Estimate (Approximate)

| Service | Free tier | Beyond free tier |
|---------|-----------|------------------|
| Firebase Hosting | 10 GB storage, 360 MB/day transfer | ~$0.026/GB |
| Cloud Run | 2M requests/month | ~$0.00002400/request + CPU/memory |
| Domain | N/A | ~$12/year (Google Domains) |

For a small site, expect to stay within free tiers initially.

---

## 8. Next Actions

1. Confirm your domain (e.g. `heerise.com`).
2. Create GCP + Firebase projects if not done.
3. Implement the `/api` prefix in the backend.
4. Run `firebase init` and add `firebase.json`.
5. Deploy backend, then frontend.
6. Add domain and DNS.
7. Test end-to-end.
