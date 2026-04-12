// fever.js - Fever Analysis + Gemini Medicine Integration

document.addEventListener('DOMContentLoaded', () => {

    /* ===============================
       1. LOAD PATIENT NAME
    =============================== */
    const pName = localStorage.getItem('pName') || "Guest";
    const nameDisplay = document.getElementById('pNameDisplay');
    if (nameDisplay) {
        nameDisplay.innerHTML = `<i class="fa-solid fa-user-circle"></i> ${pName}`;
    }

    /* ===============================
       2. ELEMENT REFERENCES
    =============================== */
    const askBtn = document.getElementById('askBtn');
    const inputField = document.getElementById('userQuery');
    const responseBox = document.getElementById('responseBox');
    const medicineBox = document.getElementById('medicineBox');

    /* ===============================
       3. MAIN FUNCTION
    =============================== */
    function provideAdvice() {
        const query = inputField.value.trim();

        if (!query) {
            alert("Please type a symptom first.");
            return;
        }

        /* ---------- UI: Loading ---------- */
        // Orange color theme for Fever
        responseBox.innerHTML = "🌡️ Analyzing fever & infection symptoms...";
        responseBox.style.color = "#e67e22";
        responseBox.style.opacity = 0.6;

        medicineBox.innerHTML = "💊 Generating medicine suggestions...";
        medicineBox.style.color = "#e67e22";
        medicineBox.style.opacity = 0.6;

        /* ===============================
           4. CSV-BASED FEVER ADVICE
        =============================== */
        fetch("http://127.0.0.1:5000/analyze_fever", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query: query })
        })
        .then(res => {
            if (!res.ok) throw new Error("CSV server error");
            return res.json();
        })
        .then(data => {
            responseBox.style.opacity = 1;

            if (!data.answer || data.answer.trim() === "") {
                responseBox.innerHTML =
                    "ℹ️ No matching fever condition found. Please consult a doctor.";
                responseBox.style.color = "#7f8c8d";
            } else {
                responseBox.innerHTML = data.answer;
                responseBox.style.color = "#e67e22";
            }
        })
        .catch(err => {
            console.error("Fever CSV Error:", err);
            responseBox.innerHTML = "❌ Fever database not reachable.";
            responseBox.style.color = "#c0392b";
            responseBox.style.opacity = 1;
        });

        /* ===============================
           5. GEMINI MEDICINE SUGGESTION
        =============================== */
        // Note: You must add the '/fever_medicine' route to app.py!
        fetch("http://127.0.0.1:5000/fever_medicine", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                disease: "Fever or Viral Infection", // Context for AI
                symptoms: query
            })
        })
        .then(res => {
            if (!res.ok) throw new Error("Gemini server error");
            return res.json();
        })
        .then(data => {
            medicineBox.style.opacity = 1;

            if (!data.medicine || data.medicine.trim() === "") {
                medicineBox.innerHTML =
                    "ℹ️ No medicine recommendation available.";
                medicineBox.style.color = "#7f8c8d";
            } else {
                medicineBox.innerHTML = data.medicine;
                medicineBox.style.color = "#2c3e50";
            }
        })
        .catch(err => {
            console.error("Gemini Error:", err);
            medicineBox.innerHTML =
                "❌ Unable to fetch medicine suggestions.";
            medicineBox.style.color = "#c0392b";
            medicineBox.style.opacity = 1;
        });
    }

    /* ===============================
       6. EVENT LISTENERS
    =============================== */
    if (askBtn) {
        askBtn.addEventListener("click", provideAdvice);
    }

    if (inputField) {
        inputField.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                provideAdvice();
            }
        });
    }

});