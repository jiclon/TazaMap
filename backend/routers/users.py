from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from models import User
from schemas import UserCreate, UserOut, LoginIn,TokenOut
from dependencies import get_db 
from security import hash_password, verify_password, create_token

router = APIRouter()

@router.get("/users/{user_id}", response_model=UserOut)
def get_id(user_id: int, db: Session = Depends(get_db)):
    db_user = db.get(User, user_id)

    if db_user is None:
        raise HTTPException(
            status_code=404, 
            detail="user_not_found"
        )
    return db_user

@router.post("/users", response_model=UserOut,status_code=201)
def create_user(user: UserCreate,db: Session = Depends(get_db)):
    db_user = db.scalar(select(User).where(User.phone == user.phone))

    if db_user is not None:
        raise HTTPException(
            status_code=409,
            detail="phone_taken"
        )

    new_user = User(
        phone=user.phone,
        name=user.name,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)): 
    db_user = db.scalar(select(User).where(User.phone == data.phone))
    if(
        db_user is None
        or db_user.password_hash is None
        or not verify_password(data.password, db_user.password_hash)
    ):
        raise HTTPException(
            status_code=401,
            detail="invalid_credentials"
        )
    return TokenOut(access_token=create_token(db_user.id))

