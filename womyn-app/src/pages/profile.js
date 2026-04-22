import { renderNavbar } from "../components/navbar"; 
import { auth, db } from "../utils/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    updateDoc, 
    orderBy,
    doc
} from "firebase/firestore";
import { getPostHTML, attachPostEvents } from "../components/postCard"; 
import { renderRightColumn } from "../components/rightColumn";
import { toggleFollow } from "../utils/interactions"; 
import { showToast } from "../utils/ui"; 
import { attachModerationWatcher, logModerationEvent, scanModerationText } from "../utils/moderation";
import { escapeHTML } from "../utils/santising.js";

export async function renderProfile(root, username) {
    root.innerHTML = `
    <div class="container">
        <div class="left-col">${renderNavbar()}</div>
        <div class="center-col"><h2>Loading profile...</h2></div>
        <div class="right-col"></div>
    </div>
    `;

    const center = root.querySelector(".center-col");
    renderRightColumn(root.querySelector(".right-col"));

    try {
        let profileUsername = username;
        let userData = null;
        let isOwnProfile = false; 

        // FETCH PROFILE USER DATA ---
        if (!profileUsername) {
            // Case A: My (user) own Profile
            if (auth.currentUser) {
                const userDocRef = doc(db, "users", auth.currentUser.uid);
                const userSnap = await getDoc(userDocRef);
                if (!userSnap.exists()) { center.innerHTML = "<h2>User not found.</h2>"; return; }
                userData = userSnap.data();
                userData.uid = auth.currentUser.uid;
                profileUsername = userData.username; 
                isOwnProfile = true; 
            } else { center.innerHTML = "<h2>Please login.</h2>"; return; }
        } else {
            // Case B: other User
            const userQuery = query(collection(db, "users"), where("username", "==", profileUsername));
            const userSnap = await getDocs(userQuery);
            if (userSnap.empty) { center.innerHTML = `<h2>User "${profileUsername}" not found.</h2>`; return; }
            userData = userSnap.docs[0].data();
            userData.uid = userSnap.docs[0].id; 
            if (auth.currentUser && auth.currentUser.uid === userData.uid) isOwnProfile = true;
        }

        // --- CHECK FOLLOW STATUS  ---
        let isFollowing = false;
        let currentUserPinnedIds = [];

        if (auth.currentUser) {
            const currentUserRef = doc(db, "users", auth.currentUser.uid);
            const currentUserSnap = await getDoc(currentUserRef);
            
            if (currentUserSnap.exists()) {
                const myData = currentUserSnap.data();
                currentUserPinnedIds = myData.pinnedPostIds || [];
                const myFollowing = myData.following || [];
                isFollowing = myFollowing.includes(userData.uid);
            }
        }

        const currentSeed = userData.avatarSeed || userData.username; 
        const headerAvatarUrl = userData.profileImageUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(currentSeed)}`;
        const safeHeaderAvatarUrl = escapeHTML(headerAvatarUrl);
        const safeUsername = escapeHTML(userData.username || "unknown");
        const safeBio = escapeHTML(userData.bio || "");
        
        // Follow Button HTML
        let actionButtonHTML = "";
        if (isOwnProfile) {
            actionButtonHTML = `<button id="edit-profile-btn" class="secondary-btn profile-edit-btn">Edit Profile</button>`;
        } else if (auth.currentUser && auth.currentUser.uid !== userData.uid) {
            // If following -> "Unfollow", If not -> "Follow" 
            const btnText = isFollowing ? "Unfollow" : "Follow";
            const btnClass = isFollowing ? "secondary-btn" : "primary-btn";
            actionButtonHTML = `<button id="follow-btn" class="${btnClass}">${btnText}</button>`;
        }
        // Follower Counts 
        const followerCount = (userData.followers || []).length;
        const followingCount = (userData.following || []).length;
        const openWarningCount = userData.openWarningCount || 0;
        const warningBadgeHTML = openWarningCount > 0
            ? `<div class="profile-warning-pill">TOXIC BEHAVIOUR UNDER REVIEW : ${openWarningCount}</div>`
            : "";

        // --- FETCH POSTS ---
        const postsQuery = query(
            collection(db, "posts"),
            where("username", "==", profileUsername),
            orderBy("createdAt", "desc")
        );
        const postsSnap = await getDocs(postsQuery);
        let postsHTML = "";
        postsSnap.forEach(doc => {
            postsHTML += getPostHTML(doc.data(), doc.id, userData, currentUserPinnedIds, [], { variant: "stream" });
        });


        // --- HTML ---
        center.innerHTML = `
            <div class="profile-header-section">
                <div class="profile-header-top">
                    <div class="profile-avatar-frame">
                        <img id="profile-main-avatar" class="profile-main-avatar" src="${safeHeaderAvatarUrl}" />
                    </div>
                    <div>
                        <h2 style="margin: 0;">@${safeUsername}</h2>
                        ${warningBadgeHTML}
                        <div style="font-size: 0.9rem; color: #666; margin: 4px 0;">
                            <strong>${followerCount}</strong> followers &bull; <strong>${followingCount}</strong> following
                        </div>
                        <p style="margin: 5px 0 0 0; color: #444;">${safeBio || "No bio yet."}</p>
                    </div>
                </div>
                
                <div style="margin-top: 1rem;">
                    ${actionButtonHTML}
                </div>

                <div id="edit-form" style="display: none; margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
                    <label style="font-weight:bold; display:block; margin-bottom:0.5rem;">Update Bio</label>
                    <textarea id="bio-input" class="post-textarea" rows="3">${safeBio}</textarea>
                    <div id="bio-moderation-warning" class="moderation-warning"></div>
                    
                    <label style="font-weight:bold; display:block; margin-top:1rem; margin-bottom:0.5rem;">Avatar</label>
                    <div class="profile-edit-avatar-row" style="display: flex; gap: 10px; align-items: center;">
                        <button id="shuffle-avatar-btn" class="secondary-btn profile-edit-secondary-btn" type="button">Shuffle Avatar</button>
                        <span class="profile-edit-note" style="font-size: 0.8rem; color: #666;">(Click Save to apply)</span>
                    </div>

                    <div class="profile-edit-actions" style="margin-top: 1rem;">
                        <button id="save-profile-btn" class="primary-btn profile-save-btn">Save Changes</button>
                        <button id="cancel-edit-btn" class="secondary-btn profile-edit-secondary-btn">Cancel</button>
                    </div>
                </div>
            </div>
            
            <hr class="profile-divider"/>
            <h3>Posts</h3>
            <div id="profile-posts-list" class="posts-grid">
                ${postsHTML || "<p>No posts yet.</p>"}
            </div>
        `;

        // Activate Post Actions
        const postsContainer = center.querySelector("#profile-posts-list");
        if(postsContainer) attachPostEvents(postsContainer, currentUserPinnedIds);


        // ---ATTACH FOLLOW LISTENER ---
        const followBtn = document.getElementById("follow-btn");
        if (followBtn) {
            followBtn.onclick = async () => {
                // Disable button
                followBtn.disabled = true;
                
                try {
                    await toggleFollow(auth.currentUser.uid, userData.uid, isFollowing);
                    // Toggle 
                    isFollowing = !isFollowing;
                    
                    if (isFollowing) {
                        followBtn.textContent = "Unfollow";
                        followBtn.className = "secondary-btn";
                        showToast(`Following @${userData.username}`);
                    } else {
                        followBtn.textContent = "Follow";
                        followBtn.className = "primary-btn";
                        showToast(`Unfollowed @${userData.username}`);
                    }
                } catch (err) {
                    console.error(err);
                    showToast("Action failed.");
                } finally {
                    followBtn.disabled = false;
                }
            };
        }

        // --- ATTACH EDIT LISTENERS ---
        if (isOwnProfile) {
            const editBtn = document.getElementById("edit-profile-btn");
            const editForm = document.getElementById("edit-form");
            const cancelBtn = document.getElementById("cancel-edit-btn");
            const saveBtn = document.getElementById("save-profile-btn");
            const bioInput = document.getElementById("bio-input");
            const shuffleBtn = document.getElementById("shuffle-avatar-btn");
            const mainAvatar = document.getElementById("profile-main-avatar");
            const bioModerationWarning = document.getElementById("bio-moderation-warning");
            let newSeed = currentSeed; 
            let newProfileImageUrl = userData.profileImageUrl || null;
            const bioWatcher = attachModerationWatcher({
                fields: [bioInput],
                getText: () => bioInput.value,
                warningEl: bioModerationWarning,
                label: "This bio"
            });

            editBtn.onclick = () => { editForm.style.display = "block"; editBtn.style.display = "none"; };
            
            cancelBtn.onclick = () => { 
                editForm.style.display = "none"; 
                editBtn.style.display = "inline-block";
                bioInput.value = userData.bio || ""; 
                newSeed = currentSeed; 
                newProfileImageUrl = userData.profileImageUrl || null;
                mainAvatar.src = headerAvatarUrl; 
                bioWatcher.refresh();
            };

            shuffleBtn.onclick = () => {
                newSeed = Math.random().toString(36).substring(7); 
                newProfileImageUrl = null;
                mainAvatar.src = `https://api.dicebear.com/9.x/glass/svg?seed=${newSeed}`; 
            };

            saveBtn.onclick = async () => {
                const newBio = bioInput.value.trim();
                const moderationResult = scanModerationText(newBio);
                try {
                    const userRef = doc(db, "users", auth.currentUser.uid);
                    if (moderationResult.isFlagged) {
                        await logModerationEvent({
                            userId: auth.currentUser.uid,
                            username: userData.username,
                            sourceType: "bio",
                            text: newBio,
                            matchedRule: moderationResult.matchedRule,
                            category: moderationResult.category,
                            matchedRules: moderationResult.matchedRules,
                            categories: moderationResult.categories,
                            severity: moderationResult.severity,
                            context: {
                                contextLink: `#/profile/${userData.username}`,
                                contextLabel: `@${userData.username}`
                            }
                        });
                    }
                    await updateDoc(userRef, { bio: newBio, avatarSeed: newSeed, profileImageUrl: newProfileImageUrl });
                    userData.bio = newBio;
                    userData.avatarSeed = newSeed;
                    userData.profileImageUrl = newProfileImageUrl;
                    window.__womynCurrentUserProfile = {
                        ...(window.__womynCurrentUserProfile || {}),
                        bio: newBio,
                        avatarSeed: newSeed,
                        profileImageUrl: newProfileImageUrl
                    };
                    document.querySelector(".profile-header-section p").textContent = newBio || "No bio yet.";
                    editForm.style.display = "none";
                    editBtn.style.display = "inline-block";
                    bioWatcher.refresh();
                    showToast("Profile updated!");
                } catch (err) { alert("Error: " + err.message); }
            };
        }

    } catch (err) {
        console.error(err);
        center.innerHTML = `<h2>Error loading profile: ${escapeHTML(err.message)}</h2>`;
    }
}
