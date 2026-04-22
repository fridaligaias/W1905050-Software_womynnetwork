import { renderNavbar } from "../components/navbar"; 
import { db, auth } from "../utils/firebase"; 
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    orderBy, 
    onSnapshot 
} from "firebase/firestore";
import { getPostHTML, attachPostEvents } from "../components/postCard"; 
import { renderRightColumn } from "../components/rightColumn"; 
import { addComment } from "../utils/interactions"; 
import { timeAgo } from "../utils/date"; 
import { attachModerationWatcher, logModerationEvent, scanModerationText } from "../utils/moderation";
import { escapeHTML, getSafeProfileHref } from "../utils/santising.js";

export async function renderThread(root, postId) {
    root.innerHTML = `
    <div class="container">
        <div class="left-col">${renderNavbar()}</div>
        <div class="center-col">
            <button id="back-btn" class="secondary-btn" style="margin-bottom: 1rem;">← Back</button>
            <div id="thread-container"><h2>Loading post...</h2></div>
            
            <div class="comment-section" style="display:none;" id="comment-section">
                <h3>Comments</h3>
                
                <form id="comment-form" class="comment-form">
                    <img id="current-user-comment-avatar" class="comment-avatar" src="" />
                    <input type="text" id="comment-input" class="comment-input" placeholder="Write a comment..." autocomplete="off" />
                    <button type="submit" class="primary-btn">Post</button>
                </form>
                <div id="comment-moderation-warning" class="moderation-warning"></div>

                <div id="comments-list" class="comment-list">
                    </div>
            </div>

        </div>
        <div class="right-col">
            </div>
    </div>
    `;

    // Initialise right-col
    const rightCol = root.querySelector(".right-col");
    renderRightColumn(rightCol);

    const container = document.getElementById("thread-container");
    const commentSection = document.getElementById("comment-section");
    const commentForm = document.getElementById("comment-form");
    const commentInput = document.getElementById("comment-input");
    const commentsList = document.getElementById("comments-list");
    const backBtn = document.getElementById("back-btn");
    const commentModerationWarning = document.getElementById("comment-moderation-warning");
    const commentWatcher = attachModerationWatcher({
        fields: [commentInput],
        getText: () => commentInput.value,
        warningEl: commentModerationWarning,
        label: "This comment"
    });

    backBtn.onclick = () => window.history.back();

    try {
        // --- FETCH MAIN POST DATA ---
        const postRef = doc(db, "posts", postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            container.innerHTML = "<h2>Post not found.</h2>";
            return;
        }
        const post = postSnap.data();
        // Fetch post author profile
        let authorProfile = null;
        if (post.authorUID) {
            const userRef = doc(db, "users", post.authorUID);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                authorProfile = userSnap.data();
            }
        }
        // Fetch current viewer info (for pinned status and comment Avatar)
        let currentUserPinnedIds = [];
        let currentUserData = null; 
        
        if (auth.currentUser) {
            const currentUserRef = doc(db, "users", auth.currentUser.uid);
            const currentUserSnap = await getDoc(currentUserRef);
            if (currentUserSnap.exists()) {
                currentUserData = currentUserSnap.data();
                currentUserPinnedIds = currentUserData.pinnedPostIds || [];
                
                // Set the avatar in the input form immediately
                const commentAvatarUrl = currentUserData.profileImageUrl
                    || `https://api.dicebear.com/9.x/glass/svg?seed=${currentUserData.avatarSeed || currentUserData.username}`;
                document.getElementById("current-user-comment-avatar").src = commentAvatarUrl;
            }
        }

        // Render the Post Card
        container.innerHTML = getPostHTML(post, postId, authorProfile, currentUserPinnedIds, [], { variant: "thread" });
        attachPostEvents(container, currentUserPinnedIds);
        // Reveal Comment Section
        commentSection.style.display = "block";
        // --- COMMENTS LISTENER ---
        const commentsQuery = query(
            collection(db, "posts", postId, "comments"), 
            orderBy("createdAt", "asc") 
        );

        onSnapshot(commentsQuery, (snapshot) => {
            commentsList.innerHTML = ""; 
            
            if (snapshot.empty) {
                commentsList.innerHTML = "<p style='color:#888; font-size: 0.9rem;'>No comments yet. Be the first!</p>";
                return;
            }

            snapshot.forEach(doc => {
                const comment = doc.data();
                const timeString = escapeHTML(timeAgo(comment.createdAt));
                const safeUsername = escapeHTML(comment.username || "unknown");
                const safeProfileHref = getSafeProfileHref(comment.username || "");
                // Use stored seed
                const avatarUrl = comment.profileImageUrl
                    || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(comment.avatarSeed || comment.username || "user")}`;
                const safeAvatarUrl = escapeHTML(avatarUrl);
                const safeContent = escapeHTML(comment.content || "");

                commentsList.innerHTML += `
                <div class="comment-item">
                    <a href="${safeProfileHref}">
                        <img src="${safeAvatarUrl}" class="comment-avatar" />
                    </a>
                    <div>
                        <div class="comment-bubble">
                            <div class="comment-header">
                                <a href="${safeProfileHref}" class="username-link" style="color:inherit; text-decoration:none;">${safeUsername}</a>
                            </div>
                            <p class="comment-text">${safeContent}</p>
                        </div>
                        <div class="comment-meta">${timeString}</div>
                    </div>
                </div>
                `;
            });
        });

        // --- SUBMIT NEW COMMENT ---
        commentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const content = commentInput.value.trim();
            
            if (!content) return;
            if (!auth.currentUser) {
                alert("Please login to comment.");
                return;
            }
            // Disable input to prevent double-send
            commentInput.disabled = true;
            try {
                const moderationResult = scanModerationText(content);
                // Pass user data to helper
                await addComment(postId, {
                    uid: auth.currentUser.uid,
                    username: currentUserData.username,
                    avatarSeed: currentUserData.avatarSeed,
                    profileImageUrl: currentUserData.profileImageUrl || null
                }, content);

                if (moderationResult.isFlagged) {
                    await logModerationEvent({
                        userId: auth.currentUser.uid,
                        username: currentUserData.username,
                        sourceType: "comment",
                        text: content,
                        matchedRule: moderationResult.matchedRule,
                        category: moderationResult.category,
                        matchedRules: moderationResult.matchedRules,
                        categories: moderationResult.categories,
                        severity: moderationResult.severity,
                        context: {
                            postId,
                            contextLink: `#/thread/${postId}`,
                            contextLabel: "View thread"
                        }
                    });
                }

                commentInput.value = ""; // Clear input on success
                commentWatcher.refresh();
            } catch (err) {
                console.error("Error adding comment:", err);
                alert("Failed to post comment.");
            } finally {
                commentInput.disabled = false;
                commentInput.focus();
            }
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `<h2>Error loading thread: ${escapeHTML(err.message)}</h2>`;
    }
}
