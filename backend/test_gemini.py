import google.generativeai as genai

genai.configure(api_key="AIzaSyCA3VRT4EoBTGtGttbOl4bn541i8V74t4o")
model = genai.GenerativeModel("gemini-2.5-flash")

prompt = """You are an advanced university complaint analysis AI.
Analyse the provided complaint title and description carefully.
Respond with ONLY valid JSON, no markdown, no explanation.

Respond EXACTLY in this JSON format:
{
  "category": "must be one of: INFRASTRUCTURE, ACADEMIC, ADMINISTRATIVE, IT_SERVICES, HOSTEL, LIBRARY, TRANSPORT, SAFETY, OTHER",
  "priority": "must be one of: LOW, MEDIUM, HIGH, CRITICAL",
  "suggested_department": "most relevant department name string",
  "reasoning": "A concise (max 2 sentences) explanation of why this category and priority were chosen based on the description.",
  "confidence_score": 0.0 to 1.0
}

Priority guidelines:
- CRITICAL: Immediate safety hazards, system-wide outages, life-threatening issues, fire, flooding.
- HIGH: Significant disruptions to academics, security issues, or major utility failures.
- MEDIUM: Individual academic issues, minor facility repairs.
- LOW: Suggestions, general feedback, very minor issues.

Complaint Title: Fire in the mess of hostel
Complaint Description: Fire is continuously increasing in the Hostel. Help we are stuck in fire. Please Help. Help...."""

r = model.generate_content(
    prompt,
    generation_config=genai.types.GenerationConfig(
        response_mime_type="application/json",
        temperature=0.1,
    ),
)
print("RESULT:", r.text)
