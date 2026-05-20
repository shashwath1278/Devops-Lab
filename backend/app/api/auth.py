import uuid
from datetime import datetime, timedelta
import os
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# In-memory user store (per container process; resets on Azure restart)
users_by_username: dict[str, dict] = {}
users_by_email: dict[str, dict] = {}


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


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


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


def _find_user(identifier: str) -> Optional[dict]:
    identifier = identifier.strip()
    if identifier in users_by_username:
        return users_by_username[identifier]
    if "@" in identifier:
        return users_by_email.get(identifier.lower())
    return None


@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    if not user.email or "@" not in user.email:
        raise HTTPException(status_code=400, detail="Valid email is required")

    username = user.username.strip()
    email = user.email.strip().lower()

    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    if username in users_by_username:
        raise HTTPException(status_code=400, detail="Username already registered")

    if email in users_by_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    record = {
        "id": user_id,
        "username": username,
        "email": email,
        "hashed_password": get_password_hash(user.password),
    }
    users_by_username[username] = record
    users_by_email[email] = record

    return _issue_token(user_id, username, email)


@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    db_user = _find_user(user.username)
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return _issue_token(
        db_user["id"],
        db_user["username"],
        db_user.get("email"),
    )
