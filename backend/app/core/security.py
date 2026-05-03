import uuid
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def generate_jti() -> str:
    """Generate a unique JWT ID for token blacklisting."""
    return str(uuid.uuid4())


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    jti = generate_jti()
    to_encode.update({
        "exp": expire,
        "jti": jti,
        "type": "access",
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token with longer expiry."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    jti = generate_jti()
    to_encode.update({
        "exp": expire,
        "jti": jti,
        "type": "refresh",
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_email_verification_token(user_id: str) -> str:
    """Create a token for email verification (24h expiry)."""
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode = {
        "sub": user_id,
        "type": "email_verify",
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_password_reset_token(user_id: str) -> str:
    """Create a token for password reset (1h expiry)."""
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    to_encode = {
        "sub": user_id,
        "type": "password_reset",
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str, expected_type: str = "access") -> dict:
    """
    Verify and decode a JWT token.
    Raises HTTPException if invalid, expired, or wrong type.
    Returns the decoded payload.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        token_type: str = payload.get("type", "")
        if token_type != expected_type:
            raise credentials_exception

        sub: str = payload.get("sub")
        if sub is None:
            raise credentials_exception

        return payload

    except JWTError:
        raise credentials_exception
