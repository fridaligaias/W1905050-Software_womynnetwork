import { auth } from "../utils/firebase";
import { timeAgo } from "../utils/date";
import { toggleLike, togglePin, deletePost } from "../utils/interactions";
import { showConfirmModal, showToast } from "../utils/ui";
import { escapeHTML } from "../utils/santising.js";

const GRID_TEXT_READ_MORE_THRESHOLD = 220;
const GRID_IMAGE_CAPTION_THRESHOLD = 110;
const STREAM_TEXT_READ_MORE_THRESHOLD = 360;

function getSafeProfileHref(username = "") {
    return `#/profile/${encodeURIComponent(username)}`;
}

function getSafeCircleHref(circleId = "") {
    return `#/circle/${encodeURIComponent(circleId)}`;
}

function getUserAvatarUrl(user = {}, fallbackUsername = "") {
    if (user?.profileImageUrl) {
        return escapeHTML(user.profileImageUrl);
    }

    const seed = user?.avatarSeed || fallbackUsername || "user";
    return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;
}

//tighter cards 
function getGridBodyHTML(post, titleHTML) {
    const safeContent = escapeHTML(post.content || "");
    const safeImageUrl = escapeHTML(post.imageUrl || "");
    const hasImage = post.type === "image" && safeImageUrl;

    if (hasImage) {
        const showCaptionReadMore = (post.content || "").length > GRID_IMAGE_CAPTION_THRESHOLD;
        const captionHTML = post.title || post.content
            ? `
            <div class="grid-post-caption">
                ${titleHTML}
                ${post.content ? `<p class="grid-post-caption-text">${safeContent}</p>` : ""}
                ${showCaptionReadMore ? `<span class="grid-post-read-more">Read more</span>` : ""}
            </div>
            `
            : "";

        return `
        <div class="post-click-target post-body grid-post-body">
            <div class="post-media-wrap grid-post-media-wrap">
                <img src="${safeImageUrl}" class="post-media grid-post-media" alt="Post image"/>
            </div>
            ${captionHTML}
        </div>
        `;
    }

    const showTextReadMore = (post.content || "").length > GRID_TEXT_READ_MORE_THRESHOLD;

    return `
    <div class="post-click-target post-body grid-post-body grid-post-text-body">
        ${titleHTML}
        <p class="post-content grid-post-content">${safeContent}</p>
        ${showTextReadMore ? `<span class="grid-post-read-more">Read more</span>` : ""}
    </div>
    `;
}

// Feed/profile/circle layouts
function getStreamBodyHTML(post, titleHTML) {
    const safeContent = escapeHTML(post.content || "");
    const safeImageUrl = escapeHTML(post.imageUrl || "");
    const hasImage = post.type === "image" && safeImageUrl;
    const showReadMore = (post.content || "").length > STREAM_TEXT_READ_MORE_THRESHOLD;
    const readMoreHTML = showReadMore ? `<span class="stream-post-read-more">Read more</span>` : "";

    if (!hasImage) {
        return `
        <div class="post-click-target post-body stream-post-body">
            ${titleHTML}
            ${post.content ? `<p class="post-content stream-post-content">${safeContent}</p>` : ""}
            ${readMoreHTML}
        </div>
        `;
    }

    return `
    <div class="post-body stream-post-body">
        <div class="post-click-target stream-post-hero">
            <div class="post-media-wrap stream-post-media-wrap">
                <img src="${safeImageUrl}" class="post-media stream-post-media" alt="Post image"/>
            </div>
            <div class="stream-post-copy">
                ${titleHTML}
                ${post.content ? `<p class="post-click-target post-content stream-post-content">${safeContent}</p>` : ""}
                ${readMoreHTML}
            </div>
        </div>
    </div>
    `;
}

