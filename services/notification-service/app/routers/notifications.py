from fastapi import APIRouter, HTTPException, Depends, Query, Path
from typing import Optional
from datetime import datetime

from app.models.notification import (
    NotificationCreate,
    NotificationSendRequest,
    NotificationStatus
)
from app.services.notification_service import notification_service
from app.utils.auth import verify_token, verify_service_token

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/health", response_model=dict)
async def health_check():
    """Health check endpoint for notifications"""
    try:
        # Try to connect to Redis
        from app.core.database import redis_manager
        is_healthy = await redis_manager.health_check()
        
        if not is_healthy:
            raise HTTPException(status_code=503, detail="Service unhealthy - Redis connection failed")
        
        return {
            "success": True,
            "message": "Notification service is healthy",
            "data": {
                "timestamp": datetime.utcnow().isoformat(),
                "status": "healthy",
                "database": "connected"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


@router.post("/send", response_model=dict)
async def send_notification(
    request: NotificationSendRequest,
    _: dict = Depends(verify_service_token)
):
    """Send a notification (service-to-service endpoint)"""
    try:
        notification_data = NotificationCreate(
            type=request.type,
            recipient_id=request.recipient,
            title=request.title,
            message=request.message,
            priority=request.priority,
            data=request.data
        )
        
        notification = await notification_service.create_notification(notification_data)
        
        return {
            "success": True,
            "message": "Notification sent successfully",
            "data": {"notification_id": notification.id}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")


@router.get("/user/{user_id}", response_model=dict)
async def get_user_notifications(
    user_id: str = Path(..., description="User ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[NotificationStatus] = Query(None, description="Filter by status"),
    current_user: dict = Depends(verify_token)
):
    """Get notifications for a specific user"""
    # Only allow users to see their own notifications, or admins to see any
    if current_user["user_id"] != user_id and current_user["role"] not in ["admin", "super_admin", "librarian"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        result = await notification_service.get_user_notifications(
            user_id=user_id,
            page=page,
            limit=limit,
            status_filter=status
        )
        
        return {
            "success": True,
            "message": "Notifications retrieved successfully",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve notifications: {str(e)}")


@router.get("/{notification_id}", response_model=dict)
async def get_notification(
    notification_id: str = Path(..., description="Notification ID"),
    current_user: dict = Depends(verify_token)
):
    """Get a specific notification"""
    try:
        notification = await notification_service.get_notification(notification_id)
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Only allow users to see their own notifications, or admins to see any
        if (notification.recipient_id != current_user["user_id"] and 
            current_user["role"] not in ["admin", "super_admin", "librarian"]):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "success": True,
            "message": "Notification retrieved successfully",
            "data": {"notification": notification}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve notification: {str(e)}")


@router.put("/{notification_id}/read", response_model=dict)
async def mark_notification_as_read(
    notification_id: str = Path(..., description="Notification ID"),
    current_user: dict = Depends(verify_token)
):
    """Mark a notification as read"""
    try:
        # First check if notification exists and user has access
        notification = await notification_service.get_notification(notification_id)
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Only allow users to mark their own notifications as read
        if notification.recipient_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        updated_notification = await notification_service.mark_as_read(notification_id)
        
        return {
            "success": True,
            "message": "Notification marked as read",
            "data": {"notification": updated_notification}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark notification as read: {str(e)}")


@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(
    notification_id: str = Path(..., description="Notification ID"),
    current_user: dict = Depends(verify_token)
):
    """Delete a notification"""
    try:
        # First check if notification exists and user has access
        notification = await notification_service.get_notification(notification_id)
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Only allow users to delete their own notifications, or admins to delete any
        if (notification.recipient_id != current_user["user_id"] and 
            current_user["role"] not in ["admin", "super_admin", "librarian"]):
            raise HTTPException(status_code=403, detail="Access denied")
        
        success = await notification_service.delete_notification(notification_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete notification")
        
        return {
            "success": True,
            "message": "Notification deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete notification: {str(e)}")


@router.get("/user/{user_id}/unread-count", response_model=dict)
async def get_unread_count(
    user_id: str = Path(..., description="User ID"),
    current_user: dict = Depends(verify_token)
):
    """Get count of unread notifications for a user"""
    # Only allow users to see their own count, or admins to see any
    if current_user["user_id"] != user_id and current_user["role"] not in ["admin", "super_admin", "librarian"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        count = await notification_service.get_unread_count(user_id)
        
        return {
            "success": True,
            "message": "Unread count retrieved successfully",
            "data": {"unread_count": count}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get unread count: {str(e)}")


@router.get("/templates", response_model=dict)
async def get_notification_templates(
    current_user: dict = Depends(verify_token)
):
    """Get all notification templates (admin only)"""
    if current_user["role"] not in ["admin", "super_admin", "librarian"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        templates = notification_service.get_notification_templates()
        
        return {
            "success": True,
            "message": "Templates retrieved successfully",
            "data": {"templates": templates}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve templates: {str(e)}")


@router.post("/cleanup", response_model=dict)
async def cleanup_old_notifications(
    days: int = Query(30, ge=1, le=365, description="Delete notifications older than this many days"),
    current_user: dict = Depends(verify_token)
):
    """Clean up old notifications (admin only)"""
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        deleted_count = await notification_service.cleanup_old_notifications(days)
        
        return {
            "success": True,
            "message": f"Cleaned up {deleted_count} old notifications",
            "data": {"deleted_count": deleted_count}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup notifications: {str(e)}") 