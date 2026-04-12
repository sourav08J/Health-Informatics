from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
import sqlite3
import csv
import os
import datetime

# Import the new scan module
from scan import scan_bp 

# ========================================================
# ✅ NEW: Import the AI function from dis.py
# ========================================================
# NEW (Add this)
from ai_helper import get_medicine_suggestions

app = Flask(__name__, static_folder='.', static_url_path='', template_folder='.')
CORS(app)

# ================= CONFIGURATION =================
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Database & CSV Paths
DB_NAME = os.path.join(BASE_DIR, "medical.db")
PATIENTS_FILE = os.path.join(BASE_DIR, "patients.csv")
# ✅ NEW: Login History File Path
LOGIN_HISTORY_FILE = os.path.join(BASE_DIR, "login_history.csv")

# FIXED: Standardized Absolute Upload Folder Path
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")

# Ensure the 'static/uploads' folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Dictionary for Symptom CSVs
CSV_FILES = {
    "heart": os.path.join(BASE_DIR, "heart_data.csv"),
    "blood": os.path.join(BASE_DIR, "blood_data.csv"),
    "bone": os.path.join(BASE_DIR, "bone_data.csv"),
    "diabetes": os.path.join(BASE_DIR, "diabetes_data.csv"),
    "fever": os.path.join(BASE_DIR, "fever_data.csv"),
    "respiratory": os.path.join(BASE_DIR, "respiratory_data.csv"),
}

# --- REGISTER BLUEPRINT ---
app.register_blueprint(scan_bp)

