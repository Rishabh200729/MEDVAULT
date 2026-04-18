"""
MedVault AI - RAG Voice Engine
Speech-to-Speech medical assistant using:
- Google Gemini Free Tier (15 RPM, no cost)
- Patient medical records as RAG context
- Safety guardrails (no prescriptions)
"""

import os
from typing import Optional

# Try to import Gemini
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# ─── Config ──────────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

SYSTEM_PROMPT = """You are MedVault AI, a multilingual medical health assistant for Indian patients.
You help patients understand their health records in simple, everyday language.

CRITICAL RULES:
1. NEVER prescribe medications or suggest dosage changes.
2. NEVER diagnose conditions — only explain existing records.
3. Always say "Please consult your doctor" for medical advice.
4. Use simple language — imagine explaining to an elderly person.
5. If asked in Hindi, respond in Hindi. If Tamil, respond in Tamil. Match the user's language.
6. Keep responses SHORT — 2-3 sentences max, suitable for being spoken aloud.
7. Reference specific values from the patient's records when answering.
8. You are NOT a doctor. You are a health information assistant.

EXAMPLES OF GOOD RESPONSES:
- "Your last blood sugar was 180 mg/dL which is higher than normal. Please take your medicines on time and consult your doctor."
- "Aapka blood group B+ hai. Aapko Penicillin se allergy hai, yeh doctors ko zaroor batayein."
- "Your hemoglobin is 11.2 which is slightly low. Eat iron-rich foods like spinach and consult your doctor."

EXAMPLES OF BAD RESPONSES (NEVER DO THIS):
- "You should take 500mg Metformin twice daily" (PRESCRIBING = FORBIDDEN)
- "I think you have diabetes" (DIAGNOSING = FORBIDDEN)
"""


def build_rag_context(patient_data: dict, records: list[dict]) -> str:
    """
    Build RAG context from patient's medical profile and records.
    This is the 'retrieval' part — we pull all relevant patient data.
    """
    context_parts = []

    # Patient profile
    context_parts.append("=== PATIENT PROFILE ===")
    context_parts.append(f"Name: {patient_data.get('full_name', 'Unknown')}")
    context_parts.append(f"Age/DOB: {patient_data.get('date_of_birth', 'Unknown')}")
    context_parts.append(f"Gender: {patient_data.get('gender', 'Unknown')}")
    context_parts.append(f"Blood Group: {patient_data.get('blood_group', 'Unknown')}")
    context_parts.append(f"Known Allergies: {patient_data.get('allergies', 'None')}")
    context_parts.append(f"Chronic Conditions: {patient_data.get('chronic_conditions', 'None')}")
    context_parts.append(f"Current Medications: {patient_data.get('current_medications', 'None')}")

    # Medical records
    if records:
        context_parts.append("\n=== MEDICAL RECORDS ===")
        for i, record in enumerate(records[:10], 1):  # Cap at 10 most recent
            context_parts.append(f"\n--- Record {i}: {record.get('title', 'Untitled')} ---")
            context_parts.append(f"Type: {record.get('record_type', 'Unknown')}")
            context_parts.append(f"Date: {record.get('report_date', 'Unknown')}")
            if record.get('ai_summary'):
                context_parts.append(f"Summary: {record['ai_summary']}")
            if record.get('alert_level') and record['alert_level'] != 'normal':
                context_parts.append(f"⚠️ ALERT: {record.get('alert_reason', 'Flagged')}")

    return "\n".join(context_parts)


def query_gemini(user_query: str, rag_context: str, language: str = "en") -> str:
    """
    Send query to Gemini free tier with RAG context.
    Falls back to a rule-based response if Gemini is unavailable.
    """
    if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
        return fallback_response(user_query, rag_context, language)

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        lang_instruction = {
            "hi": "Respond in Hindi (Hinglish is okay). Use simple words.",
            "ta": "Respond in Tamil. Use simple words.",
            "te": "Respond in Telugu. Use simple words.",
            "bn": "Respond in Bengali. Use simple words.",
            "en": "Respond in simple English.",
        }

        full_prompt = f"""{SYSTEM_PROMPT}

{lang_instruction.get(language, lang_instruction['en'])}

{rag_context}

=== PATIENT'S QUESTION ===
{user_query}

Remember: Keep it SHORT (2-3 sentences), SIMPLE, and NEVER prescribe medicines.
"""

        response = model.generate_content(full_prompt)
        answer = response.text.strip()

        # Safety post-processing
        answer = apply_safety_filter(answer)
        return answer

    except Exception as e:
        print(f"[Gemini Error] {e}")
        return fallback_response(user_query, rag_context, language)


