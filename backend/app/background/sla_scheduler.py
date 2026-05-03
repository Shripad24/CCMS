import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def run_sla_check() -> None:
    """Execute SLA compliance check with a fresh DB session."""
    from app.services.sla_service import check_and_escalate_complaints

    logger.info("Scheduler: Starting SLA check...")
    try:
        async with AsyncSessionLocal() as session:
            try:
                await check_and_escalate_complaints(session)
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.error(f"SLA check failed: {e}")
            finally:
                await session.close()
    except Exception as e:
        logger.error(f"SLA check session error: {e}")


def start_scheduler() -> None:
    """Start the background scheduler with SLA check job."""
    scheduler.add_job(
        run_sla_check,
        trigger=IntervalTrigger(minutes=15),
        id="sla_check",
        replace_existing=True,
        coalesce=True,
    )
    scheduler.start()
    logger.info("Background scheduler started. SLA check runs every 15 minutes.")
