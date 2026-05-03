import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.models.complaint import Complaint, ComplaintStatus, Priority
from app.models.complaint_update import ComplaintUpdate, UpdateType
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)

# Legal status transitions
VALID_TRANSITIONS: dict[str, list[str]] = {
    "SUBMITTED": ["ASSIGNED", "REJECTED"],
    "ASSIGNED": ["IN_PROGRESS", "PENDING_INFO", "REJECTED"],
    "IN_PROGRESS": ["PENDING_INFO", "RESOLVED", "ESCALATED"],
    "PENDING_INFO": ["IN_PROGRESS", "RESOLVED"],
    "ESCALATED": ["IN_PROGRESS", "ASSIGNED", "RESOLVED"],
    "RESOLVED": ["CLOSED"],
    "CLOSED": [],
    "REJECTED": [],
}


def validate_status_transition(current: str, new: str) -> bool:
    """Check if a status transition is legal."""
    allowed = VALID_TRANSITIONS.get(current, [])
    return new in allowed


async def generate_reference_number(db: AsyncSession) -> str:
    """Generate a unique complaint reference number: CCMS-{YEAR}-{NNNN}."""
    year = datetime.now(timezone.utc).year
    prefix = f"CCMS-{year}-"
    result = await db.execute(
        select(func.count(Complaint.id)).where(
            Complaint.reference_no.like(f"{prefix}%")
        )
    )
    count = (result.scalar() or 0) + 1
    return f"{prefix}{count:04d}"


async def get_complaints_paginated(
    db: AsyncSession,
    user: User,
    status: str | None = None,
    priority: str | None = None,
    category: str | None = None,
    department_id: UUID | None = None,
    assigned_staff_id: UUID | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 10,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> dict:
    """Get paginated complaints filtered by role and query params."""
    query = select(Complaint)

    # Role-based filtering
    if user.role == UserRole.STUDENT:
        query = query.where(Complaint.student_id == user.id)
    elif user.role == UserRole.STAFF:
        query = query.where(Complaint.assigned_staff_id == user.id)
    # ADMIN sees all

    # Apply filters
    if status:
        statuses = [s.strip() for s in status.split(",")]
        query = query.where(Complaint.status.in_(statuses))
    if priority:
        query = query.where(Complaint.priority == priority)
    if category:
        query = query.where(Complaint.category == category)
    if department_id:
        query = query.where(Complaint.department_id == department_id)
    if assigned_staff_id:
        query = query.where(Complaint.assigned_staff_id == assigned_staff_id)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Complaint.title.ilike(search_term),
                Complaint.description.ilike(search_term),
                Complaint.reference_no.ilike(search_term),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Sort
    sort_col = getattr(Complaint, sort_by, Complaint.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    items = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