# ================= INIT SYSTEM =================
def init_system():
    # 1. Initialize Users DB
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT
        )
    """)
    conn.commit()
    conn.close()

    # 2. Initialize Patients CSV
    if not os.path.exists(PATIENTS_FILE):
        with open(PATIENTS_FILE, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(
                ["name", "age", "gender", "bmi", "bmr", "bp", "date"]
            )

    # 3. ✅ NEW: Initialize Login History CSV
    if not os.path.exists(LOGIN_HISTORY_FILE):
        with open(LOGIN_HISTORY_FILE, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(["email", "timestamp", "status"])

    print(f"✅ Server initialized. Uploads folder at: {UPLOAD_FOLDER}")

init_system()

# ================= DB HELPER =================
def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# ================= PAGE ROUTES =================
@app.route("/")
def login_page():
    return send_from_directory(BASE_DIR, "Health.html")

@app.route("/Health1.html")
def page2():
    return send_from_directory(BASE_DIR, "Health1.html")
    
@app.route("/Health2.html")
def dashboard_page():
    return send_from_directory(BASE_DIR, "Health2.html")

@app.route("/heart.html")
def heart_page():
    return send_from_directory(BASE_DIR, "heart.html")

@app.route("/scan.html")
def scan_page():
    # Passed None to result_text initially so the template shows the default state
    return render_template("scan.html", result_text=None)

# Route to serve any static file (CSS, JS, Images)
@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(BASE_DIR, path)

# ================= AUTHENTICATION =================
@app.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json(force=True)
        email = data.get("email")
        password = data.get("password")

        conn = get_db()
        cur = conn.cursor()
        cur.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, password))
        conn.commit()
        conn.close()

        return jsonify({"message": "Signup successful"}), 200

    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 400
    except Exception as e:
        print("SIGNUP ERROR:", e)
        return jsonify({"error": "Server error"}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json(force=True)
        email = data.get("email")
        password = data.get("password")

        conn = get_db()
        cur = conn.cursor()
        # FIXED: Added missing 'FROM users' to the query
        cur.execute("SELECT * FROM users WHERE email=? AND password=?", (email, password))
        user = cur.fetchone()
        conn.close()

        # ✅ NEW: Record Login Attempt
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        status = "Failed"
        
        if user:
            status = "Success"
            
        # Write to login_history.csv
        try:
            with open(LOGIN_HISTORY_FILE, "a", newline="", encoding="utf-8") as f:
                csv.writer(f).writerow([email, timestamp, status])
        except Exception as csv_err:
            print("LOGIN CSV ERROR:", csv_err)

        if user:
            return jsonify({"message": "Login success"}), 200
        return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify({"error": "Server error"}), 500

# ================= DATA SAVING =================
@app.route("/save_patient", methods=["POST"])
def save_patient():
    try:
        data = request.get_json(force=True)
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        with open(PATIENTS_FILE, "a", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow([
                data.get("name", "Guest"),
                data.get("age", "--"),
                data.get("gender", "--"),
                data.get("bmi", "--"),
                data.get("bmr", "--"),
                data.get("bp", "--"),
                now
            ])

        return jsonify({"message": "Saved"}), 200

    except Exception as e:
        print("PATIENT ERROR:", e)
        return jsonify({"error": "Server error"}), 500

@app.route("/get_latest_patient", methods=["GET"])
def get_latest_patient():
    try:
        if not os.path.exists(PATIENTS_FILE):
            return jsonify({})
            
        with open(PATIENTS_FILE, "r", encoding="utf-8") as f:
            reader = list(csv.DictReader(f))
            if reader:
                return jsonify(reader[-1])
            return jsonify({})
    except Exception as e:
        print("GET PATIENT ERROR:", e)
        return jsonify({})

# ================= SYMPTOM ANALYSIS ENGINE (CSV) =================
def analyze_symptom(category, query):
    file_path = CSV_FILES.get(category)
    if not file_path or not os.path.exists(file_path):
        return f"❌ {category.title()} database missing."

    query = query.lower()

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("keyword", "").lower() in query:
                    return (
                        f"<b>Diagnosis:</b> {row['diagnosis']}<br>"
                        f"<b>Advice:</b> {row['advice']}"
                    )
    except Exception as e:
        print(f"{category.upper()} CSV ERROR:", e)
        return "❌ Error reading database."

    return "ℹ️ No specific condition detected. Please consult a doctor."

@app.route("/analyze_heart", methods=["POST"])
def analyze_heart():
    return jsonify({"answer": analyze_symptom("heart", request.json.get("query", ""))})

@app.route("/analyze_blood", methods=["POST"])
def analyze_blood():
    return jsonify({"answer": analyze_symptom("blood", request.json.get("query", ""))})

@app.route("/analyze_bone", methods=["POST"])
def analyze_bone():
    return jsonify({"answer": analyze_symptom("bone", request.json.get("query", ""))})

@app.route("/analyze_diabetes", methods=["POST"])
def analyze_diabetes():
    return jsonify({"answer": analyze_symptom("diabetes", request.json.get("query", ""))})

@app.route("/analyze_fever", methods=["POST"])
def analyze_fever():
    return jsonify({"answer": analyze_symptom("fever", request.json.get("query", ""))})

@app.route("/analyze_respiratory", methods=["POST"])
def analyze_respiratory():
    return jsonify({"answer": analyze_symptom("respiratory", request.json.get("query", ""))})

# ========================================================
# ✅ NEW: GEMINI AI MEDICINE ROUTE
# ========================================================
@app.route("/heart_medicine", methods=["POST"])
def heart_medicine():
    try:
        data = request.get_json(force=True)
        # Extract data from frontend
        disease = data.get("disease", "Heart Disease")
        symptoms = data.get("symptoms", "")

        if not symptoms:
            return jsonify({"medicine": "No symptoms provided."})

        # Call the function from dis.py
        suggestion = get_medicine_suggestions(disease, symptoms)
        
        return jsonify({"medicine": suggestion}), 200

    except Exception as e:
        print("GEMINI ROUTE ERROR:", e)
        return jsonify({"error": "Internal Server Error"}), 500
# ... existing heart_medicine route ...

# === ADD THIS NEW ROUTE FOR BLOOD ===
@app.route("/blood_medicine", methods=["POST"])
def blood_medicine():
    try:
        data = request.get_json(force=True)
        disease = data.get("disease", "Blood Disorder")
        symptoms = data.get("symptoms", "")

        if not symptoms:
            return jsonify({"medicine": "No symptoms provided."})

        # Reuse the same AI function!
        suggestion = get_medicine_suggestions(disease, symptoms)
        
        return jsonify({"medicine": suggestion}), 200

    except Exception as e:
        print("BLOOD ROUTE ERROR:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    
# ... existing blood_medicine route ...

# === ADD THIS NEW ROUTE FOR BONE ===
@app.route("/bone_medicine", methods=["POST"])
def bone_medicine():
    try:
        data = request.get_json(force=True)
        disease = data.get("disease", "Bone Issue")
        symptoms = data.get("symptoms", "")

        if not symptoms:
            return jsonify({"medicine": "No symptoms provided."})

        # Reuse the AI helper function
        suggestion = get_medicine_suggestions(disease, symptoms)
        
        return jsonify({"medicine": suggestion}), 200

    except Exception as e:
        print("BONE ROUTE ERROR:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    
# ... existing bone_medicine route ...

# === ADD THIS NEW ROUTE FOR DIABETES ===
@app.route("/diabetes_medicine", methods=["POST"])
def diabetes_medicine():
    try:
        data = request.get_json(force=True)
        disease = data.get("disease", "Diabetes")
        symptoms = data.get("symptoms", "")

        if not symptoms:
            return jsonify({"medicine": "No symptoms provided."})

        # Reuse the AI helper function
        suggestion = get_medicine_suggestions(disease, symptoms)
        
        return jsonify({"medicine": suggestion}), 200

    except Exception as e:
        print("DIABETES ROUTE ERROR:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    
# ... existing diabetes_medicine route ...

# === ADD THIS NEW ROUTE FOR FEVER ===
@app.route("/fever_medicine", methods=["POST"])
def fever_medicine():
    try:
        data = request.get_json(force=True)
        disease = data.get("disease", "Fever/Infection")
        symptoms = data.get("symptoms", "")

        if not symptoms:
            return jsonify({"medicine": "No symptoms provided."})

        # Reuse the AI helper function
        suggestion = get_medicine_suggestions(disease, symptoms)
        
        return jsonify({"medicine": suggestion}), 200

    except Exception as e:
        print("FEVER ROUTE ERROR:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    
# ... existing fever_medicine route ...

# === ADD THIS NEW ROUTE FOR RESPIRATORY ===
@app.route("/respiratory_medicine", methods=["POST"])
def respiratory_medicine():
    try:
        data = request.get_json(force=True)
        disease = data.get("disease", "Respiratory Issue")
        symptoms = data.get("symptoms", "")

        if not symptoms:
            return jsonify({"medicine": "No symptoms provided."})

        # Reuse the AI helper function
        suggestion = get_medicine_suggestions(disease, symptoms)
        
        return jsonify({"medicine": suggestion}), 200

    except Exception as e:
        print("RESPIRATORY ROUTE ERROR:", e)
        return jsonify({"error": "Internal Server Error"}), 500

# ================= MAIN =================
if __name__ == "__main__":
    # Ensure port 5000 is used for local development
    app.run(debug=True, port=5000)