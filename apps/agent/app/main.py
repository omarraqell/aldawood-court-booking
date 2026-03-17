import traceback

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas.chat import ChatRequest
from app.services.agent_service import agent_service

app = FastAPI(title="Aldawood Booking Agent", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
