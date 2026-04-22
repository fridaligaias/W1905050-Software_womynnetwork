import { renderNavbar } from "../components/navbar"; 
import { db, auth } from "../utils/firebase";
import { collection, query, orderBy, limit, getDocs, startAfter, doc, getDoc } from "firebase/firestore";
import { getPostHTML, attachPostEvents } from "../components/postCard"; 
import { renderRightColumn } from "../components/rightColumn";

export async function renderFeed(root) {
    root.innerHTML = `
    <div class="container">
        <div class="left-col">${renderNavbar()}</div>
        <div class="center-col">
            <div class="feed-shell">
                <h2 class="feed-title">your feed</h2>
                
                <div class="feed-toggles">
                    <button id="btn-all" class="toggle-btn active">All</button>
                    <button id="btn-friends" class="toggle-btn">Friends</button>
                    <button id="btn-circles" class="toggle-btn">Circles</button>
                </div>

                <div id="posts-container" class="posts-grid"></div>
                
                <button id="btn-load-more" class="load-more-btn" style="display:none;">
                    Load More
                </button>
            </div>
        </div>
        <div class="right-col"></div>
    </div>
    `;

    renderRightColumn(root.querySelector(".right-col"));

    // --- STATE ---
    let lastVisibleDoc = null; 
    let isFetching = false;
    let currentFilter = "all";
    const BATCH_SIZE = 10;     
    const authorCache = {};    // Cache users to save reads
    
    let currentUserData = { following: [], joinedCircles: [], pinnedPostIds: [] };

    // DOM Elements
    const postsContainer = document.getElementById("posts-container");
    const loadMoreBtn = document.getElementById("btn-load-more");

    // Fetch Myn data first
    if (auth.currentUser) {
        try {
            const uSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (uSnap.exists()) {
                const data = uSnap.data();
                currentUserData = {
                    following: data.following || [],      
                    joinedCircles: data.joinedCircles || [], 
                    pinnedPostIds: data.pinnedPostIds || []
                };
            }
        } catch (e) { console.error(e); }
    }

    const fetchNextBatch = async () => {
        if (isFetching) return;
        isFetching = true;
        loadMoreBtn.textContent = "Loading...";

        try {
            let q;
            const postsRef = collection(db, "posts");

            if (lastVisibleDoc) {
                // "Load More"
                q = query(postsRef, orderBy("createdAt", "desc"), startAfter(lastVisibleDoc), limit(BATCH_SIZE));
            } else {
                q = query(postsRef, orderBy("createdAt", "desc"), limit(BATCH_SIZE));
            }

            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                loadMoreBtn.style.display = "none"; 
                if (!lastVisibleDoc) postsContainer.innerHTML = "<p>No posts yet.</p>";
                return;
            }

            lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
            await renderBatch(snapshot.docs);
            
            loadMoreBtn.style.display = "block"; 
            loadMoreBtn.textContent = "Load More";

        } catch (error) {
            console.error("Error fetching posts:", error);
            loadMoreBtn.textContent = "Error loading";
        } finally {
            isFetching = false;
        }
    };

    // Render batch & apply logic
    const renderBatch = async (docs) => {
        const htmlPromises = docs.map(async (postDoc) => {
            const post = postDoc.data();
            
            // --- AUTHOR FETCHING ---
            let authorProfile = null;
            if (post.authorUID) {
                if (authorCache[post.authorUID]) {
                    authorProfile = authorCache[post.authorUID];
                } else {
                    const userRef = doc(db, "users", post.authorUID);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        authorProfile = userSnap.data();
                        authorCache[post.authorUID] = authorProfile;
                    }
                }
            }

            // --- FETCH COMMENTS PREVIEW ---
            let commentsPreview = [];
            try {
                const commentsRef = collection(db, "posts", postDoc.id, "comments");
                const q = query(commentsRef, orderBy("createdAt", "asc"), limit(3));
                const cSnap = await getDocs(q);
                commentsPreview = cSnap.docs.map(d => d.data());
            } catch (err) {
                console.error("Error loading comments", err);
            }

            // --- HTML ---
            const postHTML = await getPostHTML(
                post,
                postDoc.id,
                authorProfile,
                currentUserData.pinnedPostIds,
                commentsPreview,
                { variant: "stream" }
            );
            // visibility categories
            const isFriend = currentUserData.following.includes(post.authorUID);
            const isCircle = post.circleId && currentUserData.joinedCircles.includes(post.circleId);
            
            return `
            <div class="post-wrapper" 
                 data-friend="${isFriend}" 
                 data-circle="${isCircle}">
                 ${postHTML}
            </div>`;
        });

        const htmlStrings = await Promise.all(htmlPromises);
        
        postsContainer.insertAdjacentHTML('beforeend', htmlStrings.join(""));
        applyFilterStyles();
        attachPostEvents(postsContainer, currentUserData.pinnedPostIds);
    };

    //filtering logic
    const applyFilterStyles = () => {
        const wrappers = document.querySelectorAll(".post-wrapper");
        
        wrappers.forEach(wrapper => {
            if (currentFilter === "all") {
                wrapper.style.display = "block";
            } else if (currentFilter === "friends") {
                wrapper.style.display = wrapper.dataset.friend === "true" ? "block" : "none";
            } else if (currentFilter === "circles") {
                wrapper.style.display = wrapper.dataset.circle === "true" ? "block" : "none";
            }
        });
    };

    //  toggle button listeners
    const setupToggles = () => {
        const buttons = {
            all: document.getElementById("btn-all"),
            friends: document.getElementById("btn-friends"),
            circles: document.getElementById("btn-circles")
        };

        const setActive = (type) => {
            currentFilter = type;
            Object.values(buttons).forEach(btn => btn.classList.remove("active"));
            buttons[type].classList.add("active");
            applyFilterStyles(); 
        };

        buttons.all.addEventListener("click", () => setActive("all"));
        buttons.friends.addEventListener("click", () => setActive("friends"));
        buttons.circles.addEventListener("click", () => setActive("circles"));
    };

    setupToggles();
    
    loadMoreBtn.addEventListener("click", fetchNextBatch);
    fetchNextBatch(); //  first 10
}
