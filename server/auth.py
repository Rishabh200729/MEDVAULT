"""
MedVault AI - Authentication & Authorization
SHA-256 Aadhaar hashing, JWT tokens, and RBAC middleware.
100% free - no paid auth providers.
"""

import hashlib
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from models import get_db, User, UserRole

# ─── Config ──────────────────────────────────────────────────────────────────

SECRET_KEY = "medvault-dev-secret-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours for hackathon convenience

security = HTTPBearer(auto_error=False)


# ─── Aadhaar → Universal Medical ID ─────────────────────────────────────────

def generate_medical_id(aadhaar_number: str) -> str:
    """
    Convert a 12-digit Aadhaar number into a SHA-256 hashed Universal Medical ID.
    The raw Aadhaar is NEVER stored — only the irreversible hash.
    """
    cleaned = aadhaar_number.strip().replace(" ", "").replace("-", "")
    if len(cleaned) != 12 or not cleaned.isdigit():
        raise ValueError("Invalid Aadhaar number format. Must be 12 digits.")
    salted = f"medvault:abha:{cleaned}"
    return hashlib.sha256(salted.encode()).hexdigest()


# ─── Password Utilities ─────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


# ─── JWT Token Management ───────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


# ─── FastAPI Dependencies (RBAC) ────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Extract and validate the current user from JWT token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    payload = decode_token(credentials.credentials)
    medical_id = payload.get("sub")
    if not medical_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    user = db.query(User).filter(User.medical_id == medical_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


def require_role(*roles: UserRole):
    """
    RBAC decorator factory. Use as a FastAPI dependency:
        current_user: User = Depends(require_role(UserRole.DOCTOR, UserRole.LAB))
    """
    async def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {[r.value for r in roles]}"
            )
        return current_user
    return role_checker
