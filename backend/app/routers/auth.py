"""
Authentication routes.
"""

import os

from fastapi import APIRouter, Depends, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session

from .. import models
from ..auth import authenticate_user, create_access_token, get_current_user, get_password_hash
from ..database import get_db
from ..schemas import GoogleLoginRequest, LoginRequest, MessageResponse, TokenResponse, UserRead

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token(user)
    return TokenResponse(access_token=access_token, user=UserRead.model_validate(user))


@router.post("/google", response_model=TokenResponse)
async def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Verify a real Google Identity Services ID token and return a VICAI JWT."""
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not google_client_id:
        raise HTTPException(status_code=503, detail="Google authentication is not configured")

    try:
        google_user = id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token") from exc

    email = google_user.get("email")
    if not email or not google_user.get("email_verified", False):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google email is not verified")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            email=email,
            name=google_user.get("name") or email,
            role="finance_manager",
            company="Google Workspace SSO",
            password_hash=get_password_hash("google-oauth-user"),
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.name = google_user.get("name") or user.name
        user.company = user.company or "Google Workspace SSO"
        db.commit()
        db.refresh(user)

    access_token = create_access_token(user)
    return TokenResponse(access_token=access_token, user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
async def me(current_user: models.User = Depends(get_current_user)):
    return UserRead.model_validate(current_user)


@router.post("/logout", response_model=MessageResponse)
async def logout():
    return MessageResponse(message="Logged out successfully", success=True)
