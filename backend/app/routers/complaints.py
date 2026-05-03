import os
import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus, Priority
from app.models.complaint_update import ComplaintUpdate, UpdateType
from app.models.rating import Rating
from app.schemas.complaint import (
    ComplaintResponse, StatusUpdateRequest, AssignRequest, RatingRequest, ComplaintUpdateResponse,
)
from app.services.complaint_service import (
    generate_reference_number, get_complaints_paginated, validate_status_transition,
)
from app.services.ai_service import classify_complaint
from app.services.sla_service import calculate_sla_deadline
from app.services.notification_service import (
    notify_complaint_submitted, notify_complaint_assigned,
    notify_status_changed, notify_resolved,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/complaints", tags=["Complaints"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_complaint(
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile | None = File(None),
    current_user: User = Depends(require_role("STUDENT")),
    db: AsyncSession = Depends(get_db),
):
    # AI classification
    ai_result = await classify_complaint(title, description)

    ref_no = await generate_reference_number(db)
    now = datetime.now(timezone.utc)

    # Map AI suggested department to actual department
    from app.models.department import Department
    dept_result = await db.execute(select(Department).where(Department.name.ilike(f"%{ai_result.get('suggested_department', '')}%")))
    dept = dept_result.scalar_one_or_none()

    ai_priority = ai_result.get("priority", "MEDIUM")
    priority_enum = Priority(ai_priority) if ai_priority in [p.value for p in Priority] else Priority.MEDIUM

    sla_deadline = await calculate_sla_deadline(now, priority_enum.value, dept.id if dept else None, db)

    # Save file
    attachment_url = None
    if file and file.filename:
        ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")
        with open(filepath, "wb") as f:
            f.write(content)
        attachment_url = f"/uploads/{filename}"

    complaint = Complaint(
        reference_no=ref_no,
        student_id=current_user.id,
        title=title,
        description=description,
        status=ComplaintStatus.SUBMITTED,
        category=ai_result.get("category", "OTHER"),
        priority=priority_enum,
        department_id=dept.id if dept else None,
        ai_category=ai_result.get("category"),
        ai_priority=ai_result.get("priority"),
        ai_department=ai_result.get("suggested_department"),
        ai_reasoning=ai_result.get("reasoning"),
        ai_confidence=ai_result.get("confidence_score"),
        sla_deadline=sla_deadline,
        attachment_url=attachment_url,
    )
    db.add(complaint)
    await db.flush()

    # Create initial update
    update = ComplaintUpdate(
        complaint_id=complaint.id,
        author_id=current_user.id,
        update_type=UpdateType.STATUS_CHANGE,
        new_status=ComplaintStatus.SUBMITTED.value,
        message=f"Complaint submitted. AI classified as {ai_result.get('category')} with {ai_result.get('priority')} priority.",
    )
    db.add(update)

    try:
        await notify_complaint_submitted(db, complaint)
    except Exception as e:
        logger.error(f"Notification error: {e}")

    return {
        "id": str(complaint.id),
        "reference_no": complaint.reference_no,
        "title": complaint.title,
        "description": complaint.description,
        "status": complaint.status.value,
        "category": complaint.category,
        "priority": complaint.priority.value,
        "ai_category": complaint.ai_category,
        "ai_priority": complaint.ai_priority,
        "ai_department": complaint.ai_department,
        "ai_reasoning": complaint.ai_reasoning,
        "ai_confidence": complaint.ai_confidence,
        "sla_deadline": complaint.sla_deadline.isoformat() if complaint.sla_deadline else None,
        "attachment_url": complaint.attachment_url,
        "created_at": complaint.created_at.isoformat(),
    }


