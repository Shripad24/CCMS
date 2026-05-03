import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from uuid import UUID

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.notification import Notification

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


@router.get("/")
async def get_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)  # noqa: E712

    # Count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Unread count (always)
    unread_q = await db.execute(
        select(func.count(Notification.id)).where(
            and_(Notification.user_id == current_user.id, Notification.is_read == False)  # noqa: E712
        )
    )
    unread_count = unread_q.scalar() or 0

    # Paginate
    query = query.order_by(Notification.created_at.desc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    notifications = result.scalars().all()

    items = [{
        "id": str(n.id), "user_id": str(n.user_id), "type": n.type,
        "message": n.message, "complaint_id": str(n.complaint_id) if n.complaint_id else None,
        "is_read": n.is_read, "created_at": n.created_at.isoformat(),
    } for n in notifications]

    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0

    return {
        "items": items, "total": total, "page": page,
        "page_size": page_size, "total_pages": total_pages,
        "unread_count": unread_count,
    }


@router.patch("/{notif_id}/read")
async def mark_as_read(
    notif_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(
            and_(Notification.id == UUID(notif_id), Notification.user_id == current_user.id)
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    return {"message": "Marked as read"}


@router.patch("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(
            and_(Notification.user_id == current_user.id, Notification.is_read == False)  # noqa: E712
        )
    )
    notifications = result.scalars().all()
    for n in notifications:
        n.is_read = True
    return {"message": f"Marked {len(notifications)} notifications as read"}
