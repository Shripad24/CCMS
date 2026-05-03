import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    head_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    head = relationship("User", foreign_keys=[head_user_id])
    members = relationship("User", back_populates="department", foreign_keys="User.department_id")
    complaints = relationship("Complaint", back_populates="department")
    sla_policies = relationship("SLAPolicy", back_populates="department")

    def __repr__(self) -> str:
        return f"<Department {self.name}>"
