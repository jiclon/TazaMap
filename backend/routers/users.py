from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from models import User
from schemas import UserCreate, UserOut
from dependencies import get_db 

router = APIRouter()

@router.get("/users/{user_id}", response_model=UserOut)
def get_id(user_id: int, db: Session = Depends(get_db)):
    db_user = db.get(User, user_id)

    if db_user is None:
        raise HTTPException(
            status_code=404, 
            detail="Пользователь не найден"
        )
    return db_user

@router.post("/users", response_model=UserOut,status_code=201)
def create_user(user: UserCreate,db: Session = Depends(get_db)):
    db_user = db.scalar(select(User).where(User.phone == user.phone))

    if db_user is not None:
        raise HTTPException(
            status_code=409,
            detail="Пользователь с таким номером уже существует"
        )

    new_user = User(
        phone=user.phone,
        name=user.name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user
