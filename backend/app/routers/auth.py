import logging

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.schemas.auth import (
    RegisterRequest, LoginRequest, RefreshRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
    TokenResponse, MessageResponse,
)
from app.schemas.user import UserResponse
from app.services.auth_service import (
    register_user, authenticate_user, generate_tokens,
    blacklist_token, verify_email, reset_password,
)
from app.core.security import (
    create_email_verification_token, create_password_reset_token,
    verify_token, create_access_token,
)
from app.core.dependencies import get_current_user
from app.services.email_service import send_verification_email, send_password_reset_email
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await register_user(db, body.full_name, body.email, body.password, body.role)
        await db.flush()

        if user.is_verified:
            # DEV_MODE: user is auto-verified, no email needed
            logger.info(f"DEV_MODE: {body.email} registered and auto-verified")
            return {"message": f"Registration successful. You can now log in."}
        else:
            # PRODUCTION: send verification email
            token = create_email_verification_token(str(user.id))
            background_tasks.add_task(send_verification_email, body.email, body.full_name, token)
            return {"message": f"Registration successful. Check {body.email} for verification link."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        user = await authenticate_user(db, body.email, body.password)
        tokens = generate_tokens(user)
        return {
            **tokens,
            "user": {
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role.value,
                "department_id": str(user.department_id) if user.department_id else None,
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/refresh")
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = verify_token(body.refresh_token, expected_type="refresh")
        from app.models.token_blacklist import TokenBlacklist
        jti = payload.get("jti")
        if jti:
            result = await db.execute(select(TokenBlacklist).where(TokenBlacklist.jti == jti))
            if result.scalar_one_or_none():
                raise HTTPException(status_code=401, detail="Token revoked")
        token_data = {"sub": payload["sub"], "role": payload["role"]}
        new_access = create_access_token(token_data)
        return {"access_token": new_access, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/logout", response_model=MessageResponse)
async def logout(
    body: RefreshRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await blacklist_token(db, body.refresh_token, current_user.id)
    return {"message": "Logged out successfully"}


@router.get("/verify-email/{token}", response_model=MessageResponse)
async def verify_email_endpoint(token: str, db: AsyncSession = Depends(get_db)):
    try:
        await verify_email(db, token)
        return {"message": "Email verified successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user:
        token = create_password_reset_token(str(user.id))
        background_tasks.add_task(send_password_reset_email, user.email, user.full_name, token)
    # Always return 200 for security
    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password_endpoint(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    try:
        await reset_password(db, body.token, body.new_password)
        return {"message": "Password reset successful"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: __import__("app.schemas.user", fromlist=["ProfileUpdateRequest"]).ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.profile_photo_url is not None:
        current_user.profile_photo_url = body.profile_photo_url
    if body.new_password and body.current_password:
        from app.core.security import verify_password, get_password_hash
        if not verify_password(body.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        current_user.password_hash = get_password_hash(body.new_password)
    
    await db.commit()
    await db.refresh(current_user)
    return current_user
