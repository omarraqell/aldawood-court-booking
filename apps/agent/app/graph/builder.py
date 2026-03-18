from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from app.config import settings
from app.graph.prompts.system_prompt import build_system_prompt
from app.tools.backend_tools import agent_tools


def prompt_fn(state: dict) -> list:
    system_prompt = build_system_prompt(
        policies=state.get("policies", {}),
        packages=state.get("packages", []),
        active_bookings=state.get("active_bookings", []),
        customer=state.get("customer", {}),
    )
    return [SystemMessage(content=system_prompt)] + list(state.get("messages", []))


llm = ChatOpenAI(
    api_key=settings.openai_api_key,
    model=settings.openai_model,
    temperature=0,
)

graph = create_react_agent(
    model=llm,
    tools=agent_tools,
    state_modifier=prompt_fn,
)
