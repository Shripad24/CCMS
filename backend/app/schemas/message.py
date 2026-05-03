from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: UUID
    complaint_id: UUID
    sender_id: UUID
    content: str
    is_read: bool
    created_at: datetime
    sender: "SenderBrief | None" = None

    model_config = {"from_attributes": True}


class SenderBrief(BaseModel):
    id: UUID
    full_name: str
    role: str

    model_config = {"from_attributes": True}


MessageResponse.model_rebuild()
