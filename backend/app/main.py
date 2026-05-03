import logging
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.background.sla_scheduler import start_scheduler, scheduler
from app.core.security import verify_token
from app.core.websocket_manager import manager
from app.routers import auth, complaints, messages, notifications, admin, departments

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CCMS API",
    description="Campus Complaint Management System API",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
import os
upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(messages.router)
app.include_router(notifications.router)
app.include_router(admin.router)
app.include_router(departments.router)


@app.on_event("startup")
async def startup():
    logger.info("Starting CCMS API...")
    await init_db()
    start_scheduler()
    logger.info("CCMS API started successfully")


@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()
    logger.info("CCMS API shut down")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = ""):
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return
    try:
        payload = verify_token(token, expected_type="access")
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001, reason="Invalid token")
            return
    except Exception:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Client heartbeat support — echo pong
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id)
    except Exception:
        await manager.disconnect(websocket, user_id)


# Global exception handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Not found"})


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
