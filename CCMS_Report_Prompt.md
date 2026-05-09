# Claude Prompt: CCMS Project Report Generation

---

## PROMPT (Copy everything below this line and paste it to Claude)

---

Write a complete, formal academic project report for the following project. The report is for the course **CS400: Project-I** at **Indian Institute of Information Technology Guwahati (IIIT Guwahati)**, submitted in **November 2025**.

---

### Report Identity

- **Project Name**: CCMS — Campus Complaint Management System
- **Student**: [YOUR NAME] ([YOUR ROLL NUMBER])
- **Advisor**: [YOUR ADVISOR NAME]
- **Department**: Department of Computer Science and Engineering
- **Institution**: Indian Institute of Information Technology Guwahati
- **Course**: CS400 : Project-I
- **Date**: IIIT Guwahati, November 2025

---

### Formatting Rules (Follow EXACTLY)

1. Produce a **LaTeX-style formatted academic report** with:
   - A proper **Title Page** (project title, student name, roll number, advisor, department, course, date)
   - A **Table of Contents** with section numbers and page-dot-leaders (e.g., `1 Introduction . . . . . . . . . 2`)
   - All sections numbered with decimal notation (e.g., `4.1`, `4.1.1`)
   - Each subsection begins with a **bold label** acting as a visual subtitle (e.g., **QR Code Scanner**)
   - Page header on every page: `CCMS Project [page number]`

2. **Body text** style:
   - Formal academic prose in paragraph blocks (1–2 short introductory paragraphs per section)
   - Features described using **bullet lists** in the format: `• Feature name: Description`
   - Bold key terms, followed by colon and plain explanation

