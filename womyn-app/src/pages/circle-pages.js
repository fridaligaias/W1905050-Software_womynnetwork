import { renderNavbar } from "../components/navbar"; 
import { db, auth } from "../utils/firebase"; 
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs 
} from "firebase/firestore";
import { renderRightColumn } from "../components/rightColumn";
import { getPostHTML, attachPostEvents } from "../components/postCard";
import { toggleCircleMembership, getCircles, createCircle, deleteCircle } from "../utils/circles"; 
import { showToast, showConfirmModal } from "../utils/ui";

function generateAvatarSeed() {
    return Math.random().toString(36).substring(7);
}

// Discovery view of circles

export async function renderCircles(root) {
    root.innerHTML = `
    <div class="container">
        <div class="left-col">${renderNavbar()}</div>
        <div class="center-col">
            <div class="circles-shell">
                <div class="circles-hero">
                    <div class="circles-hero-copy">
                        <span class="circles-kicker">Discover</span>
                        <div class="circles-header-row">
                            <div class="circles-header-text">
                                <h2>circles</h2>
                                <p>Find your community.</p>
                            </div>
                            <button id="open-create-btn" class="primary-btn circles-create-btn">+ Create Circle</button>
                        </div>
                        <p class="circles-hero-description">
                            Explore spaces to connect, share, and take part in what matters to you.
                        </p>
                    </div>
                </div>

                <div id="circles-grid" class="circles-grid">
                    <p>Loading circles...</p>
                </div>
            </div>
        </div>
        <div class="right-col"></div>
    </div>

    <div id="create-circle-modal" class="modal-backdrop" style="display: none;">
        <div class="modal-box" style="text-align: left;">
            <h3 class="modal-title">Create a Circle</h3>
            <p class="modal-subtitle">Circles are spaces for shared interests and discussions.</p>

            <div class="circle-create-avatar-section">
                <div class="profile-avatar-frame circle-create-avatar-frame">
                    <img id="circle-avatar-preview" class="profile-main-avatar" alt="Circle avatar preview" />
                </div>
                <div class="profile-edit-avatar-row circle-create-avatar-row" style="display: flex; gap: 10px; align-items: center;">
                    <button id="shuffle-circle-avatar-btn" class="secondary-btn profile-edit-secondary-btn" type="button">Randomise</button>
                </div>
            </div>
            
            <label class="modal-label">Circle Name</label>
            <input type="text" id="circle-name-input" class="post-textarea modal-input" placeholder="e.g. Hiking Enthusiasts" />
            
            <label class="modal-label">Description</label>
            <textarea id="circle-desc-input" class="post-textarea" rows="3" placeholder="What is this circle about?"></textarea>

            <div class="modal-actions">
                <button id="cancel-create-btn" class="secondary-btn">Cancel</button>
                <button id="confirm-create-btn" class="primary-btn">Create</button>
            </div>
        </div>
    </div>
    `;

    renderRightColumn(root.querySelector(".right-col"));
    const grid = document.getElementById("circles-grid");
    
    const modal = document.getElementById("create-circle-modal");
    const openBtn = document.getElementById("open-create-btn");
    const cancelBtn = document.getElementById("cancel-create-btn");
    const confirmBtn = document.getElementById("confirm-create-btn");
    const nameInput = document.getElementById("circle-name-input");
    const descInput = document.getElementById("circle-desc-input");
    const avatarPreview = document.getElementById("circle-avatar-preview");
    const shuffleAvatarBtn = document.getElementById("shuffle-circle-avatar-btn");
    let pendingAvatarSeed = generateAvatarSeed();

    const updateAvatarPreview = () => {
        avatarPreview.src = `https://api.dicebear.com/9.x/glass/svg?seed=${pendingAvatarSeed}`;
    };

    updateAvatarPreview();

    openBtn.onclick = () => {
        if (!auth.currentUser) return alert("Please login to create a circle.");
        modal.style.display = "flex";
        updateAvatarPreview();
        nameInput.focus();
    };

    const closeModal = () => {
        modal.style.display = "none";
        nameInput.value = "";
        descInput.value = "";
        pendingAvatarSeed = generateAvatarSeed();
        updateAvatarPreview();
    };

    cancelBtn.onclick = closeModal;
    shuffleAvatarBtn.onclick = () => {
        pendingAvatarSeed = generateAvatarSeed();
        updateAvatarPreview();
    };
    
    // Close if clicking outside the box
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    confirmBtn.onclick = async () => {
        const name = nameInput.value;
        const desc = descInput.value;

        if (!name || !desc) return alert("Please fill in all fields.");

        confirmBtn.disabled = true;
        confirmBtn.textContent = "Creating...";

        try {
            await createCircle(name, desc, pendingAvatarSeed);
            showToast("Circle created!");
            closeModal();
            loadGrid(); 
        } catch (err) {
            alert(err.message);
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = "Create";
        }
    };

    // --- Grid loading  ---
    async function loadGrid() {
        grid.innerHTML = "<p>Loading...</p>";
        
        // Fetch (users) joined circles
        let joinedCircles = [];
        if (auth.currentUser) {
            const uSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (uSnap.exists()) {
                joinedCircles = uSnap.data().joinedCircles || [];
            }
        }

        // fetch ALL circles
        const circles = await getCircles();

        if (circles.length === 0) {
            grid.innerHTML = `
                <div class="circles-empty-state">
                    No circles yet. Be the first to create one!
                </div>`;
            return;
        }

        // Render cards
        grid.innerHTML = circles.map(circle => {
            const isJoined = joinedCircles.includes(circle.id);
            const btnText = isJoined ? "Joined" : "Join";
            const btnClass = isJoined ? "secondary-btn" : "primary-btn";
            const avatarUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${circle.avatarSeed}`;
            const description = circle.description || "A place for shared updates and conversations.";

            return `
            <div class="circle-card">
                <div class="circle-card-glow"></div>
                <div class="circle-icon-wrapper">
                    <a href="#/circle/${circle.id}">
                        <img src="${avatarUrl}" class="circle-icon" />
                    </a>
                </div>
                <div class="circle-info">
                    <h3><a href="#/circle/${circle.id}" class="circle-card-link">${circle.name}</a></h3>
                    <p>${description}</p>
                </div>
                <button class="${btnClass} join-circle-btn" data-id="${circle.id}">
                    ${btnText}
                </button>
            </div>
            `;
        }).join("");

        // Join 
        grid.querySelectorAll(".join-circle-btn").forEach(btn => {
            btn.onclick = async (e) => {
                const circleId = btn.dataset.id;
                const isCurrentlyJoined = btn.textContent.trim() === "Joined";
                
                btn.disabled = true;
                const success = await toggleCircleMembership(circleId, !isCurrentlyJoined);
                
                if (success) {
                    if (!isCurrentlyJoined) {
                        btn.textContent = "Joined";
                        btn.className = "secondary-btn join-circle-btn";
                        showToast(`Joined ${circleId}`);
                    } else {
                        btn.textContent = "Join";
                        btn.className = "primary-btn join-circle-btn";
                        showToast(`Left ${circleId}`);
                    }
                }
                btn.disabled = false;
            };
        });
    }

    loadGrid();
}
// selected circle view
export async function renderCircleFeed(root, circleId) {
    root.innerHTML = `
    <div class="container">
        <div class="left-col">${renderNavbar()}</div>
        <div class="center-col">
            <div id="circle-header-loader"><h2>Loading Circle...</h2></div>
            <div id="circle-feed-posts" class="posts-grid"></div>
        </div>
        <div class="right-col"></div>
    </div>
    `;

    renderRightColumn(root.querySelector(".right-col"));
    const headerContainer = document.getElementById("circle-header-loader");
    const postsContainer = document.getElementById("circle-feed-posts");

    try {
        const circleRef = doc(db, "circles", circleId);
        const circleSnap = await getDoc(circleRef);

        if (!circleSnap.exists()) {
            headerContainer.innerHTML = "<h2>Circle not found.</h2>";
            return;
        }

        const circleData = circleSnap.data();
        
        let isMember = false;
        let isOwner = false;
        let currentUserPinnedIds = [];
        
        if (auth.currentUser) {
            const uSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (uSnap.exists()) {
                const uData = uSnap.data();
                isMember = (uData.joinedCircles || []).includes(circleId);
                currentUserPinnedIds = uData.pinnedPostIds || [];
            }
            if (circleData.creatorUID === auth.currentUser.uid) {
                isOwner = true;
            }
        }

        const avatarUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${circleData.avatarSeed}`;
        
        headerContainer.innerHTML = `
            <div class="profile-header-section circle-feed-header">
                <div class="circle-info-container">
                    <img src="${avatarUrl}" class="circle-avatar-large" />
                    <div class="circle-details">
                        <h2>${circleData.name}</h2>
                        <p>${circleData.description}</p>
                        <div class="circle-meta">
                            ${circleData.memberCount || 0} members 
                            ${isOwner ? '<span class="admin-badge">Admin</span>' : ''}
                        </div>
                    </div>
                </div>
                
                <div class="circle-actions-row">
                    <button id="circle-join-btn" class="${isMember ? 'secondary-btn' : 'primary-btn'}">
                        ${isMember ? "Joined" : "Join Circle"}
                    </button>
                    
                    <button id="create-circle-post-btn" class="secondary-btn" style="display:${isMember ? 'block' : 'none'}">
                        + Post
                    </button>

                    ${isOwner ? `<button id="delete-circle-btn" class="secondary-btn circle-delete-btn">Delete Circle</button>` : ''}
                </div>
            </div>
            <hr class="profile-divider feed-divider"/>
        `;

        const joinBtn = document.getElementById("circle-join-btn");
        const postBtn = document.getElementById("create-circle-post-btn");
        const deleteBtn = document.getElementById("delete-circle-btn");

        joinBtn.onclick = async () => {
            if (!auth.currentUser) return alert("Login required");
            joinBtn.disabled = true;
            const success = await toggleCircleMembership(circleId, !isMember);
            if (success) {
                isMember = !isMember;
                const metaDiv = document.querySelector(".circle-meta");
                //get current
                let currentCount = parseInt(metaDiv.textContent) || 0;
                if (isMember) {
                    joinBtn.textContent = "Joined";
                    joinBtn.className = "secondary-btn";
                    postBtn.style.display = "block";
                    showToast(`Joined ${circleData.name}`);

                    currentCount++;
                } else {
                    joinBtn.textContent = "Join Circle";
                    joinBtn.className = "primary-btn";
                    postBtn.style.display = "none";
                    showToast(`Left ${circleData.name}`);

                    currentCount--;
                }
                metaDiv.innerHTML = `${currentCount} members ${isOwner ? '<span class="admin-badge">Admin</span>' : ''}`;
            }
            joinBtn.disabled = false;
        };

        postBtn.onclick = () => {
            window.location.hash = `#/post?circleId=${circleId}&circleName=${encodeURIComponent(circleData.name)}&circleSeed=${circleData.avatarSeed}`;
        };

        if (deleteBtn) {
            deleteBtn.onclick = () => {
                showConfirmModal(`Are you sure you want to delete "${circleData.name}"? This cannot be undone.`, async () => {
                    try {
                        deleteBtn.textContent = "Deleting...";
                        deleteBtn.disabled = true;
                        
                        await deleteCircle(circleId);
                        
                        showToast("Circle deleted.");
                        setTimeout(() => {
                            window.location.hash = "#/circles"; 
                        }, 1000);
                    } catch (err) {
                        alert(err.message);
                        deleteBtn.textContent = "Delete Circle";
                        deleteBtn.disabled = false;
                    }
                });
            };
        }

        const q = query(
            collection(db, "posts"), 
            where("circleId", "==", circleId),
            orderBy("createdAt", "desc")
        );
        
        const postsSnap = await getDocs(q);

        if (postsSnap.empty) {
            postsContainer.innerHTML = `
                <div style="text-align:center; padding: 2rem; color: #666;">
                    <p>No posts in this circle yet.</p>
                </div>`;
        } else {
            let postsHTML = "";
            const htmlPromises = postsSnap.docs.map(async (pDoc) => {
                const post = pDoc.data();
                let authorProfile = null;
                if (post.authorUID) {
                    const aSnap = await getDoc(doc(db, "users", post.authorUID));
                if (aSnap.exists()) authorProfile = aSnap.data();
                }
                return getPostHTML(post, pDoc.id, authorProfile, currentUserPinnedIds, [], { variant: "stream" });
            });
            const htmlStrings = await Promise.all(htmlPromises);
            postsContainer.innerHTML = htmlStrings.join("");
            attachPostEvents(postsContainer, currentUserPinnedIds);
        }

    } catch (err) {
        console.error(err);
        headerContainer.innerHTML = `<h2>Error: ${err.message}</h2>`;
    }
}
