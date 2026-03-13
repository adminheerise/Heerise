from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .routers import auth, onboarding, me, admin, contact, syllabus, career_lab
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CareerCoach Auth+Onboarding MVP", debug=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:1313"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routes under /api so Firebase Hosting rewrite /api/** → backend works
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


@app.get("/health")
def health():
    return {"ok": True}
