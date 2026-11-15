from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.config import settings
from app.models.user import User, AuditLog
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.dependencies import get_current_user
from app.core.otp_service import OTPService
from app.schemas.auth import LoginRequest, TokenResponse, UserOut, RefreshTokenRequest, SendOTPRequest, VerifyOTPRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    # Find user by email or institutional_id
    query = select(User).where(
        (User.email == req.email_or_id) | (User.institutional_id == req.email_or_id)
    ).options(selectinload(User.student_profile), selectinload(User.faculty_profile))

    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        # Audit failed login attempt
        client_ip = request.client.host if request.client else "unknown"
        audit = AuditLog(
            user_id=user.id if user else None,
            action="LOGIN_FAILED",
            resource="AUTH",
            ip_address=client_ip,
            details=f"Failed login attempt for identifier: {req.email_or_id}"
        )
        db.add(audit)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your institutional ID/email and password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact your department administrator."
        )

    # Issue JWT access & refresh tokens
    extra_claims = {
        "role": user.role.value,
        "email": user.email,
        "full_name": user.full_name,
        "institutional_id": user.institutional_id
    }
    access_token = create_access_token(user.id, extra_claims)
    refresh_token = create_refresh_token(user.id)

    # Audit successful login
    client_ip = request.client.host if request.client else "unknown"
    audit = AuditLog(
        user_id=user.id,
        action="LOGIN_SUCCESS",
        resource="AUTH",
        ip_address=client_ip,
        details=f"User {user.email} logged in with role {user.role.value}"
    )
    db.add(audit)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


@router.post("/refresh")
async def refresh_token(req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    user_id = int(payload.get("sub"))
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    extra_claims = {
        "role": user.role.value,
        "email": user.email,
        "full_name": user.full_name,
        "institutional_id": user.institutional_id
    }
    new_access_token = create_access_token(user.id, extra_claims)
    new_refresh_token = create_refresh_token(user.id)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.post("/send-otp")
async def send_otp(req: SendOTPRequest, current_user: User = Depends(get_current_user)):
    success = await OTPService.send_verification_code(req.phone_number)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to dispatch verification code. Please retry."
        )
    return {"message": "Verification code dispatched successfully", "phone_number": req.phone_number}


@router.post("/verify-otp")
async def verify_otp(
    req: VerifyOTPRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    verified = await OTPService.verify_code(req.phone_number, req.code)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )

    current_user.phone_number = req.phone_number
    current_user.is_phone_verified = True
    await db.commit()

    return {"message": "Phone number verified successfully", "is_phone_verified": True}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    audit = AuditLog(
        user_id=current_user.id,
        action="LOGOUT",
        resource="AUTH",
        details=f"User {current_user.email} signed out."
    )
    db.add(audit)
    await db.commit()
    return {"message": "Signed out successfully"}
