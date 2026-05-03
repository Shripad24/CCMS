import json
import asyncio
import logging
from typing import Any

import google.generativeai as genai

from app.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = """You are a university complaint classification AI. 
Analyse the complaint title and description and respond with ONLY valid JSON, no markdown, no explanation.
JSON schema:
{
  "category": one of ["INFRASTRUCTURE", "ACADEMIC", "ADMINISTRATIVE", "IT_SERVICES", "HOSTEL", "LIBRARY", "TRANSPORT", "SAFETY", "OTHER"],
  "priority": one of ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  "suggested_department": string (department name),
  "reasoning": string (max 2 sentences explaining classification),
  "confidence_score": float between 0.0 and 1.0
}
Priority guidelines:
- CRITICAL: Safety hazards, system-wide failures, urgent health issues
- HIGH: Issues affecting studies or daily life significantly  
- MEDIUM: Issues causing moderate inconvenience
- LOW: Minor issues, suggestions, general feedback"""

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


async def classify_complaint(title: str, description: str) -> dict[str, Any]:
    """
    Use Google Gemini to classify a complaint.
    Returns a dict with: category, priority, suggested_department, reasoning, confidence_score.
    On any error, returns DEFAULT_RESULT.
    """
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not configured. Using default classification.")
        return DEFAULT_RESULT.copy()

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"{SYSTEM_PROMPT}\n\nComplaint Title: {title}\nComplaint Description: {description}"

        response = await asyncio.wait_for(
            asyncio.to_thread(
                model.generate_content,
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=500,
                ),
            ),
            timeout=8.0,
        )

        response_text = response.text.strip()

        # Clean up response — remove markdown code blocks if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            lines = [l for l in lines if not l.startswith("```")]
            response_text = "\n".join(lines).strip()

        result = json.loads(response_text)

        # Validate and sanitize
        if result.get("category") not in VALID_CATEGORIES:
            result["category"] = "OTHER"
        if result.get("priority") not in VALID_PRIORITIES:
            result["priority"] = "MEDIUM"
        if not isinstance(result.get("suggested_department"), str):
            result["suggested_department"] = "General Administration"
        if not isinstance(result.get("reasoning"), str):
            result["reasoning"] = "Classification completed."
        
        confidence = result.get("confidence_score", 0.0)
        if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
            result["confidence_score"] = 0.5
        else:
            result["confidence_score"] = float(confidence)

        return result

    except asyncio.TimeoutError:
        logger.error("Gemini API timed out after 8 seconds")
        return DEFAULT_RESULT.copy()
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        return DEFAULT_RESULT.copy()
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return DEFAULT_RESULT.copy()
