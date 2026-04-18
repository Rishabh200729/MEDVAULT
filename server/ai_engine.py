"""
MedVault AI - AI Summarization Engine
Uses free HuggingFace models for medical report summarization.
Includes guardrails to prevent medical prescriptions.
"""

import re
import os

# ─── Guardrails ──────────────────────────────────────────────────────────────

DISCLAIMER = (
    "⚠️ This is an AI-generated summary for informational purposes only. "
    "It is NOT a medical prescription. Always consult your doctor."
)

BLOCKED_PHRASES = [
    "you should take",
    "i prescribe",
    "start taking",
    "increase your dose",
    "stop taking",
    "change your medication",
]


def apply_guardrails(text: str) -> str:
    """Remove any prescriptive language from AI output."""
    for phrase in BLOCKED_PHRASES:
        text = re.sub(re.escape(phrase), "[REDACTED - consult your doctor]",
                      text, flags=re.IGNORECASE)
    return text


# ─── Report Summarizer (Rule-based for offline / Free fallback) ──────────────

def extract_key_values(ocr_text: str) -> list[dict]:
    """
    Parse common Indian lab report patterns (e.g., from Thyrocare, SRL, Dr Lal PathLabs).
    Extracts test names, values, and reference ranges.
    """
    results = []
    # Pattern: "Hemoglobin  14.2  g/dL  13.0 - 17.0"
    pattern = r'([A-Za-z\s\(\)]+?)\s+([\d\.]+)\s*([a-zA-Z/%]+)?\s*[\-–]\s*([\d\.]+ *[\-–] *[\d\.]+)?'
    matches = re.findall(pattern, ocr_text)

    for match in matches:
        test_name = match[0].strip()
        value = match[1].strip()
        unit = match[2].strip() if match[2] else ""
        ref_range = match[3].strip() if match[3] else ""

        if len(test_name) > 2 and test_name[0].isalpha():
            results.append({
                "test": test_name,
                "value": value,
                "unit": unit,
                "reference_range": ref_range
            })

    return results


def check_abnormal_markers(parsed_results: list[dict]) -> tuple[str, str]:
    """
    Flag critical markers commonly found in Indian diagnostic reports.
    Returns (alert_level, reason).
    """
    critical_markers = {
        "glucose": {"high": 200, "unit": "mg/dL", "condition": "Diabetes risk"},
        "hba1c": {"high": 6.5, "unit": "%", "condition": "Diabetes"},
        "creatinine": {"high": 1.4, "unit": "mg/dL", "condition": "Kidney concern"},
        "troponin": {"high": 0.04, "unit": "ng/mL", "condition": "Cardiac risk"},
        "tsh": {"high": 5.0, "unit": "mIU/L", "condition": "Thyroid disorder"},
        "hemoglobin": {"low": 8.0, "unit": "g/dL", "condition": "Severe anemia"},
        "platelet": {"low": 100000, "unit": "/μL", "condition": "Dengue/Infection risk"},
        "cholesterol": {"high": 240, "unit": "mg/dL", "condition": "Cardiovascular risk"},
    }

    alerts = []
    max_level = "normal"

    for result in parsed_results:
        test_lower = result["test"].lower().strip()
        try:
            val = float(result["value"])
        except ValueError:
            continue

        for marker, thresholds in critical_markers.items():
            if marker in test_lower:
                if "high" in thresholds and val > thresholds["high"]:
                    alerts.append(
                        f"🔴 {result['test']}: {val} {result['unit']} "
                        f"(above {thresholds['high']}) → {thresholds['condition']}"
                    )
                    max_level = "red"
                elif "low" in thresholds and val < thresholds["low"]:
                    alerts.append(
                        f"🔴 {result['test']}: {val} {result['unit']} "
                        f"(below {thresholds['low']}) → {thresholds['condition']}"
                    )
                    max_level = "red"

    if not alerts:
        return "normal", ""

    return max_level, "; ".join(alerts)