3. **Do not use markdown** — write as if this is a LaTeX PDF document converted to plain text (i.e., no #, **, *, etc.). Use ALL CAPS section headers and consistent indentation.

4. Include exactly **11 sections** as listed below, in order.

---

### Section Structure

Write all 11 sections below:

---

**Section 1: Introduction**
Write 3 formal paragraphs covering:
- What CCMS is: a full-stack campus complaint management web application
- The problem it addresses: inefficient, manual complaint handling in universities; lack of transparency, no prioritization, no SLA enforcement
- How it solves it: AI-powered classification using Google Gemini, role-based access (Student / Staff / Admin), real-time WebSocket notifications, SLA management with automated escalation, and PDF report generation
- Tech: React 18 + TypeScript + Vite on frontend, FastAPI + PostgreSQL + SQLAlchemy 2.0 async on backend, JWT authentication, Resend API for emails

---

**Section 2: App Purpose**
Write 1 paragraph + bullet list. Cover:
- Digitize and streamline the complaint submission process in academic institutions
- Automatically classify complaints by category (INFRASTRUCTURE, ACADEMIC, ADMINISTRATIVE, IT_SERVICES, HOSTEL, LIBRARY, TRANSPORT, SAFETY, OTHER) and priority (LOW, MEDIUM, HIGH, CRITICAL) using AI
- Route complaints to correct departments automatically
- Enforce SLA deadlines with automatic escalation when breached
- Provide real-time status notifications via WebSocket and email
- Give admins analytics dashboards and exportable PDF reports
- Enable communication between students and staff through an in-app messaging system
- Collect post-resolution feedback via a 1–5 star rating system

---

**Section 3: Target Audience**
Write 1 paragraph + bullet list. Users:
- Students who want to submit, track, and receive updates on complaints
- Staff members assigned to resolve complaints within their department
- University administrators who manage users, departments, SLA policies, and generate reports
- University management seeking data-driven insights on complaint resolution
- IT administrators who configure and manage the system

---

**Section 4: Core Features**
This is the main section. Use the following subsection hierarchy:

**4.1 AI-Powered Complaint Classification**
Brief intro paragraph, then:

**4.1.1 Google Gemini Integration**
Bullet list:
- gemini-1.5-flash model via google-generativeai SDK
- Structured JSON output: category, priority, suggested_department, reasoning, confidence_score
- Strict system prompt with 9 valid categories and 4 priority levels
- 8-second async timeout with graceful fallback to default classification
- Response validation and sanitization: invalid fields replaced with safe defaults
- Confidence score (0.0–1.0) stored per complaint for analytics
- AI acceptance rate tracked (% of complaints where AI category matches final category)

**4.1.2 Auto-Department Routing**
Bullet list:
- AI suggests a department name; backend fuzzy-matches it against existing departments
- Complaint is automatically assigned to the matching department on submission
- SLA deadline calculated based on the department's SLA policy for the given priority

**4.2 Complaint Management**
Brief intro paragraph, then:

**4.2.1 Complaint Submission (Student)**
Bullet list:
- Form with title, description, optional file attachment (max 10MB, stored in /uploads/)
- Auto-generates unique reference number (format: CCMS-YYYYMMDD-XXXX)
- AI classification runs immediately on submission
- SLA deadline auto-set based on AI priority and matched department
- Attachment URL stored; students can view their own attachments
- Initial audit trail entry created on submission

**4.2.2 Complaint Lifecycle & Status Transitions**
Statuses: SUBMITTED → ASSIGNED → IN_PROGRESS → PENDING_INFO → RESOLVED → CLOSED (or ESCALATED)
Bullet list:
- Validated state machine: only allowed transitions accepted (e.g., cannot go from RESOLVED back to IN_PROGRESS)
- PENDING_INFO: SLA timer paused while waiting for student clarification; timer resumes when status changes
- Staff and Admin can update status with optional notes and file attachments on each update
- Full audit trail: every status change is logged as a ComplaintUpdate record with author, timestamp, before/after status, and message
- RESOLVED triggers a prompt for the student to rate the experience (1–5 stars)
- Rating submission automatically transitions complaint to CLOSED

**4.2.3 File Attachments**
Bullet list:
- Students attach files during complaint submission
- Staff can attach files when updating complaint status (e.g., evidence of resolution)
- Files served as static content via FastAPI StaticFiles mount at /uploads/
- Max file size: 10MB per upload

**4.3 SLA Management**
Brief intro paragraph, then:

**4.3.1 SLA Policies**
Bullet list:
- Default SLA hours by priority: CRITICAL=4h, HIGH=24h, MEDIUM=72h, LOW=168h
- Per-department SLA policies can override defaults (stored in sla_policies table)
- Unique constraint per (department, priority) pair
- Warning threshold at 80% elapsed time (configurable per policy)

**4.3.2 Automated SLA Enforcement**
Bullet list:
- APScheduler background job runs every 15 minutes
- Checks all active complaints (SUBMITTED, ASSIGNED, IN_PROGRESS) with non-null SLA deadlines
- Skips complaints where SLA is paused (PENDING_INFO state)
- Calculates effective deadline including paused duration
- At 80% elapsed: sends SLA_WARNING notification to assigned staff and all admins; sets sla_warning_sent = True
- At 100% elapsed (breach): auto-escalates complaint to ESCALATED status, bumps priority one level (LOW→MEDIUM→HIGH→CRITICAL), creates ComplaintUpdate record with SLA_BREACH type, sends SLA_BREACH notification

**4.3.3 SLA Countdown UI**
Bullet list:
- Frontend SLACountdown component shows live countdown to deadline
- Color-coded: green (>50% remaining), yellow (20–50%), red (<20% or overdue)
- Displays time remaining in days/hours/minutes

**4.4 Real-Time Notifications**
Brief intro paragraph, then:

**4.4.1 WebSocket System**
Bullet list:
- WebSocket endpoint at /ws?token=<JWT>
- Token verified on connect; invalid tokens immediately rejected (code 4001)
- WebSocketManager maintains per-user connection lists (supports multiple tabs)
- Ping/pong heartbeat: client sends {type: "ping"}, server replies {type: "pong"}
- Notification events pushed instantly when: complaint submitted, assigned, status changed, SLA warning/breach, message received, complaint resolved
- Notifications persist in DB; accessible via REST API even if user was offline

**4.4.2 Notification Bell**
Bullet list:
- Real-time unread count badge on notification bell icon
- Click to view notification history
- Mark as read functionality
- NotificationBell component subscribes to WebSocket on mount

**4.5 Messaging System**
Brief intro paragraph, then:

**4.5.1 In-App Chat**
Bullet list:
- Per-complaint chat channel between student and assigned staff
- Messages stored in messages table with sender, complaint reference, timestamp
- Staff and students can exchange clarifications without leaving the platform
- New message triggers WebSocket notification to the recipient
- Message history loaded per complaint on complaint detail page

**4.6 User & Role Management**
Brief intro paragraph, then:

**4.6.1 Three-Role System**
Roles: STUDENT, STAFF, ADMIN
Bullet list:
- Students: submit complaints, view own complaints, chat with staff, rate resolved complaints
- Staff: view assigned complaints, update status, attach files, chat with students
- Admin: full access to all complaints, assign staff, manage users/departments/SLA policies, view analytics, export PDF reports
- Role enforced via JWT claims and FastAPI dependency injection (require_role decorator)

**4.6.2 User Management (Admin)**
Bullet list:
- Create users with any role (Student, Staff, Admin)
- Assign staff to departments on creation
- Activate/deactivate accounts (soft delete: is_active = False)
- Approve or deny pending staff registrations
- Trigger password reset email via Resend API
- Search and filter users by role, approval status

**4.7 Department Management**
Bullet list:
- Admin can create, view, and manage departments
- Each department has a name and list of member staff
- Complaints routed to departments via AI suggestion
- Per-department SLA policies configurable per priority level
- Department performance tracked in analytics (avg resolution hours, SLA rate, escalation count)

**4.8 Analytics Dashboard (Admin)**
Brief intro paragraph, then:

**4.8.1 Live Analytics**
Bullet list:
- Total complaints, complaints this month
- Breakdown by status (SUBMITTED, ASSIGNED, IN_PROGRESS, PENDING_INFO, ESCALATED, RESOLVED, CLOSED, REJECTED)
- Breakdown by category (9 categories) and priority (4 levels)
- Average complaint resolution time in hours
- SLA compliance rate: (total - escalated) / total × 100%
- AI acceptance rate: % of complaints where AI-predicted category matches final category
- 30-day submission trend (daily count chart via Recharts)
- Per-department performance table: avg resolution hours, SLA rate
- Staff leaderboard: complaints handled, avg rating, avg resolution time

**4.8.2 PDF Report Generation**
Bullet list:
- Admin selects date range (start_date, end_date)
- ReportLab generates a styled A4 PDF
- Sections: cover page, total complaints, complaints by status (table), complaints by category (table), avg resolution time, SLA compliance rate, staff performance leaderboard (top 5)
- Blue (#3B82F6) styled table headers
- Returned as downloadable attachment (Content-Disposition: attachment)

**4.9 Authentication System**
Brief intro paragraph, then:

**4.9.1 JWT Authentication**
Bullet list:
- HS256 JWT access tokens (short-lived) and refresh tokens (longer-lived)
- Token type field prevents token confusion attacks
- Token blacklist table invalidates logout tokens
- Secure password hashing via bcrypt (passlib)
- Email verification: token-based link sent via Resend API, 24-hour expiry
- Password reset: token-based link, 1-hour expiry

**4.9.2 Session Management**
Bullet list:
- Access token stored in frontend (Zustand store + localStorage)
- Axios interceptors auto-attach Authorization header
- Automatic token refresh flow on 401 responses
- Logout invalidates token in blacklist table

**4.10 Rating System**
Bullet list:
- Student rates resolved complaint on a 1–5 star scale
- Optional text feedback
- Rating linked to complaint, student, and the assigned staff member
- DB constraint enforces score range (CHECK score >= 1 AND score <= 5)
- One rating per complaint (unique constraint on complaint_id)
- Rating submission closes the complaint (RESOLVED → CLOSED)
- Staff avg rating shown in admin analytics and leaderboard

---

**Section 5: Technologies Used**

Present as a formatted two-column table with these rows:

| Category | Technology |
|---|---|
| Frontend | React 18.3, TypeScript 5.4, Vite 5.3, Tailwind CSS 3.4 |
| State Management | Zustand 4.5, TanStack React Query 5.49 |
| Forms & Validation | React Hook Form 7.52, Zod 3.23, @hookform/resolvers |
| UI Components | Radix UI (Dialog, Dropdown, Select, Toast, Avatar, Tabs), Lucide React, Sonner |
| Charts | Recharts 2.12 |
| Backend | FastAPI 0.111, Python 3.11, Uvicorn 0.30 |
| ORM & Database | SQLAlchemy 2.0 (async), asyncpg, Alembic, PostgreSQL 15+ |
| Authentication | python-jose (JWT HS256), passlib[bcrypt] |
| AI Integration | Google Gemini API (gemini-1.5-flash), google-generativeai 0.7.2 |
| Background Tasks | APScheduler 3.10 |
| PDF Generation | ReportLab 4.2 |
| Email Service | Resend API (via httpx async HTTP client) |
| File Uploads | python-multipart, aiofiles, FastAPI StaticFiles |
| Real-Time | WebSocket (FastAPI native), custom WebSocketManager |
| Development Tools | Git, GitHub, VS Code, Postman, pgAdmin |

---

**Section 6: System Architecture**

Write 1 intro paragraph, then describe the two-tier architecture:

1. **Web Frontend (React + Vite)**
   - SPA served on localhost:5173 in development
   - React Router v6 for client-side routing
   - Role-based route protection (ProtectedRoute component)
   - Zustand for global auth state; TanStack Query for server state caching
   - Axios instance with interceptors for JWT header injection and 401 refresh
   - WebSocket connection per authenticated session
   - Pages organized by role: /student/*, /staff/*, /admin/*

2. **Backend API (FastAPI + PostgreSQL)**
   - RESTful API on localhost:8000/api/v1/
   - Auto-generated Swagger docs at /docs
   - Routers: auth, complaints, messages, notifications, admin, departments
   - SQLAlchemy 2.0 async sessions with asyncpg driver
   - Alembic for schema migrations
   - APScheduler background job for SLA enforcement (runs every 15 minutes)
   - Static file serving for uploaded attachments at /uploads/
   - WebSocket endpoint at /ws with per-user connection manager

3. **Database (PostgreSQL)**
   - Tables: users, departments, complaints, complaint_updates, messages, notifications, ratings, sla_policies, token_blacklist
   - UUID primary keys throughout
   - Enum types for roles, statuses, priorities, update types
   - SLA policy unique constraint per (department, priority)
   - Check constraint on ratings (score 1–5)

4. **External Services**
   - Google Gemini API for AI classification
   - Resend API for transactional emails (verification, password reset, SLA alerts)

Include a simple architecture diagram description (ASCII or text-based box diagram showing: Browser ↔ React Frontend ↔ FastAPI Backend ↔ PostgreSQL, with side connections to Gemini API and Resend API, and a WebSocket channel)

---

**Section 7: Security Implementation**

Write using bold subheadings (no numbered subsections, same style as SecureScan report), covering:

**Authentication & Authorization**
- JWT HS256 tokens — stateless session management; access + refresh token pair
- Token type validation prevents access tokens being used as refresh tokens
- Token blacklist — logout invalidates token; DB-checked on every protected request
- bcrypt password hashing — one-way, salt-round secure hashing via passlib
- Email verification — users must verify email before accessing the system
- Role-based access control — STUDENT/STAFF/ADMIN roles enforced at every endpoint via require_role dependency
- Staff approval workflow — new staff accounts require admin approval before access

**Data Protection**
- Environment variables — all secrets (DB password, JWT secret, API keys) stored in .env, never in source code
- CORS middleware — restricted to known frontend origins only
- Input validation — Pydantic schemas validate and sanitize all request bodies
- File upload validation — max 10MB limit, extension preservation, UUID-renamed files prevent path traversal
- HTTPS recommended for production (SSL/TLS)

**SLA & Audit Trail**
- Every complaint state change is recorded in complaint_updates with author, timestamp, before/after status
- SLA breach auto-escalation is recorded as an audit entry with UpdateType.SLA_BREACH
- Complaint ownership enforced: students can only view/act on their own complaints; staff can only access assigned complaints

**Email Security**
- Resend API — transactional email service with authenticated API key
- Verification and reset tokens are single-use JWTs with short expiry (24h / 1h)
- Tokens invalidated after use

---

**Section 8: Future Scope**

Use 5 bold subheadings + bullets (same style as SecureScan):

**Enhanced AI Capabilities**
- Fine-tune Gemini prompts with historical complaint data for better accuracy
- Implement multi-turn AI chat for guided complaint submission
- AI-generated resolution suggestions for common complaint types
- Automated duplicate complaint detection

**Advanced Notification System**
- Push notifications for mobile browsers (Web Push API)
- SMS notifications via Twilio for critical/escalated complaints
- Configurable notification preferences per user
- Digest email summaries (daily/weekly)

**Analytics & Reporting**
- Interactive charts replacing static PDF reports
- Predictive analytics: forecast complaint volume by department
- Geographical heatmaps for hostel/campus location-based complaints
- Export to Excel/CSV in addition to PDF
- SIEM integration for security monitoring

**Mobile Application**
- React Native mobile app for students and staff
- Camera-based document attachment
- Biometric authentication (fingerprint/Face ID)
- Offline complaint drafting with sync on reconnect

**Enterprise & Institutional Features**
- Multi-institution support (separate tenant namespaces)
- LDAP/SSO integration for university login systems
- Bulk complaint import via CSV
- API access for third-party integrations (ERP, LMS)
- GDPR/data retention policy enforcement

---

**Section 9: Conclusion**

Write 2–3 formal paragraphs:
- Summarize what was built: a production-ready, full-stack complaint management system for academic institutions
- Mention key technical achievements: async FastAPI backend with PostgreSQL, AI-powered classification with Gemini, real-time WebSocket notifications, SLA automation with APScheduler, PDF generation with ReportLab, Resend API email integration, role-based access, rating system
- Conclude with: the modular architecture allows easy extension; this project demonstrates proficiency in full-stack web development, AI integration, database design, REST API design, real-time systems, and security best practices

Key achievements bullet list:
- Functional AI-powered complaint classification with confidence scoring
- Real-time notification system via WebSocket with persistent fallback
- Automated SLA enforcement with escalation and priority bumping
- Role-based access for three distinct user types
- Complete audit trail for every complaint state change
- In-app messaging between students and staff
- Comprehensive admin analytics dashboard with 30-day trend
- Downloadable PDF analytics reports
- Post-resolution 1–5 star rating and feedback system
- Email notifications via Resend API for key lifecycle events
- Secure JWT authentication with token blacklisting
- Database migrations via Alembic

---

**Section 10: Screenshots**

Write placeholder descriptions for 12 screenshots (paired in 6 figure-pairs, side by side), covering:
- Figure 1: Student Login Page — Figure 2: Student Registration Page
- Figure 3: Student Dashboard — Figure 4: Submit Complaint Form
- Figure 5: My Complaints List — Figure 6: Complaint Detail with SLA Countdown
- Figure 7: Staff Dashboard — Figure 8: Assigned Complaint with Status Update
- Figure 9: Admin Dashboard with Analytics — Figure 10: Admin User Management
- Figure 11: Admin SLA Management — Figure 12: PDF Report Download

For each figure write: "Figure N: [Caption]" on its own line, as in the reference report.

---

**Section 11: Appendix**

**11.1 Repository Information**

Present in code-block style:
- Repository: CCMS
- Owner: [YOUR GITHUB USERNAME]
- Branch: main
- Link: https://github.com/[YOUR GITHUB USERNAME]/CCMS
- Structure:
  - /backend — FastAPI application (app/, alembic/, seed.py, requirements.txt)
  - /frontend — React + Vite application (src/, package.json, tailwind.config.ts)
  - README.md — Setup and configuration guide

**11.2 API Endpoints Summary**

Present as a table with columns: Method | Endpoint | Role | Description

Include these endpoints:
- POST /api/v1/auth/register — Public — Register new user
- POST /api/v1/auth/login — Public — Login and receive tokens
- GET /api/v1/auth/me — Authenticated — Get current user profile
- POST /api/v1/complaints/ — Student — Submit new complaint (multipart/form-data)
- GET /api/v1/complaints/ — Authenticated — List complaints (filtered by role)
- GET /api/v1/complaints/{id} — Authenticated — Get complaint detail
- PATCH /api/v1/complaints/{id}/status — Staff/Admin — Update complaint status
- PATCH /api/v1/complaints/{id}/assign — Admin — Assign complaint to staff
- POST /api/v1/complaints/{id}/rating — Student — Submit 1–5 star rating
- GET /api/v1/complaints/{id}/updates — Authenticated — Get audit trail
- GET /api/v1/messages/{complaint_id} — Authenticated — Get messages
- POST /api/v1/messages/ — Authenticated — Send message
- GET /api/v1/notifications/ — Authenticated — Get notifications
- GET /api/v1/admin/analytics — Admin — Get analytics data
- POST /api/v1/admin/reports/generate — Admin — Generate PDF report
- GET /api/v1/admin/users — Admin — List all users
- POST /api/v1/admin/users — Admin — Create user
- GET /api/v1/departments/ — Authenticated — List departments
- WS /ws?token=<JWT> — Authenticated — Real-time WebSocket connection

---

**11.3 Database Schema Summary**

List the 10 tables with their key columns:
- users: id (UUID PK), full_name, email, password_hash, role (STUDENT/STAFF/ADMIN), is_verified, is_approved, is_active, department_id (FK), created_at
- departments: id (UUID PK), name, description
- complaints: id (UUID PK), reference_no (unique), student_id (FK), title, description, status, category, priority, department_id (FK), assigned_staff_id (FK), ai_category, ai_priority, ai_department, ai_reasoning, ai_confidence, sla_deadline, sla_warning_sent, sla_paused_at, sla_paused_duration_minutes, attachment_url, created_at, resolved_at
- complaint_updates: id (UUID PK), complaint_id (FK), author_id (FK), update_type (STATUS_CHANGE/ASSIGNMENT/COMMENT/SLA_BREACH), previous_status, new_status, message, attachment_url, created_at
- messages: id (UUID PK), complaint_id (FK), sender_id (FK), content, created_at
- notifications: id (UUID PK), user_id (FK), type, message, complaint_id (FK), is_read, created_at
- ratings: id (UUID PK), complaint_id (FK, unique), student_id (FK), staff_id (FK), score (CHECK 1–5), feedback_text, created_at
- sla_policies: id (UUID PK), department_id (FK), priority, resolution_hours, warning_threshold_pct, created_at (UNIQUE: department_id + priority)
- token_blacklist: id (UUID PK), token, created_at

---

End of prompt.
