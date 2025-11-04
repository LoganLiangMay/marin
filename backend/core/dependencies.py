"""
Dependency injection for FastAPI endpoints.
Provides reusable dependencies for services and connections.
"""

from typing import AsyncGenerator, Optional
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import redis.asyncio as aioredis

from backend.core.config import settings


# MongoDB Connection
_mongodb_client: Optional[AsyncIOMotorClient] = None


async def get_mongodb_client() -> AsyncIOMotorClient:
    """Get MongoDB client (singleton pattern)."""
    global _mongodb_client
    if _mongodb_client is None:
        _mongodb_client = AsyncIOMotorClient(settings.mongodb_uri)
    return _mongodb_client


async def get_database() -> AsyncIOMotorDatabase:
    """Get MongoDB database instance."""
    client = await get_mongodb_client()
    return client[settings.mongodb_database]


# Redis Connection
_redis_client: Optional[aioredis.Redis] = None


async def get_redis_client() -> aioredis.Redis:
    """Get Redis client (singleton pattern)."""
    global _redis_client
    if _redis_client is None:
        _redis_client = await aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True
        )
    return _redis_client


# Dependency for injecting database
async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """FastAPI dependency for database connection."""
    db = await get_database()
    yield db


# Dependency for injecting Redis
async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    """FastAPI dependency for Redis connection."""
    redis = await get_redis_client()
    yield redis


# Cleanup functions
async def close_mongodb_connection():
    """Close MongoDB connection on application shutdown."""
    global _mongodb_client
    if _mongodb_client is not None:
        _mongodb_client.close()
        _mongodb_client = None


async def close_redis_connection():
    """Close Redis connection on application shutdown."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None
