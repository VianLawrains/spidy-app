import os
import json
import logging
import traceback
import httpx
from typing import AsyncGenerator, List, Dict, Any
from app.core.config import settings

# Configure logger for LLM Router
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SpidyLLMRouter")

SPIDY_SYSTEM_PROMPT = """You are Spidy AI, a professional, high-performance AI assistant.

COMMUNICATION STYLE & GUIDELINES:
- Maintain a formal, professional, polite, and articulate tone.
- Do NOT use superhero roleplay, jokes, puns, or informal slang.
- Provide clear, well-structured, accurate, and direct answers.
- Expert in Software Architecture, Python, Data Engineering, SQL, System Design, and Technical Strategy.
- Explain complex concepts with precision, step-by-step clarity, and concrete examples.
"""

class LLMRouter:
    def get_api_key(self, provider: str) -> str:
        """Dynamically fetch API key from settings or environment variables"""
        if provider == "gemini":
            return os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        elif provider == "openai":
            return os.getenv("OPENAI_API_KEY") or settings.OPENAI_API_KEY
        elif provider == "claude":
            return os.getenv("ANTHROPIC_API_KEY") or settings.ANTHROPIC_API_KEY
        return ""

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemini-3.6-flash",
        system_extra: str = "",
        memory_context: str = ""
    ) -> str:
        """Real LLM response generator calling Google GenAI (gemini-3.6-flash), OpenAI, Claude, or Ollama"""
        
        full_system_prompt = f"{SPIDY_SYSTEM_PROMPT}\n{system_extra}\n{memory_context}".strip()
        model_name = model.lower()
        user_prompt = messages[-1]["content"] if messages else ""

        # 1. Check Gemini Provider
        if "gemini" in model_name or not model_name:
            gemini_key = self.get_api_key("gemini")
            key_detected = bool(gemini_key and len(gemini_key.strip()) > 5)
            key_len = len(gemini_key.strip()) if gemini_key else 0

            logger.info("=== [LLM Request Pipeline Audit] ===")
            logger.info(f"-> Selected Provider: Google GenAI SDK (Gemini)")
            logger.info(f"-> Selected Model: gemini-3.6-flash")
            logger.info(f"-> API Key Detected: {key_detected} (Length: {key_len} chars)")
            logger.info(f"-> Full Request Prompt: '{user_prompt}'")

            if not key_detected:
                error_msg = f"⚠️ [Configuration Error]: GEMINI_API_KEY is missing or empty in .env. Please set GEMINI_API_KEY in your .env file to enable Gemini AI responses."
                logger.error(error_msg)
                return error_msg

            try:
                response = await self._call_gemini_genai_sdk(messages, full_system_prompt, gemini_key.strip())
                logger.info(f"-> Full Gemini Response Received: '{response}'")
                return response
            except Exception as e:
                err_detail = f"❌ [Gemini API Error]: {str(e)}\n{traceback.format_exc()}"
                logger.error(err_detail)
                return f"❌ [Gemini API Exception]: {str(e)}"

        # 2. Check OpenAI Provider
        if "gpt" in model_name or "openai" in model_name:
            openai_key = self.get_api_key("openai")
            key_detected = bool(openai_key and len(openai_key.strip()) > 5)
            key_len = len(openai_key.strip()) if openai_key else 0

            logger.info("=== [LLM Request Pipeline Audit] ===")
            logger.info(f"-> Selected Provider: OpenAI API")
            logger.info(f"-> Selected Model: {model}")
            logger.info(f"-> API Key Detected: {key_detected} (Length: {key_len} chars)")
            logger.info(f"-> Full Request Prompt: '{user_prompt}'")

            if not key_detected:
                error_msg = f"⚠️ [Configuration Error]: OPENAI_API_KEY is missing in .env. Please set OPENAI_API_KEY to enable OpenAI responses."
                logger.error(error_msg)
                return error_msg

            try:
                response = await self._call_openai(messages, full_system_prompt, openai_key.strip())
                logger.info(f"-> Full OpenAI Response Received: '{response}'")
                return response
            except Exception as e:
                err_detail = f"❌ [OpenAI API Error]: {str(e)}\n{traceback.format_exc()}"
                logger.error(err_detail)
                return f"❌ [OpenAI API Exception]: {str(e)}"

        # 3. Check Anthropic Claude Provider
        if "claude" in model_name:
            claude_key = self.get_api_key("claude")
            key_detected = bool(claude_key and len(claude_key.strip()) > 5)
            key_len = len(claude_key.strip()) if claude_key else 0

            logger.info("=== [LLM Request Pipeline Audit] ===")
            logger.info(f"-> Selected Provider: Anthropic Claude API")
            logger.info(f"-> Selected Model: {model}")
            logger.info(f"-> API Key Detected: {key_detected} (Length: {key_len} chars)")
            logger.info(f"-> Full Request Prompt: '{user_prompt}'")

            if not key_detected:
                error_msg = f"⚠️ [Configuration Error]: ANTHROPIC_API_KEY is missing in .env. Please set ANTHROPIC_API_KEY to enable Claude responses."
                logger.error(error_msg)
                return error_msg

            try:
                response = await self._call_claude(messages, full_system_prompt, claude_key.strip())
                logger.info(f"-> Full Claude Response Received: '{response}'")
                return response
            except Exception as e:
                err_detail = f"❌ [Claude API Error]: {str(e)}\n{traceback.format_exc()}"
                logger.error(err_detail)
                return f"❌ [Claude API Exception]: {str(e)}"

        # 4. Check Ollama Local Provider
        if "ollama" in model_name:
            logger.info("=== [LLM Request Pipeline Audit] ===")
            logger.info(f"-> Selected Provider: Ollama Local API ({settings.OLLAMA_BASE_URL})")
            logger.info(f"-> Selected Model: {model}")
            logger.info(f"-> Full Request Prompt: '{user_prompt}'")

            try:
                response = await self._call_ollama(messages, full_system_prompt)
                logger.info(f"-> Full Ollama Response Received: '{response}'")
                return response
            except Exception as e:
                err_detail = f"❌ [Ollama Local API Error]: {str(e)}\n{traceback.format_exc()}"
                logger.error(err_detail)
                return f"❌ [Ollama API Exception]: {str(e)}"

        # Default: Fallback to Gemini Provider
        gemini_key = self.get_api_key("gemini")
        if gemini_key:
            return await self._call_gemini_genai_sdk(messages, full_system_prompt, gemini_key.strip())
        return "⚠️ [Configuration Error]: No valid AI Provider API keys found in .env."

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

    async def _call_gemini_genai_sdk(self, messages: List[Dict[str, str]], system_prompt: str, api_key: str) -> str:
        """Call Google GenAI SDK using gemini-3.6-flash"""
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        user_prompt = messages[-1]["content"] if messages else ""
        
        logger.info("Calling Gemini model: gemini-3.6-flash")
        res = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )
        if res and hasattr(res, 'text') and res.text:
            return res.text
        raise RuntimeError("Gemini 3.6 Flash API returned an empty response.")

    async def _call_openai(self, messages: List[Dict[str, str]], system_prompt: str, api_key: str) -> str:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key)
        
        formatted_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            formatted_messages.append({"role": m["role"], "content": m["content"]})
            
        res = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=formatted_messages
        )
        return res.choices[0].message.content

    async def _call_claude(self, messages: List[Dict[str, str]], system_prompt: str, api_key: str) -> str:
        async with httpx.AsyncClient(timeout=30.0) as client:
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
        async with httpx.AsyncClient(timeout=60.0) as client:
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
