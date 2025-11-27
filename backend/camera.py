from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models import Camera, Alert
from database import get_cameras_by_owner, get_all_cameras
from auth import get_current_user, require_role
from datetime import datetime

router = APIRouter()

@router.get("/cameras", response_model=List[Camera])
def get_cameras(current_user: dict = Depends(get_current_user)):
    """Get cameras based on user role"""
    if current_user["role"] == "owner":
        # Owner sees only their cameras
        cameras = get_cameras_by_owner(current_user["id"])
    elif current_user["role"] == "control_room":
        # Control room sees all cameras
        cameras = get_all_cameras()
    else:
        raise HTTPException(status_code=403, detail="Invalid role")
    
    return cameras

@router.get("/alerts", response_model=List[Alert])
def get_alerts(current_user: dict = Depends(require_role(["control_room"]))):
    """Get alerts (only for control room)"""
    # Generate dummy alerts
    cameras = get_all_cameras()
    alerts = []
    
    # Create some dummy alerts
    dummy_messages = [
        "Motion detected at Parking Area",
        "Unauthorized access attempt detected",
        "Camera offline detected",
        "Suspicious activity in Main Entrance",
        "Motion detected at Back Gate"
    ]
    
    for i, camera in enumerate(cameras[:5]):  # Create alerts for first 5 cameras
        alerts.append({
            "id": i + 1,
            "camera_id": camera["id"],
            "camera_name": camera["name"],
            "location": camera["location"],
            "message": dummy_messages[i % len(dummy_messages)],
            "timestamp": datetime.now().isoformat(),
            "severity": ["low", "medium", "high"][i % 3]
        })
    
    return alerts

