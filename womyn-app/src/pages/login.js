import { login } from "../utils/auth";

export function renderLogin(root) {
    root.innerHTML = `
    <div class="auth-container">
        <div class="auth-card">
            <h1 class="logo-text auth-logo">
                <a href="#/" style="text-decoration: none; color: inherit; cursor: pointer;">womyn</a>
            </h1>
            <p class="auth-subtitle">Welcome back Myn!</p>

            <form id="auth-form" class="auth-form">
                <input type="text" id="username" class="auth-input" placeholder="Username" required autocomplete="username"/>
                
                <input type="password" id="password" class="auth-input" placeholder="Password" required autocomplete="current-password"/>
                
                <button type="submit" class="auth-btn">Log In</button>
            </form>

            <p class="auth-link-text">
                Don't have an account? <a href="#/signup">Sign Up</a>
            </p>
            
            <p id="auth-error" style="color: #e0245e;"></p>
        </div>
    </div>
    `;

    const form = document.getElementById("auth-form");
    const errorEl = document.getElementById("auth-error");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorEl.textContent = "";

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        const btn = form.querySelector("button");
        const originalText = btn.textContent;
        btn.textContent = "Logging in...";
        btn.disabled = true;

        try {
            const internalEmail = `${username}@womyn.local`;
            
            await login(internalEmail, password);
            window.location.hash = "#/feed";

        } catch (err) {
            errorEl.textContent = "Invalid username or password.";
            console.error(err);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}