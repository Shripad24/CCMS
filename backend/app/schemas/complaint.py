from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from app.schemas.rating import RatingResponse


class ComplaintResponse(BaseModel):
    id: UUID
    reference_no: str
    student_id: UUID
    title: str
    description: str
    status: str
    category: str | None = None
    priority: str
    department_id: UUID | None = None
    assigned_staff_id: UUID | None = None
    ai_category: str | None = None
    ai_priority: str | None = None
    ai_department: str | None = None
    ai_reasoning: str | None = None
    ai_confidence: float | None = None
    sla_deadline: datetime | None = None
    sla_warning_sent: bool = False
    attachment_url: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    resolved_at: datetime | None = None
    student: "UserBrief | None" = None
    assigned_staff: "UserBrief | None" = None
    rating: "RatingResponse | None" = None

    model_config = {"from_attributes": True}


class UserBrief(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: str

    model_config = {"from_attributes": True}


class StatusUpdateRequest(BaseModel):
    new_status: str
    message: str | None = None


class AssignRequest(BaseModel):
    staff_id: UUID
    note: str | None = None


class RatingRequest(BaseModel):
    score: int
    feedback_text: str | None = None


class ComplaintUpdateResponse(BaseModel):
    id: UUID
    complaint_id: UUID
    author_id: UUID
    update_type: str
    previous_status: str | None = None
    new_status: str | None = None
    message: str | None = None
    attachment_url: str | None = None
    created_at: datetime
    author: UserBrief | None = None

    model_config = {"from_attributes": True}


# Update forward ref
ComplaintResponse.model_rebuild()
