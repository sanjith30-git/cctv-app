from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from auth import authenticate_user, create_token_for_user, get_current_user, security
from camera import router as camera_router
from models import LoginRequest, Token
from database import ensure_data_dir
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

if __name__ == "__main__":
    import uvicorn
    ensure_data_dir()
    uvicorn.run(app, host="0.0.0.0", port=8000)

