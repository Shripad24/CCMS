import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaints.id"), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="notifications")
    complaint = relationship("Complaint")

    def __repr__(self) -> str:
        return f"<Notification {self.type} for user {self.user_id}>"
