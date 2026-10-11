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


@router.delete("/cleanups/{cleanup_id}",status_code=204)
def cleanups_delete(cleanup_id: int, db: Session = Depends(get_db)):
    db_claenup = db.get(Cleanup, cleanup_id)

    if db_claenup is None:
        raise HTTPException(
            status_code=404,
            detail="Уборка не найдена"
        )
    
    db.delete(db_claenup)
    db.commit()