@router.get("/")
async def list_complaints(
    status_filter: str | None = Query(None, alias="status"),
    priority: str | None = None,
    category: str | None = None,
    department_id: str | None = None,
    assigned_staff_id: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID as PyUUID
    dept_id = PyUUID(department_id) if department_id else None
    staff_id = PyUUID(assigned_staff_id) if assigned_staff_id else None

    result = await get_complaints_paginated(
        db, current_user, status=status_filter, priority=priority,
        category=category, department_id=dept_id, assigned_staff_id=staff_id,
        search=search, page=page, page_size=page_size,
        sort_by=sort_by, sort_order=sort_order,
    )

    items = []
    for c in result["items"]:
        # Eagerly load related user data
        student_result = await db.execute(select(User).where(User.id == c.student_id))
        student = student_result.scalar_one_or_none()
        staff = None
        if c.assigned_staff_id:
            staff_result = await db.execute(select(User).where(User.id == c.assigned_staff_id))
            staff = staff_result.scalar_one_or_none()

        items.append({
            "id": str(c.id), "reference_no": c.reference_no, "title": c.title,
            "description": c.description, "status": c.status.value,
            "category": c.category, "priority": c.priority.value,
            "department_id": str(c.department_id) if c.department_id else None,
            "assigned_staff_id": str(c.assigned_staff_id) if c.assigned_staff_id else None,
            "ai_category": c.ai_category, "ai_priority": c.ai_priority,
            "ai_department": c.ai_department, "ai_reasoning": c.ai_reasoning,
            "ai_confidence": c.ai_confidence,
            "sla_deadline": c.sla_deadline.isoformat() if c.sla_deadline else None,
            "sla_warning_sent": c.sla_warning_sent,
            "attachment_url": c.attachment_url,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            "resolved_at": c.resolved_at.isoformat() if c.resolved_at else None,
            "student": {"id": str(student.id), "full_name": student.full_name, "email": student.email, "role": student.role.value} if student else None,
            "assigned_staff": {"id": str(staff.id), "full_name": staff.full_name, "email": staff.email, "role": staff.role.value} if staff else None,
        })

    return {
        "items": items, "total": result["total"],
        "page": result["page"], "page_size": result["page_size"],
        "total_pages": result["total_pages"],
    }


@router.get("/{complaint_id}")
async def get_complaint(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID as PyUUID
    result = await db.execute(select(Complaint).where(Complaint.id == PyUUID(complaint_id)))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Ownership check
    if current_user.role == UserRole.STUDENT and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == UserRole.STAFF and complaint.assigned_staff_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    student_result = await db.execute(select(User).where(User.id == complaint.student_id))
    student = student_result.scalar_one_or_none()
    staff = None
    if complaint.assigned_staff_id:
        staff_result = await db.execute(select(User).where(User.id == complaint.assigned_staff_id))
        staff = staff_result.scalar_one_or_none()

    return {
        "id": str(complaint.id), "reference_no": complaint.reference_no,
        "student_id": str(complaint.student_id), "title": complaint.title,
        "description": complaint.description, "status": complaint.status.value,
        "category": complaint.category, "priority": complaint.priority.value,
        "department_id": str(complaint.department_id) if complaint.department_id else None,
        "assigned_staff_id": str(complaint.assigned_staff_id) if complaint.assigned_staff_id else None,
        "ai_category": complaint.ai_category, "ai_priority": complaint.ai_priority,
        "ai_department": complaint.ai_department, "ai_reasoning": complaint.ai_reasoning,
        "ai_confidence": complaint.ai_confidence,
        "sla_deadline": complaint.sla_deadline.isoformat() if complaint.sla_deadline else None,
        "sla_warning_sent": complaint.sla_warning_sent,
        "attachment_url": complaint.attachment_url,
        "created_at": complaint.created_at.isoformat(),
        "updated_at": complaint.updated_at.isoformat() if complaint.updated_at else None,
        "resolved_at": complaint.resolved_at.isoformat() if complaint.resolved_at else None,
        "student": {"id": str(student.id), "full_name": student.full_name, "email": student.email, "role": student.role.value} if student else None,
        "assigned_staff": {"id": str(staff.id), "full_name": staff.full_name, "email": staff.email, "role": staff.role.value} if staff else None,
    }


@router.patch("/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: str,
    body: StatusUpdateRequest,
    current_user: User = Depends(require_role("STAFF", "ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID as PyUUID
    result = await db.execute(select(Complaint).where(Complaint.id == PyUUID(complaint_id)))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    current_status = complaint.status.value
    if not validate_status_transition(current_status, body.new_status):
        raise HTTPException(status_code=400, detail=f"Cannot transition from {current_status} to {body.new_status}")

    # Handle SLA pause/resume
    now = datetime.now(timezone.utc)
    if body.new_status == "PENDING_INFO":
        complaint.sla_paused_at = now
    elif current_status == "PENDING_INFO" and complaint.sla_paused_at:
        paused_delta = (now - complaint.sla_paused_at).total_seconds() / 60
        complaint.sla_paused_duration_minutes = (complaint.sla_paused_duration_minutes or 0) + int(paused_delta)
        complaint.sla_paused_at = None

    complaint.status = ComplaintStatus(body.new_status)
    complaint.updated_at = now

    if body.new_status == "RESOLVED":
        complaint.resolved_at = now

    update = ComplaintUpdate(
        complaint_id=complaint.id, author_id=current_user.id,
        update_type=UpdateType.STATUS_CHANGE,
        previous_status=current_status, new_status=body.new_status,
        message=body.message,
    )
    db.add(update)

    try:
        await notify_status_changed(db, complaint, body.new_status)
        if body.new_status == "RESOLVED":
            await notify_resolved(db, complaint)
    except Exception as e:
        logger.error(f"Notification error: {e}")

    return {"message": "Status updated", "new_status": body.new_status}


@router.patch("/{complaint_id}/assign")
async def assign_complaint(
    complaint_id: str,
    body: AssignRequest,
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID as PyUUID
    result = await db.execute(select(Complaint).where(Complaint.id == PyUUID(complaint_id)))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    staff_result = await db.execute(select(User).where(User.id == body.staff_id, User.role == UserRole.STAFF))
    staff = staff_result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    previous_status = complaint.status.value
    complaint.assigned_staff_id = staff.id
    complaint.status = ComplaintStatus.ASSIGNED
    complaint.updated_at = datetime.now(timezone.utc)

    update = ComplaintUpdate(
        complaint_id=complaint.id, author_id=current_user.id,
        update_type=UpdateType.ASSIGNMENT,
        previous_status=previous_status, new_status="ASSIGNED",
        message=body.note or f"Assigned to {staff.full_name}",
    )
    db.add(update)

    try:
        await notify_complaint_assigned(db, complaint, staff)
    except Exception as e:
        logger.error(f"Notification error: {e}")

    return {"message": f"Complaint assigned to {staff.full_name}"}


@router.get("/{complaint_id}/updates")
async def get_complaint_updates(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID as PyUUID
    cid = PyUUID(complaint_id)

    # Check access
    c_result = await db.execute(select(Complaint).where(Complaint.id == cid))
    complaint = c_result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if current_user.role == UserRole.STUDENT and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(ComplaintUpdate).where(ComplaintUpdate.complaint_id == cid).order_by(ComplaintUpdate.created_at)
    )
    updates = result.scalars().all()

    items = []
    for u in updates:
        author_result = await db.execute(select(User).where(User.id == u.author_id))
        author = author_result.scalar_one_or_none()
        items.append({
            "id": str(u.id), "complaint_id": str(u.complaint_id),
            "author_id": str(u.author_id), "update_type": u.update_type.value,
            "previous_status": u.previous_status, "new_status": u.new_status,
            "message": u.message, "attachment_url": u.attachment_url,
            "created_at": u.created_at.isoformat(),
            "author": {"id": str(author.id), "full_name": author.full_name, "email": author.email, "role": author.role.value} if author else None,
        })
    return items


@router.post("/{complaint_id}/rating")
async def submit_rating(
    complaint_id: str,
    body: RatingRequest,
    current_user: User = Depends(require_role("STUDENT")),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID as PyUUID
    cid = PyUUID(complaint_id)
    result = await db.execute(select(Complaint).where(Complaint.id == cid))
    complaint = result.scalar_one_or_none()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your complaint")
    if complaint.status != ComplaintStatus.RESOLVED:
        raise HTTPException(status_code=400, detail="Can only rate resolved complaints")
    if not complaint.assigned_staff_id:
        raise HTTPException(status_code=400, detail="No staff assigned to rate")

    # Check existing rating
    existing = await db.execute(select(Rating).where(Rating.complaint_id == cid))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already rated")

    if body.score < 1 or body.score > 5:
        raise HTTPException(status_code=400, detail="Score must be 1-5")

    rating = Rating(
        complaint_id=cid, student_id=current_user.id,
        staff_id=complaint.assigned_staff_id,
        score=body.score, feedback_text=body.feedback_text,
    )
    db.add(rating)
    complaint.status = ComplaintStatus.CLOSED
    complaint.updated_at = datetime.now(timezone.utc)

    update = ComplaintUpdate(
        complaint_id=cid, author_id=current_user.id,
        update_type=UpdateType.STATUS_CHANGE,
        previous_status="RESOLVED", new_status="CLOSED",
        message=f"Rated {body.score}/5. {body.feedback_text or ''}".strip(),
    )
    db.add(update)

    return {"message": "Rating submitted", "rating_id": str(rating.id)}
