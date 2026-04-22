import { db, auth } from "../utils/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

function escapeHTML(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function renderRightColumn(containerElement) {
    if (!auth.currentUser) {
        containerElement.innerHTML = `
        <h3 class="pinned-title">pinboard</h3>
        <p class="pinboard-empty-msg">Login to see pins.</p>
        `;
        return;
    }

    containerElement.innerHTML = `
    <h3 class="pinned-title">pinboard</h3>
    <div id='pinned-list'>Loading...</div>
    `;
    const list = document.getElementById("pinned-list");

    // get user new and old on 'pinnedPostIds'
    onSnapshot(doc(db, "users", auth.currentUser.uid), async (userSnap) => {
        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        const pinnedIds = userData.pinnedPostIds || [];

        if (pinnedIds.length === 0) {
            list.innerHTML = "<p class='pinboard-empty-msg'>No pinned posts yet.</p>";
            return;
        }
        //show most recently pinned first
        const recentPins = pinnedIds.slice().reverse(); 

        const promises = recentPins.map(async (postId) => {
            const pSnap = await getDoc(doc(db, "posts", postId));
            if (!pSnap.exists()) return null;
            return { id: pSnap.id, ...pSnap.data() };
        });

        const posts = await Promise.all(promises);
        
        // previews
        list.innerHTML = "";
        posts.forEach(post => {
            if (!post) return; // if could have been deleted

            const safeTitle = escapeHTML(post.title || "");
            const safeContent = escapeHTML(post.content || "");
            const headline = safeTitle || safeContent || (post.type === "image" ? "Pinned image post" : "Pinned text post");
            const snippet = safeTitle && safeContent ? safeContent : "";
            const mediaHTML = post.type === "image" && post.imageUrl
                ? `<img src="${post.imageUrl}" class="pinned-preview-thumb" alt="${headline}">`
                : "";
            const bodyClass = mediaHTML ? "pinned-preview-body has-thumb" : "pinned-preview-body";

            const card = document.createElement("div");
            card.className = mediaHTML ? "pinned-preview-card has-thumb" : "pinned-preview-card text-only";
            card.innerHTML = `
                ${mediaHTML}
                <div class="${bodyClass}">
                    <div class="pinned-preview-title">${headline}</div>
                    ${snippet ? `<div class="pinned-preview-snippet">${snippet}</div>` : ""}
                    <div class="pinned-preview-meta">@${escapeHTML(post.username || "unknown")}</div>
                </div>
            `;
            
            // follow link on click
            card.onclick = () => {
                window.location.hash = `#/thread/${post.id}`;
            };

            list.appendChild(card);
        });
    });
}
