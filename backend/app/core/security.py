from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _truncate(password: str) -> str:
    """Truncate password to 72 bytes (bcrypt limit)."""
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_truncate(plain_password), hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(_truncate(password))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    # Use UTC timezone for consistency
    current_time = datetime.now(timezone.utc)
    expire = current_time + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": current_time})
    print(f"[JWT] Creating token with exp={expire}, iat={current_time}")
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        print(f"[JWT] Token decoded successfully: {payload}")
        return payload
    except JWTError as e:
        print(f"[JWT] Token decode error: {e}")
        return None
