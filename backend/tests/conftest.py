# backend/tests/conftest.py
import pytest
from app.db.mongoDB import connect_mongo, close_mongo
from app.db.redis import connect_redis, close_redis

# We set scope to "session" so it only connects once for all tests
@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    """Automatically connect to DBs before running tests and close after."""
    print("\n--- Testing: Connecting to Infrastructure ---")
    await connect_mongo()
    await connect_redis()
    yield
    print("\n--- Testing: Cleaning up Connections ---")
    await close_mongo()
    await close_redis()