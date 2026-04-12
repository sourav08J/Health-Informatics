document.addEventListener("DOMContentLoaded", () => {

    const emailInput  = document.getElementById("email");
    const passInput   = document.getElementById("password");
    const loginBtn    = document.getElementById("loginBtn");
    const signupBtn   = document.getElementById("signupBtn");
    const errorMsg    = document.getElementById("error-msg");
    const togglePass  = document.getElementById("togglePass");

    const SERVER = "http://127.0.0.1:5000";

    // ---- Show / hide password ----
    togglePass.addEventListener("click", () => {
        const isText = passInput.type === "text";
        passInput.type = isText ? "password" : "text";
        togglePass.innerHTML = isText
            ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    });

    // ---- Message display ----
    function show(msg, color = "red") {
        errorMsg.className = "";
        void errorMsg.offsetWidth; // reflow to retrigger animation
        errorMsg.style.color = color;
        errorMsg.style.background = color === "red"
            ? "rgba(239,68,68,0.1)"
            : "rgba(34,197,94,0.1)";
        errorMsg.innerText = msg;
        errorMsg.classList.add("visible");
    }

    function clearMsg() {
        errorMsg.style.background = "";
        errorMsg.innerText = "";
        errorMsg.className = "";
    }

    // ---- Ripple effect ----
    function triggerRipple(btn, e) {
        btn.classList.remove("ripple");
        void btn.offsetWidth;
        const rect = btn.getBoundingClientRect();
        btn.style.setProperty("--rx", `${e.clientX - rect.left}px`);
        btn.style.setProperty("--ry", `${e.clientY - rect.top}px`);
        btn.classList.add("ripple");
    }

    // ---- Loading state helpers ----
    function setLoading(btn, state) {
        if (state) {
            btn.classList.add("loading");
            btn.disabled = true;
        } else {
            btn.classList.remove("loading");
            btn.disabled = false;
        }
    }

    // ---- Validation ----
    function validate() {
        const email = emailInput.value.trim();
        const pass  = passInput.value.trim();
        if (!email || !pass) { show("Please fill in all fields."); return false; }
        if (!/\S+@\S+\.\S+/.test(email)) { show("Please enter a valid email."); return false; }
        if (pass.length < 6) { show("Password must be at least 6 characters."); return false; }
        return true;
    }

    // ---- LOGIN ----
    loginBtn.addEventListener("click", async (e) => {
        triggerRipple(loginBtn, e);
        clearMsg();
        if (!validate()) return;

        setLoading(loginBtn, true);
        try {
            const res = await fetch(`${SERVER}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailInput.value.trim(),
                    password: passInput.value.trim()
                })
            });

            const data = await res.json();

            if (res.ok) {
                show("Login successful! Redirecting…", "green");
                setTimeout(() => { window.location.href = "Health1.html"; }, 800);
            } else {
                show(data.error || "Login failed.");
            }
        } catch {
            show("Unable to reach server. Please try again.");
        } finally {
            setLoading(loginBtn, false);
        }
    });

    // ---- SIGNUP ----
    signupBtn.addEventListener("click", async (e) => {
        triggerRipple(signupBtn, e);
        clearMsg();
        if (!validate()) return;

        setLoading(signupBtn, true);
        try {
            const res = await fetch(`${SERVER}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailInput.value.trim(),
                    password: passInput.value.trim()
                })
            });

            const data = await res.json();

            if (res.ok) {
                show("Account created! You can now log in.", "green");
            } else {
                show(data.error || "Signup failed.");
            }
        } catch {
            show("Unable to reach server. Please try again.");
        } finally {
            setLoading(signupBtn, false);
        }
    });

    // Clear message when user starts typing
    [emailInput, passInput].forEach(el => el.addEventListener("input", clearMsg));

});
