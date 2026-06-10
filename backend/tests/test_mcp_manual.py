# backend/tests/test_mcp_manual.py
import asyncio
from app.mcp.tools import mcp
from app.db.mongoDB import connect_mongo, close_mongo
from app.db.redis import connect_redis, close_redis

async def test_mcp_locally():
    print("--- 🧪 Async Manual MCP Test (Fixed) ---")
    
    # 1. Connect to Infrastructure
    await connect_mongo()
    await connect_redis()
    
    try:
        # 2. Await the list_tools() coroutine
        print("\n📦 Registered Tools:")
        # We MUST await this because it's a coroutine
        tools = await mcp.list_tools() 
        
        for t in tools:
            # t is usually a Tool object with a .name attribute
            name = getattr(t, 'name', str(t))
            print(f" - {name}")

        # 3. Execute the tool
        print("\n🚀 Executing 'get_economic_indicator' via MCP...")
        
        # This was already awaited, but the script stopped earlier at list_tools
        result = await mcp.call_tool(
            "get_economic_indicator", 
            arguments={"indicator": "GDP", "country_code": "CM"}
        )
        
        print("\n📊 Raw Result from MCP:")
        # MCP results are often a list of TextContent objects
        print(result)

        # 4. Final Verification
        result_str = str(result)
        if "GDP" in result_str or "World Bank" in result_str:
            print("\n✅ MCP Tool Test: SUCCESS")
        else:
            print("\n❌ MCP Tool Test: FAILED (Data structure unexpected)")

    except Exception as e:
        print(f"\n❌ Execution Error: {str(e)}")
    
    finally:
        # 5. Proper Cleanup
        await close_mongo()
        await close_redis()
        print("\n--- Test Finished ---")

if __name__ == "__main__":
    asyncio.run(test_mcp_locally())