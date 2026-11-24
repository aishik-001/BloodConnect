
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");
const loginButton = document.getElementById("loginButton");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Checking credentials...";
    loginButton.disabled = true;

    try {
        const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed.");
        }

        message.style.color = "green";
        message.textContent = "Login successful! Redirecting...";

        window.location.href = "/admin.html";

    } catch (error) {
        message.style.color = "#d12f40";
        message.textContent = error.message;
    } finally {
        loginButton.disabled = false;
    }
});
