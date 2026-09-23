import json
import logging
from typing import Dict, Any, Optional
import httpx
from backend.app.config import settings

logger = logging.getLogger("groq_service")


class GroqService:
    """
    Direct client for Groq API.
    Isolates low-level HTTP requests and error handling so application code
    remains completely decoupled from Groq internals.
    """

    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

    @classmethod
    def is_configured(cls) -> bool:
        """Checks if Groq API key is present."""
        return bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())

    @classmethod
    def generate_chat_completion(
        cls,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        json_mode: bool = False,
        timeout_seconds: float = 12.0
    ) -> Optional[str]:
        """
        Sends a chat completion request to the Groq API.
        Returns the text response or None on failure without throwing uncaught exceptions.
        """
        if not cls.is_configured():
            logger.info("Groq API key not configured. Using fallback service.")
            return None

        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY.strip()}",
            "Content-Type": "application/json",
        }

        payload: Dict[str, Any] = {
            "model": settings.GROQ_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature,
        }

        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            with httpx.Client(timeout=timeout_seconds) as client:
                response = client.post(cls.GROQ_API_URL, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error(f"Groq API returned HTTP {response.status_code}: {response.text}")
                    return None

                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return content.strip()

        except httpx.TimeoutException:
            logger.warning("Groq API request timed out.")
            return None
        except Exception as e:
            logger.error(f"Groq API invocation failed: {str(e)}")
            return None
