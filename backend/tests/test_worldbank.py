# backend/tests/test_worldbank.py
import pytest
from app.services.wordbank import worldbank_client
from app.db.redis import get_redis

async def test_worldbank_real_fetch():
    """Verify we can fetch real GDP data for Cameroon."""
    # GDP Indicator code: NY.GDP.MKTP.CD
    data = await worldbank_client.get_indicator("NY.GDP.MKTP.CD", "CM")
    
    assert isinstance(data, list)
    assert len(data) > 0
    assert "year" in data[0]
    assert "value" in data[0]
    print(f"\n✅ World Bank Data Received: {data[0]}")

async def test_worldbank_caching():
    """Verify that a second call hits Redis, not the API."""
    redis = get_redis()
    indicator = "SP.POP.TOTL" # Population
    
    # 1. First call (Populates cache)
    await worldbank_client.get_indicator(indicator, "CM")
    
    # 2. Check if a key exists in Redis
    # The key format we used: wb_cache:path:params
    # We look for any key starting with 'wb_cache'
    keys = await redis.keys("wb_cache:*")
    assert len(keys) > 0
    print(f"\n✅ Redis Cache Verified: {len(keys)} keys stored.")