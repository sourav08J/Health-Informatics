// Function to Print the Report
function printReport() {
    window.print();
}

// Function to Copy Analysis Text to Clipboard
function copyText() {
    // Select the text content inside the analysis box
    const analysisText = document.querySelector('.markdown-body').innerText;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(analysisText)
            .then(() => {
                // Show temporary success feedback
                const btn = document.querySelector('.btn-copy');
                // Check if button exists (in case user didn't add a copy button)
                if(btn) {
                    const originalHTML = btn.innerHTML;
                    
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                    btn.style.backgroundColor = "#2ecc71";
                    btn.style.color = "white";

                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.style.backgroundColor = "#ecf0f1";
                        btn.style.color = "#2c3e50";
                    }, 2000);
                } else {
                    alert("Text copied to clipboard!");
                }
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert("Failed to copy text. Please try selecting it manually.");
            });
    } else {
        alert("Clipboard access not supported in this browser.");
    }
}// commit change //