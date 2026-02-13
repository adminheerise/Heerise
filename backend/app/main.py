from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .routers import auth, onboarding, me, admin, contact
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

app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(me.router)
app.include_router(admin.router)
app.include_router(contact.router)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"ok": True}
