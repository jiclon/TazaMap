from pydantic import BaseModel, ConfigDict
from datetime import datetime

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

