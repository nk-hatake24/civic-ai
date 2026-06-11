# backend/tests/test_mcp_manual.py
import asyncio
from fastmcp import Client          # ✅ Client, pas le serveur
from app.mcp.tools import mcp
from app.db.mongoDB import connect_mongo, close_mongo
from app.db.redis import connect_redis, close_redis

async def test_mcp_locally():
    print("--- 🧪 Async Manual MCP Test ---")

    await connect_mongo()
    await connect_redis()

    try:
        async with Client(mcp) as client:

            # 1. Lister les outils
            print("\n📦 Registered Tools:")
            tools = await client.list_tools()
            for t in tools:
                print(f" - {t.name}  |  inputSchema: {t.inputSchema}")

            # 2. Appeler l'outil — NOM CORRECT : get_development_indicator
            print("\n🚀 Executing 'get_development_indicator' via MCP Client...")
            result = await client.call_tool(
                "get_development_indicator",             # ✅ nom corrigé
                arguments={"indicator": "GDP", "country_code": "CM"}
            )

            print("\n📊 Raw Result:")
            print(result)

            result_str = str(result)
            if "GDP" in result_str or "World Bank" in result_str:
                print("\n✅ MCP Tool Test: SUCCESS")
            else:
                print("\n❌ MCP Tool Test: FAILED (unexpected data structure)")

    except Exception as e:
        import traceback
        print(f"\n❌ Execution Error: {e}")
        traceback.print_exc()           # ✅ Stack trace complet pour débugger

    finally:
        await close_mongo()
        await close_redis()
        print("\n--- Test Finished ---")

if __name__ == "__main__":
    asyncio.run(test_mcp_locally())