from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from models import User
from security import read_token
from database import SessionLocal 

bearer = HTTPBearer(auto_error=False)

def get_db():
    db = SessionLocal()
    try:
        yield db 
    finally:
        db.close()

def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:

    if creds is None: 
        raise HTTPException(
            status_code=401, 
            detail="not_authenticated"
        )
    user_id = read_token(creds.credentials)

    if user_id is None: 
        raise HTTPException(
            status_code=401,
            detail="not_authenticated"
        )

    db_user = db.get(User, user_id)

    if db_user is None: 
        raise HTTPException(
            status_code=401,
            detail="not_authenticated"
        )

    return db_user



