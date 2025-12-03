from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from models import Camera, Alert, UpdateCameraNameRequest
from database import get_cameras_by_owner, get_all_cameras, load_cameras, save_cameras
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

@router.patch("/cameras/{camera_id}/status")
def update_camera_status(
    camera_id: int, 
    status: str = Query(..., description="Camera status: 'active' or 'inactive'"),
    current_user: dict = Depends(get_current_user)
):
    """Update camera status (active/inactive)"""
    if status not in ["active", "inactive"]:
        raise HTTPException(status_code=400, detail="Status must be 'active' or 'inactive'")
    
    cameras = load_cameras()
    camera = None
    for cam in cameras:
        if cam["id"] == camera_id:
            camera = cam
            break
    
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # Check permissions
    if current_user["role"] == "owner":
        # Owners can only update their own cameras
        if camera["owner_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You can only update your own cameras")
    elif current_user["role"] == "control_room":
        # Control room users can update any camera status
        pass
    else:
        raise HTTPException(status_code=403, detail="Invalid role")
    
    # Update status
    camera["status"] = status
    save_cameras(cameras)
    
    return {"id": camera_id, "status": status, "message": f"Camera status updated to {status}"}

@router.patch("/cameras/{camera_id}/name")
def update_camera_name(
    camera_id: int,
    update_data: UpdateCameraNameRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update camera name"""
    if not update_data.name or not update_data.name.strip():
        raise HTTPException(status_code=400, detail="Camera name cannot be empty")
    
    cameras = load_cameras()
    camera = None
    for cam in cameras:
        if cam["id"] == camera_id:
            camera = cam
            break
    
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # Check permissions
    if current_user["role"] == "owner":
        # Owners can only update their own cameras
        if camera["owner_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You can only update your own cameras")
    elif current_user["role"] == "control_room":
        # Control room users can update any camera name
        pass
    else:
        raise HTTPException(status_code=403, detail="Invalid role")
    
    # Update name
    camera["name"] = update_data.name.strip()
    save_cameras(cameras)
    
    return {"id": camera_id, "name": camera["name"], "message": "Camera name updated successfully"}

@router.get("/alerts", response_model=List[Alert])
def get_alerts(current_user: dict = Depends(require_role(["control_room"]))):
    """Get alerts (only for control room) - Currently returns zero alerts"""
    # Return empty alerts list
    return []

