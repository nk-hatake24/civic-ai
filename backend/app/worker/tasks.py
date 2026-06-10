import json
from datetime import datetime, timezone
from app.db.mongoDB import get_database  
from app.db.redis import get_redis     
from app.services.ai_multi_provider import ai_service

async def push_event(job_id: str, event_type: str, data: dict):
    """Helper to push status updates to the frontend via Redis"""
    redis = get_redis()
    payload = json.dumps({"type": event_type, "data": data})
    await redis.rpush(f"sse:{job_id}", payload)
    await redis.expire(f"sse:{job_id}", 600)

async def process_chat_task(ctx, job_id: str, user_id: str, conversation_id: str, message: str):
    db = get_database()
    
    # 1. Fetch History (Scoped to user_id)
    cursor = db.messages.find({"conversation_id": conversation_id, "user_id": user_id}).sort("created_at", 1)
    history_docs = await cursor.to_list(length=10)
    
    messages = [{"role": "system", "content": "You are a helpful eGov assistant for CivicAI."}]
    for doc in history_docs:
        messages.append({"role": doc["role"], "content": doc["content"]})
    messages.append({"role": "user", "content": message})

    # 2. Save User Message
    await db.messages.insert_one({
        "conversation_id": conversation_id,
        "user_id": user_id,
        "role": "user",
        "content": message,
        "created_at": datetime.now(timezone.utc)
    })

    try:
        await push_event(job_id, "status", {"message": "AI is thinking..."})
        
        # 3. Call Multi-Provider
        final_text, provider_info = await ai_service.generate_response(messages)

        # 4. Save Assistant Answer
        await db.messages.insert_one({
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "assistant",
            "content": final_text,
            "provider": provider_info,
            "created_at": datetime.now(timezone.utc)
        })

        await push_event(job_id, "final_answer", {"text": final_text, "source": provider_info})

    except Exception as e:
        await push_event(job_id, "error", {"message": str(e)})