//Thread layouts
function getThreadBodyHTML(post, titleHTML) {
    const safeContent = escapeHTML(post.content || "");
    const safeImageUrl = escapeHTML(post.imageUrl || "");
    const hasImage = post.type === "image" && safeImageUrl;

    if (!hasImage) {
        return getDetailBodyHTML(post, titleHTML);
    }

    return `
    <div class="post-click-target post-body thread-post-body">
        <div class="post-media-wrap thread-post-media-wrap">
            <img src="${safeImageUrl}" class="post-media thread-post-media" alt="Post image"/>
        </div>
        <div class="thread-post-flow">
            ${titleHTML}
            ${post.content ? `<p class="post-content thread-post-content">${safeContent}</p>` : ""}
        </div>
    </div>
    `;
}

//deafult
function getDetailBodyHTML(post, titleHTML) {
    const safeContent = escapeHTML(post.content || "");
    const safeImageUrl = escapeHTML(post.imageUrl || "");
    const hasImage = post.type === "image" && safeImageUrl;

    const bodyHTML = hasImage
        ? `
        <div class="post-clickable-area post-media-wrap">
            <img src="${safeImageUrl}" class="post-media" alt="Post image"/>
        </div>
        ${post.content ? `<p class="post-clickable-area post-content">${safeContent}</p>` : ""}
        `
        : `<p class="post-clickable-area post-content">${safeContent}</p>`;

    return `
    <div class="post-click-target post-body">
        ${titleHTML}
        ${bodyHTML}
    </div>
    `;
}

