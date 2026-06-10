# backend/app/services/worldbank.py
import httpx
import json
from app.config import get_settings
from app.db.redis import get_redis, connect_redis # Import connect_redis as backup

class WorldBankClient:
    def __init__(self):
        self.settings = get_settings()
        self.base_url = "https://api.worldbank.org/v2"

    async def _get_with_cache(self, path: str, params: dict = {}):
        # 1. Try to get redis. If None, try one quick reconnect
        redis = get_redis()
        if redis is None:
            try:
                redis = await connect_redis()
            except:
                redis = None

        cache_key = f"wb_cache:{path}:{json.dumps(params, sort_keys=True)}"
        
        # 2. Check Cache (Only if redis is available)
        if redis:
            try:
                cached = await redis.get(cache_key)
                if cached: return json.loads(cached)
            except Exception as e:
                print(f"⚠️ Redis Read Error: {e}")

        # 3. Fetch from World Bank
        actual_params = params.copy()
        actual_params.update({"format": "json", "per_page": 50})
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{self.base_url}/{path}", params=actual_params)
            response.raise_for_status()
            data = response.json()

        # 4. Save to Cache (Only if redis is available)
        if redis:
            try:
                await redis.setex(cache_key, 86400, json.dumps(data))
            except Exception as e:
                print(f"⚠️ Redis Write Error: {e}")
            
        return data

    async def get_indicator(self, indicator_code: str, country: str = "CM"):
        path = f"country/{country}/indicator/{indicator_code}"
        data = await self._get_with_cache(path, {"date": "2013:2023"})
        if data and isinstance(data, list) and len(data) > 1:
            return [{"year": r["date"], "value": r["value"]} for r in data[1] if r["value"]]
        return []

worldbank_client = WorldBankClient()