def apply_safety_filter(text: str) -> str:
    """Remove any prescriptive language that slipped through."""
    import re
    blocked = [
        r"you should take \d+\s*mg",
        r"i prescribe",
        r"start taking",
        r"increase your dose",
        r"stop taking",
        r"take \d+ tablets",
    ]
    for pattern in blocked:
        text = re.sub(pattern, "[please consult your doctor]", text, flags=re.IGNORECASE)
    return text


def fallback_response(user_query: str, rag_context: str, language: str = "en") -> str:
    """
    Rule-based fallback when Gemini API key is not set.
    Parses the query keywords and returns relevant info from context.
    """
    query_lower = user_query.lower()

    # Extract patient info from context
    lines = rag_context.split("\n")
    info = {}
    for line in lines:
        if ":" in line:
            key, val = line.split(":", 1)
            info[key.strip().lower()] = val.strip()

    # Keyword matching
    if any(w in query_lower for w in ["blood", "raktadan", "khoon", "रक्त"]):
        bg = info.get("blood group", "unknown")
        if language == "hi":
            return f"Aapka blood group {bg} hai. Emergency mein yeh jaankari bahut zaroori hai. Apne doctor se confirm karein."
        return f"Your blood group is {bg}. This is critical information for emergencies. Please confirm with your doctor."

    if any(w in query_lower for w in ["allergy", "allergic", "एलर्जी"]):
        allergies = info.get("known allergies", "none reported")
        if language == "hi":
            return f"Aapko {allergies} se allergy hai. Koi bhi nayi dawai lene se pehle doctor ko zaroor batayein."
        return f"You have allergies to: {allergies}. Always inform your doctor before taking any new medication."

    if any(w in query_lower for w in ["sugar", "diabetes", "glucose", "शुगर", "मधुमेह"]):
        conditions = info.get("chronic conditions", "")
        if "diabetes" in conditions.lower():
            if language == "hi":
                return "Aapko diabetes hai — sugar control mein rakhna zaroori hai. Apni dawai samay par lein aur doctor ki salah maanein."
            return "You have diabetes on record. It's important to keep your sugar controlled. Take medicines on time and follow your doctor's advice."
        if language == "hi":
            return "Aapki records mein diabetes ka koi record nahi hai. Agar aapko chinta hai toh blood sugar test karwa lein."
        return "There's no diabetes on your records. If you're concerned, please get a blood sugar test done."

    if any(w in query_lower for w in ["medicine", "dawai", "tablet", "दवाई", "medication"]):
        meds = info.get("current medications", "none listed")
        if language == "hi":
            return f"Aapki current dawaiyan: {meds}. Inhe samay par lein. Koi badlav karne se pehle doctor se poochein."
        return f"Your current medications are: {meds}. Take them on time. Consult your doctor before making any changes."

    if any(w in query_lower for w in ["report", "test", "result", "रिपोर्ट", "jaanch"]):
        # Look for records in context
        if "=== MEDICAL RECORDS ===" in rag_context:
            if language == "hi":
                return "Aapki medical reports vault mein stored hain. Doctor dashboard se detailed summary dekh sakte hain. Koi specific test ke baare mein poochein."
            return "Your medical reports are stored in your vault. Your doctor can see detailed summaries. Ask me about a specific test for more details."
        if language == "hi":
            return "Aapki vault mein abhi koi report nahi hai. Jab lab aapki report upload karega, yahan dikh jayegi."
        return "No reports in your vault yet. Once a lab uploads your report, it will appear here."

    if any(w in query_lower for w in ["bp", "blood pressure", "hypertension", "ब्लड प्रेशर"]):
        conditions = info.get("chronic conditions", "")
        if "hypertension" in conditions.lower():
            if language == "hi":
                return "Aapko high blood pressure hai — namak kam khayein, dawai samay par lein, aur regular check-up karayein."
            return "You have hypertension on record. Reduce salt intake, take medicines on time, and get regular check-ups."
        if language == "hi":
            return "Aapki records mein BP ki koi problem nahi hai. Regular check-up karate rahein."
        return "No blood pressure issues on your records. Keep getting regular check-ups."

    # Default
    if language == "hi":
        return "Main aapka health assistant hoon. Aap mujhse apne blood group, allergies, reports, ya dawaiyon ke baare mein pooch sakte hain. Doctor ki salah ke liye apne doctor se milein."
    return "I'm your health assistant. You can ask me about your blood group, allergies, reports, or medications. For medical advice, please consult your doctor."
