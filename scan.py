from flask import Blueprint, request, render_template, current_app
import os
import google.generativeai as genai
import json
import time

scan_bp = Blueprint('scan_bp', __name__)

genai.configure(api_key="AIzaSyDFNBHPTC-WvJnarnLAoWi9ojLmT83CNJw")

# --- UPDATED PROMPT: Added 'ai_advice' field ---
MEDICAL_PROMPT = """
You are a medical assistant. Analyze the prescription image.
Return a JSON object with exactly these THREE fields:

1. "summary_html": A string containing HTML (using <h3>, <p>, <ul>, <strong>) that summarizes:
   - Patient Name & Date
   - Clinical Findings
   - Doctor's Advice (extracted from image)
   (Do NOT include <html> or <body> tags).

2. "medicines": A list of objects for each drug found:
   [ {"name": "Drug Name", "dosage": "Dose info", "frequency": "Freq info"} ]

3. "ai_advice": An object containing general AI-generated wellness advice based on the diagnosis:
   {
     "dos": ["List of 3-4 short things the patient SHOULD do (e.g., drink water, rest)"],
     "donts": ["List of 3-4 short things the patient should AVOID (e.g., spicy food, heavy lifting)"],
     "recovery_guide": "A warm, descriptive paragraph giving lifestyle and dietary advice for the cure period."
   }

Return ONLY valid JSON. No Markdown formatting.
"""

@scan_bp.route('/analyze_prescription', methods=['POST'])
def analyze_prescription():
    if 'file' not in request.files:
        return "No file", 400
    
    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400

    if file:
        try:
            upload_folder = current_app.config['UPLOAD_FOLDER']
            filepath = os.path.join(upload_folder, file.filename)
            file.save(filepath)

            # Upload to Gemini
            raw_file = genai.upload_file(filepath)
            
            # Wait for processing
            while raw_file.state.name == "PROCESSING":
                time.sleep(1)
                raw_file = genai.get_file(raw_file.name)

            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash-lite",
                system_instruction=MEDICAL_PROMPT
            )
            
            response = model.generate_content([raw_file, "Extract data and provide advice."])
            
            # Clean up response to ensure valid JSON
            text_response = response.text.replace("```json", "").replace("```", "").strip()
            
            try:
                data = json.loads(text_response)
            except json.JSONDecodeError:
                # Fallback if JSON fails
                data = {
                    "summary_html": "<p>Error parsing AI response.</p>",
                    "medicines": [],
                    "ai_advice": {"dos": [], "donts": [], "recovery_guide": "Could not generate advice."}
                }

            return render_template('scan.html', 
                                 result_html=data.get('summary_html'),
                                 medicines=data.get('medicines'),
                                 ai_advice=data.get('ai_advice'), # <-- Passed new data here
                                 filename=file.filename)

        except Exception as e:
            print(f"❌ SCAN ERROR: {e}")
            return render_template('scan.html', error=str(e))

    return "Something went wrong", 500