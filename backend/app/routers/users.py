"""
User management routes for ERP access administration.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..auth import get_password_hash, require_admin_user
from ..database import get_db
from ..schemas import UserCreate, UserRead, UserUpdate

router = APIRouter()

ALLOWED_ROLES = {"admin", "finance_manager", "accountant", "auditor"}


@router.get("/", response_model=List[UserRead])
async def get_users(db: Session = Depends(get_db), _admin=Depends(require_admin_user)):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()


@router.post("/", response_model=UserRead)
async def create_user(payload: UserCreate, db: Session = Depends(get_db), _admin=Depends(require_admin_user)):
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid ERP role")
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="User already exists")

    user = models.User(
        email=payload.email,
        name=payload.name,
        role=payload.role,
        company=payload.company,
        password_hash=get_password_hash(payload.password),
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.put("/{user_id}", response_model=UserRead)
async def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), _admin=Depends(require_admin_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "role" in update_data and update_data["role"] not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid ERP role")

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)
