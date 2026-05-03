import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.notification import Notification
from app.models.user import User, UserRole
from app.models.complaint import Complaint
from app.core.websocket_manager import manager

logger = logging.getLogger(__name__)


async def create_and_send_notification(
    db: AsyncSession,
    user_id: UUID,
    notif_type: str,
    message: str,
    complaint_id: UUID | None = None,
) -> None:
    """
    Create a notification in the DB and send it via WebSocket.
    """
    notification = Notification(
        user_id=user_id,
        type=notif_type,
        message=message,
        complaint_id=complaint_id,
    )
    db.add(notification)
    await db.flush()

    # Send via WebSocket
    ws_message = {
        "type": "notification",
        "data": {
            "id": str(notification.id),
            "notif_type": notif_type,
            "message": message,
            "complaint_id": str(complaint_id) if complaint_id else None,
            "is_read": False,
            "created_at": notification.created_at.isoformat(),
        },
    }
    await manager.send_to_user(str(user_id), ws_message)


async def _get_admin_user_ids(db: AsyncSession) -> list[UUID]:
    """Get all active admin user IDs."""
    result = await db.execute(
        select(User.id).where(
            User.role == UserRole.ADMIN,
            User.is_active == True,  # noqa: E712
        )
    )
    return [row[0] for row in result.fetchall()]


async def notify_complaint_submitted(db: AsyncSession, complaint: Complaint) -> None:
    """Notify all admins about a new complaint submission."""
    # Load student name
    result = await db.execute(select(User).where(User.id == complaint.student_id))
    student = result.scalar_one_or_none()
    student_name = student.full_name if student else "A student"

    admin_ids = await _get_admin_user_ids(db)
    for admin_id in admin_ids:
        await create_and_send_notification(
            db=db,
            user_id=admin_id,
            notif_type="NEW_COMPLAINT",
            message=f"New complaint {complaint.reference_no} submitted by {student_name}",
            complaint_id=complaint.id,
        )


async def notify_complaint_assigned(
    db: AsyncSession, complaint: Complaint, staff: User
) -> None:
    """Notify staff member about being assigned a complaint."""
    await create_and_send_notification(
        db=db,
        user_id=staff.id,
        notif_type="ASSIGNED",
        message=f"You have been assigned complaint {complaint.reference_no}: {complaint.title}",
        complaint_id=complaint.id,
    )


async def notify_status_changed(
    db: AsyncSession, complaint: Complaint, new_status: str
) -> None:
    """Notify the student that their complaint status has changed."""
    await create_and_send_notification(
        db=db,
        user_id=complaint.student_id,
        notif_type="STATUS_CHANGED",
        message=f"Your complaint {complaint.reference_no} status changed to {new_status}",
        complaint_id=complaint.id,
    )


async def notify_new_message(
    db: AsyncSession,
    complaint: Complaint,
    sender: User,
    recipient_id: UUID,
) -> None:
    """Notify a user that they have a new message on a complaint."""
    await create_and_send_notification(
        db=db,
        user_id=recipient_id,
        notif_type="NEW_MESSAGE",
        message=f"{sender.full_name} replied to complaint {complaint.reference_no}",
        complaint_id=complaint.id,
    )


async def notify_sla_warning(db: AsyncSession, complaint: Complaint) -> None:
    """Notify assigned staff and all admins about SLA warning."""
    admin_ids = await _get_admin_user_ids(db)

    msg = f"SLA warning: Complaint {complaint.reference_no} is approaching its deadline"

    # Notify assigned staff if exists
    if complaint.assigned_staff_id:
        await create_and_send_notification(
            db=db,
            user_id=complaint.assigned_staff_id,
            notif_type="SLA_WARNING",
            message=msg,
            complaint_id=complaint.id,
        )

    # Notify all admins
    for admin_id in admin_ids:
        await create_and_send_notification(
            db=db,
            user_id=admin_id,
            notif_type="SLA_WARNING",
            message=msg,
            complaint_id=complaint.id,
        )


async def notify_sla_breach(db: AsyncSession, complaint: Complaint) -> None:
    """Notify assigned staff and all admins about SLA breach/escalation."""
    admin_ids = await _get_admin_user_ids(db)

    msg = f"SLA BREACH: Complaint {complaint.reference_no} has been escalated"

    # Notify assigned staff if exists
    if complaint.assigned_staff_id:
        await create_and_send_notification(
            db=db,
            user_id=complaint.assigned_staff_id,
            notif_type="SLA_BREACH",
            message=msg,
            complaint_id=complaint.id,
        )

    # Notify all admins
    for admin_id in admin_ids:
        await create_and_send_notification(
            db=db,
            user_id=admin_id,
            notif_type="SLA_BREACH",
            message=msg,
            complaint_id=complaint.id,
        )


async def notify_resolved(db: AsyncSession, complaint: Complaint) -> None:
    """Notify the student that their complaint has been resolved."""
    await create_and_send_notification(
        db=db,
        user_id=complaint.student_id,
        notif_type="RESOLVED",
        message=f"Your complaint {complaint.reference_no} has been resolved. Please rate your experience.",
        complaint_id=complaint.id,
    )
