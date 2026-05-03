import io
import logging
from datetime import date, datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case

from app.models.complaint import Complaint, ComplaintStatus
from app.models.rating import Rating
from app.models.user import User, UserRole
from app.models.department import Department

logger = logging.getLogger(__name__)


async def generate_analytics_report(db: AsyncSession, start_date: date, end_date: date) -> bytes:
    """Generate a PDF analytics report for the given date range."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5 * inch, bottomMargin=0.5 * inch)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("CustomTitle", parent=styles["Title"], fontSize=22, textColor=colors.HexColor("#3B82F6"))
    heading_style = ParagraphStyle("CustomHeading", parent=styles["Heading2"], fontSize=14, textColor=colors.HexColor("#1E293B"), spaceAfter=10)
    elements = []

    end_dt = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59, tzinfo=timezone.utc)
    start_dt = datetime(start_date.year, start_date.month, start_date.day, tzinfo=timezone.utc)

    # Cover page
    elements.append(Spacer(1, 2 * inch))
    elements.append(Paragraph("CCMS Analytics Report", title_style))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"Period: {start_date.isoformat()} to {end_date.isoformat()}", styles["Normal"]))
    elements.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]))
    elements.append(Spacer(1, inch))

    # Total complaints
    total_q = await db.execute(select(func.count(Complaint.id)).where(and_(Complaint.created_at >= start_dt, Complaint.created_at <= end_dt)))
    total = total_q.scalar() or 0
    elements.append(Paragraph(f"Total Complaints: {total}", heading_style))
    elements.append(Spacer(1, 10))

    # By status
    elements.append(Paragraph("Complaints by Status", heading_style))
    status_data = [["Status", "Count"]]
    for s in ComplaintStatus:
        q = await db.execute(select(func.count(Complaint.id)).where(and_(Complaint.status == s, Complaint.created_at >= start_dt, Complaint.created_at <= end_dt)))
        cnt = q.scalar() or 0
        if cnt > 0:
            status_data.append([s.value, str(cnt)])
    if len(status_data) > 1:
        t = Table(status_data, colWidths=[3 * inch, 2 * inch])
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3B82F6")), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), 0.5, colors.grey), ("FONTSIZE", (0, 0), (-1, -1), 10)]))
        elements.append(t)
    elements.append(Spacer(1, 15))

    # By category
    elements.append(Paragraph("Complaints by Category", heading_style))
    cat_q = await db.execute(select(Complaint.category, func.count(Complaint.id)).where(and_(Complaint.created_at >= start_dt, Complaint.created_at <= end_dt)).group_by(Complaint.category))
    cat_data = [["Category", "Count"]]
    for row in cat_q.fetchall():
        cat_data.append([row[0] or "Uncategorized", str(row[1])])
    if len(cat_data) > 1:
        t = Table(cat_data, colWidths=[3 * inch, 2 * inch])
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3B82F6")), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), 0.5, colors.grey), ("FONTSIZE", (0, 0), (-1, -1), 10)]))
        elements.append(t)
    elements.append(Spacer(1, 15))

    # Avg resolution time
    elements.append(Paragraph("Average Resolution Time", heading_style))
    res_q = await db.execute(select(func.avg(func.extract("epoch", Complaint.resolved_at - Complaint.created_at) / 3600)).where(and_(Complaint.resolved_at.isnot(None), Complaint.created_at >= start_dt, Complaint.created_at <= end_dt)))
    avg_hours = res_q.scalar()
    elements.append(Paragraph(f"Average: {avg_hours:.1f} hours" if avg_hours else "No resolved complaints in period", styles["Normal"]))
    elements.append(Spacer(1, 15))

    # SLA compliance
    elements.append(Paragraph("SLA Compliance", heading_style))
    resolved_q = await db.execute(select(func.count(Complaint.id)).where(and_(Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]), Complaint.created_at >= start_dt, Complaint.created_at <= end_dt)))
    resolved_total = resolved_q.scalar() or 0
    escalated_q = await db.execute(select(func.count(Complaint.id)).where(and_(Complaint.status == ComplaintStatus.ESCALATED, Complaint.created_at >= start_dt, Complaint.created_at <= end_dt)))
    escalated_total = escalated_q.scalar() or 0
    if total > 0:
        sla_rate = ((total - escalated_total) / total) * 100
        elements.append(Paragraph(f"Compliance Rate: {sla_rate:.1f}%", styles["Normal"]))
    elements.append(Spacer(1, 15))

    # Staff leaderboard
    elements.append(Paragraph("Staff Performance", heading_style))
    staff_q = await db.execute(
        select(User.full_name, func.count(Complaint.id), func.avg(Rating.score))
        .join(Complaint, Complaint.assigned_staff_id == User.id)
        .outerjoin(Rating, Rating.staff_id == User.id)
        .where(and_(User.role == UserRole.STAFF, Complaint.created_at >= start_dt, Complaint.created_at <= end_dt))
        .group_by(User.id, User.full_name)
        .order_by(func.count(Complaint.id).desc())
        .limit(5)
    )
    staff_data = [["Staff Name", "Resolved", "Avg Rating"]]
    for row in staff_q.fetchall():
        staff_data.append([row[0], str(row[1]), f"{row[2]:.1f}" if row[2] else "N/A"])
    if len(staff_data) > 1:
        t = Table(staff_data, colWidths=[2.5 * inch, 1.5 * inch, 1.5 * inch])
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3B82F6")), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), 0.5, colors.grey), ("FONTSIZE", (0, 0), (-1, -1), 10)]))
        elements.append(t)

    doc.build(elements)
    return buffer.getvalue()
