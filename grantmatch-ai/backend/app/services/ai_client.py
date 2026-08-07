from __future__ import annotations

from app.core.config import settings


class AIClient:
    def __init__(self) -> None:
        self.openai_enabled = bool(settings.openai_api_key)
        self.anthropic_enabled = bool(settings.anthropic_api_key)

    def has_live_provider(self) -> bool:
        return self.openai_enabled or self.anthropic_enabled

    def provider_label(self) -> str:
        if self.openai_enabled:
            return "OpenAI"
        if self.anthropic_enabled:
            return "Anthropic"
        return "Local fallback"
