# backend/tests/test_infrastructure.py
import pytest
from app.db.mongoDB import get_database # Check if your file is mongo.py or mongoDB.py
from app.db.redis import get_redis

async def test_mongodb_connection():
    """Test if we can ping and write to MongoDB."""
    db = get_database()
    
    # Test Ping
    ping_result = await db.command("ping")
    assert ping_result["ok"] == 1.0
    
    # Test Write/Read
    test_collection = db["test_connection"]
    await test_collection.insert_one({"status": "working"})
    found = await test_collection.find_one({"status": "working"})
    
    assert found is not None
    assert found["status"] == "working"
    
    # Cleanup
    await test_collection.delete_many({})

async def test_redis_connection():
    """Test if we can ping and set/get values in Redis."""
    redis = get_redis()
    
    # Test Ping
    pong = await redis.ping()
    assert pong is True
    
    # Test Set/Get
    await redis.set("test_key", "civicai_is_live")
    value = await redis.get("test_key")
    
    assert value == "civicai_is_live"
    
    # Cleanup
    await redis.delete("test_key")