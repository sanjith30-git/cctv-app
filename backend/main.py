from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from auth import authenticate_user, create_token_for_user, get_current_user, security
from camera import router as camera_router
from models import LoginRequest, Token, UpdateUsernameRequest, UpdatePasswordRequest
from database import ensure_data_dir, load_users, save_users, get_user_by_id
from utils import verify_password, get_password_hash
import json

app = FastAPI(title="CCTV Role-Based System API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for mobile development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include camera routes
app.include_router(camera_router, prefix="/api", tags=["cameras"])

@app.get("/")
def root():
    return {"message": "CCTV Role-Based System API"}

@app.post("/api/login", response_model=Token)
def login(login_data: LoginRequest):
    """
    Login endpoint - READ ONLY operation.
    This endpoint NEVER modifies the database or user passwords.
    It only:
    1. Verifies credentials (read-only)
    2. Creates and returns a JWT token
    """
    # Authenticate user - this is a READ-ONLY operation
    # It returns user data WITHOUT the password field
    user = authenticate_user(
        login_data.username,
        login_data.password,
        login_data.role
    )
    
    # Create token - this does NOT touch the database
    token = create_token_for_user(user)
    
    # Return token - no database writes occur
    return token

@app.get("/api/me")
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@app.get("/api/test-auth")
def test_auth(current_user: dict = Depends(get_current_user)):
    """Test endpoint to verify authentication is working"""
    return {
        "authenticated": True,
        "user_id": current_user["id"],
        "username": current_user["username"],
        "role": current_user["role"]
    }

@app.put("/api/me/username")
def update_username(
    update_data: UpdateUsernameRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update username - requires current password verification"""
    users = load_users()
    user = get_user_by_id(current_user["id"])
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(update_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Check if new username already exists
    for u in users:
        if u["username"] == update_data.new_username and u["id"] != current_user["id"]:
            raise HTTPException(status_code=400, detail="Username already exists")
    
    # Update username
    for u in users:
        if u["id"] == current_user["id"]:
            u["username"] = update_data.new_username
            break
    
    save_users(users)
    return {"message": "Username updated successfully", "username": update_data.new_username}

@app.put("/api/me/password")
def update_password(
    update_data: UpdatePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update password - requires current password verification"""
    users = load_users()
    user = get_user_by_id(current_user["id"])
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(update_data.current_password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid current password")
    
    # Validate new password
    if len(update_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    # Update password
    for u in users:
        if u["id"] == current_user["id"]:
            u["password"] = get_password_hash(update_data.new_password)
            break
    
    save_users(users)
    return {"message": "Password updated successfully"}

if __name__ == "__main__":
    import uvicorn
    ensure_data_dir()
    uvicorn.run(app, host="0.0.0.0", port=8000)

