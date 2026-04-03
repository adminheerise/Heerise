from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .routers import auth, onboarding, me, admin, contact, syllabus, career_lab, sim
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Heerise API", debug=False)

# CORS: local dev + production (Firebase Hosting domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:1313",
        "http://localhost:8080",
        "https://heeriseacademy.web.app",
        "https://heeriseacademy.firebaseapp.com",
        "https://heeriseacademy.com",
        "https://www.heeriseacademy.com",
        "https://heerise.com",
        "https://www.heerise.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All routes under /api for Cloud Run (Firebase rewrites preserve path)
API_PREFIX = "/api"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(onboarding.router, prefix=API_PREFIX)
app.include_router(me.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(contact.router, prefix=API_PREFIX)
app.include_router(syllabus.router, prefix=API_PREFIX)
app.include_router(career_lab.router, prefix=API_PREFIX)
app.include_router(sim.router, prefix=API_PREFIX)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get(f"{API_PREFIX}/health")
def health():
    return {"ok": True}
