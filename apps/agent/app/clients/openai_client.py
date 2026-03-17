from langchain_openai import ChatOpenAI

from app.config import settings


def build_llm() -> ChatOpenAI:
    return ChatOpenAI(
        api_key=settings.openai_api_key,
        model=settings.openai_model,
        temperature=0,
    )
