# backend/tests/diagnose_mcp.py
import asyncio
from app.mcp.tools import mcp

async def diagnose():
    print("--- 🔍 CivicAI MCP Diagnostic ---")
    
    # 1. List all available attributes
    attributes = dir(mcp)
    print("\nAvailable attributes on your 'mcp' object:")
    for attr in attributes:
        if not attr.startswith("__"): # Hide private Python methods
            print(f" - {attr}")

    # 2. Try to find the tools automatically
    print("\nLooking for tool registry...")
    found_tools = False
    for attr in ["tools", "_tools", "tool_manager", "_tool_manager"]:
        if hasattr(mcp, attr):
            val = getattr(mcp, attr)
            print(f"✅ Found tool storage in: mcp.{attr}")
            print(f"   Value: {val}")
            found_tools = True
            break
    
    if not found_tools:
        print("❌ Could not find tool storage automatically.")

if __name__ == "__main__":
    asyncio.run(diagnose())