import { signup } from "../utils/auth";
import { db } from "../utils/firebase";
import { generateUsername } from "unique-username-generator"; 
import { 
    doc, 
    serverTimestamp, 
    setDoc, 
    collection, 
    query,      
    where,      
    getDocs,
    updateDoc,
    arrayUnion 
} from "firebase/firestore";

export function renderSignup(root) {
    root.innerHTML = `
    <div class="auth-container">
        <div class="auth-card">
            <h1 class="logo-text auth-logo">
                <a href="#/" style="text-decoration: none; color: inherit; cursor: pointer;">womyn</a>
            </h1>
            <p class="auth-subtitle">Create your account</p>

            <form id="signup-form" class="auth-form">
                
                <div class="input-group">
                    <input type="text" id="username" class="auth-input" placeholder="Choose a unique username" required autocomplete="username"/>
                    
                    <div id="username-tools" class="username-tools">
                        <small>Need an idea?</small>
                        <div id="suggestion-chips" class="suggestion-chips"></div>
                        <button type="button" id="refresh-suggestions" class="link-btn">Refresh</button>
                    </div>
                </div>

                <input type="email" id="email" class="auth-input" placeholder="Email address (optional)" autocomplete="email"/>

                <input type="password" id="password" class="auth-input" placeholder="Create password" required autocomplete="new-password" />

                <input type="text" id="invite-code" class="auth-input" placeholder="Enter Invite Code" required />

                <div class="auth-checkbox-wrapper">
                    <label class="auth-checkbox-label">
                        <input type="checkbox" id="check-terms" required>
                        <span>I agree to the Terms of Use and Community Guidelines</span>
                    </label>
                    <label class="auth-checkbox-label">
                        <input type="checkbox" id="check-rules" required>
                        <span>I understand this is an invite-only, women-only network</span>
                    </label>
                </div>

                <button type="submit" class="auth-btn">Create Account</button>
            </form>

            <p class="auth-link-text">
                Already have an account? <a href="#/login">Log In</a>
            </p>

            <p id="signup-error" style="color: #e0245e;"></p>
        </div>
    </div>
    `;

    const form = document.getElementById("signup-form");
    const errorEl = document.getElementById("signup-error");
    const usernameInput = document.getElementById("username");
    const suggestionChips = document.getElementById("suggestion-chips");
    const refreshBtn = document.getElementById("refresh-suggestions");

    // --- RANDOM USERNAME LOGIC ---
    function generateAndRenderNames() {
        suggestionChips.innerHTML = ""; // Clear existing
        
        for (let i = 0; i < 3; i++) {
            //using default config from unique-username-generator
            const randomName = generateUsername("", 0, 15); 
            
            const chip = document.createElement("span");
            chip.className = "name-chip";
            chip.textContent = randomName;
            
            chip.addEventListener("click", () => {
                usernameInput.value = randomName;
            });

            suggestionChips.appendChild(chip);
        }
    }
    generateAndRenderNames();

    // refresh new batch of rand usernames
    refreshBtn.addEventListener("click", generateAndRenderNames);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorEl.textContent = "";

        const username = usernameInput.value.trim();
        const emailInput = document.getElementById("email").value.trim(); 
        const password = document.getElementById("password").value;
        const inviteCode = document.getElementById("invite-code").value.trim();
        const checkTerms = document.getElementById("check-terms").checked;
        const checkRules = document.getElementById("check-rules").checked;

        const btn = form.querySelector("button[type='submit']");
        const originalText = btn.textContent;
        btn.textContent = "Verifying...";
        btn.disabled = true;

        if (!username || !password || !inviteCode) {
            showError("All fields are required."); return;
        }

        if (/\s/.test(username)) {
            showError("Username cannot contain spaces."); return;
        }

        if (!checkTerms || !checkRules) {
            showError("You must accept the agreements to join."); return;
        }

        try {
            const invitesRef = collection(db, "invites");
            const qInvite = query(invitesRef, where("code", "==", inviteCode));
            const inviteSnapshot = await getDocs(qInvite);

            if (inviteSnapshot.empty) {
                showError("Invalid invite code."); return;
            }

            const inviteDoc = inviteSnapshot.docs[0];
            const inviteData = inviteDoc.data();
            
            if (inviteData.used === true && !inviteData.isGolden) {
                showError("This invite code has already been used."); return;
            }

            const usersRef = collection(db, "users"); 
            const qUser = query(usersRef, where("username", "==", username));
            const userSnapshot = await getDocs(qUser);

            if (!userSnapshot.empty) {
                showError("Username is already taken."); return;
            }
            
            const internalEmail = `${username}@womyn.local`;

            btn.textContent = "Creating Account...";
            const userCredential = await signup(internalEmail, password);
            const uid = userCredential.user.uid;
           
            if (inviteData.isGolden) {
                await updateDoc(doc(db, "invites", inviteDoc.id), {
                    usedBy: arrayUnion(uid) 
                });
            } else {
                await updateDoc(doc(db, "invites", inviteDoc.id), {
                    used: true,
                    usedBy: uid,
                    usedAt: serverTimestamp()
                });
            }

            // --- SAVE USER PROFILE ---
            const avatarSeed = Math.random().toString(36).substring(7);

            await setDoc(doc(db, "users", uid), {
                username,
                username_lower: username.toLowerCase(),
                avatarSeed, 
                profileImageUrl: null,
                isModerator: false,
                openWarningCount: 0,
                createdAt: serverTimestamp(),
                bio: "",
                pinnedPostIds: [],
                following: [] 
            });

            // Keep optional contact email out of the public profile document.
            if (emailInput) {
                await setDoc(doc(db, "private_users", uid), {
                    email: emailInput,
                    createdAt: serverTimestamp()
                });
            }

            window.location.hash = "#/feed";

        } catch (err) {
            console.error(err);
            if (err.code === "auth/email-already-in-use") {
                showError("This username is already registered.");
            } else {
                showError(err.message);
            }
        }

        function showError(msg) {
            errorEl.textContent = msg;
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}
