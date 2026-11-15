from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from jose import jwt, JWTError
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.config import settings

# Initialize Argon2id password hasher (PRD FR-01)
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    salt_len=16
)


def hash_password(password: str) -> str:
    """Hash password using Argon2id"""
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2id hash"""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, Exception):
        return False


def create_access_token(subject: Union[str, Any], extra_claims: Optional[Dict[str, Any]] = None) -> str:
    """Create JWT access token with expiration"""
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expires_delta

    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "type": "access",
        "iat": datetime.utcnow()
    }
    if extra_claims:
        to_encode.update(extra_claims)

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: Union[str, Any]) -> str:
    """Create JWT refresh token with extended rotation expiration"""
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    expire = datetime.utcnow() + expires_delta

    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "type": "refresh",
        "iat": datetime.utcnow()
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT signature and expiration"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
