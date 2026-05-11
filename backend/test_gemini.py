import google.generativeai as genai

genai.configure(api_key="AIzaSyDSvpWusCcM54zgbbEL2TTh3jhRQTHX-OU")
model = genai.GenerativeModel("gemini-2.5-flash")

prompt = """You are a university complaint classification AI. Respond with ONLY valid JSON.
{
  "category": "one of: INFRASTRUCTURE, ACADEMIC, SAFETY, HOSTEL, OTHER",
  "priority": "one of: LOW, MEDIUM, HIGH, CRITICAL",
  "suggested_department": "string",
  "reasoning": "string",
  "confidence_score": 0.0 to 1.0
}

Complaint Title: Fire in hostel mess
Complaint Description: Fire is continuously increasing in the Hostel. Help we are stuck in fire. Please Help.
"""

r = model.generate_content(
    prompt,
    generation_config=genai.types.GenerationConfig(
        response_mime_type="application/json",
        temperature=0.1,
    ),
)
print("SUCCESS:", r.text)
