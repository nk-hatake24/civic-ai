# backend/app/worker/queue.py
from arq.connections import RedisSettings
from app.config import get_settings
from urllib.parse import urlparse
from app.db.mongoDB import connect_mongo, close_mongo  # Use your filename (mongo or mongoDB)
from app.db.redis import connect_redis, close_redis

def get_redis_settings() -> RedisSettings:
    settings = get_settings()
    url = urlparse(settings.redis_url)
    return RedisSettings(
        host=url.hostname or "localhost",
        port=url.port or 6379,
        password=url.password,
        ssl=url.scheme == "rediss",
    )

async def startup(ctx):
    """This runs when the worker starts"""
    print("--- Worker: Connecting to Databases ---")
    await connect_mongo()
    await connect_redis()
    print("--- Worker: Databases Connected ---")

async def shutdown(ctx):
    """This runs when the worker stops"""
    await close_mongo()
    await close_redis()

class WorkerSettings:
    """ARQ worker configuration."""
    from app.worker.tasks import process_chat_task
    
    functions = [process_chat_task]
    redis_settings = get_redis_settings()
    
    # ADD THESE TWO LINES:
    on_startup = startup
    on_shutdown = shutdown
    
    max_jobs = 5
    job_timeout = 300