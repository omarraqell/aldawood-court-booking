import asyncio
import logging
import traceback
import sys

# Workaround for Pydantic v1 incompatibility with Python 3.14
if sys.version_info >= (3, 14):
    real_version_info = sys.version_info
    class MockVersionInfo(tuple):
        @property
        def major(self): return 3
        @property
        def minor(self): return 13
        @property
        def micro(self): return 0
        @property
        def releaselevel(self): return "final"
        @property
        def serial(self): return 0
        def __ge__(self, other):
            if isinstance(other, tuple) and len(other) >= 2 and other[0] == 3 and other[1] == 14:
                return False
            return real_version_info >= other
    sys.version_info = MockVersionInfo((3, 13, 0, "final", 0))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.schemas.chat import ChatRequest
from app.services.agent_service import agent_service
from app.telegram_bot import create_telegram_app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

telegram_app = create_telegram_app()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start Telegram bot polling on startup, stop on shutdown."""
    if telegram_app:
        await telegram_app.initialize()
        await telegram_app.start()
        await telegram_app.updater.start_polling()
        logger.info("Telegram bot started polling.")
    yield
    if telegram_app:
        await telegram_app.updater.stop()
        await telegram_app.stop()
        await telegram_app.shutdown()
        logger.info("Telegram bot stopped.")


app = FastAPI(title="Aldawood Booking Agent", version="0.3.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def test_ui():
    ui_path = os.path.join(os.path.dirname(__file__), "..", "test-ui.html")
    return FileResponse(ui_path)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "agent"}


@app.post("/chat")
async def chat(payload: ChatRequest):
    try:
        return await agent_service.run(
            message=payload.message,
            phone=payload.phone or "",
            conversation_id=payload.conversation_id or "",
        )
    except Exception as e:
        tb = traceback.format_exc()
        return JSONResponse(status_code=500, content={"error": str(e), "traceback": tb})
