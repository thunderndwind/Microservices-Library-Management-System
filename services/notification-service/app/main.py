import asyncio
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from loguru import logger

from app.core.config import settings
from app.core.database import redis_manager
from app.routers.notifications import router as notifications_router
from app.services.event_service import event_service


# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL
)

if settings.LOG_FILE:
    logger.add(
        settings.LOG_FILE,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level=settings.LOG_LEVEL,
        rotation="1 day",
        retention="30 days"
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager"""
    # Startup
    logger.info("Starting Notification Service...")
    
    # Connect to Redis
    await redis_manager.connect()
    
    # Connect to RabbitMQ (but don't start consuming yet)
    await event_service.connect()
    
    # Start event consumer in background thread
    if event_service.is_connected:
        await event_service.start_consuming()
        logger.info("Started event consumer")
    else:
        logger.warning("RabbitMQ not connected - events will not be processed")
    
    logger.info("Notification Service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Notification Service...")
    
    # Disconnect from services
    event_service.disconnect()
    await redis_manager.disconnect()
    
    logger.info("Notification Service shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description="Notification Service for Library Management System",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add trusted host middleware for production
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "notification-service"]
    )


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Global health check endpoint"""
    try:
        # Check Redis connection
        redis_healthy = await redis_manager.health_check()
        
        # Check RabbitMQ connection
        rabbitmq_healthy = event_service.is_connected
        
        status = "healthy" if redis_healthy and rabbitmq_healthy else "degraded"
        status_code = 200 if status == "healthy" else 503
        
        return JSONResponse(
            status_code=status_code,
            content={
                "success": True,
                "message": f"Notification Service is {status}",
                "data": {
                    "timestamp": "2024-01-15T10:30:00.000Z",
                    "status": status,
                    "services": {
                        "redis": "connected" if redis_healthy else "disconnected",
                        "rabbitmq": "connected" if rabbitmq_healthy else "disconnected"
                    },
                    "environment": settings.ENVIRONMENT
                }
            }
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "message": "Service unhealthy",
                "error": str(e)
            }
        )


# Include routers
app.include_router(
    notifications_router,
    prefix=f"/api/{settings.API_VERSION}"
)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "success": True,
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.API_VERSION,
        "docs": "/docs" if settings.DEBUG else "Documentation disabled in production"
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
