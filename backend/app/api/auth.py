from datetime import datetime, timedelta
import os
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.core.supabase import supabase

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class UserCreate(BaseModel):
    username: str
    password: str
    email: str


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str
    email: Optional[str] = None


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _table_rows(response) -> list:
    if hasattr(response, "data") and response.data is not None:
        return response.data
    if isinstance(response, tuple) and len(response) > 1:
        return response[1] or []
    return []


def _issue_token(user_id: str, username: str, email: Optional[str]) -> dict:
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username, "id": user_id},
        expires_delta=access_token_expires,
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_id,
        "username": username,
        "email": email,
    }


@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    if not user.email or "@" not in user.email:
        raise HTTPException(status_code=400, detail="Valid email is required")

    try:
        auth_res = supabase.auth.sign_up(
            {
                "email": user.email,
                "password": user.password,
                "options": {"data": {"username": user.username}},
            }
        )
        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Registration failed")
        user_id = auth_res.user.id
    except HTTPException:
        raise
    except Exception as e:
        message = str(e)
        if "already registered" in message.lower():
            raise HTTPException(
                status_code=400, detail="Username or email already registered"
            )
        print(f"Supabase Auth Error: {e}")
        detail = "Registration failed"
        if "Name or service not known" in str(e):
            detail = "Supabase URL is missing or invalid on the server (check SUPABASE_URL env)"
        raise HTTPException(status_code=500, detail=detail)

    try:
        supabase.table("users").insert(
            {"id": user_id, "username": user.username, "email": user.email}
        ).execute()
    except Exception as e:
        print(f"Note: public.users insert skipped or failed: {e}")

    return _issue_token(user_id, user.username, user.email)


@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    rows = _table_rows(
        supabase.table("users")
        .select("id, email, username")
        .eq("username", user.username)
        .limit(1)
        .execute()
    )
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    profile = rows[0]
    email = profile.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account has no email on file",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        auth_res = supabase.auth.sign_in_with_password(
            {"email": email, "password": user.password}
        )
        if not auth_res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_id = auth_res.user.id
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return _issue_token(
        user_id,
        profile.get("username") or user.username,
        email,
    )
