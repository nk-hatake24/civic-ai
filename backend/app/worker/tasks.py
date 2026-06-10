# app/worker/tasks.py
import json
import time
from datetime import datetime, timezone
from fastmcp import Client  # ✅ Utiliser le Client, pas le serveur directement
from app.db.mongoDB import get_database
from app.db.redis import get_redis
from app.services.ai_multi_provider import ai_service
from app.mcp.tools import mcp  # ton instance FastMCP serveur

async def push_event(job_id: str, event_type: str, data: dict):
    """Helper to push status updates to the frontend via Redis"""
    redis = get_redis()
    payload = json.dumps({"type": event_type, "data": data})
    await redis.rpush(f"sse:{job_id}", payload)
    await redis.expire(f"sse:{job_id}", 600)


async def get_mcp_tool_schemas() -> list[dict]:
    try:
        async with Client(mcp) as client:
            tools = await client.list_tools()
            
            # 🔍 DEBUG — retire cette ligne une fois que ça marche
            if tools:
                print(f"DEBUG tool type: {type(tools[0])}")
                print(f"DEBUG tool attrs: {vars(tools[0]) if hasattr(tools[0], '__dict__') else dir(tools[0])}")
            
            schemas = []
            for t in tools:
                parameters = getattr(t, "inputSchema", None) or {"type": "object", "properties": {}}
                schemas.append({
                    "type": "function",
                    "function": {
                        "name": t.name,
                        "description": t.description or "",
                        "parameters": parameters
                    }
                })
            return schemas
    except Exception as e:
        print(f"⚠️ Failed to list MCP tools schema: {e}")
        return []


async def process_chat_task(ctx, job_id: str, user_id: str, conversation_id: str, message: str):
    db = get_database()

    # 1. Récupération de l'historique
    cursor = db.messages.find(
        {"conversation_id": conversation_id, "user_id": user_id}
    ).sort("created_at", 1)
    history_docs = await cursor.to_list(length=10)

    messages = [{"role": "system", "content": "You are a helpful eGov assistant for CivicAI."}]
    for doc in history_docs:
        messages.append({"role": doc["role"], "content": doc["content"]})
    messages.append({"role": "user", "content": message})

    # 2. Sauvegarde du message utilisateur
    await db.messages.insert_one({
        "conversation_id": conversation_id,
        "user_id": user_id,
        "role": "user",
        "content": message,
        "created_at": datetime.now(timezone.utc)
    })

    try:
        await push_event(job_id, "status", {"message": "AI is thinking..."})

        # 3. Récupération des schémas MCP
        tool_schemas = await get_mcp_tool_schemas()

        # 4. Premier appel LLM avec outils
        response_obj, provider_info = await ai_service.generate_response(messages, tools=tool_schemas)

        # 5. Agentic Loop si l'IA veut appeler un outil
        if response_obj.tool_calls:
            tool_calls_frontend = []

            # ✅ Ouvrir le client une seule fois pour tous les appels d'outils
            async with Client(mcp) as client:
                for tc in response_obj.tool_calls:
                    tool_name = tc["function"]["name"]
                    tool_args = tc["function"]["arguments"]
                    tool_id = tc["id"]

                    # ✅ Désérialiser les arguments si nécessaire
                    if isinstance(tool_args, str):
                        try:
                            tool_args = json.loads(tool_args)
                        except json.JSONDecodeError:
                            tool_args = {}

                    await push_event(job_id, "tool_start", f"Running World Bank tool: {tool_name}")
                    print(f"🛠️ Worker executing MCP tool: '{tool_name}' with arguments: {tool_args}")

                    start_time = int(time.time() * 1000)
                    tool_error = None
                    tool_result_str = ""

                    try:
                        # ✅ Appel via Client — c'est l'API correcte
                        tool_result = await client.call_tool(tool_name, arguments=tool_args)

                        # ✅ FastMCP retourne une liste de TextContent/ImageContent etc.
                        if isinstance(tool_result, list):
                            tool_result_str = "".join([
                                c.text for c in tool_result if hasattr(c, "text")
                            ])
                        else:
                            tool_result_str = str(tool_result)

                    except Exception as ex:
                        tool_error = str(ex)
                        tool_result_str = f"Error during tool call execution: {tool_error}"

                    end_time = int(time.time() * 1000)

                    # ✅ Injecter le résultat dans l'historique pour le 2ème appel LLM
                    messages.append({
                        "role": "assistant",
                        "content": response_obj.content or "",
                        "tool_calls": [{
                            "id": tool_id,
                            "type": "function",
                            "function": {
                                "name": tool_name,
                                "arguments": json.dumps(tool_args) if isinstance(tool_args, dict) else tool_args
                            }
                        }]
                    })

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_id,
                        "name": tool_name,
                        "content": tool_result_str
                    })

                    tool_calls_frontend.append({
                        "id": tool_id,
                        "name": tool_name,
                        "status": "error" if tool_error else "success",
                        "startTime": start_time,
                        "endTime": end_time,
                        "input": tool_args,
                        "result": tool_result_str if not tool_error else None,
                        "error": tool_error
                    })

            await push_event(job_id, "status", {"message": "Analyzing retrieved World Bank data..."})

            # 6. Deuxième appel LLM pour synthétiser
            final_response_obj, provider_info = await ai_service.generate_response(messages)
            final_text = final_response_obj.content

        else:
            final_text = response_obj.content
            tool_calls_frontend = []

        # 7. Sauvegarde de la réponse
        await db.messages.insert_one({
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "assistant",
            "content": final_text,
            "provider": provider_info,
            "created_at": datetime.now(timezone.utc)
        })

        # 8. Push SSE final
        await push_event(job_id, "final_answer", {
            "text": final_text,
            "source": provider_info,
            "toolCalls": tool_calls_frontend
        })

    except Exception as e:
        print(f"❌ Error in process_chat_task: {e}")
        await push_event(job_id, "error", {"message": str(e)})