import { renderNavbar } from "../components/navbar"; 
import { auth, db } from "../utils/firebase";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import { applyAdversarial } from "../utils/adversarial";
import { showToast } from "../utils/ui";
import { attachModerationWatcher, logModerationEvent, scanModerationText } from "../utils/moderation";

// Gallery Data
const galleryImages = [
    { name: "cat108.jpg", src: new URL("../assets/gallery/cat108.jpg", import.meta.url).href },
    { name: "dog.png",    src: new URL("../assets/gallery/dog.png", import.meta.url).href },
    { name: "woman1.jpg", src: new URL("../assets/gallery/woman1.jpg", import.meta.url).href },
    { name: "woman2.jpg", src: new URL("../assets/gallery/woman2.jpg", import.meta.url).href },
    { name: "cake.jpg",   src: new URL("../assets/gallery/cake.jpg", import.meta.url).href },
    { name: "flight.jpg", src: new URL("../assets/gallery/flight.jpg", import.meta.url).href },
    { name: "meeting.jpg", src: new URL("../assets/gallery/meeting.jpg", import.meta.url).href },
    { name: "microphone.jpg", src: new URL("../assets/gallery/microphone.jpg", import.meta.url).href },
    { name: "sunglasses.jpg", src: new URL("../assets/gallery/sunglasses.jpg", import.meta.url).href },
    { name: "takingPic.jpg", src: new URL("../assets/gallery/takingPic.jpg", import.meta.url).href },
    { name: "travelLake.jpg", src: new URL("../assets/gallery/travelLake.jpg", import.meta.url).href },
    { name: "travelSelfie.jpg", src: new URL("../assets/gallery/travelSelfie.jpg", import.meta.url).href },
    { name: "twoWom.jpg", src: new URL("../assets/gallery/twoWom.jpg", import.meta.url).href },
    { name: "knit.jpg", src: new URL("../assets/gallery/knit.jpg", import.meta.url).href },
    { name: "baristas.jpg", src: new URL("../assets/gallery/baristas.jpg", import.meta.url).href },
    { name: "Baker.jpg", src: new URL("../assets/gallery/Baker.jpg", import.meta.url).href },
    { name: "basketballPose.jpg", src: new URL("../assets/gallery/basketballPose.jpg", import.meta.url).href },
    { name: "beachM.jpg", src: new URL("../assets/gallery/beachM.jpg", import.meta.url).href },
    { name: "beachMother1.jpg", src: new URL("../assets/gallery/beachMother1.jpg", import.meta.url).href },
    { name: "beachMum.jpg", src: new URL("../assets/gallery/beachMum.jpg", import.meta.url).href },
    { name: "birthW.jpg", src: new URL("../assets/gallery/birthW.jpg", import.meta.url).href },
    { name: "bookclubW.jpg", src: new URL("../assets/gallery/bookclubW.jpg", import.meta.url).href },
    { name: "catSelfie.jpg", src: new URL("../assets/gallery/catSelfie.jpg", import.meta.url).href },
    { name: "catsW.jpg", src: new URL("../assets/gallery/catsW.jpg", import.meta.url).href },
    { name: "chess.jpg", src: new URL("../assets/gallery/chess.jpg", import.meta.url).href },
    { name: "chess2.jpg", src: new URL("../assets/gallery/chess2.jpg", import.meta.url).href },
    { name: "chessGame.jpg", src: new URL("../assets/gallery/chessGame.jpg", import.meta.url).href },
    { name: "chessGame1.jpg", src: new URL("../assets/gallery/chessGame1.jpg", import.meta.url).href },
    { name: "chessPlayerW.jpg", src: new URL("../assets/gallery/chessPlayerW.jpg", import.meta.url).href },
    { name: "chessStare.jpg", src: new URL("../assets/gallery/chessStare.jpg", import.meta.url).href },
    { name: "cityG.jpg", src: new URL("../assets/gallery/cityG.jpg", import.meta.url).href },
    { name: "drinksW.jpg", src: new URL("../assets/gallery/drinksW.jpg", import.meta.url).href },
    { name: "FitnessW.jpg", src: new URL("../assets/gallery/FitnessW.jpg", import.meta.url).href },
    { name: "fitnessW1.jpg", src: new URL("../assets/gallery/fitnessW1.jpg", import.meta.url).href },
    { name: "footballW.jpg", src: new URL("../assets/gallery/footballW.jpg", import.meta.url).href },
    { name: "hikingW.jpg", src: new URL("../assets/gallery/hikingW.jpg", import.meta.url).href },
    { name: "hockeyW.jpg", src: new URL("../assets/gallery/hockeyW.jpg", import.meta.url).href },
    { name: "marathonW.jpg", src: new URL("../assets/gallery/marathonW.jpg", import.meta.url).href },
    { name: "marathonW3.jpg", src: new URL("../assets/gallery/marathonW3.jpg", import.meta.url).href },
    { name: "marathonW11.jpg", src: new URL("../assets/gallery/marathonW11.jpg", import.meta.url).href },
    { name: "marathonW22.jpg", src: new URL("../assets/gallery/marathonW22.jpg", import.meta.url).href },
    { name: "motherRoom1.jpg", src: new URL("../assets/gallery/motherRoom1.jpg", import.meta.url).href },
    { name: "partyW.jpg", src: new URL("../assets/gallery/partyW.jpg", import.meta.url).href },
    { name: "petSelfie1.jpg", src: new URL("../assets/gallery/petSelfie1.jpg", import.meta.url).href },
    { name: "petSelfiew12.jpg", src: new URL("../assets/gallery/petSelfiew12.jpg", import.meta.url).href },
    { name: "petSelfiew123.jpg", src: new URL("../assets/gallery/petSelfiew123.jpg", import.meta.url).href },
    { name: "petSelfiew1234.jpg", src: new URL("../assets/gallery/petSelfiew1234.jpg", import.meta.url).href },
    { name: "petSelfieWw.jpg", src: new URL("../assets/gallery/petSelfieWw.jpg", import.meta.url).href },
    { name: "petSelfiewww.jpg", src: new URL("../assets/gallery/petSelfiewww.jpg", import.meta.url).href },
    { name: "PillsWorry.jpg", src: new URL("../assets/gallery/PillsWorry.jpg", import.meta.url).href },
    { name: "pregnantEating.jpg", src: new URL("../assets/gallery/pregnantEating.jpg", import.meta.url).href },
    { name: "protestW.jpg", src: new URL("../assets/gallery/protestW.jpg", import.meta.url).href },
    { name: "selfieA.jpg", src: new URL("../assets/gallery/selfieA.jpg", import.meta.url).href },
    { name: "SelfieC.jpg", src: new URL("../assets/gallery/SelfieC.jpg", import.meta.url).href },
    { name: "SelfieHat.jpg", src: new URL("../assets/gallery/SelfieHat.jpg", import.meta.url).href },
    { name: "SelfieHat2.jpg", src: new URL("../assets/gallery/SelfieHat2.jpg", import.meta.url).href },
    { name: "selfieMirror.jpg", src: new URL("../assets/gallery/selfieMirror.jpg", import.meta.url).href },
    { name: "selfieS.jpg", src: new URL("../assets/gallery/selfieS.jpg", import.meta.url).href },
    { name: "selfieSmile.jpg", src: new URL("../assets/gallery/selfieSmile.jpg", import.meta.url).href },
    { name: "SelfieWoods.jpg", src: new URL("../assets/gallery/SelfieWoods.jpg", import.meta.url).href },
    { name: "teamW.jpg", src: new URL("../assets/gallery/teamW.jpg", import.meta.url).href },
    { name: "waterW.jpg", src: new URL("../assets/gallery/waterW.jpg", import.meta.url).href },
    { name: "womenEvent.jpg", src: new URL("../assets/gallery/womenEvent.jpg", import.meta.url).href },
    { name: "yogaClubW.jpg", src: new URL("../assets/gallery/yogaClubW.jpg", import.meta.url).href },
    { name: "yogaClubW1.jpg", src: new URL("../assets/gallery/yogaClubW1.jpg", import.meta.url).href },
    { name: "yogaEventClub2.jpg", src: new URL("../assets/gallery/yogaEventClub2.jpg", import.meta.url).href },
    { name: "yogaW.jpg", src: new URL("../assets/gallery/yogaW.jpg", import.meta.url).href }
];

