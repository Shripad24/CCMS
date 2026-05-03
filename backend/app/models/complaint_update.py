import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class UpdateType(str, enum.Enum):
    STATUS_CHANGE = "STATUS_CHANGE"
    NOTE = "NOTE"
    SLA_BREACH = "SLA_BREACH"
    ASSIGNMENT = "ASSIGNMENT"
    ESCALATION = "ESCALATION"


class ComplaintUpdate(Base):
    __tablename__ = "complaint_updates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaints.id"), nullable=False, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    update_type = Column(
        SAEnum(UpdateType, name="update_type_enum", create_constraint=True),
        nullable=False,
    )
    previous_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=True)
    message = Column(Text, nullable=True)
    attachment_url = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    complaint = relationship("Complaint", back_populates="updates")
    author = relationship("User")

    def __repr__(self) -> str:
        return f"<ComplaintUpdate {self.update_type} for {self.complaint_id}>"
