import redis
from loguru import logger
from app.core.config import settings
from typing import Optional
import asyncio
from functools import wraps


def async_redis_operation(func):
    """Decorator to run synchronous Redis operations in async context"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, func, *args, **kwargs)
    return wrapper


class RedisManager:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None

    async def connect(self):
        """Connect to Redis database"""
        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                health_check_interval=30
            )
            # Test connection
            await self._ping()
            logger.info("Connected to Redis successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None

    async def disconnect(self):
        """Disconnect from Redis database"""
        if self.redis_client:
            await asyncio.get_event_loop().run_in_executor(None, self.redis_client.close)
            logger.info("Disconnected from Redis")

    async def get_client(self) -> Optional[redis.Redis]:
        """Get Redis client instance"""
        if not self.redis_client:
            await self.connect()
        return self.redis_client

    @async_redis_operation
    def _ping(self):
        """Ping Redis synchronously"""
        if self.redis_client:
            return self.redis_client.ping()
        return False

    async def health_check(self) -> bool:
        """Check if Redis is healthy"""
        try:
            if self.redis_client:
                result = await self._ping()
                return result
            return False
        except Exception:
            return False


# Global Redis manager instance
redis_manager = RedisManager() 