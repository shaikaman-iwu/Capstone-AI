from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "GrantMatch AI API"
    frontend_origin: str = "http://localhost:5173"
    database_url: str = "sqlite:///./grantmatch.db"
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    pinecone_api_key: str | None = None
    pinecone_index: str | None = None
    auth_required: bool = True
    demo_user_password: str = "grantmatch-demo"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
