import uuid
import json
import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from arq import create_pool
from app.dependencies import get_current_user, CurrentUser
from app.db.redis import get_redis
from app.worker.queue import get_redis_settings
from pydantic import BaseModel

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Timeout max d'attente pour un job (en secondes)
SSE_TIMEOUT_SECONDS = 120
SSE_POLL_INTERVAL = 0.5


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None  # ✅ Fix Pydantic v2


@router.post("")
async def start_chat(req: ChatRequest, user: CurrentUser = Depends(get_current_user)):
    job_id = str(uuid.uuid4())
    conv_id = req.conversation_id or str(uuid.uuid4())

    # ✅ Fermer le pool après usage pour éviter la fuite de connexions
    arq_pool = await create_pool(get_redis_settings())
    try:
        await arq_pool.enqueue_job(
            "process_chat_task",
            job_id=job_id,
            user_id=user.id,
            conversation_id=conv_id,
            message=req.message
        )
    finally:
        await arq_pool.aclose()

    return {"job_id": job_id, "conversation_id": conv_id}


@router.get("/stream/{job_id}")
async def stream_chat_events(
    job_id: str,
    request: Request,  # ✅ Pour détecter la déconnexion client
    user: CurrentUser = Depends(get_current_user)
):
    """SSE Endpoint: Streams tool usage and final answer from Redis."""
    redis = get_redis()

    async def event_generator():
        key = f"sse:{job_id}"
        last_index = 0
        elapsed = 0.0

        # ✅ Heartbeat pour éviter les timeouts des proxies
        yield ": heartbeat\n\n"

        while True:
            # ✅ Détecter la déconnexion du client
            if await request.is_disconnected():
                print(f"Client disconnected from job {job_id}")
                return

            # ✅ Timeout global pour éviter les streams infinis
            if elapsed >= SSE_TIMEOUT_SECONDS:
                yield f"data: {json.dumps({'type': 'error', 'data': {'message': 'Stream timeout'}})}\n\n"
                return

            events = await redis.lrange(key, last_index, -1)
            for event in events:
                yield f"data: {event}\n\n"
                last_index += 1

                data = json.loads(event)
                if data["type"] in ["final_answer", "error"]:
                    return

            await asyncio.sleep(SSE_POLL_INTERVAL)
            elapsed += SSE_POLL_INTERVAL

    # ✅ Headers obligatoires pour SSE en production (nginx, Cloudflare, etc.)
    headers = {
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",       # Désactive le buffering nginx
        "Connection": "keep-alive",
    }

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers=headers
    )