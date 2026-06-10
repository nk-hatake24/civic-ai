# backend/app/db/redis.py
import redis.asyncio as aioredis
from app.config import get_settings
from typing import Optional
import asyncio

_redis: Optional[aioredis.Redis] = None

async def connect_redis():
    global _redis
    if _redis is not None:
        return _redis
        
    settings = get_settings()
    
    _redis = aioredis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
        ssl_cert_reqs=None,
        socket_timeout=10.0,      # Don't wait forever
        socket_connect_timeout=10.0,
        retry_on_timeout=True
    )
    await _redis.ping()
    return _redis

def get_redis():
    """Returns the redis client, or raises error if not connected"""
    global _redis
    if _redis is None:
       
        return None 
    return _redis

async def close_redis():
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None