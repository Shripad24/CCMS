import json
import logging
from typing import Any

from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections per user.
    Supports multiple sessions per user (e.g. multiple browser tabs).
    """

    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        """Accept and register a WebSocket connection for a user."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected: user={user_id}, total_sessions={len(self.active_connections[user_id])}")

    async def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        """Remove a WebSocket connection for a user."""
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected: user={user_id}")

    async def send_to_user(self, user_id: str, message: dict[str, Any]) -> None:
        """Send a message to ALL sessions of a specific user."""
        if user_id in self.active_connections:
            disconnected: list[WebSocket] = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    disconnected.append(ws)
            for ws in disconnected:
                try:
                    self.active_connections[user_id].remove(ws)
                except ValueError:
                    pass
            if user_id in self.active_connections and not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast_to_users(self, user_ids: list[str], message: dict[str, Any]) -> None:
        """Send a message to multiple users."""
        for uid in user_ids:
            await self.send_to_user(uid, message)

    async def send_to_role(self, role: str, db: AsyncSession, message: dict[str, Any]) -> None:
        """Send a message to ALL connected users with a specific role."""
        result = await db.execute(
            select(User.id).where(User.role == role, User.is_active == True)  # noqa: E712
        )
        user_ids = [str(row[0]) for row in result.fetchall()]
        for uid in user_ids:
            await self.send_to_user(uid, message)

    @property
    def connected_user_count(self) -> int:
        """Get the number of connected users."""
        return len(self.active_connections)


manager = ConnectionManager()