def summarize_report(ocr_text: str) -> dict:
    """
    Main summarization pipeline:
    1. Parse OCR text for lab values
    2. Check for abnormal/critical markers
    3. Generate clinical bullet points
    4. Apply safety guardrails
    """
    parsed = extract_key_values(ocr_text)
    alert_level, alert_reason = check_abnormal_markers(parsed)

    # Build clinical bullet summary
    bullets = []
    for r in parsed[:15]:  # Cap at 15 key results
        bullet = f"• {r['test']}: {r['value']} {r['unit']}"
        if r['reference_range']:
            bullet += f" (Ref: {r['reference_range']})"
        bullets.append(bullet)

    if not bullets:
        # Fallback: just summarize the raw text into first 500 chars
        summary_text = ocr_text[:500].strip()
        bullets = [f"• Raw report excerpt: {summary_text}"]

    summary = "\n".join(bullets)
    summary = apply_guardrails(summary)

    return {
        "summary": f"{summary}\n\n{DISCLAIMER}",
        "alert_level": alert_level,
        "alert_reason": alert_reason,
        "parsed_values": parsed
    }


# ─── Voice AI: Simple Health Status for Elderly/Illiterate Users ─────────────

VOICE_TEMPLATES = {
    "hi": {  # Hindi
        "greeting": "नमस्ते {name} जी। आपकी स्वास्थ्य जानकारी यह है:",
        "blood_group": "आपका ब्लड ग्रुप {bg} है।",
        "allergy": "आपको {allergy} से एलर्जी है। सावधान रहें।",
        "condition": "आपको {condition} है। दवाई समय पर लें।",
        "normal": "आपकी सभी रिपोर्ट सामान्य हैं। चिंता की कोई बात नहीं।",
        "disclaimer": "यह सिर्फ जानकारी है, डॉक्टर की सलाह ज़रूर लें।",
    },
    "en": {  # English
        "greeting": "Hello {name}. Here is your health summary:",
        "blood_group": "Your blood group is {bg}.",
        "allergy": "You have an allergy to {allergy}. Please be careful.",
        "condition": "You have {condition}. Please take medications on time.",
        "normal": "All your reports are normal. Nothing to worry about.",
        "disclaimer": "This is for information only. Please consult your doctor.",
    },
    "ta": {  # Tamil
        "greeting": "வணக்கம் {name}. உங்கள் உடல்நிலை விவரம்:",
        "blood_group": "உங்கள் இரத்தக் குழு {bg}.",
        "allergy": "உங்களுக்கு {allergy} அலர்ஜி உள்ளது. கவனமாக இருங்கள்.",
        "condition": "உங்களுக்கு {condition} உள்ளது. மருந்துகளை சரியான நேரத்தில் எடுங்கள்.",
        "normal": "உங்கள் அனைத்து அறிக்கைகளும் சாதாரணமாக உள்ளன.",
        "disclaimer": "இது தகவலுக்கு மட்டுமே. மருத்துவரை அணுகவும்.",
    },
}


def generate_voice_summary(user_data: dict, language: str = "hi") -> str:
    """
    Generate a simple, spoken-language health summary for elderly/illiterate users.
    No medical jargon. No prescriptions. Just status awareness.
    """
    templates = VOICE_TEMPLATES.get(language, VOICE_TEMPLATES["en"])
    parts = []

    # Greeting
    parts.append(templates["greeting"].format(name=user_data.get("full_name", "")))

    # Blood group
    if user_data.get("blood_group"):
        parts.append(templates["blood_group"].format(bg=user_data["blood_group"]))

    # Allergies
    if user_data.get("allergies"):
        for allergy in user_data["allergies"].split(","):
            parts.append(templates["allergy"].format(allergy=allergy.strip()))

    # Chronic conditions
    if user_data.get("chronic_conditions"):
        for condition in user_data["chronic_conditions"].split(","):
            parts.append(templates["condition"].format(condition=condition.strip()))

    # If nothing flagged
    if not user_data.get("allergies") and not user_data.get("chronic_conditions"):
        parts.append(templates["normal"])

    # Always end with disclaimer
    parts.append(templates["disclaimer"])

    return " ".join(parts)
