from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class RatingResponse(BaseModel):
    id: UUID
    complaint_id: UUID
    student_id: UUID
    staff_id: UUID
    score: int
    feedback_text: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
