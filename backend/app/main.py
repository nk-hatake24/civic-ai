from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.db.mongoDB import connect_mongo, close_mongo, create_indexes
from app.db.redis import connect_redis, close_redis
from app.auth.router import router as auth_router
from app.chat.router import router as chat_router
from app.conversations.router import router as conv_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await connect_mongo()
    await create_indexes()
    await connect_redis()
    yield
    # Shutdown logic
    await close_mongo()
    await close_redis()

def create_app():
    settings = get_settings()
    app = FastAPI(title="CivicAI", lifespan=lifespan)

    # CORS configuration for Frontend (Next.js)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include all our modules
    app.include_router(auth_router)
    app.include_router(chat_router)
    app.include_router(conv_router)

    @app.get("/health")
    def health():
        return {"status": "ok", "version": settings.app_version}

    return app

app = create_app()