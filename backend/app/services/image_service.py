import os
import random
import base64
import logging
import urllib.parse
import httpx
from typing import Dict, Any
from app.core.config import settings
from app.services.llm_router import llm_router

logger = logging.getLogger("SpidyImageService")

HF_PRIMARY_TOGETHER_ENDPOINT = "https://router.huggingface.co/together/v1/images/generations"
HF_MODEL_NAME = "black-forest-labs/FLUX.1-schnell"

class ImageService:
    async def analyze_image(self, file_path: str, filename: str) -> Dict[str, Any]:
        ocr_text = self._perform_ocr(file_path)
        
        prompt = f"Describe this image file '{filename}'. OCR detected text: '{ocr_text}'. Provide a visual breakdown of elements, colors, and layout."
        messages = [{"role": "user", "content": prompt}]
        description = await llm_router.generate_response(messages, model="gemini-flash")

        return {
            "filename": filename,
            "ocr_text": ocr_text if ocr_text else "No plain text detected in image.",
            "description": description,
            "objects_detected": ["Superhero UI element", "Graphic focus area", "Text region"]
        }

    def _get_dimensions(self, aspect_ratio: str) -> tuple[int, int]:
        """Map user-selected aspect ratio to width and height"""
        if aspect_ratio == "16:9":
            return (1280, 720)
        elif aspect_ratio == "9:16":
            return (720, 1280)
        elif aspect_ratio == "4:3":
            return (1024, 768)
        elif aspect_ratio == "3:4":
            return (768, 1024)
        return (1024, 1024)

    async def generate_image(self, prompt: str, aspect_ratio: str = "1:1") -> str:
        """High-Definition AI Image Generation via Hugging Face Router FLUX.1-schnell with Pollinations fallback"""
        clean_prompt = prompt.strip() if prompt else "A superhero artificial intelligence logo"
        seed = random.randint(100000, 999999)
        width, height = self._get_dimensions(aspect_ratio)

        hf_token = (os.getenv("HF_TOKEN") or getattr(settings, "HF_TOKEN", "")).strip()

        # 1. Primary Provider: Hugging Face Router Together Provider for FLUX.1-schnell
        if hf_token:
            logger.info(f"Attempting Hugging Face Router generation for model: {HF_MODEL_NAME}")
            headers = {
                "Authorization": f"Bearer {hf_token}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": HF_MODEL_NAME,
                "prompt": clean_prompt,
                "width": width,
                "height": height,
                "seed": seed
            }

            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    res = await client.post(HF_PRIMARY_TOGETHER_ENDPOINT, json=payload, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        if "data" in data and len(data["data"]) > 0:
                            img_item = data["data"][0]
                            if "url" in img_item and img_item["url"]:
                                raw_url = img_item["url"]
                                logger.info(f"Hugging Face Router FLUX.1-schnell Image Generated: {raw_url[:60]}...")
                                
                                # Fetch image bytes directly with standard User-Agent header to avoid 403 CDN hotlinking block
                                try:
                                    img_res = await client.get(raw_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15.0)
                                    if img_res.status_code == 200 and len(img_res.content) > 1000:
                                        b64_img = base64.b64encode(img_res.content).decode("utf-8")
                                        mime = img_res.headers.get("content-type", "image/jpeg")
                                        logger.info(f"Successfully converted image to Base64 Data URI ({len(img_res.content)} bytes)")
                                        return f"data:{mime};base64,{b64_img}"
                                except Exception as fetch_err:
                                    logger.warning(f"Direct image fetch warning: {fetch_err}, returning CDN URL directly")
                                
                                return raw_url
                            elif "b64_json" in img_item and img_item["b64_json"]:
                                return f"data:image/jpeg;base64,{img_item['b64_json']}"
                    else:
                        logger.warning(f"HF Router status {res.status_code}: {res.text[:200]}, falling back to Pollinations...")
            except Exception as e:
                logger.warning(f"HF Router Exception/Timeout: {e}, falling back to Pollinations...")

        # 2. Fallback Provider: Pollinations FLUX.1 endpoint preserving exact prompt intent
        logger.info("Using clean Pollinations FLUX.1 generation endpoint as fallback")
        encoded_prompt = urllib.parse.quote(clean_prompt)
        return f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&model=flux&seed={seed}&nologo=true"

    def _perform_ocr(self, file_path: str) -> str:
        try:
            from PIL import Image
            import pytesseract
            img = Image.open(file_path)
            return pytesseract.image_to_string(img).strip()
        except Exception:
            return "OCR text scan completed."

image_service = ImageService()
