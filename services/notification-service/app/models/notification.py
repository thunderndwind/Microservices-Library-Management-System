from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    EMAIL = "email"
    SYSTEM = "system"
    PUSH = "push"
    SMS = "sms"


class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    READ = "read"


class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class NotificationCreate(BaseModel):
    type: NotificationType
    recipient_id: str = Field(..., description="User ID or admin ID")
    recipient_email: Optional[EmailStr] = None
    title: str = Field(..., max_length=255)
    message: str = Field(..., max_length=2000)
    priority: NotificationPriority = NotificationPriority.MEDIUM
    data: Optional[Dict[str, Any]] = None
    scheduled_at: Optional[datetime] = None


class NotificationResponse(BaseModel):
    id: str
    type: NotificationType
    recipient_id: str
    recipient_email: Optional[str] = None
    title: str
    message: str
    priority: NotificationPriority
    status: NotificationStatus
    data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None


class NotificationUpdate(BaseModel):
    status: Optional[NotificationStatus] = None
    read_at: Optional[datetime] = None


class NotificationSendRequest(BaseModel):
    type: NotificationType
    recipient: str = Field(..., description="User ID, email, or phone number")
    title: str = Field(..., max_length=255)
    message: str = Field(..., max_length=2000)
    priority: NotificationPriority = NotificationPriority.MEDIUM
    data: Optional[Dict[str, Any]] = None


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool


class NotificationTemplate(BaseModel):
    id: str
    name: str
    type: NotificationType
    title_template: str
    message_template: str
    variables: List[str]
    description: Optional[str] = None


class EventNotification(BaseModel):
    event_type: str
    timestamp: datetime
    source: str
    data: Dict[str, Any]


# Standard notification templates
NOTIFICATION_TEMPLATES = {
    "user_registered": {
        "name": "User Registration",
        "type": NotificationType.EMAIL,
        "title_template": "Welcome to Library Management System!",
        "message_template": "Hello {first_name}, welcome to our library! Your account has been created successfully.",
        "variables": ["first_name", "email"]
    },
    "admin_registered": {
        "name": "Admin Registration",
        "type": NotificationType.EMAIL,
        "title_template": "New Admin Account Created",
        "message_template": "Hello {first_name}, your {role} account has been created by {created_by}.",
        "variables": ["first_name", "role", "created_by"]
    },
    "reservation_created": {
        "name": "Book Reserved",
        "type": NotificationType.SYSTEM,
        "title_template": "Book Reserved Successfully",
        "message_template": "You have successfully reserved '{book_title}' by {book_author}. Due date: {due_date}",
        "variables": ["book_title", "book_author", "due_date"]
    },
    "reservation_due_soon": {
        "name": "Book Due Soon",
        "type": NotificationType.SYSTEM,
        "title_template": "Book Due Tomorrow",
        "message_template": "Your book '{book_title}' is due tomorrow ({due_date}). Please return it on time.",
        "variables": ["book_title", "due_date"]
    },
    "reservation_overdue": {
        "name": "Book Overdue",
        "type": NotificationType.SYSTEM,
        "title_template": "Book Overdue",
        "message_template": "Your book '{book_title}' is overdue since {due_date}. Please return it immediately.",
        "variables": ["book_title", "due_date"]
    },
    "reservation_returned": {
        "name": "Book Returned",
        "type": NotificationType.SYSTEM,
        "title_template": "Book Returned Successfully",
        "message_template": "You have successfully returned '{book_title}'. Thank you!",
        "variables": ["book_title"]
    },
    "user_suspended": {
        "name": "Account Suspended",
        "type": NotificationType.SYSTEM,
        "title_template": "Account Suspended",
        "message_template": "Your account has been suspended. Reason: {reason}. Please contact the library.",
        "variables": ["reason"]
    },
    "book_available": {
        "name": "Book Available",
        "type": NotificationType.SYSTEM,
        "title_template": "Book Now Available",
        "message_template": "The book '{book_title}' you were waiting for is now available for reservation.",
        "variables": ["book_title"]
    }
} 