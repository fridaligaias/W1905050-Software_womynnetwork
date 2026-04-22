import { renderNavbar } from "../components/navbar";
import { auth, db } from "../utils/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { warnUserFromModerationEvent } from "../utils/moderation";

function formatTimestamp(value) {
    if (!value) return "Pending";
    const date = value.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return "Pending";
    return date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHTML(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export async function renderModDashboard(root) {
    const currentProfile = window.__womynCurrentUserProfile || {};

    root.innerHTML = `
    <div class="container">
        <div class="left-col">${renderNavbar()}</div>
        <div class="mod-dashboard-col">
            <div class="mod-dashboard-shell">
                <div class="mod-dashboard-hero">
                    <span class="circles-kicker">Moderator</span>
                    <h2>Mod Dashboard</h2>
                    <p>Hello, <strong>${escapeHTML(currentProfile.username || "Moderator")}</strong>. Review flagged submissions below.</p>
                </div>

                <div class="mod-table-wrap">
                    <table class="mod-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>User</th>
                                <th>Source</th>
                                <th>Category</th>
                                <th>Severity</th>
                                <th>Rule</th>
                                <th>Preview</th>
                                <th>Context</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="mod-events-body">
                            <tr><td colspan="9">Loading moderation events...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `;

    const tbody = document.getElementById("mod-events-body");

    try {
        const q = query(collection(db, "moderation_events"), orderBy("createdAt", "desc"), limit(100));
        const snap = await getDocs(q);

        if (snap.empty) {
            tbody.innerHTML = `<tr><td colspan="9">No flagged submissions yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = snap.docs.map((rowDoc) => {
            const row = rowDoc.data();
            const preview = row.fullText || row.contentExcerpt || "No preview";
            const matchedRules = Array.isArray(row.matchedRules) && row.matchedRules.length
                ? row.matchedRules
                : [row.matchedRule || "-"];
            const categories = Array.isArray(row.categories) && row.categories.length
                ? row.categories.join(", ")
                : (row.category || "-");
            const derivedContextLink = row.contextLink
                || (row.postId ? `#/thread/${row.postId}` : row.username ? `#/profile/${row.username}` : "");
            const isThreadContext = Boolean(
                row.postId
                || (typeof derivedContextLink === "string" && derivedContextLink.startsWith("#/thread/"))
            );
            const isProfileContext = Boolean(
                !isThreadContext
                && row.username
                && typeof derivedContextLink === "string"
                && derivedContextLink.startsWith("#/profile/")
            );
            const contextLabel = isThreadContext
                ? "View thread"
                : isProfileContext
                    ? `@${row.username}`
                    : (row.contextLabel || "View submission");
            const contextHTML = derivedContextLink
                ? `<a class="mod-context-link" href="${escapeHTML(derivedContextLink)}">${escapeHTML(contextLabel)}</a>`
                : escapeHTML(contextLabel);
            const severity = row.severity || "medium";
            const warned = row.warned === true;

            return `
                <tr data-event-id="${rowDoc.id}" data-user-id="${escapeHTML(row.userId || "")}" data-username="${escapeHTML(row.username || "")}" data-severity="${escapeHTML(severity)}" data-warned="${warned ? "true" : "false"}">
                    <td><div class="mod-cell-content">${escapeHTML(formatTimestamp(row.createdAt))}</div></td>
                    <td><div class="mod-cell-content">@${escapeHTML(row.username || "unknown")}</div></td>
                    <td><div class="mod-cell-content">${escapeHTML(row.sourceType || "-")}</div></td>
                    <td><div class="mod-cell-content">${escapeHTML(categories)}</div></td>
                    <td><div class="mod-cell-content"><span class="mod-severity-pill mod-severity-${escapeHTML(severity)}">${escapeHTML(severity)}</span></div></td>
                    <td><div class="mod-cell-content">${escapeHTML(matchedRules.join(", "))}</div></td>
                    <td class="mod-table-preview"><div class="mod-cell-content">${escapeHTML(preview)}</div></td>
                    <td><div class="mod-cell-content">${contextHTML}</div></td>
                    <td>
                        ${warned
                            ? `<span class="mod-action-state">Warned</span>`
                            : `<button type="button" class="secondary-btn mod-warn-btn" data-event-id="${rowDoc.id}">Warn user</button>`}
                    </td>
                </tr>
            `;
        }).join("");

        tbody.addEventListener("click", async (event) => {
            const warnBtn = event.target.closest(".mod-warn-btn");
            if (!warnBtn) return;

            const rowEl = warnBtn.closest("tr");
            if (!rowEl || rowEl.dataset.warned === "true") return;

            const rowData = {
                userId: rowEl.dataset.userId,
                username: rowEl.dataset.username,
                severity: rowEl.dataset.severity
            };

            if (warnBtn) {
                warnBtn.disabled = true;
                warnBtn.textContent = "Warning...";

                try {
                    const result = await warnUserFromModerationEvent({
                        eventId: warnBtn.dataset.eventId,
                        moderatorId: auth.currentUser?.uid,
                        moderatorUsername: currentProfile.username,
                        row: rowData
                    });

                    if (result.warned) {
                        rowEl.dataset.warned = "true";
                        warnBtn.outerHTML = `<span class="mod-action-state">Warned</span>`;
                    } else {
                        if (result.reason === "already_warned") {
                            rowEl.dataset.warned = "true";
                            warnBtn.outerHTML = `<span class="mod-action-state">Warned</span>`;
                        } else {
                            warnBtn.disabled = false;
                            warnBtn.textContent = "Warn user";
                        }
                    }
                } catch (error) {
                    console.error("Error warning user:", error);
                    warnBtn.disabled = false;
                    warnBtn.textContent = "Warn user";
                }
            }
        });
    } catch (error) {
        console.error("Error loading moderation events:", error);
        tbody.innerHTML = `<tr><td colspan="9">Could not load moderation events.</td></tr>`;
    }
}
