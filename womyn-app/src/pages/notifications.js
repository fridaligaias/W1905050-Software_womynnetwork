import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { renderNavbar } from "../components/navbar";
import { renderRightColumn } from "../components/rightColumn";
import { auth, db } from "../utils/firebase";
import { timeAgo } from "../utils/date";
import { escapeHTML } from "../utils/santising.js";

function getNotificationAccent(type) {
    if (type === "like") {
        return {
            icon: "♡",
            color: "#d45b88"
        };
    }

    if (type === "comment") {
        return {
            icon: "↳",
            color: "#4f7da5"
        };
    }

    if (type === "follow") {
        return {
            icon: "+",
            color: "#5a4aa3"
        };
    }

    return {
        icon: "•",
        color: "#5b6b67"
    };
}

function getNotificationCard(notification) {
    const accent = getNotificationAccent(notification.type);
    const notificationText = escapeHTML(notification.text || "You have a new notification.");
    const notificationTime = timeAgo(notification.createdAt);
    const notificationLink = notification.link || "";
    const wrapperTag = notificationLink ? "a" : "div";
    const hrefAttr = notificationLink ? `href="${escapeHTML(notificationLink)}"` : "";
    const clickableClass = notificationLink ? "notification-card-clickable" : "";

    return `
        <${wrapperTag} class="notification-card ${clickableClass}" ${hrefAttr} style="
            display:flex;
            align-items:flex-start;
            gap:0.95rem;
            padding:1rem 1.1rem;
            border-bottom:1px solid var(--border-muted);
            color:inherit;
            text-decoration:none;
        ">
            <div style="
                width:2rem;
                height:2rem;
                border-radius:999px;
                background:${accent.color}14;
                border:1px solid ${accent.color}35;
                color:${accent.color};
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:1rem;
                font-weight:700;
                flex-shrink:0;
                margin-top:0.1rem;
            ">
                ${accent.icon}
            </div>

            <div style="min-width:0; flex:1;">
                <div style="
                    color:var(--text-primary);
                    font-size:0.98rem;
                    line-height:1.5;
                    word-break:break-word;
                ">
                    ${notificationText}
                </div>
                <div style="
                    color:var(--text-muted);
                    font-size:0.8rem;
                    margin-top:0.3rem;
                ">
                    ${notificationTime}
                </div>
            </div>
        </${wrapperTag}>
    `;
}

export async function renderNotifications(root) {
    root.innerHTML = `
        <div class="container">
            <div class="left-col">
                ${renderNavbar()}
            </div>

            <div class="center-col">
                <div class="feed-shell">
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:flex-end;
                        gap:1rem;
                        padding:0 0 1rem;
                        border-bottom:1px solid var(--border-muted);
                    ">
                        <div>
                            <h2 style="margin:0; color:var(--text-primary);">Notifications</h2>
                        </div>
                    </div>

                    <div class="notifications-list" style="
                        background:var(--panel-bg-soft);
                        border:1px solid var(--border-muted);
                        margin-top:1rem;
                    ">
                        <div style="padding:1rem; color:var(--text-muted);">Loading notifications...</div>
                    </div>
                </div>
            </div>

            <div class="right-col"></div>
        </div>
    `;

    renderRightColumn(root.querySelector(".right-col"));

    const listEl = root.querySelector(".notifications-list");

    if (!auth.currentUser) {
        listEl.innerHTML = `
            <div style="padding:1.1rem; color:var(--text-muted);">
                Please log in to view your notifications.
            </div>
        `;
        return;
    }

    try {
        // Notifications subcollection ----
        const notificationsRef = collection(db, "users", auth.currentUser.uid, "notifications");
        const notificationsQuery = query(notificationsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(notificationsQuery);

        if (snapshot.empty) {
            listEl.innerHTML = `
                <div style="padding:1.1rem; color:var(--text-muted);">
                    No notifications yet.
                </div>
            `;
            return;
        }

        const notificationCards = snapshot.docs.map((docSnap, index, docs) => {
            const notification = docSnap.data();
            const cardHTML = getNotificationCard(notification);

            if (index === docs.length - 1) {
                return cardHTML.replace("border-bottom:1px solid rgba(109, 132, 124, 0.18);", "border-bottom:none;");
            }

            return cardHTML;
        }).join("");

        listEl.innerHTML = notificationCards;
    } catch (error) {
        console.error("Error loading notifications:", error);
        listEl.innerHTML = `
            <div style="padding:1.1rem; color:#8a5a5a;">
                We could not load notifications right now.
            </div>
        `;
    }
}
