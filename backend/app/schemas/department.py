from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class DepartmentResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    head_user_id: UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DepartmentCreateRequest(BaseModel):
    name: str
    description: str | None = None
    head_user_id: UUID | None = None


class DepartmentUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    head_user_id: UUID | None = None


class SLAPolicyRequest(BaseModel):
    priority: str
    resolution_hours: int
    warning_threshold_pct: float = 0.8
