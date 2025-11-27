from pydantic import BaseModel
from typing import Optional, List

class User(BaseModel):
    id: int
    username: str
    password: str  # Will be hashed
    role: str  # "owner" or "control_room"

class Camera(BaseModel):
    id: int
    name: str
    location: str
    owner_id: int
    stream_url: Optional[str] = None
    status: str = "active"  # active, inactive

class Alert(BaseModel):
    id: int
    camera_id: int
    camera_name: str
    location: str
    message: str
    timestamp: str
    severity: str = "medium"  # low, medium, high

class LoginRequest(BaseModel):
    username: str
    password: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str

