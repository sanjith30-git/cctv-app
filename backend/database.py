import json
import os
from typing import List, Optional

DATA_DIR = "data"
USERS_FILE = os.path.join(DATA_DIR, "users.json")
CAMERAS_FILE = os.path.join(DATA_DIR, "cameras.json")

def ensure_data_dir():
    """Create data directory if it doesn't exist"""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

def load_users() -> List[dict]:
    """Load users from JSON file"""
    ensure_data_dir()
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users: List[dict]):
    """Save users to JSON file"""
    ensure_data_dir()
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def load_cameras() -> List[dict]:
    """Load cameras from JSON file"""
    ensure_data_dir()
    if not os.path.exists(CAMERAS_FILE):
        return []
    with open(CAMERAS_FILE, "r") as f:
        return json.load(f)

def save_cameras(cameras: List[dict]):
    """Save cameras to JSON file"""
    ensure_data_dir()
    with open(CAMERAS_FILE, "w") as f:
        json.dump(cameras, f, indent=2)

def get_user_by_username(username: str) -> Optional[dict]:
    """Get user by username - returns a COPY to prevent accidental modifications"""
    users = load_users()
    for user in users:
        if user["username"] == username:
            # Return a copy to prevent accidental modification of the original
            return user.copy()
    return None

def get_user_by_id(user_id: int) -> Optional[dict]:
    """Get user by ID - returns a COPY to prevent accidental modifications"""
    users = load_users()
    for user in users:
        if user["id"] == user_id:
            # Return a copy to prevent accidental modification of the original
            return user.copy()
    return None

def get_cameras_by_owner(owner_id: int) -> List[dict]:
    """Get all cameras for a specific owner"""
    cameras = load_cameras()
    return [cam for cam in cameras if cam["owner_id"] == owner_id]

def get_all_cameras() -> List[dict]:
    """Get all cameras"""
    return load_cameras()

