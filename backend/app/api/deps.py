from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    print(f"[AUTH] Validating token, length={len(token)}, first_20_chars={token[:20]}")
    payload = decode_access_token(token)
    if payload is None:
        print(f"[AUTH] Token validation failed - payload is None")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user_id = payload.get("sub")
    print(f"[AUTH] Token payload: user_id={user_id}, exp={payload.get('exp')}")
    if user_id is None:
        print(f"[AUTH] Token validation failed - no user_id in payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        print(f"[AUTH] Token validation failed - user not found in DB: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    print(f"[AUTH] Token validation successful for user {user.email}")
    return user


def require_role(*roles: str):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {', '.join(roles)}",
            )
        return user
    return role_checker
