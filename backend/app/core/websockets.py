import json
import logging
from typing import Dict, List, Set
from fastapi import WebSocket

logger = logging.getLogger("classsphere.websockets")


class ConnectionManager:
    def __init__(self):
        # Active connections: user_id -> set of WebSockets
        self.user_connections: Dict[int, Set[WebSocket]] = {}
        # Room connections: class_session_id -> set of WebSockets
        self.room_connections: Dict[int, Set[WebSocket]] = {}
        # All connected WebSockets
        self.all_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, user_id: int, class_session_id: int = None):
        await websocket.accept()
        self.all_connections.add(websocket)

        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

        if class_session_id:
            if class_session_id not in self.room_connections:
                self.room_connections[class_session_id] = set()
            self.room_connections[class_session_id].add(websocket)

        logger.info(f"WebSocket client connected: user_id={user_id}, class_session_id={class_session_id}")

    def disconnect(self, websocket: WebSocket, user_id: int, class_session_id: int = None):
        self.all_connections.discard(websocket)

        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        if class_session_id and class_session_id in self.room_connections:
            self.room_connections[class_session_id].discard(websocket)
            if not self.room_connections[class_session_id]:
                del self.room_connections[class_session_id]

        logger.info(f"WebSocket client disconnected: user_id={user_id}, class_session_id={class_session_id}")

    async def broadcast_to_room(self, class_session_id: int, event_type: str, data: dict):
        """Broadcast an event payload to all clients listening to a specific classroom session"""
        payload = json.dumps({"event": event_type, "class_session_id": class_session_id, "data": data})
        if class_session_id in self.room_connections:
            dead_sockets = set()
            for ws in self.room_connections[class_session_id]:
                try:
                    await ws.send_text(payload)
                except Exception as e:
                    logger.warning(f"Error sending to WS in room {class_session_id}: {e}")
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.room_connections[class_session_id].discard(ws)
                self.all_connections.discard(ws)

    async def send_to_user(self, user_id: int, event_type: str, data: dict):
        """Send message directly to a specific user"""
        payload = json.dumps({"event": event_type, "data": data})
        if user_id in self.user_connections:
            dead_sockets = set()
            for ws in self.user_connections[user_id]:
                try:
                    await ws.send_text(payload)
                except Exception as e:
                    logger.warning(f"Error sending to WS user {user_id}: {e}")
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.user_connections[user_id].discard(ws)
                self.all_connections.discard(ws)

    async def broadcast_global(self, event_type: str, data: dict):
        """Broadcast message to all connected clients"""
        payload = json.dumps({"event": event_type, "data": data})
        dead_sockets = set()
        for ws in self.all_connections:
            try:
                await ws.send_text(payload)
            except Exception as e:
                dead_sockets.add(ws)
        for ws in dead_sockets:
            self.all_connections.discard(ws)


manager = ConnectionManager()