export function getPostHTML(post, postId, authorProfile, userPinnedIds = [], comments = [], options = {}) {
    const variant = options.variant || "detail";
    const isGridVariant = variant === "grid";
    const isStreamVariant = variant === "stream";
    const isThreadVariant = variant === "thread";
    const timeString = timeAgo(post.createdAt);

    const avatarUrl = getUserAvatarUrl(authorProfile, post.username);
    const safeUsername = escapeHTML(post.username || "unknown");
    const safeProfileHref = getSafeProfileHref(post.username || "");
    const safeCircleName = escapeHTML(post.circleName || "");

    const likes = post.likes || [];
    const currentUid = auth.currentUser ? auth.currentUser.uid : null;
    const isLiked = currentUid && likes.includes(currentUid);
    const likeCount = likes.length;
    const isPinned = userPinnedIds.includes(postId);
    const postTypeLabel = escapeHTML(post.type ? post.type.toUpperCase() : "TEXT");

    const heartEmpty = `<svg class="action-icon-empty" viewBox="0 0 24 24"><path d="M16.5 3C19.538 3 22 5.5 22 9c0 7-7.5 11-10 12.5C9.5 20 2 16 2 9c0-3.5 2.5-6 5.5-6C9.36 3 11 4 12 5c1-1 2.64-2 4.5-2zm-3.566 15.604c.881-.556 1.676-1.109 2.42-1.701C18.335 14.533 20 11.943 20 9c0-2.36-1.537-4-3.5-4-1.076 0-2.24.57-3.086 1.414L12 7.828l-1.414-1.414C9.74 5.57 8.576 5 7.5 5 5.56 5 4 6.656 4 9c0 2.944 1.666 5.533 4.645 7.903.745.592 1.54 1.145 2.421 1.7.299.189.595.37.934.572.339-.202.635-.383.934-.571z"></path></svg>`;
    const heartFilled = `<svg class="action-icon-filled" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`;
    const pinEmpty = `<svg class="action-icon-empty" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256"><path d="M235.32,81.37,174.63,20.69a16,16,0,0,0-22.63,0L98.37,74.49c-10.66-3.34-35-7.37-60.4,13.14a16,16,0,0,0-1.29,23.78L85,159.71,42.34,202.34a8,8,0,0,0,11.32,11.32L96.29,171l48.29,48.29A16,16,0,0,0,155.9,224c.38,0,.75,0,1.13,0a15.93,15.93,0,0,0,11.64-6.33c19.64-26.1,17.75-47.32,13.19-60L235.33,104A16,16,0,0,0,235.32,81.37ZM224,92.69h0l-57.27,57.46a8,8,0,0,0-1.49,9.22c9.46,18.93-1.8,38.59-9.34,48.62L48,100.08c12.08-9.74,23.64-12.31,32.48-12.31A40.13,40.13,0,0,1,96.81,91a8,8,0,0,0,9.25-1.51L163.32,32,224,92.68Z"></path></svg>`;
    const pinFilled = `<svg class="action-icon-filled" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256"><path d="M235.33,104l-53.47,53.65c4.56,12.67,6.45,33.89-13.19,60A15.93,15.93,0,0,1,157,224c-.38,0-.75,0-1.13,0a16,16,0,0,1-11.32-4.69L96.29,171,53.66,213.66a8,8,0,0,1-11.32-11.32L85,159.71l-48.3-48.3A16,16,0,0,1,38,87.63c25.42-20.51,49.75-16.48,60.4-13.14L152,20.7a16,16,0,0,1,22.63,0l60.69,60.68A16,16,0,0,1,235.33,104Z"></path></svg>`;
    const trashIcon = `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;

    const isOwner = currentUid && post.authorUID === currentUid;
    const deleteBtnHTML = isOwner
        ? `<button class="delete-btn" data-id="${postId}" title="Delete Post">${trashIcon}</button>`
        : "";

    let headerHTML = "";

    if (post.circleId) {
        const circleAvatar = `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(post.circleSeed || post.circleId)}`;
        const safeCircleHref = getSafeCircleHref(post.circleId);

        headerHTML = `
        <div class="post-header circle-mode">
            <a href="${safeCircleHref}" class="circle-icon-link">
                <img src="${circleAvatar}" class="circle-post-avatar" />
            </a>
            <div class="post-header-text">
                <div class="post-header-topline">
                    <a href="${safeCircleHref}" class="circle-name-link">${safeCircleName}</a>
                    <span class="post-type-badge">${postTypeLabel}</span>
                </div>
                <div class="post-sub-meta">
                    Posted by <a href="${safeProfileHref}">@${safeUsername}</a> &bull; ${timeString}
                </div>
            </div>
            <div class="post-header-actions">${deleteBtnHTML}</div>
        </div>
        `;
    } else {
        headerHTML = `
        <div class="post-header">
            <a href="${safeProfileHref}">
                <img src="${avatarUrl}" class="user-avatar post-avatar" />
            </a>
            <div class="post-header-text">
                <div class="post-header-topline">
                    <a href="${safeProfileHref}" class="username-link">@${safeUsername}</a>
                    <span class="post-type-badge">${postTypeLabel}</span>
                </div>
                <span class="post-meta">Posted ${timeString}</span>
            </div>
            <div class="post-header-actions">${deleteBtnHTML}</div>
        </div>
        `;
    }

    const titleHTML = post.title ? `<h4 class="post-title">${escapeHTML(post.title)}</h4>` : "";

    // small comment preview on non-grid cards
    let commentsHTML = "";
    if (!isGridVariant && comments && comments.length > 0) {
        commentsHTML = `<div class="post-comments-preview">`;
        comments.forEach(c => {
            commentsHTML += `<div class="preview-comment-row"><strong>${escapeHTML(c.username)}:</strong> <span>${escapeHTML(c.content)}</span></div>`;
        });
        if (comments.length >= 15) commentsHTML += `<div class="post-comments-more">View all comments...</div>`;
        commentsHTML += `</div>`;
    }

    const tagsHTML = post.tags && post.tags.length
        ? post.tags.map(t => `<span class="post-tag-chip">#${escapeHTML(t)}</span>`).join("")
        : "";

    // Swap body renderer based on the page 
    let bodyMarkup = getDetailBodyHTML(post, titleHTML);
    if (isGridVariant) bodyMarkup = getGridBodyHTML(post, titleHTML);
    if (isStreamVariant) bodyMarkup = getStreamBodyHTML(post, titleHTML);
    if (isThreadVariant) bodyMarkup = getThreadBodyHTML(post, titleHTML);

    return `
    <div class="post-card ${isGridVariant ? "post-card-grid" : isStreamVariant ? "post-card-stream" : isThreadVariant ? "post-card-thread" : "post-card-detail"}" data-id="${postId}">
        ${headerHTML}
        ${bodyMarkup}
        ${tagsHTML ? `<div class="post-tags">${tagsHTML}</div>` : ""}
        <div class="post-actions">
            <button class="like-btn ${isLiked ? "liked" : ""}" data-id="${postId}">
                ${heartEmpty}
                ${heartFilled}
                <span>${likeCount > 0 ? likeCount : "Like"}</span>
            </button>

            <button class="pin-btn ${isPinned ? "pinned" : ""}" data-id="${postId}">
                ${pinEmpty}
                ${pinFilled}
                <span>${isPinned ? "Pinned" : "Pin"}</span>
            </button>
        </div>
        ${commentsHTML ? `<div class="post-click-target post-comments-trigger">${commentsHTML}</div>` : ""}
    </div>
    `;
}

