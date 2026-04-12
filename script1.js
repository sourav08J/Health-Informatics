// script1.js - Calculator Logic & Server Connection

document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ JavaScript Loaded");

    // --- CONFIGURATION ---
    const NEXT_PAGE = "Health2.html"; // Ensure this file exists in your folder
    const SERVER_URL = "http://127.0.0.1:5000";

    // --- ELEMENTS ---
    const analyzeBtn = document.getElementById('analyzeBtn');
    const submitBtn = document.getElementById('submitBtn');
    const resultsSection = document.getElementById('results-section');

    // Inputs
    const nameInput = document.getElementById('patientName');
    const ageInput = document.getElementById('age');
    const genderInput = document.getElementById('gender');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const bpInput = document.getElementById('bpInput');

    // Result Outputs
    const bmiDisplay = document.getElementById('bmi-result');
    const bmiEval = document.getElementById('bmi-evaluation');
    const bmrDisplay = document.getElementById('bmr-result');
    const idealWeightDisplay = document.getElementById('ideal-weight');
    const bpDisplay = document.getElementById('bp-result');
    const bpBox = document.getElementById('bp-box');
    const bpEval = document.getElementById('bp-evaluation');

    // --- 1. ANALYZE BUTTON LOGIC ---
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Stop page refresh
            console.log("Analyze Clicked");

            // Get Values
            const age = parseFloat(ageInput.value);
            const height = parseFloat(heightInput.value);
            const weight = parseFloat(weightInput.value);
            const gender = genderInput.value;

            // Validation
            if (!age || !height || !weight) {
                alert("⚠️ Please enter valid numbers for Age, Height, and Weight.");
                return;
            }

            // A. Calculate BMI
            const heightInMeters = height / 100;
            const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
            bmiDisplay.innerText = bmi;

            // BMI Color/Text Status
            if (bmi < 18.5) { 
                bmiEval.innerText = "Underweight"; 
                bmiEval.style.color = "#f1c40f"; // Yellow
            } else if (bmi < 24.9) { 
                bmiEval.innerText = "Normal Weight"; 
                bmiEval.style.color = "#2ecc71"; // Green
            } else if (bmi < 29.9) { 
                bmiEval.innerText = "Overweight"; 
                bmiEval.style.color = "#e67e22"; // Orange
            } else { 
                bmiEval.innerText = "Obese"; 
                bmiEval.style.color = "#e74c3c"; // Red
            }

            // B. Calculate BMR
            let bmr = 0;
            if (gender === 'male') {
                bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
            } else {
                bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
            }
            bmrDisplay.innerText = Math.round(bmr);

            // C. Ideal Weight
            const minIdeal = (18.5 * heightInMeters * heightInMeters).toFixed(1);
            const maxIdeal = (24.9 * heightInMeters * heightInMeters).toFixed(1);
            idealWeightDisplay.innerText = `${minIdeal} - ${maxIdeal} kg`;

           // D. Blood Pressure
            if (bpInput.value.trim() !== "") {
                bpBox.style.display = "block";
                bpDisplay.innerText = bpInput.value;
                
                // 1. Split input (handles "120/80", "120 80", or "120-80")
                let parts = bpInput.value.split(/[\/\s\-]+/);
                
                if (parts.length >= 2) {
                    let sys = parseInt(parts[0]);
                    let dia = parseInt(parts[1]);
                    let category = "";
                    let color = "";

                    // 2. Apply Logic
                    if (sys > 180 || dia > 120) {
                        category = "Hypertensive Crisis ⚠️";
                        color = "#ff0000"; // Red
                    } else if (sys >= 140 || dia >= 90) {
                        category = "High BP (Stage 2)";
                        color = "#ff4500"; // OrangeRed
                    } else if (sys >= 130 || dia >= 80) {
                        category = "High BP (Stage 1)";
                        color = "#ffa500"; // Orange
                    } else if (sys >= 120 && dia < 80) {
                        category = "Elevated";
                        color = "#ffd700"; // Gold
                    } else if (sys < 90 || dia < 60) {
                        category = "Low Blood Pressure";
                        color = "#1e90ff"; // DodgerBlue
                    } else {
                        category = "Normal";
                        color = "#008000"; // Green
                    }

                    // 3. Update UI
                    bpEval.innerText = category;
                    bpEval.style.color = color;
                    bpEval.style.fontWeight = "bold";
                } else {
                    bpEval.innerText = "Invalid Format (Use 120/80)";
                    bpEval.style.color = "gray";
                }

            } else {
                bpBox.style.display = "none";
                bpDisplay.innerText = "-";
            }

            // Show Results
            resultsSection.style.display = "block";
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // --- 2. SAVE & REDIRECT LOGIC ---
    if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault(); 
            console.log("🖱️ Save Button Clicked");

            // Check if user clicked Analyze first
            if(bmiDisplay.innerText === "--" || bmiDisplay.innerText === "") {
                alert("Please click 'Analyze Body Metrics' first!");
                return;
            }

            // Prepare Data
            const patientData = {
                name: nameInput.value || "Guest",
                age: ageInput.value,
                gender: genderInput.value,
                bmi: bmiDisplay.innerText,
                bmr: bmrDisplay.innerText,
                bp: bpDisplay.innerText
            };

            try {
                // Send to Python
                const response = await fetch(`${SERVER_URL}/save_patient`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(patientData)
                });

                if (response.ok) {
                    console.log("✅ Data saved successfully!");
                    // --- REDIRECT HAPPENS HERE ---
                    window.location.href = NEXT_PAGE; 
                } else {
                    alert("⚠️ Error saving data. Check server console.");
                }
            } catch (error) {
                console.error("❌ Error:", error);
                alert("Cannot connect to server. Is app.py running?");
            }
        });
    }
});