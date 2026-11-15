import os
from typing import List, Union
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DEFAULT_DB_FILE = os.path.join(_BASE_DIR, "classsphere.db").replace("\\", "/")


class Settings(BaseSettings):
    APP_NAME: str = "ClassSphere"
    APP_VERSION: str = "2.0"
    ENVIRONMENT: str = Field(default="development", description="development, test, or production")
    APP_MODE: str = Field(default="SIMULATION", description="SIMULATION or CONNECTED")

    # Base directory
    BASE_DIR: str = _BASE_DIR

    # Database
    DATABASE_URL: str = Field(
        default=f"sqlite+aiosqlite:///{_DEFAULT_DB_FILE}",
        description="Async SQLAlchemy database connection string"
    )

    # JWT Authentication
    JWT_SECRET_KEY: str = Field(
        default="classsphere-super-secure-production-jwt-secret-key-32-chars-min",
        description="HMAC secret for signing access and refresh tokens"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Twilio Verify (FR-01)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_VERIFY_SERVICE_SID: str = ""

    # Computer Vision Model Weights Paths (FR-17)
    YOLO_MODEL_PATH: str = "models/yolov8n.pt"
    FACE_MODEL_PATH: str = "PENDING EVALUATION"
    ACTIVITY_MODEL_PATH: str = "PENDING EVALUATION"
    FALL_MODEL_PATH: str = "PENDING EVALUATION"

    # Camera Sources
    CAMERA_SOURCE: str = "simulated://classroom_a101"

    # Notification Provider
    NOTIFICATION_PROVIDER: str = "websocket"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    # Storage paths
    UPLOAD_DIR: str = os.path.join(_BASE_DIR, "uploads")
    REFERENCE_DIR: str = os.path.join(_BASE_DIR, "uploads", "references")
    CLASSROOM_PHOTOS_DIR: str = os.path.join(_BASE_DIR, "uploads", "classroom_photos")

    model_config = SettingsConfigDict(
        env_file=os.path.join(_BASE_DIR, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

# Ensure upload dirs exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REFERENCE_DIR, exist_ok=True)
os.makedirs(settings.CLASSROOM_PHOTOS_DIR, exist_ok=True)
