from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings
from typing import Optional

_client: Optional[AsyncIOMotorClient] = None

async def connect_mongo():
    global _client
    settings = get_settings()
    # Initialize the Async client
    _client = AsyncIOMotorClient(settings.mongodb_url)
    # Check if connection is successful
    await _client.admin.command("ping")

async def close_mongo():
    global _client
    if _client:
        _client.close()

def get_database():
    settings = get_settings()
    return _client[settings.mongodb_db_name]

async def create_indexes():
    """Build indexes for performance and security."""
    db = get_database()
    # 1. Ensure emails are unique
    await db.users.create_index("email", unique=True)
    # 2. Scope conversations to user_id for isolation
    await db.conversations.create_index([("user_id", 1), ("updated_at", -1)])
    # 3. Scope messages to conversation AND user
    await db.messages.create_index([("conversation_id", 1), ("user_id", 1), ("created_at", 1)])