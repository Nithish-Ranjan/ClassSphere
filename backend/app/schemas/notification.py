from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recipient_user_id: int
    role_target: Optional[str] = None
    title: str
    message: str
    category: str
    is_read: bool
    delivery_status: str
    link_url: Optional[str] = None
    created_at: datetime
