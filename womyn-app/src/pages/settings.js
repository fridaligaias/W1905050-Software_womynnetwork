import { renderNavbar } from "../components/navbar";
import { logout } from "../utils/auth";
import { db, auth } from "../utils/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { showToast } from "../utils/ui";
import { applyTheme, getPreferredTheme } from "../utils/theme";

export function renderSettings(root) {
    root.innerHTML = `
    <div class="container">
        <div class="left-col">
            ${renderNavbar()}
        </div>
        <div class="center-col">
            <div class="settings-header" style="margin-bottom: 2rem;">
                <h2>Settings</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem;">
                    Hi, <strong id="settings-username">Loading...</strong>! You've been a Myn since <span id="settings-date">...</span>.
                </p>
            </div>

            <div class="settings-group" style="
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                padding: 1rem 1.1rem;
                background: var(--panel-bg-soft);
                border: 1px solid var(--border-muted);
            ">
                <div>
                    <div style="font-weight: 600; color: var(--text-primary);">Dark Mode</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                        Switch the main app surfaces between light and dark themes.
                    </div>
                </div>

                <label class="switch" style="position: relative; display: inline-block; width: 46px; height: 24px;">
                    <input id="theme-toggle" type="checkbox" style="opacity: 0; width: 0; height: 0;">
                    <span class="slider" style="
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #cfd7d3;
                        transition: .25s ease;
                        border-radius: 999px;
                    "></span>
                </label>
            </div>
            
            <div class="settings-group" style="
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                padding: 1rem 1.1rem;
                background: var(--panel-bg-soft);
                border: 1px solid var(--border-muted);
            ">
                <div>
                    <div style="font-weight: 600; color: var(--text-primary);">Enable Notifications</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                        Turn follow, like, and comment notifications on or off.
                    </div>
                </div>

                <label class="switch" style="position: relative; display: inline-block; width: 46px; height: 24px;">
                    <input id="notifications-toggle" type="checkbox" style="opacity: 0; width: 0; height: 0;">
                    <span class="slider" style="
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #cfd7d3;
                        transition: .25s ease;
                        border-radius: 999px;
                    "></span>
                </label>
            </div>

            <hr style="border: 0.5px solid #eee; margin: 1.5rem 0;">

            <div class="settings-link-section" style="margin-bottom: 1.5rem;">
                <a href="#/terms" style="text-decoration: none; color: #d4a5a5; font-weight: bold; display: block; margin-bottom: 0.2rem;">
                    Terms of Use →
                </a>
                <p style="font-size: 0.8rem; color: #999;">This section will be expanded in the final version.</p>
            </div>

            <div class="settings-link-section" style="margin-bottom: 2rem;">
                <details>
                    <summary>FAQ ▾</summary>

                    <div style="padding-top: 0.75rem;">
                        <details style="cursor: pointer;">
                            <summary style="font-weight: 500; list-style: none; color: #333;">Why is Womyn strictly invite-only?</summary>
                            <div class="faq-content">
                                <p>
                                    I believe that the best way to maintain a genuinely safe space is to protect it from the front door.
                                    By making the network invite-only, we can help block bots, trolls, and bad actors from mass-creating
                                    accounts, so the community stays more authentic and secure.
                                </p>
                            </div>
                        </details>

                        <details style="cursor: pointer;">
                            <summary style="font-weight: 500; list-style: none; color: #333;">Isn't AI part of the problem with modern social media? Why use it at all?</summary>
                            <div class="faq-content">
                                <p>
                                    On traditional platforms, AI is often used to exploit users by harvesting data, tracking behaviour,
                                    and pushing addictive content just to keep people scrolling. At Womyn, AI is intended as a shield, not a spy.
                                </p>
                                <p>
                                    The aim is to use artificial intelligence purely for protection: from adding noise to photos to interfere
                                    with malicious facial recognition, to detecting non-consensual deepfakes, to supporting context-aware moderation
                                    that can catch harassment before users have to see it. AI should defend privacy and agency rather than compromise it.
                                </p>
                            </div>
                        </details>

                        <details style="cursor: pointer;">
                            <summary style="font-weight: 500; list-style: none; color: #333;">What is AI Image Perturbation, and why do you use it?</summary>
                            <div class="faq-content">
                                <p>
                                    When you upload a photo to Womyn, the system can apply a special layer of visual noise using an AI technique,
                                    currently based on a variation of the Basic Iterative Method (BIM). To the human eye, the image still looks the same,
                                    but to malicious algorithms and scrapers it becomes much harder to interpret cleanly.
                                </p>
                                <p>
                                    The goal is to make it harder for your identity to be tracked, scraped, or misused across the web.
                                </p>
                            </div>
                        </details>

                        <details style="cursor: pointer;">
                            <summary style="font-weight: 500; list-style: none; color: #333;">How do you handle harassment and toxic behavior?</summary>
                            <div class="faq-content">
                                <p>
                                    In addition to the invite-only barrier and a peer-admin moderation approach, Womyn is exploring
                                    more advanced context-aware AI moderation. Rather than depending only on easy-to-bypass keyword filters,
                                    the goal is to better understand nuance and catch harmful behaviour earlier.
                                </p>
                            </div>
                        </details>

                        <details style="cursor: pointer;">
                            <summary style="font-weight: 500; list-style: none; color: #333;">Why exclude men?</summary>
                            <div class="faq-content">
                                <p>
                                    No. Creating a space specifically for women is not about hatred toward men. It is about recognising
                                    that women face unique vulnerabilities, realities, and experiences online.
                                </p>
                                <p>
                                    Just as women-only gyms, shelters, and networking events exist in the physical world to support safety,
                                    comfort, and focus, the digital world can also justify dedicated spaces. The mainstream internet is already
                                    overwhelmingly mixed-sex, and it has repeatedly proven hostile to women in areas such as harassment, surveillance,
                                    and non-consensual image exploitation.
                                </p>
                                <p>
                                    Womyn is not intended as a malicious statement against men. It is intended as a sanctuary where women can connect,
                                    share, and exist online without constantly being on guard.
                                </p>
                            </div>
                        </details>
                    </div>
                </details>
            </div>

            <button id="logout-btn" style="
                padding: 0.5rem 1rem;
                background: #ff4d4d;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">Log Out</button>
            <p id="logout-error" style="color: red;"></p>
        </div>
    </div>

    <style>
        .switch input:checked + .slider { background-color: #55796d; }
        .slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .25s ease;
            border-radius: 50%;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
        }
        .switch input:checked + .slider:before { transform: translateX(22px); }
    </style>
    `;

    const logoutBtn = document.getElementById("logout-btn");
    const errorEl = document.getElementById("logout-error");
    const themeToggle = document.getElementById("theme-toggle");
    const notificationsToggle = document.getElementById("notifications-toggle");

    logoutBtn.addEventListener("click", async () => {
        errorEl.textContent = "";
        try {
            await logout();
            window.location.hash = "#/login";
        } catch (err) {
            errorEl.textContent = err.message;
        }
    });

    themeToggle.checked = getPreferredTheme() === "dark";
    themeToggle.addEventListener("change", () => {
        const nextTheme = themeToggle.checked ? "dark" : "light";
        applyTheme(nextTheme);
        showToast(nextTheme === "dark" ? "Dark mode on" : "Light mode on");
    });

    // Notifications toggle in sync with the user profile doc
    notificationsToggle.addEventListener("change", async () => {
        if (!auth.currentUser) return;

        try {
            notificationsToggle.disabled = true;
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                notificationsEnabled: notificationsToggle.checked
            });

            showToast(
                notificationsToggle.checked
                    ? "Notifications turned on"
                    : "Notifications turned off"
            );
        } catch (error) {
            console.error("Error updating notification preference:", error);
            notificationsToggle.checked = !notificationsToggle.checked;
            showToast("Could not update notification setting");
        } finally {
            notificationsToggle.disabled = false;
        }
    });

    // Load the signed-in user's settings
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();

                    let dateStr = "Unknown Date";
                    if (data.createdAt) {
                        const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                        dateStr = dateObj.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                        });
                    }

                    document.getElementById("settings-username").textContent = data.username || "Member";
                    document.getElementById("settings-date").textContent = dateStr;

                    // Default is enabled unless the user explicitly turned notifications off.
                    notificationsToggle.checked = data.notificationsEnabled !== false;
                }
            } catch (error) {
                console.error("Error loading settings:", error);
            }
        } else {
            window.location.hash = "#/login";
        }
    });
}
