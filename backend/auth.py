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
    """
    Bcrypt has a maximum password length of 72 bytes.
    This function safely truncates passwords to ensure they fit within bcrypt's limit.
    """
    if not password:
        return password
    
    try:
        # Encode to bytes to check actual byte length
        encoded = password.encode("utf-8")
        
        # If it's already within the limit, return as-is
        if len(encoded) <= 72:
            return password
        
        # Truncate to 72 bytes and decode back to string
        # Use 'ignore' to handle any incomplete multi-byte characters at the boundary
        truncated = encoded[:72].decode("utf-8", errors="ignore")
        return truncated
        
    except Exception as e:
        # If anything goes wrong, try to return first 72 characters (not bytes)
        # This is a safe fallback but less precise
        return password[:72] if len(password) > 72 else password

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Use bcrypt directly to avoid passlib issues
        import bcrypt
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

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
