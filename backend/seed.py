"""
Seed script for CCMS database.
Creates departments, users, SLA policies, and sample complaints.
Run: python seed.py
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import AsyncSessionLocal, init_db
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.complaint import Complaint, ComplaintStatus, Priority
from app.models.complaint_update import ComplaintUpdate, UpdateType
from app.models.sla_policy import SLAPolicy
from app.core.security import hash_password


async def seed():
    print("Initializing database tables...")
    await init_db()

    async with AsyncSessionLocal() as db:
        try:
            # Check if already seeded
            result = await db.execute(select(User).limit(1))
            if result.scalar_one_or_none():
                print("Database already seeded. Skipping.")
                return

            print("Creating departments...")
            dept_it = Department(name="IT Services", description="Information Technology support and services")
            dept_academic = Department(name="Academic Affairs", description="Academic programs, curriculum, and faculty matters")
            dept_infra = Department(name="Infrastructure & Facilities", description="Campus infrastructure, buildings, and maintenance")
            db.add_all([dept_it, dept_academic, dept_infra])
            await db.flush()

            print("Creating admin user...")
            admin = User(
                full_name="System Admin", email="admin@university.edu.in",
                password_hash=hash_password("Admin@123"),
                role=UserRole.ADMIN, is_verified=True, is_active=True,
            )
            db.add(admin)
            await db.flush()

            print("Creating staff users...")
            staff1 = User(
                full_name="Rajesh Kumar", email="rajesh@university.edu.in",
                password_hash=hash_password("Staff@123"),
                role=UserRole.STAFF, is_verified=True, is_active=True,
                department_id=dept_it.id,
            )
            staff2 = User(
                full_name="Priya Sharma", email="priya@university.edu.in",
                password_hash=hash_password("Staff@123"),
                role=UserRole.STAFF, is_verified=True, is_active=True,
                department_id=dept_academic.id,
            )
            staff3 = User(
                full_name="Amit Patel", email="amit@university.edu.in",
                password_hash=hash_password("Staff@123"),
                role=UserRole.STAFF, is_verified=True, is_active=True,
                department_id=dept_infra.id,
            )
            db.add_all([staff1, staff2, staff3])
            await db.flush()

            print("Creating student users...")
            student1 = User(
                full_name="Arun Mehta", email="arun@university.edu.in",
                password_hash=hash_password("Student@123"),
                role=UserRole.STUDENT, is_verified=True, is_active=True,
            )
            student2 = User(
                full_name="Sneha Gupta", email="sneha@university.edu.in",
                password_hash=hash_password("Student@123"),
                role=UserRole.STUDENT, is_verified=True, is_active=True,
            )
            db.add_all([student1, student2])
            await db.flush()

            print("Creating SLA policies...")
            priorities = [("LOW", 168), ("MEDIUM", 72), ("HIGH", 24), ("CRITICAL", 4)]
            for dept in [dept_it, dept_academic, dept_infra]:
                for p_name, hours in priorities:
                    sla = SLAPolicy(department_id=dept.id, priority=p_name, resolution_hours=hours)
                    db.add(sla)
            await db.flush()

            print("Creating sample complaints...")
            now = datetime.now(timezone.utc)

            c1 = Complaint(
                reference_no="CCMS-2025-0001", student_id=student1.id,
                title="WiFi not working in Library Block B",
                description="The WiFi has been down for 2 days in Library Block B. Students cannot access online resources for their assignments.",
                status=ComplaintStatus.SUBMITTED, category="IT_SERVICES", priority=Priority.HIGH,
                department_id=dept_it.id, ai_category="IT_SERVICES", ai_priority="HIGH",
                ai_department="IT Services", ai_reasoning="Network connectivity issue affecting student work.",
                ai_confidence=0.92, sla_deadline=now + timedelta(hours=24),
            )
            c2 = Complaint(
                reference_no="CCMS-2025-0002", student_id=student1.id,
                title="Broken chairs in Lecture Hall 203",
                description="Multiple chairs are broken in Lecture Hall 203. At least 5 chairs have broken armrests and 2 have broken seats.",
                status=ComplaintStatus.ASSIGNED, category="INFRASTRUCTURE", priority=Priority.MEDIUM,
                department_id=dept_infra.id, assigned_staff_id=staff3.id,
                ai_category="INFRASTRUCTURE", ai_priority="MEDIUM",
                ai_department="Infrastructure & Facilities", ai_reasoning="Furniture maintenance required.",
                ai_confidence=0.88, sla_deadline=now + timedelta(hours=72),
            )
            c3 = Complaint(
                reference_no="CCMS-2025-0003", student_id=student2.id,
                title="Exam results not updated on portal",
                description="The results for the mid-semester exams of CS301 have not been updated on the student portal. It has been over a week since the exam.",
                status=ComplaintStatus.IN_PROGRESS, category="ACADEMIC", priority=Priority.HIGH,
                department_id=dept_academic.id, assigned_staff_id=staff2.id,
                ai_category="ACADEMIC", ai_priority="HIGH",
                ai_department="Academic Affairs", ai_reasoning="Academic records not updated affecting student records.",
                ai_confidence=0.85, sla_deadline=now + timedelta(hours=24),
            )
            c4 = Complaint(
                reference_no="CCMS-2025-0004", student_id=student2.id,
                title="Water leakage in Hostel Room 312",
                description="There is significant water leakage from the ceiling in Hostel Room 312. The water is damaging personal belongings.",
                status=ComplaintStatus.RESOLVED, category="INFRASTRUCTURE", priority=Priority.CRITICAL,
                department_id=dept_infra.id, assigned_staff_id=staff3.id,
                ai_category="INFRASTRUCTURE", ai_priority="CRITICAL",
                ai_department="Infrastructure & Facilities", ai_reasoning="Water damage poses safety and property risk.",
                ai_confidence=0.95, sla_deadline=now - timedelta(hours=2),
                resolved_at=now - timedelta(hours=1),
            )
            c5 = Complaint(
                reference_no="CCMS-2025-0005", student_id=student1.id,
                title="Request for additional bus route to South Campus",
                description="Many students living in South Campus area have to take multiple buses. A direct route would be very helpful.",
                status=ComplaintStatus.SUBMITTED, category="TRANSPORT", priority=Priority.LOW,
                ai_category="TRANSPORT", ai_priority="LOW",
                ai_department="General Administration", ai_reasoning="Transport convenience request, not urgent.",
                ai_confidence=0.78, sla_deadline=now + timedelta(hours=168),
            )

            db.add_all([c1, c2, c3, c4, c5])
            await db.flush()

            # Add complaint updates
            for c, msg in [(c1, "Complaint submitted."), (c2, "Assigned to Amit Patel."), (c3, "Investigation in progress."), (c4, "Issue resolved — plumbing fixed.")]:
                u = ComplaintUpdate(
                    complaint_id=c.id, author_id=admin.id,
                    update_type=UpdateType.STATUS_CHANGE,
                    new_status=c.status.value, message=msg,
                )
                db.add(u)

            await db.commit()

            print("\n" + "=" * 50)
            print("  CCMS Database Seeded Successfully!")
            print("=" * 50)
            print("\n  Default Credentials:")
            print("  " + "-" * 46)
            print(f"  {'Role':<10} {'Email':<30} {'Password'}")
            print("  " + "-" * 46)
            print(f"  {'ADMIN':<10} {'admin@university.edu.in':<30} Admin@123")
            print(f"  {'STAFF':<10} {'rajesh@university.edu.in':<30} Staff@123")
            print(f"  {'STAFF':<10} {'priya@university.edu.in':<30} Staff@123")
            print(f"  {'STAFF':<10} {'amit@university.edu.in':<30} Staff@123")
            print(f"  {'STUDENT':<10} {'arun@university.edu.in':<30} Student@123")
            print(f"  {'STUDENT':<10} {'sneha@university.edu.in':<30} Student@123")
            print("  " + "-" * 46)
            print(f"\n  Departments: IT Services, Academic Affairs, Infrastructure & Facilities")
            print(f"  Sample Complaints: 5 (various statuses)")
            print(f"  SLA Policies: 12 (4 priorities x 3 departments)")
            print("=" * 50 + "\n")

        except Exception as e:
            await db.rollback()
            print(f"Seed failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed())
