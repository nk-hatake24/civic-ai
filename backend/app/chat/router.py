import uuid
import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from arq import create_pool
from app.dependencies import get_current_user, CurrentUser
from app.db.redis import get_redis
from app.worker.queue import get_redis_settings
from pydantic import BaseModel

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    conversation_id: str = None # If None, create new

@router.post("")
async def start_chat(req: ChatRequest, user: CurrentUser = Depends(get_current_user)):
    # 1. Generate IDs
    job_id = str(uuid.uuid4())
    conv_id = req.conversation_id or str(uuid.uuid4())
    
    # 2. Connect to the Job Queue (Redis)
    arq_pool = await create_pool(get_redis_settings())
    
    # 3. Enqueue the task for the worker
    await arq_pool.enqueue_job(
        "process_chat_task",
        job_id=job_id,
        user_id=user.id,
        conversation_id=conv_id,
        message=req.message
    )
    
    return {"job_id": job_id, "conversation_id": conv_id}

@router.get("/stream/{job_id}")
async def stream_chat_events(job_id: str, user: CurrentUser = Depends(get_current_user)):
    """SSE Endpoint: Streams tool usage and final answer from Redis."""
    redis = get_redis()

    async def event_generator():
        key = f"sse:{job_id}"
        last_index = 0
        
        while True:
            # Check for new events in the Redis list
            events = await redis.lrange(key, last_index, -1)
            for event in events:
                yield f"data: {event}\n\n"
                last_index += 1
                
                # Stop streaming if we get a final answer or error
                data = json.loads(event)
                if data["type"] in ["final_answer", "error"]:
                    return
            
            await asyncio.sleep(0.5) # Poll every 500ms

    return StreamingResponse(event_generator(), media_type="text/event-stream")