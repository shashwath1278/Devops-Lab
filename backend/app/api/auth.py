from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

router = APIRouter()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Mock database
users_db = {}

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str
    email: Optional[str] = None

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

import uuid
from app.core.supabase import supabase

# ... imports ...

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    # 1. Create user in Supabase Auth
    try:
        # Use sign_up (works with anon or service key, but creates in auth.users)
        auth_res = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {
                "data": {
                    "username": user.username
                }
            }
        })
        
        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Registration failed")
            
        user_id = auth_res.user.id
        
    except Exception as e:
        # Check if user already exists
        if "User already registered" in str(e):
             raise HTTPException(status_code=400, detail="Username/Email already registered")
        print(f"Supabase Auth Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # 2. Try to sync to public.users (if it exists and is needed)
    try:
        supabase.table("users").insert({
            "id": user_id,
            "username": user.username,
            "email": user.email
        }).execute()
    except Exception as e:
        print(f"Note: Failed to insert into public.users (might not exist or trigger handles it): {e}")

    # 3. Store in local mock DB (for login fallback if needed, or just return token)
    # We can just return the token now.
    
    # Generate our own token for consistency with the frontend expectations
    # OR use the one from Supabase? 
    # Let's stick to our token to avoid breaking the frontend 'login' flow which expects our token structure.
    # But we MUST use the Supabase user_id.
    
    hashed_password = get_password_hash(user.password)
    users_db[user.username] = {
        "id": user_id,
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password
    }
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "id": user_id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user_id,
        "username": user.username,
        "email": user.email
    }
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "id": user_id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user_id,
        "username": user.username,
        "email": user.email
    }

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    db_user = users_db.get(user.username)
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "id": db_user["id"]},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": db_user["id"],
        "username": db_user["username"],
        "email": db_user["email"]
    }
