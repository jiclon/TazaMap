from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from models import UserRole

class SpotCreate(BaseModel):
    title: str 
    description: str | None = None
    latitude: float
    longitude: float
    image: str
    trash_level: str 

class SpotOut(SpotCreate):
    id: int 
    status: str 
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CleanupCreate(BaseModel):
    spot_id: int 
    starts_at: datetime
    gathering_place: str | None = None
    chat_link: str | None = None

class CleanupOut(CleanupCreate):
    id: int 
    status: str 
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserCreate(BaseModel):
    phone: str = Field(pattern=r"^\+?\d{10,15}$")
    name: str = Field(min_length=1, max_length=40)

class UserOut(BaseModel):
    id: int 
    name: str 
    role: UserRole
    trust: int 
    is_verified: bool 
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


