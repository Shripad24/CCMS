import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Boolean, DateTime, Text, Enum as SAEnum, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    STAFF = "STAFF"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole, name="user_role_enum", create_constraint=True), nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_approved = Column(Boolean, default=True, server_default='true', nullable=False)  # Staff needs admin approval
    is_active = Column(Boolean, default=True, nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    profile_photo_url = Column(Text, nullable=True)
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

    # Relationships
    department = relationship("Department", back_populates="members", foreign_keys=[department_id])
    complaints_submitted = relationship("Complaint", back_populates="student", foreign_keys="Complaint.student_id")
    complaints_assigned = relationship("Complaint", back_populates="assigned_staff", foreign_keys="Complaint.assigned_staff_id")
    messages_sent = relationship("Message", back_populates="sender")
    notifications = relationship("Notification", back_populates="user")
    ratings_given = relationship("Rating", back_populates="student", foreign_keys="Rating.student_id")
    ratings_received = relationship("Rating", back_populates="staff", foreign_keys="Rating.staff_id")

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
