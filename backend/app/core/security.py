import re
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Union, Any, Tuple
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def hash_otp(otp_code: str) -> str:
    """Fast SHA-256 hash for temporary OTP codes"""
    return hashlib.sha256(otp_code.encode("utf-8")).hexdigest()

def verify_otp_hash(otp_code: str, hashed_otp: str) -> bool:
    if not otp_code or not hashed_otp:
        return False
    return hash_otp(otp_code) == hashed_otp

def generate_secure_otp() -> str:
    """Generate a cryptographically secure 6-digit random number"""
    return str(secrets.randbelow(900000) + 100000)

def normalize_email(email: str) -> str:
    if not email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    trimmed = email.strip().lower()
    email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(email_regex, trimmed):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    return trimmed

def validate_full_name(full_name: str) -> str:
    if not full_name:
        raise HTTPException(status_code=400, detail="Please enter your full name.")
    name_clean = full_name.strip()
    if not re.match(r"^[A-Za-z\s]+$", name_clean):
        raise HTTPException(status_code=400, detail="Name can contain letters and normal spaces only.")
    if len(name_clean) < 2 or len(name_clean) > 50:
        raise HTTPException(status_code=400, detail="Name must be between 2 and 50 characters.")
    return name_clean

def validate_username(username: str) -> str:
    if not username:
        return ""
    clean_user = username.strip().lower()
    if not re.match(r"^[a-z0-9_]{3,20}$", clean_user):
        raise HTTPException(
            status_code=400,
            detail="Username must be 3–20 characters and contain letters, numbers, or underscores only."
        )
    return clean_user

def validate_password_strength(password: str) -> None:
    if not password or len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long."
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 1 uppercase letter."
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 1 lowercase letter."
        )
    if not re.search(r"[0-9]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 1 number."
        )
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 1 special character."
        )

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any]) -> Tuple[str, datetime]:
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh", "jti": secrets.token_hex(16)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt, expire

def decode_token(token: str) -> Optional[dict]:
    try:
        decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return decoded
    except JWTError:
        return None
