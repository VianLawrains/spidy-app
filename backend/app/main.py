import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init_db
from app.api import auth, chat, tools, docs, images, news
from app.services.llm_router import llm_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    await init_db()
    print("🚀 [Spidy Backend] Database initialized & server ready!")
    yield
    print("🛑 [Spidy Backend] Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Parse Production CORS Origins
cors_origins_env = os.getenv("CORS_ORIGINS", "").strip()
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

# Default local development & production fallback origins if CORS_ORIGINS is not set
if not allowed_origins:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Production Health Check Endpoints
@app.get("/")
@app.get("/health")
@app.get("/api/health")
@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs"
    }

# Register API Routers (Mount under both /api/v1 and /api for maximum compatibility)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix="/api")

app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix="/api")

app.include_router(tools.router, prefix=settings.API_V1_STR)
app.include_router(tools.router, prefix="/api")

app.include_router(docs.router, prefix=settings.API_V1_STR)
app.include_router(docs.router, prefix="/api")

app.include_router(images.router, prefix=settings.API_V1_STR)
app.include_router(images.router, prefix="/api")

app.include_router(news.router, prefix=settings.API_V1_STR)
app.include_router(news.router, prefix="/api")

# Real-Time WebSocket Endpoint for Streaming Chat & Voice Response
@app.websocket("/ws/chat")
async def websocket_chat_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            raw_data = await websocket.receive_text()
            payload = json.loads(raw_data)
            prompt = payload.get("message", "")
            model = payload.get("model", "gemini-3.6-flash")
            
            messages = [{"role": "user", "content": prompt}]
            
            # Stream tokens
            async for chunk in llm_router.stream_response(messages, model=model):
                await websocket.send_json({"type": "chunk", "content": chunk})
            
            await websocket.send_json({"type": "done"})
    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected cleanly.")
    except Exception as e:
        print(f"[WebSocket] Error: {e}")
