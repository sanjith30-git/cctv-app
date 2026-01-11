from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils import verify_password, create_access_token, decode_token
from database import get_user_by_username
from models import LoginRequest, Token
from datetime import timedelta

security = HTTPBearer(auto_error=False)

def authenticate_user(username: str, password: str, role: str) -> dict:
    """
    Authenticate user and return user data if valid.
    This function is READ-ONLY and never modifies the database.
    """
    # Get user from database (returns a copy to prevent modifications)
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Verify password - READ ONLY operation
    stored_password_hash = user["password"]
    if not verify_password(password, stored_password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Check if role matches
    if user["role"] != role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User does not have {role} role"
        )
    
    # Return user data WITHOUT password field for security
    # This ensures password hash is never exposed or accidentally modified
    user_data = {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"]
    }
    
    return user_data

def create_token_for_user(user: dict) -> Token:
    """Create JWT token for authenticated user"""
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={
            "sub": str(user["id"]),
            "username": user["username"],
            "role": user["role"]
        },
        expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user from JWT token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    username = payload.get("username")
    role = payload.get("role")
    
    if user_id is None or username is None or role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "id": int(user_id),
        "username": username,
        "role": role
    }

def require_role(allowed_roles: list):
    """Dependency to check if user has required role"""
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

