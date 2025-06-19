from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Optional
import os


class Settings(BaseSettings):
    # Server Configuration
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8001, env="PORT")
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    PROJECT_NAME: str = Field(default="Library Notification Service", env="PROJECT_NAME")
    API_VERSION: str = Field(default="v1", env="API_VERSION")

    # Database Configuration (Redis)
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_HOST: str = Field(default="localhost", env="REDIS_HOST")
    REDIS_PORT: int = Field(default=6379, env="REDIS_PORT")
    REDIS_DB: int = Field(default=0, env="REDIS_DB")
    REDIS_PASSWORD: Optional[str] = Field(default=None, env="REDIS_PASSWORD")

    # RabbitMQ Configuration
    RABBITMQ_URL: str = Field(default="amqp://guest:guest@localhost:5673", env="RABBITMQ_URL")
    RABBITMQ_HOST: str = Field(default="localhost", env="RABBITMQ_HOST")
    RABBITMQ_PORT: int = Field(default=5673, env="RABBITMQ_PORT")
    RABBITMQ_USERNAME: str = Field(default="guest", env="RABBITMQ_USERNAME")
    RABBITMQ_PASSWORD: str = Field(default="guest", env="RABBITMQ_PASSWORD")
    RABBITMQ_EXCHANGE: str = Field(default="library_events", env="RABBITMQ_EXCHANGE")

    # JWT Configuration
    JWT_SECRET: str = Field(default="your_jwt_secret_here_change_in_production", env="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")

    # Email Configuration (SMTP)
    SMTP_HOST: str = Field(default="smtp.gmail.com", env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USERNAME: Optional[str] = Field(default=None, env="SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    EMAIL_FROM: str = Field(default="noreply@library.com", env="EMAIL_FROM")

    # External Services
    USER_SERVICE_URL: str = Field(default="http://localhost:3001", env="USER_SERVICE_URL")
    ADMIN_SERVICE_URL: str = Field(default="http://localhost:3003", env="ADMIN_SERVICE_URL")
    BOOK_SERVICE_URL: str = Field(default="http://localhost:8000", env="BOOK_SERVICE_URL")
    RESERVATION_SERVICE_URL: str = Field(default="http://localhost:3000", env="RESERVATION_SERVICE_URL")

    # Service Token (for inter-service communication)
    SERVICE_TOKEN: str = Field(default="internal-service-token-change-in-production", env="SERVICE_TOKEN")

    # CORS Configuration
    CORS_ORIGINS: List[str] = Field(default=["http://localhost:3002", "http://localhost:3004"], env="CORS_ORIGINS")

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    RATE_LIMIT_BURST: int = Field(default=100, env="RATE_LIMIT_BURST")

    # Logging Configuration
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FILE: str = Field(default="logs/notification.log", env="LOG_FILE")

    # Notification Configuration
    MAX_RETRIES: int = Field(default=3, env="MAX_RETRIES")
    RETRY_DELAY: int = Field(default=300, env="RETRY_DELAY")
    BATCH_SIZE: int = Field(default=100, env="BATCH_SIZE")
    CLEANUP_DAYS: int = Field(default=30, env="CLEANUP_DAYS")

    # Email Templates
    EMAIL_TEMPLATE_DIR: str = Field(default="templates/email", env="EMAIL_TEMPLATE_DIR")

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True
        # Environment variables take precedence over defaults
        env_prefix = ""
        
    def __init__(self, **kwargs):
        # Load environment variables first, then apply defaults
        super().__init__(**kwargs)


# Create global settings instance
settings = Settings() 