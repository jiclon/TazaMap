from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from models import Cleanup
from schemas import CleanupCreate, CleanupOut
from dependencies import get_db

router = APIRouter()

@router.get("/cleanups", response_model=list[CleanupOut])
def get_cleanups(db: Session = Depends(get_db)):
    return db.scalars(select(Cleanup)).all()

@router.post("/cleanups", response_model=CleanupOut, status_code=201)
def create_cleanup(cleanup: CleanupCreate, db: Session = Depends(get_db)):
    db_cleanup = Cleanup(**cleanup.model_dump())

    db.add(db_cleanup)
    db.commit()
    db.refresh(db_cleanup)

    return db_cleanup