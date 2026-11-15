from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.core.dependencies import get_current_user
from app.schemas.notification import NotificationOut

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationOut])
async def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Notification).where(
        Notification.recipient_user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(30)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    notif = await db.get(Notification, notification_id)
    if not notif or notif.recipient_user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    await db.commit()
    return {"message": "Notification marked as read"}
