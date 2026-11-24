import enum
from sqlalchemy import String, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from database import Base

class Spot(Base):
    __tablename__ = "spots"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(40))
    description: Mapped[str | None] = mapped_column(String(120))
    latitude: Mapped[float] = mapped_column()
    longitude: Mapped[float] = mapped_column()
    image: Mapped[str] = mapped_column()
    trash_level:  Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="dirty")
    created_at: Mapped[datetime] = mapped_column(default=datetime.now)
    cleanups: Mapped[list["Cleanup"]] = relationship(back_populates="spot")
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

class Cleanup(Base):
    __tablename__ = "cleanups"

    id: Mapped[int] = mapped_column(primary_key=True)
    spot_id: Mapped[int] = mapped_column(ForeignKey("spots.id"))
    starts_at: Mapped[datetime] = mapped_column()
    gathering_place: Mapped[str | None] = mapped_column(String(80))
    chat_link: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20),default="planned")
    created_at: Mapped[datetime] = mapped_column(default=datetime.now)
    spot: Mapped["Spot"] = relationship(back_populates="cleanups")


class UserRole(str, enum.Enum):
    user = "user"
    organizer = "organizer"
    teacher = "teacher"
    partner = "partner"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    phone: Mapped[str] = mapped_column(String(20), unique=True) 
    name: Mapped[str] = mapped_column(String(40))
    role: Mapped[UserRole] =  mapped_column(Enum(UserRole), default=UserRole.user)
    xp: Mapped[int] = mapped_column(server_default="0")
    trust: Mapped[int] = mapped_column(default=0)
    is_verified: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    password_hash: Mapped[str] = mapped_column(nullable=True)


    
