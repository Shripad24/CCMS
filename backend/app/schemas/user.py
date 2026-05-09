from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: str
    department_id: UUID | None = None
    profile_photo_url: str | None = None
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreateRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str
    department_id: UUID | None = None


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    role: str | None = None
    department_id: UUID | None = None
    is_active: bool | None = None

class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    profile_photo_url: str | None = None
    current_password: str | None = None
    new_password: str | None = None
