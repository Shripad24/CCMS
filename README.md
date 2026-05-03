# CCMS — Campus Complaint Management System

A full-stack campus complaint management system with AI-powered classification, real-time notifications, SLA management, and comprehensive analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL |
| Auth | JWT (HS256) + bcrypt |
| AI | Google Gemini API (gemini-1.5-flash) |
| Real-time | WebSocket |
| Reports | ReportLab PDF generation |

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (tested with PostgreSQL 18)

## Setup (Windows)

### 1. Database

Open pgAdmin and create a new database called `ccms_db`.

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your PostgreSQL password, Gemini API key, etc.

# Seed the database (creates tables + sample data)
python seed.py

# Start the server
uvicorn app.main:app --reload
```

### 3. Frontend

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 4. Access

- **Frontend**: http://localhost:5173
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Health**: http://localhost:8000/api/v1/health

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@university.edu.in | Admin@123 |
| Staff | rajesh@university.edu.in | Staff@123 |
| Staff | priya@university.edu.in | Staff@123 |
| Staff | amit@university.edu.in | Staff@123 |
| Student | arun@university.edu.in | Student@123 |
| Student | sneha@university.edu.in | Student@123 |

## Features

- **AI-powered complaint classification** using Google Gemini
- **Role-based access control** (Student, Staff, Admin)
- **Real-time notifications** via WebSocket
- **SLA management** with automatic escalation
- **Chat messaging** between students and staff
- **Analytics dashboard** with charts (Recharts)
- **PDF report generation** (ReportLab)
- **Email notifications** via Resend API
- **File attachments** for complaints
- **Rating system** for resolved complaints
