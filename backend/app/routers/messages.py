import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.complaint import Complaint
from app.models.message import Message
from app.schemas.message import MessageCreate
from app.services.notification_service import notify_new_message

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/complaints", tags=["Messages"])


@router.post("/{complaint_id}/messages")
async def send_message(
    complaint_id: str,
    body: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cid = UUID(complaint_id)
    result = await db.execute(select(Complaint).where(Complaint.id == cid))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Access check
    if current_user.role == UserRole.STUDENT and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == UserRole.STAFF and complaint.assigned_staff_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    msg = Message(complaint_id=cid, sender_id=current_user.id, content=body.content)
    db.add(msg)
    await db.flush()

    # Determine recipient
    if current_user.role == UserRole.STUDENT:
        recipient_id = complaint.assigned_staff_id
    else:
        recipient_id = complaint.student_id

    if recipient_id:
        try:
            await notify_new_message(db, complaint, current_user, recipient_id)
        except Exception as e:
            logger.error(f"Message notification error: {e}")

    return {
        "id": str(msg.id), "complaint_id": str(msg.complaint_id),
        "sender_id": str(msg.sender_id), "content": msg.content,
        "is_read": msg.is_read, "created_at": msg.created_at.isoformat(),
        "sender": {"id": str(current_user.id), "full_name": current_user.full_name, "role": current_user.role.value},
    }


@router.get("/{complaint_id}/messages")
async def get_messages(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cid = UUID(complaint_id)
    result = await db.execute(select(Complaint).where(Complaint.id == cid))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == UserRole.STUDENT and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == UserRole.STAFF and complaint.assigned_staff_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get messages
    msg_result = await db.execute(
        select(Message).where(Message.complaint_id == cid).order_by(Message.created_at)
    )
    messages = msg_result.scalars().all()

    # Mark unread messages for current user as read
    for m in messages:
        if m.sender_id != current_user.id and not m.is_read:
            m.is_read = True

    items = []
    for m in messages:
        sender_result = await db.execute(select(User).where(User.id == m.sender_id))
        sender = sender_result.scalar_one_or_none()
        items.append({
            "id": str(m.id), "complaint_id": str(m.complaint_id),
            "sender_id": str(m.sender_id), "content": m.content,
            "is_read": m.is_read, "created_at": m.created_at.isoformat(),
            "sender": {"id": str(sender.id), "full_name": sender.full_name, "role": sender.role.value} if sender else None,
        })

    return items
