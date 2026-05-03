import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.department import Department
from app.models.sla_policy import SLAPolicy
from app.schemas.department import (
    DepartmentCreateRequest, DepartmentUpdateRequest,
    DepartmentResponse, SLAPolicyRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/departments", tags=["Departments"])


@router.get("/")
async def list_departments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Department).order_by(Department.name))
    departments = result.scalars().all()
    return [{
        "id": str(d.id), "name": d.name, "description": d.description,
        "head_user_id": str(d.head_user_id) if d.head_user_id else None,
        "created_at": d.created_at.isoformat(),
    } for d in departments]


@router.post("/", status_code=201)
async def create_department(
    body: DepartmentCreateRequest,
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Department).where(Department.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Department name already exists")

    dept = Department(name=body.name, description=body.description, head_user_id=body.head_user_id)
    db.add(dept)
    await db.flush()
    return {"message": "Department created", "id": str(dept.id)}


@router.patch("/{dept_id}")
async def update_department(
    dept_id: str,
    body: DepartmentUpdateRequest,
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Department).where(Department.id == UUID(dept_id)))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    if body.name is not None:
        dept.name = body.name
    if body.description is not None:
        dept.description = body.description
    if body.head_user_id is not None:
        dept.head_user_id = body.head_user_id

    return {"message": "Department updated"}


@router.patch("/{dept_id}/sla-policy")
async def upsert_sla_policy(
    dept_id: str,
    body: SLAPolicyRequest,
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    did = UUID(dept_id)
    # Check department exists
    dept_r = await db.execute(select(Department).where(Department.id == did))
    if not dept_r.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Department not found")

    # Upsert
    result = await db.execute(
        select(SLAPolicy).where(SLAPolicy.department_id == did, SLAPolicy.priority == body.priority)
    )
    policy = result.scalar_one_or_none()

    if policy:
        policy.resolution_hours = body.resolution_hours
        policy.warning_threshold_pct = body.warning_threshold_pct
    else:
        policy = SLAPolicy(
            department_id=did, priority=body.priority,
            resolution_hours=body.resolution_hours,
            warning_threshold_pct=body.warning_threshold_pct,
        )
        db.add(policy)

    await db.flush()
    return {"message": "SLA policy updated"}
