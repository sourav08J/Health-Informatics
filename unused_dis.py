# dis.py
from flask import Blueprint, request, jsonify
import google.generativeai as genai
import os

# Blueprint
dis_bp = Blueprint("dis_bp", __name__)

# ================= GEMINI CONFIG =================
# BEST PRACTICE: store key as environment variable
GEMINI_API_KEY = os.getenv("AIzaSyAGJQT8EBObrEunW6BNfmlk1utj3t2DS-o")

if not GEMINI_API_KEY:
    raise RuntimeError("❌ GEMINI_API_KEY not set")

genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")

# ================= MEDICINE ROUTE =================
@dis_bp.route("/heart_medicine", methods=["POST"])
def heart_medicine():
    try:
        data = request.get_json(force=True)
        disease = data.get("disease", "Heart Disease")
        symptoms = data.get("symptoms", "")

        prompt = f"""
You are a medical assistant.
Disease: {disease}
Symptoms: {symptoms}

Suggest:
- Common medicines (generic names)
- Basic dosage (educational only)
- Precautions
- When to see a doctor

⚠️ Do NOT give emergency advice.
⚠️ Keep response short and clear.
"""

        response = model.generate_content(prompt)

        return jsonify({
            "medicine": response.text
        }), 200

    except Exception as e:
        print("GEMINI ERROR:", e)
        return jsonify({
            "medicine": "⚠️ Medicine suggestion service unavailable."
        }), 500