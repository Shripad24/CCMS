import json
import asyncio
import logging
import time
from typing import Any

import google.generativeai as genai

from app.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini — re-reads API key from .env on each server reload
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    logger.info(f"Gemini configured with API key: {settings.GEMINI_API_KEY[:8]}...")
else:
    logger.warning("GEMINI_API_KEY is not set in .env!")

# Models to try in order — gemini-1.5-flash was REMOVED from the API.
# We use gemini-2.0-flash as primary, with fallbacks.
MODEL_CHAIN = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

SYSTEM_PROMPT = """You are an advanced university complaint analysis AI. 
Your goal is to accurately categorize complaints, determine their priority, and suggest the most appropriate department for resolution.

Analyse the provided complaint title and description carefully.
Respond with ONLY valid JSON, no markdown, no explanation.

Respond EXACTLY in this JSON format:
{
  "category": "must be one of: INFRASTRUCTURE, ACADEMIC, ADMINISTRATIVE, IT_SERVICES, HOSTEL, LIBRARY, TRANSPORT, SAFETY, OTHER",
  "priority": "must be one of: LOW, MEDIUM, HIGH, CRITICAL",
  "suggested_department": "most relevant department name string",
  "reasoning": "A concise (max 2 sentences) explanation of why this category and priority were chosen based on the description.",
  "confidence_score": 0.0 to 1.0 based on how clear the complaint is
}

Priority guidelines:
- CRITICAL: Immediate safety hazards, system-wide outages, life-threatening issues, fire, flooding, structural collapse, violence.
- HIGH: Significant disruptions to academics, security issues, or major utility failures (no water/power in hostel), harassment, theft.
- MEDIUM: Individual academic issues, minor facility repairs, or standard administrative requests.
- LOW: Suggestions, general feedback, or very minor aesthetic issues."""

VALID_CATEGORIES = [
    "INFRASTRUCTURE", "ACADEMIC", "ADMINISTRATIVE", "IT_SERVICES",
    "HOSTEL", "LIBRARY", "TRANSPORT", "SAFETY", "OTHER",
]

VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

DEFAULT_RESULT: dict[str, Any] = {
    "category": "OTHER",
    "priority": "MEDIUM",
    "suggested_department": "General Administration",
    "reasoning": "Unable to classify automatically. Default classification applied.",
    "confidence_score": 0.0,
}


def _parse_json_response(response_text: str) -> dict:
    """Robustly parse JSON from the Gemini response text."""
    text = response_text.strip()

    # Strip markdown code fences if present
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Fallback: extract the first JSON object
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


def _call_gemini_sync(model_name: str, prompt: str) -> str:
    """Synchronous Gemini call (to be run in executor)."""
    model = genai.GenerativeModel(model_name)
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.1,
            max_output_tokens=800,
            response_mime_type="application/json",
        ),
    )
    if not response or not response.text:
        raise ValueError("Empty response from Gemini")
    return response.text


async def classify_complaint(title: str, description: str) -> dict[str, Any]:
    """
    Use Google Gemini to classify a complaint.
    Tries multiple models in sequence to handle quota limits.
    Returns a dict with: category, priority, suggested_department, reasoning, confidence_score.
    """
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not configured. Using default classification.")
        return DEFAULT_RESULT.copy()

    safe_desc = description or "No description provided."
    prompt = f"{SYSTEM_PROMPT}\n\nComplaint Title: {title}\nComplaint Description: {safe_desc}"

    last_error = None

    for model_name in MODEL_CHAIN:
        try:
            logger.info(f"Trying AI model: {model_name}")
            start_time = time.time()

            loop = asyncio.get_event_loop()
            response_text = await asyncio.wait_for(
                loop.run_in_executor(None, _call_gemini_sync, model_name, prompt),
                timeout=20.0,
            )

            elapsed = round(time.time() - start_time, 2)
            logger.info(f"Gemini ({model_name}) responded in {elapsed}s")

            result = _parse_json_response(response_text)

            # --- Validate and sanitize ---
            if result.get("category") not in VALID_CATEGORIES:
                result["category"] = "OTHER"
            if result.get("priority") not in VALID_PRIORITIES:
                result["priority"] = "MEDIUM"

            # Safety keyword override for priority
            desc_lower = safe_desc.lower()
            title_lower = title.lower()
            combined = desc_lower + " " + title_lower
            critical_keywords = [
                "fire", "burning", "flames", "electric shock", "electrocution",
                "collapse", "flood", "drowning", "violence", "assault",
                "life threatening", "life-threatening", "emergency", "immediate danger",
                "stuck in fire", "bomb", "explosion", "gas leak",
            ]
            high_keywords = [
                "no water", "no electricity", "power cut", "theft", "harassment",
                "stalking", "broken glass", "injury", "injured", "accident",
                "no internet", "server down",
            ]
            if any(kw in combined for kw in critical_keywords):
                result["priority"] = "CRITICAL"
            elif any(kw in combined for kw in high_keywords) and result.get("priority") not in ["CRITICAL"]:
                result["priority"] = "HIGH"

            if not isinstance(result.get("suggested_department"), str):
                result["suggested_department"] = "General Administration"
            if not isinstance(result.get("reasoning"), str):
                result["reasoning"] = "Classification completed based on AI analysis."

            confidence = result.get("confidence_score", 0.0)
            if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
                result["confidence_score"] = 0.85
            else:
                result["confidence_score"] = round(float(confidence), 2)

            logger.info(f"AI classified: cat={result['category']}, pri={result['priority']}, conf={result['confidence_score']}")
            return result

        except asyncio.TimeoutError:
            logger.warning(f"Model {model_name} timed out after 20s, trying next...")
            last_error = f"{model_name} timed out"
            continue
        except Exception as e:
            error_str = str(e)
            logger.warning(f"Model {model_name} failed: {type(e).__name__}: {error_str[:200]}")
            last_error = f"{model_name}: {type(e).__name__}"

            # If quota exhausted, try next model
            if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str or "quota" in error_str.lower():
                logger.info(f"Quota exhausted for {model_name}, trying next model...")
                continue
            # If model not found, try next model
            if "NOT_FOUND" in error_str or "404" in error_str:
                logger.info(f"Model {model_name} not found, trying next model...")
                continue
            # For other errors, also try next
            continue

    # All models failed
    logger.error(f"All AI models failed. Last error: {last_error}")
    return DEFAULT_RESULT.copy()
