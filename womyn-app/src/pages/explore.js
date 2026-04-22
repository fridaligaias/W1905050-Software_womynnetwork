import { renderNavbar } from "../components/navbar"; 
import { db, auth } from "../utils/firebase"; 
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from "firebase/firestore";
import { getPostHTML, attachPostEvents } from "../components/postCard"; 
import { renderRightColumn } from "../components/rightColumn";

export function renderExplore(root) {
    root.innerHTML = `
    <div class="container">
        <div class="left-col">${renderNavbar()}</div>
        <div class="center-col">
            <h2 class="explore-title">explore</h2>
            
            <div class="explore-search-container">
                <input type="text" id="search-input" placeholder="Search for users or tags..." class="search-input" />
                <div class="search-tabs">
                    <button id="tab-tags" class="tab-btn active">Tags</button>
                    <button id="tab-people" class="tab-btn">People</button>
                </div>
            </div>

            <div id="trending-container" class="trending-section" style="display:none;">
                <div class="trending-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="color: var(--feed-heading); margin: 0;">trending</h3>
                    <button id="view-more-btn" style="background:none; border:none; font-size:0.9rem; color:var(--text-muted); cursor:pointer; font-weight:600; font-family:inherit;">View More</button>
                </div>
                
                <div id="trending-grid" class="trending-grid"></div>

                <div id="trending-more-container" class="trending-more-grid"></div>
                
                <hr style="margin-top: 2rem; border:0; border-top:1px solid var(--divider-soft);" />
            </div>

            <div id="explore-results">
                <p style="text-align:center; color:var(--text-muted); margin-top: 2rem;">Type to search...</p>
            </div>
        </div>
        <div class="right-col"></div>
    </div>
    `;

    renderRightColumn(root.querySelector(".right-col"));

    // DOM ELEMENTS
    const searchInput = document.getElementById("search-input");
    const tabTags = document.getElementById("tab-tags");
    const tabPeople = document.getElementById("tab-people");
    const resultsContainer = document.getElementById("explore-results");
    
    const trendingContainer = document.getElementById("trending-container");
    const trendingGrid = document.getElementById("trending-grid");
    const trendingMoreContainer = document.getElementById("trending-more-container");
    const viewMoreBtn = document.getElementById("view-more-btn");

    // STATE
    let allTrendingPosts = []; 
    let isExpanded = false; 

    // --- LOAD TRENDING (most liked) ---
    loadTrending();

    async function loadTrending() {
        try {
            const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) return;

            // Sort by likes
            const sortedPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));

            const topPosts = sortedPosts.slice(0, 20);
            
            allTrendingPosts = await Promise.all(topPosts.map(async (post) => {
                if (!post.authorUID) return { ...post, avatarUrl: null };
                const uSnap = await getDoc(doc(db, "users", post.authorUID));
                const uData = uSnap.exists() ? uSnap.data() : {};
                return { 
                    ...post, 
                    avatarUrl: uData.profileImageUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${uData.avatarSeed || post.username}` 
                };
            }));

            renderTrendingGrid(allTrendingPosts.slice(0, 3));
            trendingContainer.style.display = "block";

        } catch (err) {
            console.error("Error loading trending:", err);
        }
    }

    function renderTrendingGrid(posts) {
        let html = "";
        if (posts[0]) html += generateTrendingCard(posts[0], "trending-large");
        if (posts[1]) html += generateTrendingCard(posts[1], "trending-small top");
        if (posts[2]) html += generateTrendingCard(posts[2], "trending-small bottom");
        trendingGrid.innerHTML = html;
    }

    // --- VIEW MORE TOGGLE ---
    viewMoreBtn.onclick = () => {
        if (isExpanded) {
            trendingMoreContainer.innerHTML = ""; 
            viewMoreBtn.textContent = "View More";
            isExpanded = false;
        } else {
            const morePosts = allTrendingPosts.slice(3, 18); 

            if (morePosts.length === 0) {
                viewMoreBtn.textContent = "No more posts";
                return;
            }

            let html = "";
            morePosts.forEach(post => {
                html += generateTrendingCard(post, "trending-standard");
            });

            trendingMoreContainer.innerHTML = html;
            viewMoreBtn.textContent = "Show Less";
            isExpanded = true;
        }
    };

    // --- CARD ---
    function generateTrendingCard(post, className) {
        const safeContent = post.content || ""; 
        
        const isLarge = className.includes("trending-large");
        const charLimit = isLarge ? 300 : 100; 
        
        const title = post.title || safeContent.substring(0, 30) + (safeContent.length > 30 ? "..." : "");
        const snippet = safeContent.substring(0, charLimit) + (safeContent.length > charLimit ? "..." : "");
        
        const hasImage = post.type === "image" && post.imageUrl;
        
        const containerStyle = `position: relative; border: none; overflow: hidden; padding: 0 !important;`;

        let backgroundLayersHTML = "";
        if (hasImage) {
            backgroundLayersHTML = `
                <img src="${post.imageUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" />
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%); pointer-events: none;"></div>
            `;
        } else {
            backgroundLayersHTML = `<div style="position: absolute; top:0; left:0; width:100%; height:100%; background: var(--panel-bg); z-index:0;"></div>`;
        }
        const contentLayerStyle = `
            position: absolute; 
            top: 0; left: 0; width: 100%; height: 100%; 
            z-index: 2; 
            display: flex; 
            flex-direction: column; 
            justify-content: ${hasImage ? 'flex-end' : 'flex-start'}; 
            gap: 0.5rem;
            padding: 1.5rem; 
            box-sizing: border-box;
        `;
        //Text Styling
        const titleStyle = hasImage 
            ? "color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); font-size: 1.2rem; font-weight: bold;" 
            : "color: var(--text-primary); font-size: 1.2rem; font-weight: bold; line-height: 1.2;";
            
        const snippetStyle = hasImage 
            ? "color: rgba(255,255,255,0.9); font-size: 0.9rem;" 
            : "color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; flex-grow: 1;";

        return `
        <div class="trending-card ${className}" style="${containerStyle}" onclick="window.location.hash='#/thread/${post.id}'">
            
            ${backgroundLayersHTML}
            
            <div style="${contentLayerStyle}">
                
                <div class="trending-title" style="${titleStyle}">
                    ${post.title || title}
                </div>

                ${(!hasImage || isLarge || className.includes("standard")) ? `
                    <div class="trending-snippet" style="${snippetStyle}">
                        ${snippet}
                    </div>
                ` : ""}
            </div>
            
            <div class="trending-avatar-container" style="z-index: 3;">
                <img src="${post.avatarUrl}" class="trending-avatar" />
            </div>
        </div>
        `;
    }

    // --- SEARCH LOGIC ---
    let searchMode = "tags"; 
    let debounceTimer = null;

    tabTags.onclick = () => {
        searchMode = "tags";
        tabTags.classList.add("active");
        tabPeople.classList.remove("active");
        searchInput.placeholder = "Search tags (e.g. 'tech')...";
        performSearch(searchInput.value);
    };

    tabPeople.onclick = () => {
        searchMode = "people";
        tabPeople.classList.add("active");
        tabTags.classList.remove("active");
        searchInput.placeholder = "Search users (e.g. 'jane')...";
        performSearch(searchInput.value);
    };

    searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        const term = e.target.value.trim();
        
        if (term) {
            trendingContainer.style.display = "none";
        } else {
            trendingContainer.style.display = "block";
            resultsContainer.innerHTML = "<p style='text-align:center; color:var(--text-muted); margin-top: 2rem;'>Type to search...</p>";
            return;
        }

        debounceTimer = setTimeout(() => performSearch(term), 500);
    });

    async function performSearch(term) {
        if (!term) return;
        resultsContainer.innerHTML = "<p style='text-align:center; color:var(--text-muted);'>Searching...</p>";
        try {
            if (searchMode === "people") await searchPeople(term);
            else await searchTags(term);
        } catch (err) {
            console.error(err);
            resultsContainer.innerHTML = `<p style="color:#ff8b8b; text-align:center;">Error: ${err.message}</p>`;
        }
    }

    async function searchPeople(term) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", ">=", term), where("username", "<=", term + "\uf8ff"), limit(20));
        const snapshot = await getDocs(q);
        if (snapshot.empty) { resultsContainer.innerHTML = `<p style="text-align:center; color:var(--text-muted);">No users found.</p>`; return; }
        
        let html = `<div class="user-results-list">`;
        snapshot.forEach(doc => {
            const user = doc.data();
            const avatarUrl = user.profileImageUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${user.avatarSeed || user.username}`;
            html += `
            <div class="user-result-card" onclick="window.location.hash='#/profile/${user.username}'">
                <img src="${avatarUrl}" class="user-avatar" />
                <div>
                    <div style="font-weight:bold; color:var(--text-primary);">@${user.username}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${user.bio || "No bio."}</div>
                </div>
            </div>`;
        });
        html += `</div>`;
        resultsContainer.innerHTML = html;
    }

    async function searchTags(term) {
        const cleanTerm = term.toLowerCase().replace("#", "");
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("tags", "array-contains", cleanTerm), orderBy("createdAt", "desc"), limit(20));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) { resultsContainer.innerHTML = `<p style="text-align:center;">No posts found for #${cleanTerm}.</p>`; return; }
        
        let currentUserPinnedIds = [];
        if (auth.currentUser) {
            const uSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (uSnap.exists()) currentUserPinnedIds = uSnap.data().pinnedPostIds || [];
        }

        const htmlPromises = snapshot.docs.map(async (postDoc) => {
            const post = postDoc.data();
            let authorProfile = null;
            if (post.authorUID) {
                const userSnap = await getDoc(doc(db, "users", post.authorUID));
                if (userSnap.exists()) authorProfile = userSnap.data();
            }
            return getPostHTML(post, postDoc.id, authorProfile, currentUserPinnedIds);
        });

        const htmlStrings = await Promise.all(htmlPromises);
        resultsContainer.innerHTML = htmlStrings.join("");
        attachPostEvents(resultsContainer, currentUserPinnedIds);
    }
}
