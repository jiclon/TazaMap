from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from models import Spot, User
from schemas import SpotOut, SpotCreate
from dependencies import get_db, get_current_user

router = APIRouter()

@router.get("/spots", response_model=list[SpotOut])
def get_spots(db: Session = Depends(get_db)):
    return db.scalars(select(Spot)).all()

@router.get("/spots/{spot_id}", response_model=SpotOut)
def get_spot(spot_id: int, db: Session = Depends(get_db)):
    db_spot = db.get(Spot,spot_id)

    if db_spot is None:

        raise HTTPException(
            status_code=404,
            detail="Место не найдено"
        )

    return db_spot

@router.post("/spots", response_model=SpotOut, status_code=201)
def create_spot(spot: SpotCreate,db: Session = Depends(get_db),user: User = Depends(get_current_user)):
    db_spot = Spot(**spot.model_dump(), user_id=user.id)

    db.add(db_spot)
    db.commit()
    db.refresh(db_spot)

    return db_spot


@router.delete("/spots/{spot_id}", status_code=204)
def spots_delete(spot_id: int, db: Session = Depends(get_db)):
    db_spot = db.get(Spot, spot_id)

    if db_spot is None:
        raise HTTPException(
            status_code=404,
            detail="Место не найдена"
        )

    db.delete(db_spot)
    db.commit()
