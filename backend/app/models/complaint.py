import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Boolean, DateTime, Text, Integer, Float,
    Enum as SAEnum, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_INFO = "PENDING_INFO"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"


class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference_no = Column(String(20), unique=True, nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(
        SAEnum(ComplaintStatus, name="complaint_status_enum", create_constraint=True),
        default=ComplaintStatus.SUBMITTED,
        nullable=False,
    )
    category = Column(String(50), nullable=True)
    priority = Column(
        SAEnum(Priority, name="priority_enum", create_constraint=True),
        default=Priority.MEDIUM,
        nullable=False,
    )
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    assigned_staff_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # AI fields
    ai_category = Column(String(50), nullable=True)
    ai_priority = Column(String(20), nullable=True)
    ai_department = Column(String(100), nullable=True)
    ai_reasoning = Column(Text, nullable=True)
    ai_confidence = Column(Float, nullable=True)

    # SLA fields
    sla_deadline = Column(DateTime(timezone=True), nullable=True)
    sla_warning_sent = Column(Boolean, default=False, nullable=False)
    sla_paused_at = Column(DateTime(timezone=True), nullable=True)
    sla_paused_duration_minutes = Column(Integer, default=0, nullable=False)

    # File attachment
    attachment_url = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=True,
    )
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    student = relationship("User", back_populates="complaints_submitted", foreign_keys=[student_id])
    assigned_staff = relationship("User", back_populates="complaints_assigned", foreign_keys=[assigned_staff_id])
    department = relationship("Department", back_populates="complaints")
    updates = relationship("ComplaintUpdate", back_populates="complaint", order_by="ComplaintUpdate.created_at")
    messages = relationship("Message", back_populates="complaint", order_by="Message.created_at")
    rating = relationship("Rating", back_populates="complaint", uselist=False)

    def __repr__(self) -> str:
        return f"<Complaint {self.reference_no} ({self.status})>"
