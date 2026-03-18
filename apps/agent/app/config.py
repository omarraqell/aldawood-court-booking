from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = Field(default="replace_me", alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-5-mini", alias="OPENAI_MODEL")
    backend_api_url: str = Field(default="http://localhost:4000/api", alias="BACKEND_API_URL")
    agent_port: int = Field(default=8000, alias="AGENT_PORT")
    telegram_bot_token: str = Field(default="", alias="TELEGRAM_BOT_TOKEN")
    webhook_url: str = Field(default="", alias="WEBHOOK_URL")


settings = Settings()
