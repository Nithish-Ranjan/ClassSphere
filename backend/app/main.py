import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base
from app.core.security import decode_token
from app.core.websockets import manager
from app.api import (
    auth, students, faculty, attendance,
    camera, events, incidents, hod, notifications, institutional_import, timetable
)
from app.seed_data import seed_database_if_needed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all tables and run seed data
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed data if database is fresh
    await seed_database_if_needed()
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="ClassSphere 2.0: Intelligent Classroom Monitoring and Management Platform",
    lifespan=lifespan
)

# CORS Middleware
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    try:
        origins = json.loads(origins)
    except Exception:
        origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for evidence and classroom photos
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API Routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(faculty.router)
app.include_router(attendance.router)
app.include_router(camera.router)
app.include_router(events.router)
app.include_router(incidents.router)
app.include_router(hod.router)
app.include_router(institutional_import.router)
app.include_router(timetable.router)
app.include_router(notifications.router)


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mode": settings.APP_MODE,
        "principle": "Monitor important events, not personalities."
    }


# Real-time WebSocket endpoints
@app.websocket("/ws/classroom/{class_session_id}")
async def classroom_websocket(
    websocket: WebSocket,
    class_session_id: int,
    token: str = Query(...)
):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = int(payload.get("sub", 0))
    await manager.connect(websocket, user_id=user_id, class_session_id=class_session_id)

    try:
        while True:
            # Keep alive and receive client commands
            data = await websocket.receive_text()
            # Echo ping/pong or client action
            await websocket.send_text(json.dumps({"type": "PONG", "payload": data}))
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id=user_id, class_session_id=class_session_id)


@app.websocket("/ws/live")
async def global_live_websocket(
    websocket: WebSocket,
    token: str = Query(...)
):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = int(payload.get("sub", 0))
    await manager.connect(websocket, user_id=user_id)

    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(json.dumps({"type": "PONG"}))
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id=user_id)
