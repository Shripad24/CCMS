from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    message: str
    complaint_id: UUID | None = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
