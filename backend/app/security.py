import os
from jose import jwt
from datetime import datetime, timedelta
from passlib.hash import argon2  
from typing import Any

JWT_SECRET = os.getenv("JWT_SECRET","change_me")
ACCESS_EXPIRES_MIN = int(os.getenv("ACCESS_EXPIRES_MIN","30"))
REFRESH_EXPIRES_DAYS = int(os.getenv("REFRESH_EXPIRES_DAYS","14"))

def hash_password(pw: str) -> str:
    return argon2.hash(pw)

def verify_password(pw: str, pw_hash: str) -> bool:
    return argon2.verify(pw, pw_hash)

def create_access_token(sub: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=ACCESS_EXPIRES_MIN)
    return jwt.encode({"sub": sub, "exp": exp}, JWT_SECRET, algorithm="HS256")

def create_refresh_token(sub: str) -> str:
    exp = datetime.utcnow() + timedelta(days=REFRESH_EXPIRES_DAYS)
    return jwt.encode({"sub": sub, "exp": exp, "typ":"refresh"}, JWT_SECRET, algorithm="HS256")

def decode_token(token: str) -> Any:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
