import {
    addDoc,
    collection,
    doc,
    getDoc,
    increment,
    serverTimestamp,
    writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { showToast } from "./ui";

const COMMUNITY_RULES = [
    { pattern: /\bnigger\b/i, rule: "racial_slur_n_word", severity: "medium" },
    { pattern: /\bfaggot\b/i, rule: "anti_gay_slur_f", severity: "medium" },
    { pattern: /\bkike\b/i, rule: "anti_jewish_slur_k", severity: "medium" },
    { pattern: /\bspic\b/i, rule: "anti_latino_slur_s", severity: "medium" },
    { pattern: /\bchink\b/i, rule: "anti_asian_slur_c", severity: "medium" },
    { pattern: /\bkill yourself\b/i, rule: "abusive_phrase_death_threat", severity: "medium" },
    { pattern: /\bbitch\b/i, rule: "abusive_phrase_b", severity: "medium" },
    { pattern: /\bnigga\b/i, rule: "racial_slur_n_word_variation", severity: "medium" },
    { pattern: /\bcunt\b/i, rule: "abusive_term_c", severity: "high" },
    { pattern: /\bkys\b/i, rule: "abusive_acronym_kys", severity: "high" },
    { pattern: /\bgo die\b/i, rule: "abusive_phrase_go_die", severity: "medium" },
    { pattern: /\bend your life\b/i, rule: "self_harm_encouragement_end_your_life", severity: "medium" },
    { pattern: /\bI('| wi)ll kill you\b/i, rule: "threat_phrase_ky", severity: "high" },
    { pattern: /\bwhore\b/i, rule: "abusive_term_w", severity: "low" },
    { pattern: /\bslut\b/i, rule: "abusive_term_s", severity: "low" }
];

const SECURITY_RULES = [
    { pattern: /<script\b/i, rule: "script_tag", severity: "high" },
    { pattern: /javascript:/i, rule: "javascript_uri", severity: "high" },
    { pattern: /\bonerror\s*=/i, rule: "onerror_handler", severity: "high" },
    { pattern: /\bonclick\s*=/i, rule: "onclick_handler", severity: "high" },
    { pattern: /<iframe\b/i, rule: "iframe_tag", severity: "high" },
    { pattern: /<img\b[^>]*(onerror|onload)\s*=/i, rule: "img_event_handler", severity: "high" },
    { pattern: /document\.cookie/i, rule: "document_cookie_access", severity: "high" },
    { pattern: /<svg\b[^>]*(onload|onbegin)\s*=/i, rule: "svg_event_handler", severity: "high" }
];

const SEVERITY_RANK = {
    low: 1,
    medium: 2,
    high: 3
};

function getWordCount(text = "") {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function buildExcerpt(text = "") {
    const trimmed = text.trim();
    if (!trimmed) return "";
    return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
}

function getHighestSeverity(severities = []) {
    if (!severities.length) return null;
    return severities.reduce((highest, current) => (
        SEVERITY_RANK[current] > SEVERITY_RANK[highest] ? current : highest
    ), severities[0]);
}

export function scanModerationText(text = "") {
    const normalized = String(text || "").trim();
    if (!normalized) {
        return {
            isFlagged: false,
            category: null,
            categories: [],
            matchedRule: null,
            matchedRules: [],
            severity: null,
            excerpt: ""
        };
    }

    const securityMatches = SECURITY_RULES
        .filter((rule) => rule.pattern.test(normalized))
        .map((rule) => ({ rule: rule.rule, severity: rule.severity }));
    const communityMatches = COMMUNITY_RULES
        .filter((rule) => rule.pattern.test(normalized))
        .map((rule) => ({ rule: rule.rule, severity: rule.severity }));
    const allMatches = [...securityMatches, ...communityMatches];
    const matchedRules = allMatches.map((match) => match.rule);

    if (!matchedRules.length) {
        return {
            isFlagged: false,
            category: null,
            categories: [],
            matchedRule: null,
            matchedRules: [],
            severity: null,
            excerpt: ""
        };
    }

    const categories = [
        ...(securityMatches.length ? ["security"] : []),
        ...(communityMatches.length ? ["community"] : [])
    ];

    return {
        isFlagged: true,
        category: securityMatches.length ? "security" : "community",
        categories,
        matchedRule: matchedRules[0],
        matchedRules,
        severity: getHighestSeverity(allMatches.map((match) => match.severity)),
        excerpt: buildExcerpt(normalized)
    };
}

export function renderModerationWarning(result, warningEl) {
    if (!warningEl) return;

    if (!result?.isFlagged) {
        warningEl.innerHTML = "";
        warningEl.style.display = "none";
        return;
    }

    const categoryLabel = result.categories?.length > 1
        ? "Multiple moderation warnings"
        : result.category === "security"
            ? "Security risk"
            : "Community rule warning";
    const rulesLabel = (result.matchedRules || [])
        .slice(0, 3)
        .join(", ")
        .replace(/_/g, " ");
    const moreCount = Math.max((result.matchedRules || []).length - 3, 0);
    warningEl.innerHTML = `
        <strong>${categoryLabel}:</strong>
        This text may breach the Terms of Use.
        ${rulesLabel ? `<div class="moderation-warning-rules">Detected: ${rulesLabel}${moreCount ? `, +${moreCount} more` : ""}</div>` : ""}
    `;
    warningEl.style.display = "block";
}

export function attachModerationWatcher({ fields = [], getText, warningEl, label = "This text", onScanComplete = null }) {
    let debounceTimer = null;
    let lastSignature = "";

    const runScan = () => {
        const text = typeof getText === "function" ? getText() : "";
        const scanStart = performance.now();
        const result = scanModerationText(text);
        const scanDurationMs = Number((performance.now() - scanStart).toFixed(3));
        const signature = result.isFlagged ? (result.matchedRules || []).join("|") : "";

        renderModerationWarning(result, warningEl);

        if (result.isFlagged && signature !== lastSignature) {
            showToast(`${label} may breach the Terms of Use.`);
        }

        if (typeof onScanComplete === "function") {
            onScanComplete({
                durationMs: scanDurationMs,
                isFlagged: result.isFlagged,
                matchedRules: result.matchedRules || []
            });
        }

        lastSignature = signature;
        return result;
    };

    const debouncedScan = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runScan, 450);
    };

    fields.forEach((field) => {
        if (!field) return;
        field.addEventListener("input", debouncedScan);
    });

    return {
        refresh: runScan
    };
}

export async function logModerationEvent({
    userId,
    username,
    sourceType,
    text,
    matchedRule,
    matchedRules = [],
    category,
    categories = [],
    severity = null,
    context = {}
}) {
    const normalized = String(text || "").trim();
    if (!userId || !username || !sourceType || !matchedRule || !category || !normalized) return;

    const wordCount = getWordCount(normalized);

    await addDoc(collection(db, "moderation_events"), {
        userId,
        username,
        sourceType,
        category,
        categories,
        matchedRule,
        matchedRules: matchedRules.length ? matchedRules : [matchedRule],
        severity,
        warned: false,
        warnedAt: null,
        warnedByUserId: null,
        contentExcerpt: buildExcerpt(normalized),
        fullText: wordCount < 100 ? normalized : null,
        createdAt: serverTimestamp(),
        ...context
    });
}

export async function warnUserFromModerationEvent({
    eventId,
    moderatorId,
    moderatorUsername,
    row
}) {
    if (!eventId || !moderatorId || !row?.userId) return { warned: false, reason: "missing_data" };

    const eventRef = doc(db, "moderation_events", eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
        return { warned: false, reason: "missing_event" };
    }

    const eventData = eventSnap.data();
    if (eventData.warned) {
        return { warned: false, reason: "already_warned" };
    }

    const batch = writeBatch(db);
    const warningRef = doc(collection(db, "user_warnings"));
    const notificationRef = doc(collection(db, "users", row.userId, "notifications"));
    const targetUserRef = doc(db, "users", row.userId);

    batch.set(warningRef, {
        userId: row.userId,
        username: row.username || "unknown",
        moderationEventId: eventId,
        createdAt: serverTimestamp(),
        createdByModeratorId: moderatorId,
        createdByModeratorUsername: moderatorUsername || "moderator",
        severity: row.severity || eventData.severity || "medium",
        status: "open"
    });

    batch.update(eventRef, {
        warned: true,
        warnedAt: serverTimestamp(),
        warnedByUserId: moderatorId
    });

    batch.update(targetUserRef, {
        openWarningCount: increment(1)
    });

    batch.set(notificationRef, {
        type: "moderation_warning",
        text: "Your account is under review for possible Terms of Use breaches.",
        link: `#/profile/${row.username || ""}`,
        createdAt: serverTimestamp(),
        read: false
    });

    await batch.commit();

    showToast(`Warned @${row.username || "user"}.`);
    return { warned: true };
}
