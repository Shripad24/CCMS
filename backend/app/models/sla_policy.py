import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class SLAPolicy(Base):
    __tablename__ = "sla_policies"
    __table_args__ = (
        UniqueConstraint("department_id", "priority", name="uq_dept_priority"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    priority = Column(String(20), nullable=False)
    resolution_hours = Column(Integer, nullable=False)
    warning_threshold_pct = Column(Float, default=0.8, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    department = relationship("Department", back_populates="sla_policies")

    def __repr__(self) -> str:
        return f"<SLAPolicy {self.priority} - {self.resolution_hours}h>"
