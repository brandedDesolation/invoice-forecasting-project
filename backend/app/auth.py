"""
Authentication utilities for JWT-backed admin access.
"""

import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import models
from .database import get_db

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("SECRET_KEY", "development-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

DEFAULT_ADMIN_EMAIL = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@invoiceforecast.com")
DEFAULT_ADMIN_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
DEFAULT_ADMIN_NAME = os.getenv("DEFAULT_ADMIN_NAME", "Admin User")
DEFAULT_ADMIN_COMPANY = os.getenv("DEFAULT_ADMIN_COMPANY", "Invoice Forecast")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(user: models.User) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


ERP_ROLES = {"admin", "finance_manager", "accountant", "auditor"}


def require_admin_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role not in ERP_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ERP access required")
    return current_user


def ensure_default_admin(db: Session) -> None:
    existing = db.query(models.User).filter(models.User.email == DEFAULT_ADMIN_EMAIL).first()
    if existing:
        return

    admin_user = models.User(
        email=DEFAULT_ADMIN_EMAIL,
        name=DEFAULT_ADMIN_NAME,
        role="admin",
        company=DEFAULT_ADMIN_COMPANY,
        password_hash=get_password_hash(DEFAULT_ADMIN_PASSWORD),
        is_active=True,
    )
    db.add(admin_user)
    db.commit()
