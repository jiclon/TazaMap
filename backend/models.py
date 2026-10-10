from sqlalchemy import String, ForeignKey
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
