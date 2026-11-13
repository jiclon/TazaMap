import os 
import jwt
from pwdlib import PasswordHash 
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM  = "HS256"
TOKEN_HOURS = 12

password_hasher = PasswordHash.recommended()

def hash_password(password: str) -> str: 
    hashed = password_hasher.hash(password)
    return hashed

def verify_password(password: str, password_hash: str) -> bool: 
    is_valid = password_hasher.verify(password, password_hash)
    return is_valid

def create_token(user_id: int ) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_HOURS)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def read_token(token: str) -> int | None:
    try: 
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except jwt.PyJWTError:
        return None