export function attachPostEvents(containerElement) {
    if (!containerElement) return;

    // Like buttons update the UI, sync to Firestore
    const buttons = containerElement.querySelectorAll(".like-btn");
    buttons.forEach(btn => {
        if (btn.dataset.listening) return;
        btn.dataset.listening = "true";

        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const button = e.target.closest("button");
            const postId = button.dataset.id;

            if (!auth.currentUser) {
                alert("Please login to like posts.");
                return;
            }

            button.classList.toggle("liked");

            const span = button.querySelector("span");
            let count = parseInt(span.innerText, 10) || 0;
            if (button.classList.contains("liked")) span.innerText = count + 1;
            else span.innerText = count > 0 ? count - 1 : "Like";

            const isNowLiked = button.classList.contains("liked");
            const fakeCurrentLikes = isNowLiked ? [] : [auth.currentUser.uid];

            try {
                await toggleLike(postId, auth.currentUser.uid, fakeCurrentLikes);
            } catch (err) {
                console.error("Like failed:", err);
                button.classList.toggle("liked");
                span.innerText = count > 0 ? count : "Like";
            }
        });
    });

    const pinButtons = containerElement.querySelectorAll(".pin-btn");
    pinButtons.forEach(btn => {
        if (btn.dataset.listening) return;
        btn.dataset.listening = "true";

        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const button = e.target.closest("button");
            const postId = button.dataset.id;
            if (!auth.currentUser) return alert("Please login.");

            button.classList.toggle("pinned");
            const label = button.querySelector("span");
            const isNowPinned = button.classList.contains("pinned");
            label.innerText = isNowPinned ? "Pinned" : "Pin";
            const fakeCurrentPinned = isNowPinned ? [] : [postId];

            try {
                await togglePin(auth.currentUser.uid, postId, fakeCurrentPinned);
            } catch (err) {
                button.classList.toggle("pinned");
                label.innerText = button.classList.contains("pinned") ? "Pinned" : "Pin";
            }
        });
    });

    // Clicking the post => thread view.
    const clickTargets = containerElement.querySelectorAll(".post-click-target");
    clickTargets.forEach(target => {
        if (target.dataset.listening) return;
        target.dataset.listening = "true";

        target.addEventListener("click", () => {
            const card = target.closest(".post-card");
            const postId = card.dataset.id;
            if (postId) {
                window.location.hash = `#/thread/${postId}`;
            }
        });
    });

    // Owners can delete posts 
    const deleteButtons = containerElement.querySelectorAll(".delete-btn");
    deleteButtons.forEach(btn => {
        if (btn.dataset.listening) return;
        btn.dataset.listening = "true";

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const button = e.target.closest("button");
            const postId = button.dataset.id;

            showConfirmModal("This cannot be undone. Delete this post?", async () => {
                const success = await deletePost(postId);
                if (success) {
                    showToast("Post deleted.");
                    const card = button.closest(".post-card");
                    if (card) {
                        card.style.opacity = "0";
                        setTimeout(() => card.remove(), 300);
                    }
                    if (window.location.hash.startsWith("#/thread")) {
                        window.history.back();
                    }
                } else {
                    alert("Failed to delete.");
                }
            });
        });
    });
}
