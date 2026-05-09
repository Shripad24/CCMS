import logging
from datetime import datetime, timedelta, timezone, date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case

from app.database import get_db
from app.core.dependencies import require_role
from app.core.security import hash_password, create_password_reset_token
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus, Priority
from app.models.rating import Rating
from app.models.department import Department
from app.schemas.user import UserCreateRequest, UserUpdateRequest, UserResponse
from app.services.report_service import generate_analytics_report
from app.services.email_service import send_password_reset_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


@router.get("/users")
async def list_users(
    search: str | None = None,
    role: str | None = None,
    is_approved: bool | None = None,
    is_active: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    if search:
        query = query.where(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    if role:
        query = query.where(User.role == role)
    if is_approved is not None:
        query = query.where(User.is_approved == is_approved)
    if is_active is not None:
        query = query.where(User.is_active == is_active)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()

    items = [{
        "id": str(u.id), "full_name": u.full_name, "email": u.email,
        "role": u.role.value, "department_id": str(u.department_id) if u.department_id else None,
        "is_active": u.is_active, "is_verified": u.is_verified, "is_approved": u.is_approved,
        "created_at": u.created_at.isoformat(),
    } for u in users]

    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": (total + page_size - 1) // page_size}


@router.post("/users", status_code=201)
async def create_user(
    body: UserCreateRequest,
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        full_name=body.full_name, email=body.email,
        password_hash=hash_password(body.password),
        role=body.role, is_verified=True,
        department_id=body.department_id,
    )
    db.add(user)
    await db.flush()
    return {"message": "User created", "user_id": str(user.id)}


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    body: UserUpdateRequest,
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.role is not None:
        user.role = body.role
    if body.department_id is not None:
        user.department_id = body.department_id
    if body.is_active is not None:
        user.is_active = body.is_active

    return {"message": "User updated"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    await db.commit()
    return {"message": "User deactivated"}


@router.post("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    await db.commit()
    return {"message": "User activated"}


@router.delete("/users/{user_id}/deny")
async def deny_user(
    user_id: str,
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_approved:
        raise HTTPException(status_code=400, detail="Cannot deny an already approved user")
        
    await db.delete(user)
    await db.commit()
    return {"message": "User registration denied and removed"}


@router.post("/users/{user_id}/approve")
async def approve_user(
    user_id: str,
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_approved:
        return {"message": "User is already approved"}
        
    user.is_approved = True
    await db.commit()
    return {"message": "User approved successfully"}


@router.post("/users/{user_id}/reset-password")
async def admin_reset_password(
    user_id: str,
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    token = create_password_reset_token(str(user.id))
    await send_password_reset_email(user.email, user.full_name, token)
    return {"message": "Password reset email sent"}


@router.get("/analytics")
async def get_analytics(
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Total complaints
    total_q = await db.execute(select(func.count(Complaint.id)))
    total = total_q.scalar() or 0

    # This month
    month_q = await db.execute(select(func.count(Complaint.id)).where(Complaint.created_at >= month_start))
    this_month = month_q.scalar() or 0

    # By status
    by_status = {}
    for s in ComplaintStatus:
        q = await db.execute(select(func.count(Complaint.id)).where(Complaint.status == s))
        cnt = q.scalar() or 0
        by_status[s.value] = cnt

    # By category
    cat_q = await db.execute(select(Complaint.category, func.count(Complaint.id)).group_by(Complaint.category))
    by_category = {row[0] or "OTHER": row[1] for row in cat_q.fetchall()}

    # By priority
    by_priority = {}
    for p in Priority:
        q = await db.execute(select(func.count(Complaint.id)).where(Complaint.priority == p))
        by_priority[p.value] = q.scalar() or 0

    # Avg resolution hours
    avg_q = await db.execute(
        select(func.avg(func.extract("epoch", Complaint.resolved_at - Complaint.created_at) / 3600))
        .where(Complaint.resolved_at.isnot(None))
    )
    avg_hours = avg_q.scalar() or 0.0

    # SLA compliance
    resolved_count = by_status.get("RESOLVED", 0) + by_status.get("CLOSED", 0)
    escalated_count = by_status.get("ESCALATED", 0)
    sla_rate = ((total - escalated_count) / total * 100) if total > 0 else 100.0

    # AI acceptance rate
    ai_q = await db.execute(select(func.count(Complaint.id)).where(Complaint.ai_category.isnot(None)))
    ai_total = ai_q.scalar() or 0
    ai_accepted = await db.execute(
        select(func.count(Complaint.id)).where(
            and_(Complaint.ai_category.isnot(None), Complaint.category == Complaint.ai_category)
        )
    )
    ai_accepted_count = ai_accepted.scalar() or 0
    ai_acceptance_rate = (ai_accepted_count / ai_total * 100) if ai_total > 0 else 0.0

    # Submission trend (last 30 days)
    trend = []
    for i in range(29, -1, -1):
        d = (now - timedelta(days=i)).date()
        dt_start = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
        dt_end = dt_start + timedelta(days=1)
        q = await db.execute(
            select(func.count(Complaint.id)).where(and_(Complaint.created_at >= dt_start, Complaint.created_at < dt_end))
        )
        trend.append({"date": d.isoformat(), "count": q.scalar() or 0})

    # Department performance
    dept_q = await db.execute(select(Department))
    departments = dept_q.scalars().all()
    dept_perf = []
    for dept in departments:
        d_total = await db.execute(select(func.count(Complaint.id)).where(Complaint.department_id == dept.id))
        d_avg = await db.execute(
            select(func.avg(func.extract("epoch", Complaint.resolved_at - Complaint.created_at) / 3600))
            .where(and_(Complaint.department_id == dept.id, Complaint.resolved_at.isnot(None)))
        )
        d_esc = await db.execute(select(func.count(Complaint.id)).where(and_(Complaint.department_id == dept.id, Complaint.status == ComplaintStatus.ESCALATED)))
        d_t = d_total.scalar() or 0
        d_e = d_esc.scalar() or 0
        dept_perf.append({
            "name": dept.name, "avg_hours": round(d_avg.scalar() or 0, 1),
            "sla_rate": round(((d_t - d_e) / d_t * 100) if d_t > 0 else 100, 1),
        })

    # Staff leaderboard
    staff_q = await db.execute(
        select(User.full_name, func.count(Complaint.id), func.avg(Rating.score),
               func.avg(func.extract("epoch", Complaint.resolved_at - Complaint.created_at) / 3600))
        .join(Complaint, Complaint.assigned_staff_id == User.id)
        .outerjoin(Rating, Rating.staff_id == User.id)
        .where(User.role == UserRole.STAFF)
        .group_by(User.id, User.full_name)
        .order_by(func.count(Complaint.id).desc()).limit(10)
    )
    leaderboard = [{
        "name": row[0], "resolved": row[1],
        "avg_rating": round(row[2], 1) if row[2] else 0,
        "avg_hours": round(row[3], 1) if row[3] else 0,
    } for row in staff_q.fetchall()]

    return {
        "total_complaints": total, "complaints_this_month": this_month,
        "by_status": by_status, "by_category": by_category, "by_priority": by_priority,
        "avg_resolution_hours": round(float(avg_hours), 1),
        "sla_compliance_rate": round(sla_rate, 1),
        "ai_acceptance_rate": round(ai_acceptance_rate, 1),
        "submission_trend": trend,
        "department_performance": dept_perf,
        "staff_leaderboard": leaderboard,
    }


@router.post("/reports/generate")
async def generate_report(
    start_date: str = Query(...),
    end_date: str = Query(...),
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    try:
        s_date = date.fromisoformat(start_date)
        e_date = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    pdf_bytes = await generate_analytics_report(db, s_date, e_date)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ccms_report_{start_date}_{end_date}.pdf"},
    )


@router.get("/sla/escalated")
async def get_escalated(
    current_user: User = Depends(require_role("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint).where(Complaint.status == ComplaintStatus.ESCALATED).order_by(Complaint.sla_deadline.asc())
    )
    complaints = result.scalars().all()

    items = []
    for c in complaints:
        student_r = await db.execute(select(User).where(User.id == c.student_id))
        student = student_r.scalar_one_or_none()
        staff = None
        if c.assigned_staff_id:
            staff_r = await db.execute(select(User).where(User.id == c.assigned_staff_id))
            staff = staff_r.scalar_one_or_none()

        items.append({
            "id": str(c.id), "reference_no": c.reference_no, "title": c.title,
            "status": c.status.value, "priority": c.priority.value,
            "sla_deadline": c.sla_deadline.isoformat() if c.sla_deadline else None,
            "created_at": c.created_at.isoformat(),
            "student": {"id": str(student.id), "full_name": student.full_name} if student else None,
            "assigned_staff": {"id": str(staff.id), "full_name": staff.full_name} if staff else None,
        })

    return items