let model = null; 

function createPerfRun(imageName = "unknown") {
    return {
        imageName,
        coldLoad: false,
        timestamps: {}
    };
}

function createTextPerfRun() {
    return {
        timestamps: {}
    };
}

function createModerationPerfRun() {
    return {
        watcherScanCount: 0,
        watcherScanTotalMs: 0,
        watcherLastFlagged: false,
        submitScanMs: null,
        moderationEventMs: 0
    };
}

function logPerfTimestamp(label, details = {}) {
    console.log(`[PERF_TS] ${label}`, {
        timestamp: new Date().toISOString(),
        ...details
    });
}

function markPerfTimestamp(run, label) {
    if (!run) return;
    run.timestamps[label] = Date.now();
}

function getPerfMs(run, startLabel, endLabel) {
    const start = run?.timestamps?.[startLabel];
    const end = run?.timestamps?.[endLabel];
    if (!start || !end) return null;
    return end - start;
}

// cropping function for the images
function preprocessImageToSquare(imgElement, size = 224) {
    return tf.tidy(() => {
        const imgTensor = tf.browser.fromPixels(imgElement);
        const [imgH, imgW, channels] = imgTensor.shape;
        const cropSize = Math.min(imgH, imgW);
        const top = Math.floor((imgH - cropSize) / 2);
        const left = Math.floor((imgW - cropSize) / 2);

        return imgTensor
            .slice([top, left, 0], [cropSize, cropSize, channels])
            .resizeBilinear([size, size])
            .toFloat()
            .div(255)
            .expandDims();
    });
}

