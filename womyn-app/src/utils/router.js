import { renderLogin } from "../pages/login.js";
import { renderSignup } from "../pages/signup.js";
import { renderFeed } from "../pages/feed.js";
import { renderExplore } from "../pages/explore.js";
import { renderPost } from "../pages/post.js";
import { renderNotifications } from "../pages/notifications.js";
import { renderProfile } from "../pages/profile.js";
import { renderSettings } from "../pages/settings.js";
import { observeAuth } from "./auth.js";
import { renderThread } from "../pages/thread.js";
import { renderCircleFeed, renderCircles } from "../pages/circle-pages.js";
import { renderLanding } from "../pages/landing.js";
import { renderTerms } from "../pages/terms.js";
import { renderModDashboard } from "../pages/mod-dashboard.js";
import { db } from "./firebase.js";
import { doc, getDoc } from "firebase/firestore";

let currentUser = null;
let currentUserProfile = null;

async function loadCurrentUserProfile(user) {
    if (!user) {
        currentUserProfile = null;
        window.__womynCurrentUserProfile = null;
        return;
    }

    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        currentUserProfile = snap.exists() ? { uid: user.uid, ...snap.data() } : null;
    } catch (error) {
        console.error("Error loading current user profile:", error);
        currentUserProfile = null;
    }

    window.__womynCurrentUserProfile = currentUserProfile;
}

//listen once for auth state
observeAuth(async (user) => {
    currentUser = user;
    await loadCurrentUserProfile(user);
    router(); // re-render on auth state change
});

export async function router() {
    const app = document.getElementById("app");
    // Normalise hash: if empty, go to landing (#/)
    const fullHash = window.location.hash || "#/"; 
    const route = fullHash.split('?')[0];

    app.innerHTML = ""; 
    
    const openRoutes = ["#/", "#/login", "#/signup", "#/terms"];

    const guestOnlyRoutes = ["#/login", "#/signup"];

    // Guest trying to access private page 
    if (!currentUser && !openRoutes.includes(route)) {
        window.location.hash = "#/";
        return;
    }

    // Myn trying to access Guest Page (Login/Signup)
    if (currentUser && guestOnlyRoutes.includes(route)) {
        window.location.hash = "#/feed";
        return;
    }

    if (currentUser && !currentUserProfile) {
        await loadCurrentUserProfile(currentUser);
    }

    // DYNAMIC ROUTES Profile, Thread, Circle
    if (route.startsWith("#/profile/")) {
        const username = route.split("/")[2];
        renderProfile(app, username);
        return;
    }

    if (route.startsWith("#/thread/")) {
        const postId = route.split("/")[2];
        renderThread(app, postId);
        return;
    }

    if (route.startsWith("#/circle/") && route !== "#/circles") {
        const circleId = route.replace("#/circle/", "");
        renderCircleFeed(app, circleId);
        return;
    }
    //mod nav rule
    if (route === "#/mod") {
        if (!currentUserProfile?.isModerator) {
            window.location.hash = "#/feed";
            return;
        }
        renderModDashboard(app);
        return;
    }

    switch(route){
        case "#/":           
            renderLanding(app);
            break;
        case "#/login":
            renderLogin(app);
            break;
        case "#/signup":
            renderSignup(app);
            break;
        case "#/terms":
            renderTerms(app); 
            break;
        case "#/feed":
            renderFeed(app);
            break;
        case "#/explore":
            renderExplore(app);
            break;
        case "#/post":
            renderPost(app);
            break;
        case "#/notifications":
            renderNotifications(app);
            break;
        case "#/profile":
            renderProfile(app, null);
            break;
        case "#/settings":
            renderSettings(app, currentUser);
            break;
        case "#/circles":
            renderCircles(app);
            break;
        default:
            app.innerHTML = "<h2>404 - Page Not Found</h2>";
    }
}
