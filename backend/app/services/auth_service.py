import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.token_blacklist import TokenBlacklist
from app.core.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    create_email_verification_token, create_password_reset_token, verify_token,
)
from app.config import settings

logger = logging.getLogger(__name__)


async def register_user(
    db: AsyncSession, full_name: str, email: str, password: str, role: str
) -> User:
    """Register a new user. Returns the created user."""
    # Check email domain
    if not settings.DEV_MODE:
        domain = email.split("@")[-1] if "@" in email else ""
        if not domain.endswith(settings.INSTITUTION_EMAIL_DOMAIN):
            raise ValueError(f"Email must be from {settings.INSTITUTION_EMAIL_DOMAIN} domain")

    # Check if email already exists
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise ValueError("Email already registered")

    # In DEV_MODE, auto-verify users so they can login immediately
    auto_verify = settings.DEV_MODE

    # Staff requires admin approval before they can login
    needs_approval = (role == "STAFF")

    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        role=role,
        is_verified=auto_verify,
        is_approved=not needs_approval,  # Students: True, Staff: False (needs admin approval)
    )
    db.add(user)
    await db.flush()

    if auto_verify:
        logger.info(f"DEV_MODE: User {email} auto-verified (no email required)")
    if needs_approval:
        logger.info(f"Staff registration: {email} requires admin approval")

    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    """Authenticate a user. Returns the user or raises ValueError."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise ValueError("Invalid email or password")
    if not user.is_active:
        raise ValueError("Account has been deactivated")
    if not user.is_verified:
        raise ValueError("Email not verified. Check your inbox.")
    if not user.is_approved:
        raise ValueError("Your account is pending admin approval. Please wait for the administrator to approve your registration.")
    if not verify_password(password, user.password_hash):
        raise ValueError("Invalid email or password")

    return user


def generate_tokens(user: User) -> dict:
    """Generate access and refresh tokens for a user."""
    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


async def blacklist_token(db: AsyncSession, token: str, user_id: UUID) -> None:
    """Add a token's JTI to the blacklist."""
    try:
        payload = verify_token(token, expected_type="refresh")
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti:
            from datetime import datetime, timezone
            bl = TokenBlacklist(
                jti=jti,
                user_id=user_id,
                expires_at=datetime.fromtimestamp(exp, tz=timezone.utc) if exp else datetime.now(timezone.utc),
            )
            db.add(bl)
            await db.flush()
    except Exception as e:
        logger.error(f"Failed to blacklist token: {e}")


async def verify_email(db: AsyncSession, token: str) -> bool:
    """Verify user's email using the verification token."""
    payload = verify_token(token, expected_type="email_verify")
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")
    user.is_verified = True
    await db.flush()
    return True


async def reset_password(db: AsyncSession, token: str, new_password: str) -> bool:
    """Reset a user's password using the reset token."""
    payload = verify_token(token, expected_type="password_reset")
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")
    user.password_hash = hash_password(new_password)
    await db.flush()
    return True
