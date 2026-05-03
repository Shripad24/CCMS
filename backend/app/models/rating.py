import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, SmallInteger, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (
        CheckConstraint("score >= 1 AND score <= 5", name="check_score_range"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaints.id"), unique=True, nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    score = Column(SmallInteger, nullable=False)
    feedback_text = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    complaint = relationship("Complaint", back_populates="rating")
    student = relationship("User", foreign_keys=[student_id], back_populates="ratings_given")
    staff = relationship("User", foreign_keys=[staff_id], back_populates="ratings_received")

    def __repr__(self) -> str:
        return f"<Rating {self.score}/5 for complaint {self.complaint_id}>"
