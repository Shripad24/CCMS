import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.complaint import Complaint, ComplaintStatus, Priority
from app.models.complaint_update import ComplaintUpdate, UpdateType
from app.models.sla_policy import SLAPolicy

logger = logging.getLogger(__name__)

# Default SLA hours by priority
DEFAULT_SLA_HOURS: dict[str, int] = {
    "CRITICAL": 4,
    "HIGH": 24,
    "MEDIUM": 72,
    "LOW": 168,
}

PRIORITY_ESCALATION: dict[str, str] = {
    "LOW": "MEDIUM",
    "MEDIUM": "HIGH",
    "HIGH": "CRITICAL",
    "CRITICAL": "CRITICAL",
}


async def get_sla_hours(priority: str, department_id: UUID | None, db: AsyncSession) -> int:
    """
    Look up SLA hours for a given priority and department.
    Falls back to defaults if no policy exists.
    """
    if department_id:
        result = await db.execute(
            select(SLAPolicy).where(
                and_(
                    SLAPolicy.department_id == department_id,
                    SLAPolicy.priority == priority,
                )
            )
        )
        policy = result.scalar_one_or_none()
        if policy:
            return policy.resolution_hours

    return DEFAULT_SLA_HOURS.get(priority, 72)


async def calculate_sla_deadline(
    submitted_at: datetime,
    priority: str,
    department_id: UUID | None,
    db: AsyncSession,
) -> datetime:
    """Calculate the SLA deadline based on submission time and priority."""
    hours = await get_sla_hours(priority, department_id, db)
    return submitted_at + timedelta(hours=hours)


async def check_and_escalate_complaints(db: AsyncSession) -> None:
    """
    Called by scheduler every 15 minutes.
    Checks all active complaints for SLA warning/breach conditions.
    """
    from app.services.notification_service import (
        notify_sla_warning,
        notify_sla_breach,
    )

    logger.info("Running SLA compliance check...")

    active_statuses = [
        ComplaintStatus.SUBMITTED,
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.IN_PROGRESS,
    ]

    result = await db.execute(
        select(Complaint).where(
            Complaint.status.in_(active_statuses),
            Complaint.sla_deadline.isnot(None),
        )
    )
    complaints = result.scalars().all()

    now = datetime.now(timezone.utc)
    escalated_count = 0
    warned_count = 0

    for complaint in complaints:
        # Skip if SLA is paused (waiting for student info)
        if complaint.sla_paused_at is not None:
            continue

        # Calculate effective deadline including any paused duration
        paused_minutes = complaint.sla_paused_duration_minutes or 0
        effective_deadline = complaint.sla_deadline + timedelta(minutes=paused_minutes)

        # Calculate total SLA duration and elapsed
        sla_start = complaint.created_at
        total_duration = (effective_deadline - sla_start).total_seconds()
        elapsed = (now - sla_start).total_seconds()

        if total_duration <= 0:
            continue

        elapsed_pct = elapsed / total_duration

        # Check for 80% warning threshold
        if elapsed_pct >= 0.8 and not complaint.sla_warning_sent:
            complaint.sla_warning_sent = True
            warned_count += 1
            try:
                await notify_sla_warning(db, complaint)
            except Exception as e:
                logger.error(f"Failed to send SLA warning for {complaint.reference_no}: {e}")

        # Check for SLA breach
        if now > effective_deadline and complaint.status != ComplaintStatus.ESCALATED:
            previous_status = complaint.status.value
            complaint.status = ComplaintStatus.ESCALATED

            # Bump priority one level
            current_priority = complaint.priority.value if complaint.priority else "MEDIUM"
            new_priority = PRIORITY_ESCALATION.get(current_priority, "CRITICAL")
            complaint.priority = Priority(new_priority)

            # Create complaint update record
            update = ComplaintUpdate(
                complaint_id=complaint.id,
                author_id=complaint.student_id,  # System action, attributed to complaint owner
                update_type=UpdateType.SLA_BREACH,
                previous_status=previous_status,
                new_status=ComplaintStatus.ESCALATED.value,
                message=f"SLA breached. Complaint escalated from {previous_status} to ESCALATED. Priority bumped to {new_priority}.",
            )
            db.add(update)
            escalated_count += 1

            try:
                await notify_sla_breach(db, complaint)
            except Exception as e:
                logger.error(f"Failed to send SLA breach notification for {complaint.reference_no}: {e}")

    if escalated_count > 0 or warned_count > 0:
        await db.commit()
        logger.info(f"SLA check complete: {warned_count} warnings sent, {escalated_count} complaints escalated")
    else:
        logger.info("SLA check complete: no actions needed")
