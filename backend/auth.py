from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models_updated import User
from crud import get_user_by_email

# Security configuration
SECRET_KEY = "your-super-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def _truncate_for_bcrypt(password: str) -> str:
    """Bcrypt considers only the first 72 bytes. Truncate safely to avoid errors.
    """
    try:
        encoded = password.encode("utf-8")
    except Exception:
        # Fallback: if encoding fails, return as-is; verify will fail gracefully
        return password
    if len(encoded) <= 72:
        return password
    # Truncate by bytes then decode ignoring incomplete trailing bytes
    return encoded[:72].decode("utf-8", errors="ignore")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    safe = _truncate_for_bcrypt(plain_password)
    return pwd_context.verify(safe, hashed_password)

def get_password_hash(password: str) -> str:
    safe = _truncate_for_bcrypt(password)
    return pwd_context.hash(safe)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email = verify_token(credentials.credentials)
    if email is None:
        raise credentials_exception
    
    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    
    return user
