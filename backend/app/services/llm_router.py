import os
import json
import time
import logging
import asyncio
import traceback
import httpx
from typing import AsyncGenerator, List, Dict, Any
from app.core.config import settings

# Configure logger for LLM Router
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SpidyLLMRouter")

SPIDY_SYSTEM_PROMPT = """You are Spidy AI, an intelligent, versatile AI assistant.

COMMUNICATION STYLE & GUIDELINES:
- Default Tone: Maintain a clear, professional, articulate, and direct tone by default.
- Persona & Roleplay: If the user explicitly asks you to speak in a specific fictional persona, character style (e.g., Batman, Yoda, Iron Man, Sherlock Holmes), or tone, fulfill their request dynamically while preserving core safety rules. Do not refuse persona or character roleplay requests.
- Expertise: Expert in Software Architecture, Python, Full-Stack Engineering, SQL, System Design, and Technical Strategy.
"""

ACTIVE_GEMINI_MODEL = "gemini-3.6-flash"

class LLMRouter:
    def __init__(self):
        self._gemini_client_cache = {}

    def get_api_key(self, provider: str) -> str:
        """Dynamically fetch API key from settings or environment variables"""
        if provider == "gemini":
            return os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        elif provider == "openai":
            return os.getenv("OPENAI_API_KEY") or settings.OPENAI_API_KEY
        elif provider == "claude":
            return os.getenv("ANTHROPIC_API_KEY") or settings.ANTHROPIC_API_KEY
        return ""

    def _get_gemini_client(self, api_key: str):
        """Lazy-initialize and cache Google GenAI client with a strict 12-second HTTP deadline to prevent high-latency stalls"""
        from google import genai
        from google.genai import types

        clean_key = api_key.strip()
        if clean_key not in self._gemini_client_cache:
            self._gemini_client_cache[clean_key] = genai.Client(
                api_key=clean_key,
                http_options=types.HttpOptions(timeout=12000)
            )
        return self._gemini_client_cache[clean_key]

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemini-3.6-flash",
        system_extra: str = "",
        memory_context: str = ""
    ) -> str:
        """Main LLM response generator routing to Google GenAI, OpenAI, Claude, or Ollama"""
        
        full_system_prompt = f"{SPIDY_SYSTEM_PROMPT}\n{system_extra}\n{memory_context}".strip()
        model_name = (model or "").lower().strip()
        user_prompt = messages[-1]["content"] if messages else ""

        # 1. Gemini Provider (Default and Primary)
        if "gemini" in model_name or not model_name or any(ver in model_name for ver in ["1.5", "2.5", "2.0", "flash", "pro"]):
            gemini_key = self.get_api_key("gemini")
            key_detected = bool(gemini_key and len(gemini_key.strip()) > 5)

            logger.info("=== [LLM Request Pipeline Audit] ===")
            logger.info("-> Selected Provider: Google GenAI SDK")
            logger.info(f"-> Active Model: {ACTIVE_GEMINI_MODEL}")
            logger.info(f"-> API Key Detected: {key_detected}")

            if not key_detected:
                error_msg = "⚠️ [Configuration Error]: GEMINI_API_KEY is missing or empty in server environment (.env). Please configure GEMINI_API_KEY on Render."
                logger.error(error_msg)
                return error_msg

            try:
                response = await self._call_gemini_genai_sdk(messages, full_system_prompt, gemini_key.strip())
                logger.info(f"-> Gemini Response Received ({len(response)} chars)")
                return response
            except Exception as e:
                err_str = str(e).lower()
                # Detect 429 Quota Exhaustion separately without exposure
                if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
                    user_msg = "Spidy AI's Gemini API quota is temporarily unavailable. Please try again later."
                    logger.warning(f"[Gemini Quota Exceeded]: {e}")
                    return user_msg

                # Handle 504 Deadline Exceeded, timeouts, and transient exceptions cleanly without exposing raw Python tracebacks
                logger.error(f"❌ [Gemini API Error/Timeout]: {str(e)}")
                return "Spidy AI is temporarily unable to reach Gemini. Please try again."

        # 2. OpenAI Provider
        if "gpt" in model_name or "openai" in model_name:
            openai_key = self.get_api_key("openai")
            if not openai_key:
                return "⚠️ [Configuration Error]: OPENAI_API_KEY is missing in server environment."
            try:
                return await self._call_openai(messages, full_system_prompt, openai_key.strip())
            except Exception as e:
                return f"❌ [OpenAI API Exception]: {str(e)}"

        # 3. Anthropic Claude Provider
        if "claude" in model_name:
            claude_key = self.get_api_key("claude")
            if not claude_key:
                return "⚠️ [Configuration Error]: ANTHROPIC_API_KEY is missing in server environment."
            try:
                return await self._call_claude(messages, full_system_prompt, claude_key.strip())
            except Exception as e:
                return f"❌ [Claude API Exception]: {str(e)}"

        # 4. Ollama Local Provider
        if "ollama" in model_name:
            try:
                return await self._call_ollama(messages, full_system_prompt)
            except Exception as e:
                return f"❌ [Ollama Local API Error]: {str(e)}"

        # Fallback to Gemini
        gemini_key = self.get_api_key("gemini")
        if gemini_key:
            return await self._call_gemini_genai_sdk(messages, full_system_prompt, gemini_key.strip())
        return "⚠️ [Configuration Error]: No valid AI Provider API keys found in server environment."

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemini-3.6-flash",
        memory_context: str = ""
    ) -> AsyncGenerator[str, None]:
        full_text = await self.generate_response(messages, model, memory_context=memory_context)
        words = full_text.split(" ")
        for i in range(0, len(words), 2):
            chunk = " ".join(words[i:i+2]) + (" " if i+2 < len(words) else "")
            yield chunk

    def _sync_gemini_call(self, user_prompt: str, system_prompt: str, api_key: str) -> str:
        """Synchronous worker function executing single fast request with strict 12s deadline"""
        from google.genai import types
        
        client = self._get_gemini_client(api_key)
        
        try:
            res = client.models.generate_content(
                model=ACTIVE_GEMINI_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt
                )
            )
            if res and hasattr(res, 'text') and res.text:
                return res.text
        except Exception as e:
            logger.warning(f"[Gemini Single Call Exception]: {e}")
            raise e

        raise RuntimeError("Gemini API returned an empty response.")

    async def _call_gemini_genai_sdk(self, messages: List[Dict[str, str]], system_prompt: str, api_key: str) -> str:
        """Call Google GenAI SDK asynchronously via thread pool to maintain high event loop responsiveness"""
        user_prompt = messages[-1]["content"] if messages else "Hello"
        logger.info(f"Dispatching async thread call to Google GenAI SDK model: {ACTIVE_GEMINI_MODEL}")
        return await asyncio.to_thread(self._sync_gemini_call, user_prompt, system_prompt, api_key)

    async def _call_openai(self, messages: List[Dict[str, str]], system_prompt: str, api_key: str) -> str:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key)
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages
        res = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=formatted_messages
        )
        return res.choices[0].message.content

    async def _call_claude(self, messages: List[Dict[str, str]], system_prompt: str, api_key: str) -> str:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 1024,
                    "system": system_prompt,
                    "messages": [{"role": m["role"], "content": m["content"]} for m in messages]
                }
            )
            data = res.json()
            if "content" in data and len(data["content"]) > 0:
                return data["content"][0]["text"]
            raise RuntimeError(f"Claude API returned unexpected payload: {data}")

    async def _call_ollama(self, messages: List[Dict[str, str]], system_prompt: str) -> str:
        async with httpx.AsyncClient(timeout=15.0) as client:
            formatted_messages = [{"role": "system", "content": system_prompt}] + messages
            res = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": "llama3",
                    "messages": formatted_messages,
                    "stream": False
                }
            )
            data = res.json()
            return data["message"]["content"]

llm_router = LLMRouter()