export async function renderPost(root) {
    const hashString = window.location.hash; 
    const queryString = hashString.includes('?') ? hashString.split('?')[1] : "";
    const urlParams = new URLSearchParams(queryString);

    const circleId = urlParams.get('circleId');
    const circleName = urlParams.get('circleName');
    const circleSeed = urlParams.get('circleSeed');

    const pageTitle = circleId 
        ? `Post to <span style="color:#89babd">${circleName}</span>` 
        : "Create a Post";

    root.innerHTML = `
    <div class="container">
        <div class="left-col">
            ${renderNavbar()}
        </div>
        <div class="center-col">
            <h2>${pageTitle}</h2>
            
            <div class="post-mode-toggle">
                <button id="tab-text" class="post-mode-btn post-mode-btn-active" type="button">Text Post</button>
                <button id="tab-image" class="post-mode-btn" type="button">Image Post</button>
            </div>

            <form id="post-form" class="post-form">
                
                <input type="text" id="post-title" placeholder="Title (Optional)" style="margin-bottom: 1rem; font-weight: bold;" />

                <div id="text-mode-container">
                    <textarea id="post-content" class="post-textarea" placeholder="What's on your mind?" rows="5"></textarea>
                </div>

                <div id="image-mode-container" style="display: none;">
                    <textarea
                        id="image-post-text"
                        class="post-textarea"
                        placeholder="Add text to your post (optional)"
                        rows="4"
                        style="margin-bottom: 1rem;"
                    ></textarea>

                    <label style="display:flex; align-items:center; gap:0.55rem; margin-bottom: 1rem; font-family:'DM Sans', sans-serif; font-size:0.9rem; color:#4d5b58;">
                        <input type="checkbox" id="use-as-profile-image" />
                        <span>Use this image as my profile picture too</span>
                    </label>
                    
                    <div id="upload-placeholder" class="upload-placeholder">
                        <button type="button" id="open-gallery-btn" class="primary-btn">Upload Image</button>
                        <p style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">Select from secure gallery</p>
                    </div>

                    <div id="gallery-container" style="display: none;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h3 style="font-size: 1rem; margin:0;">Select an image</h3>
                            <button type="button" id="close-gallery-btn" style="border:none; background:none; cursor:pointer; font-size:1.2rem;">&times;</button>
                        </div>
                        <div id="gallery-grid" class="gallery-grid"></div>
                    </div>

                    <div id="selection-area" style="display: none; margin-top: 1rem;">
                        
                        <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; background: #f5f5f5; padding: 0.5rem; border-radius: 8px;">
                            <img id="selected-preview-thumb" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
                            <div style="flex: 1;">
                                <p style="margin: 0; font-size: 0.9rem; font-weight: bold;">Image Selected</p>
                                <button type="button" id="change-image-btn" style="background: none; border: none; color: #89babd; cursor: pointer; padding: 0; font-size: 0.8rem; text-decoration: underline;">Change Image</button>
                            </div>
                        </div>

                        <div style="padding: 1rem; border: 1px solid #ddd; border-radius: 8px;">
                            <p id="model-status" style="font-size: 0.8rem; color: #666; margin-top: 0;">Loading AI Model...</p>
                            
                            <div id="progress-container" style="display:none; width: 100%; background: #ddd; height: 8px; margin-bottom: 10px; border-radius: 4px;">
                                <div id="progress-bar" style="width: 0%; height: 100%; background: #222; border-radius: 4px; transition: width 0.1s;"></div>
                            </div>

                            <button type="button" id="protect-btn" class="secondary-btn" style="width: 100%;" disabled>Apply Privacy Cloak</button>
                            
                            <div id="preview-area" style="margin-top: 15px; display:none; text-align: center;">
                                <p style="font-size: 0.9rem; margin-bottom: 5px; font-weight: bold;">Protected Result:</p>
                                <canvas id="output-canvas" width="224" height="224" style="border: 2px solid #89babd; border-radius: 6px; max-width: 100%;"></canvas>
                                <p style="color: green; font-size: 0.9rem; margin-top: 0.5rem;">✓ Ready to post</p>
                            </div>
                        </div>
                    </div>

                </div>

                <div id="post-moderation-warning" class="moderation-warning"></div>

                <div style="margin-top: 1rem;">
                    <input type="text" id="post-tags" placeholder="Tags (comma separated)" />
                </div>

                <br/>
                
                <div class="post-form-actions">
                    ${circleId ? `<button type="button" id="cancel-post-btn" class="secondary-btn">Cancel</button>` : ""}
                    <button type="submit" id="submit-btn" class="post-submit-btn">Post</button>
                </div>

            </form>
            
            <p id="post-error" style="color:red; margin-top: 1rem;"></p>
        </div>
        
        <div class="right-col">
            <h3>Info</h3>
            <p id="info-text">✏️ Select a post type to begin!</p>
        </div>
    </div>
    `;

    // --- DOM ELEMENTS ---
    const tabText = document.getElementById("tab-text");
    const tabImage = document.getElementById("tab-image");
    const textContainer = document.getElementById("text-mode-container");
    const imageContainer = document.getElementById("image-mode-container");
    const infoText = document.getElementById("info-text");
    
    // Image UI 
    const uploadPlaceholder = document.getElementById("upload-placeholder");
    const galleryContainer = document.getElementById("gallery-container");
    const galleryGrid = document.getElementById("gallery-grid");
    const selectionArea = document.getElementById("selection-area");
    
    // Image Buttons & Displays
    const openGalleryBtn = document.getElementById("open-gallery-btn");
    const closeGalleryBtn = document.getElementById("close-gallery-btn");
    const changeImageBtn = document.getElementById("change-image-btn");
    const selectedPreviewThumb = document.getElementById("selected-preview-thumb");
    
    // Protection Elements
    const protectBtn = document.getElementById("protect-btn");
    const progressBar = document.getElementById("progress-bar");
    const progressContainer = document.getElementById("progress-container");
    const previewArea = document.getElementById("preview-area");
    const canvas = document.getElementById("output-canvas");
    const modelStatus = document.getElementById("model-status");
    
    // Form Elements
    const form = document.getElementById("post-form");
    const errorEl = document.getElementById("post-error");
    const submitBtn = document.getElementById("submit-btn");
    const postTitleInput = document.getElementById("post-title");
    const postContentInput = document.getElementById("post-content");
    const imagePostTextInput = document.getElementById("image-post-text");
    const moderationWarning = document.getElementById("post-moderation-warning");

    // --- Cancel Button ---
    const cancelBtn = document.getElementById("cancel-post-btn");
    if(cancelBtn) {
        cancelBtn.onclick = () => window.history.back();
    }

    let postType = "text"; 
    let selectedImgElement = null;
    let adversarialDataUrl = null;
    let currentPerfRun = null;
    let currentTextPerfRun = null;
    let currentModerationPerfRun = createModerationPerfRun();
    const getPostModerationText = () => {
        const currentBody = postType === "text"
            ? postContentInput.value
            : imagePostTextInput.value;
        return `${postTitleInput.value}\n${currentBody}`.trim();
    };
    const postWatcher = attachModerationWatcher({
        fields: [postTitleInput, postContentInput, imagePostTextInput],
        getText: getPostModerationText,
        warningEl: moderationWarning,
        label: "This post",
        onScanComplete: ({ durationMs, isFlagged }) => {
            currentModerationPerfRun.watcherScanCount += 1;
            currentModerationPerfRun.watcherScanTotalMs += durationMs;
            currentModerationPerfRun.watcherLastFlagged = isFlagged;
        }
    });

    // --- TAB SWITCHING ---
    tabText.onclick = (e) => {
        e.preventDefault();
        postType = "text";
        currentTextPerfRun = createTextPerfRun();
        currentModerationPerfRun = createModerationPerfRun();
        markPerfTimestamp(currentTextPerfRun, "text_mode_selected");
        logPerfTimestamp("text_mode_selected");
        tabText.className = "post-mode-btn post-mode-btn-active";
        tabImage.className = "post-mode-btn";
        textContainer.style.display = "block";
        imageContainer.style.display = "none";
        infoText.textContent = "Text posts allow you to share your thoughts.";
        postWatcher.refresh();
    };

    tabImage.onclick = (e) => {
        e.preventDefault();
        postType = "image";
        currentModerationPerfRun = createModerationPerfRun();
        tabImage.className = "post-mode-btn post-mode-btn-active";
        tabText.className = "post-mode-btn";
        textContainer.style.display = "none";
        imageContainer.style.display = "block";
        infoText.textContent = "Image posts are protected by our adversarial noise model.";
        postWatcher.refresh();
    };

    // --- GALLERY  ---
    const showGallery = () => {
        uploadPlaceholder.style.display = "none";
        selectionArea.style.display = "none";
        galleryContainer.style.display = "block";
    };

    openGalleryBtn.onclick = showGallery;
    changeImageBtn.onclick = showGallery;
    closeGalleryBtn.onclick = () => {
        galleryContainer.style.display = "none";
        if (selectedImgElement) {
            selectionArea.style.display = "block";
        } else {
            uploadPlaceholder.style.display = "block";
        }
    };

    galleryImages.forEach(imgData => {
        const img = document.createElement("img");
        img.src = imgData.src;
        img.className = "gallery-thumb";
        img.crossOrigin = "anonymous";
        
        img.onclick = async () => {
            currentPerfRun = createPerfRun(imgData.name);
            markPerfTimestamp(currentPerfRun, "image_selected");
            logPerfTimestamp("image_selected", { imageName: imgData.name });

            selectedImgElement = img;
            galleryContainer.style.display = "none";
            selectionArea.style.display = "block";
            selectedPreviewThumb.src = imgData.src;
            
            previewArea.style.display = "none";
            adversarialDataUrl = null;
            protectBtn.innerText = "Apply Disturbance";

            if (!model) {
                protectBtn.innerText = "Loading AI Model...";
                protectBtn.disabled = true;
                currentPerfRun.coldLoad = true;
                markPerfTimestamp(currentPerfRun, "model_load_start");
                logPerfTimestamp("model_load_start", { imageName: imgData.name });
                try {
                    model = await mobilenet.load({ version: 2, alpha: 1.0 });
                    markPerfTimestamp(currentPerfRun, "model_load_end");
                    logPerfTimestamp("model_load_end", { imageName: imgData.name, coldLoad: true });
                    modelStatus.innerText = "AI Model Ready.";
                    protectBtn.innerText = "Apply Disturbance";
                    protectBtn.disabled = false;
                } catch (e) {
                    modelStatus.innerText = "Error loading model.";
                }
            } else {
                modelStatus.innerText = "AI Model Ready.";
                protectBtn.disabled = false;
                currentPerfRun.coldLoad = false;
                logPerfTimestamp("model_already_ready", { imageName: imgData.name, coldLoad: false });
            }
        };
        galleryGrid.appendChild(img);
    });

    // --- ADVERSARIAL GENERATION ---
    protectBtn.onclick = () => {
        if (!selectedImgElement || !model) return;
        protectBtn.disabled = true;
        protectBtn.innerText = "Processing...";
        progressContainer.style.display = "block";
        progressBar.style.width = "0%";

        setTimeout(async () => {
            try {
                markPerfTimestamp(currentPerfRun, "apply_model_start");
                logPerfTimestamp("apply_model_start");
                const originalTensor = preprocessImageToSquare(selectedImgElement, 224);

                const advTensor = await applyAdversarial(model, originalTensor, (p) => progressBar.style.width = `${p}%`);
                markPerfTimestamp(currentPerfRun, "apply_model_end");
                logPerfTimestamp("apply_model_end");
                await tf.browser.toPixels(advTensor.squeeze(), canvas);
                
                adversarialDataUrl = canvas.toDataURL("image/jpeg");
                
                previewArea.style.display = "block";
                protectBtn.innerText = "Regenerate";
                protectBtn.disabled = false;
                originalTensor.dispose();
                advTensor.dispose();
            } catch (err) {
                console.error(err);
                protectBtn.disabled = false;
                protectBtn.innerText = "Error - Try Again";
            }
        }, 50);
    };

    // --- FORM SUBMISSION ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorEl.textContent = "";
        submitBtn.disabled = true;
        submitBtn.textContent = "Posting...";

        const title = document.getElementById("post-title").value.trim();
        const imagePostText = document.getElementById("image-post-text").value.trim();
        const useAsProfileImage = document.getElementById("use-as-profile-image").checked;
        const tags = document.getElementById("post-tags").value.split(",").map(t => t.trim()).filter(t => t);

        // Validation
        if (postType === "text") {
            const content = document.getElementById("post-content").value.trim();
            if (!content) {
                errorEl.textContent = "Text content is required.";
                submitBtn.disabled = false;
                submitBtn.textContent = "Post";
                return;
            }
        } else if (postType === "image") {
            if (!adversarialDataUrl) {
                errorEl.textContent = "Please apply the filter before posting!";
                submitBtn.disabled = false;
                submitBtn.textContent = "Post";
                return;
            }
        }

        try {
            const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
            const userData = userDoc.data();
            const finalPostText = getPostModerationText();
            const submitModerationStart = performance.now();
            const moderationResult = scanModerationText(finalPostText);
            currentModerationPerfRun.submitScanMs = Number((performance.now() - submitModerationStart).toFixed(3));

            const payload = {
                authorUID: auth.currentUser.uid,
                username: userData.username,
                type: postType,
                title: title || "",
                tags,
                createdAt: serverTimestamp(),
                // --- Circle Data  ---
                circleId: circleId || null,
                circleName: circleName || null,
                circleSeed: circleSeed || null
            };

            if (postType === "text") {
                if (!currentTextPerfRun) {
                    currentTextPerfRun = createTextPerfRun();
                    markPerfTimestamp(currentTextPerfRun, "text_mode_selected");
                }
                markPerfTimestamp(currentTextPerfRun, "post_start");
                logPerfTimestamp("text_post_start");
                payload.content = document.getElementById("post-content").value.trim();
                payload.imageUrl = null;
            } else {
                payload.content = imagePostText;
                payload.imageUrl = adversarialDataUrl;
            }

            if (postType === "image") {
                markPerfTimestamp(currentPerfRun, "post_start");
                logPerfTimestamp("post_start");
            }
            const newPostRef = await addDoc(collection(db, "posts"), payload);
            if (postType === "image") {
                markPerfTimestamp(currentPerfRun, "post_end");
                logPerfTimestamp("post_end", { postId: newPostRef.id });
                console.log("[PERF_RESULT]", {
                    image: currentPerfRun?.imageName || "unknown",
                    condition: "full_pipeline",
                    coldLoad: currentPerfRun?.coldLoad || false,
                    webgl: tf.getBackend() === "webgl",
                    model_load_ms: getPerfMs(currentPerfRun, "model_load_start", "model_load_end") ?? 0,
                    apply_model_ms: getPerfMs(currentPerfRun, "apply_model_start", "apply_model_end"),
                    post_ms: getPerfMs(currentPerfRun, "post_start", "post_end"),
                    total_ms: getPerfMs(currentPerfRun, "image_selected", "post_end")
                });
            } else if (postType === "text") {
                markPerfTimestamp(currentTextPerfRun, "post_end");
                logPerfTimestamp("text_post_end", { postId: newPostRef.id });
                console.log("[PERF_RESULT]", {
                    condition: "baseline_text_post",
                    post_ms: getPerfMs(currentTextPerfRun, "post_start", "post_end"),
                    total_ms: getPerfMs(currentTextPerfRun, "text_mode_selected", "post_end")
                });
            }

            if (moderationResult.isFlagged) {
                const moderationEventStart = performance.now();
                await logModerationEvent({
                    userId: auth.currentUser.uid,
                    username: userData.username,
                    sourceType: "post",
                    text: finalPostText,
                    matchedRule: moderationResult.matchedRule,
                    category: moderationResult.category,
                    matchedRules: moderationResult.matchedRules,
                    categories: moderationResult.categories,
                    severity: moderationResult.severity,
                    context: {
                        postId: newPostRef.id,
                        contextLink: `#/thread/${newPostRef.id}`,
                        contextLabel: title || "View post"
                    }
                });
                currentModerationPerfRun.moderationEventMs = Number((performance.now() - moderationEventStart).toFixed(3));
            }

            if (postType === "text") {
                console.log("[PERF_RESULT]", {
                    condition: "heuristics_only_moderation",
                    flagged: moderationResult.isFlagged,
                    watcher_scan_count: currentModerationPerfRun.watcherScanCount,
                    watcher_scan_ms_total: Number(currentModerationPerfRun.watcherScanTotalMs.toFixed(3)),
                    watcher_scan_ms_avg: currentModerationPerfRun.watcherScanCount
                        ? Number((currentModerationPerfRun.watcherScanTotalMs / currentModerationPerfRun.watcherScanCount).toFixed(3))
                        : 0,
                    submit_scan_ms: currentModerationPerfRun.submitScanMs,
                    moderation_event_ms: currentModerationPerfRun.moderationEventMs,
                    matched_rules_count: moderationResult.matchedRules.length
                });
            }

            if (postType === "image" && useAsProfileImage) {
                await updateDoc(doc(db, "users", auth.currentUser.uid), {
                    profileImageUrl: adversarialDataUrl
                });
            }
            
            showToast("Post created successfully!");
            
            // --- Redirect ---
            setTimeout(() => {
                if (circleId) {
                    window.location.hash = `#/circle/${circleId}`;
                } else {
                    window.location.hash = "#/feed";
                }
            }, 1000);

        } catch (err) {
            errorEl.textContent = err.message;
            submitBtn.disabled = false;
            submitBtn.textContent = "Post";
        }
    });
}
