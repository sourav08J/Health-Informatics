document.addEventListener('DOMContentLoaded', () => {

    // ======================================================
    // 1. FETCH PATIENT DATA
    // ======================================================
    console.log("🔄 Requesting data from server...");

    fetch('/get_latest_patient')
    .then(res => res.json())
    .then(data => {
        if(data.name) {
            console.log("✅ Data Found:", data);
            localStorage.setItem('pName', data.name);
        } else {
            console.warn("⚠️ Server returned no patient data.");
        }
    })
    .catch(err => {
        console.error("❌ Connection Failed:", err);
    });

    // ======================================================
    // 2. CARD CLICK NAVIGATION (Only for standard links)
    // ======================================================
    const pageLinks = {
        '.card-heart':    'heart.html',
        '.card-blood':    'blood.html',
        '.card-bone':     'bone.html',
        '.card-diabetes': 'diabetes.html',
        '.card-fever':    'fever.html',
        '.card-lungs':    'resp.html'
    };

    for (const [selector, fileName] of Object.entries(pageLinks)) {
        const card = document.querySelector(selector);
        if (card) {
            card.style.cursor = "pointer";
            if(card.tagName !== 'A') {
                card.addEventListener('click', () => {
                    window.location.href = fileName;
                });
            }
        }
    }

    // ======================================================
    // 3. CARD FILTER (Search Bar)
    // ======================================================
    const searchInput = document.getElementById('diseaseSearch');
    const cards = document.querySelectorAll('.big-column');

    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const searchText = e.target.value.toLowerCase();
            cards.forEach(card => {
                const label = card.querySelector('.column-label');
                if (!label) return;
                const diseaseName = label.innerText.toLowerCase();
                card.style.display = diseaseName.includes(searchText) ? "flex" : "none";
            });
        });
    }

    // ======================================================
    // 4. SYMPTOM SUGGESTION ENGINE
    // ======================================================
    const symptomInput   = document.getElementById("symptomInput");
    const suggestionList = document.getElementById("suggestionList");

    if (symptomInput && suggestionList) {
        const diseaseDatabase = [
            { symptom: "chest pain", disease: "Heart Attack", page: "heart.html" },
            { symptom: "cough", disease: "Common Cold", page: "resp.html" },
            { symptom: "fever", disease: "Viral Infection", page: "fever.html" },
            { symptom: "low hemoglobin", disease: "Anemia", page: "blood.html" },
            { symptom: "joint pain", disease: "Arthritis", page: "bone.html" },
            { symptom: "frequent urination", disease: "Diabetes", page: "diabetes.html" }
        ];

        symptomInput.addEventListener("input", () => {
            const value = symptomInput.value.toLowerCase();
            suggestionList.innerHTML = "";
            if (!value) {
                suggestionList.style.display = "none";
                return;
            }
            const matches = diseaseDatabase.filter(item => item.symptom.includes(value));
            if (matches.length === 0) {
                suggestionList.style.display = "none";
                return;
            }
            matches.forEach(match => {
                const li = document.createElement("li");
                li.textContent = `${match.symptom} → ${match.disease}`;
                li.style.cursor = "pointer";
                li.addEventListener("click", () => {
                    window.location.href = match.page;
                });
                suggestionList.appendChild(li);
            });
            suggestionList.style.display = "block";
        });

        document.addEventListener('click', (e) => {
            if (!symptomInput.contains(e.target) && !suggestionList.contains(e.target)) {
                suggestionList.style.display = 'none';
            }
        });
    }

    // ======================================================
    // 5. FILE UPLOAD INTERACTION (Show Name / Remove File)
    // ======================================================
    const realFileInput = document.getElementById('realFileInput');
    const fileInfoContainer = document.getElementById('fileInfoContainer');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const btnText = document.getElementById('btnText');
    const uploadLabel = document.getElementById('uploadLabel');

    if (realFileInput) {
        
        // When a file is selected
        realFileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                const name = this.files[0].name;
                fileInfoContainer.style.display = 'flex';
                fileNameDisplay.textContent = name;
                
                // Style updates to show success
                btnText.textContent = "Change File";
                uploadLabel.style.borderColor = "#2ecc71"; // Green border
                uploadLabel.style.color = "#2ecc71";
            }
        });

        // When the 'X' button is clicked
        removeFileBtn.addEventListener('click', function() {
            realFileInput.value = ''; // Clear input
            fileInfoContainer.style.display = 'none'; // Hide info
            
            // Reset styles
            btnText.textContent = "Choose File";
            uploadLabel.style.borderColor = "#8e44ad"; // Back to Purple
            uploadLabel.style.color = "#8e44ad";
        });
    }

});