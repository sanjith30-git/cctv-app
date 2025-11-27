"""
Script to initialize the database with hashed passwords
Run this once to set up users with proper password hashes
"""
from utils import get_password_hash
from database import save_users, ensure_data_dir

def init_users():
    """Initialize users with hashed passwords"""
    # Default password for all users: "password123"
    default_password = "password123"
    hashed_password = get_password_hash(default_password)
    
    users = [
        {
            "id": 1,
            "username": "owner1",
            "password": hashed_password,
            "role": "owner"
        },
        {
            "id": 2,
            "username": "owner2",
            "password": hashed_password,
            "role": "owner"
        },
        {
            "id": 3,
            "username": "admin",
            "password": hashed_password,
            "role": "control_room"
        }
    ]
    
    ensure_data_dir()
    save_users(users)
    print("Users initialized successfully!")
    print("Default password for all users: password123")

if __name__ == "__main__":
    init_users()

