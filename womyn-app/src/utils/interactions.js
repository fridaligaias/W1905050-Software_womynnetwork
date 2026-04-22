import { db } from "./firebase";
import { 
    doc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove,
    addDoc,
    collection,
    serverTimestamp,
    deleteDoc,
    writeBatch,
    getDoc
} from "firebase/firestore";

async function createNotification(userId, notification) {
    if (!userId) return;

    const recipientSnap = await getDoc(doc(db, "users", userId));
    if (recipientSnap.exists()) {
        const recipientData = recipientSnap.data();
        if (recipientData.notificationsEnabled === false) {
            return;
        }
    }

    await addDoc(collection(db, "users", userId, "notifications"), {
        ...notification,
        createdAt: serverTimestamp(),
        read: false
    });
}

export async function toggleLike(postId, currentUserId, currentLikes = []) {
    const postRef = doc(db, "posts", postId);
    
    //Check if user has already liked the post
    const isLiked = currentLikes.includes(currentUserId);

    if (isLiked) {
        // Unlike
        await updateDoc(postRef, {
            likes: arrayRemove(currentUserId)
        });
    } else {
        // Like
        await updateDoc(postRef, {
            likes: arrayUnion(currentUserId)
        });

        const [postSnap, actorSnap] = await Promise.all([
            getDoc(postRef),
            getDoc(doc(db, "users", currentUserId))
        ]);

        if (postSnap.exists()) {
            const postData = postSnap.data();
            const actorData = actorSnap.exists() ? actorSnap.data() : {};
            const actorUsername = actorData.username || "Someone";
            const postLabel = postData.title || postData.content || "your post";

            if (postData.authorUID && postData.authorUID !== currentUserId) {
                await createNotification(postData.authorUID, {
                    type: "like",
                    text: `@${actorUsername} liked your post "${postLabel}".`,
                    link: `#/thread/${postId}`
                });
            }
        }
    }
}

export async function togglePin(userId, postId, currentPinnedIds = []) {
    const userRef = doc(db, "users", userId);
    const isPinned = currentPinnedIds.includes(postId);
// Unpin
    if (isPinned) { 
        await updateDoc(userRef, {
            pinnedPostIds: arrayRemove(postId)
        });
        // Pin
    } else { 
        await updateDoc(userRef, {
            pinnedPostIds: arrayUnion(postId)
        });
    }
}

export async function addComment(postId, user, content) {
    // comments inside the specific post
    const commentsRef = collection(db, "posts", postId, "comments");
    //Add the new comment 
    await addDoc(commentsRef, {
        authorUID: user.uid,
        username: user.username,
        avatarSeed: user.avatarSeed || user.username, 
        profileImageUrl: user.profileImageUrl || null,
        content: content,
        createdAt: serverTimestamp()
    });

    const postSnap = await getDoc(doc(db, "posts", postId));
    if (postSnap.exists()) {
        const postData = postSnap.data();
        const postLabel = postData.title || postData.content || "your post";

        if (postData.authorUID && postData.authorUID !== user.uid) {
            await createNotification(postData.authorUID, {
                type: "comment",
                text: `@${user.username} commented on your post "${postLabel}".`,
                link: `#/thread/${postId}`
            });
        }
    }
}

export async function deletePost(postId) {
    try {
        const postRef = doc(db, "posts", postId);
        await deleteDoc(postRef);
        return true;
    } catch (err) {
        console.error("Error deleting post:", err);
        alert("Failed to delete post.");
        return false;
    }
}

export async function toggleFollow(currentUserId, targetUserId, isFollowing) {
    const batch = writeBatch(db);

    const currentUserRef = doc(db, "users", currentUserId);
    const targetUserRef = doc(db, "users", targetUserId);

    if (isFollowing) {
        // UNFOLLOW 
        // removing target from my 'following'
        batch.update(currentUserRef, {
            following: arrayRemove(targetUserId)
        });
        // remove me from target's 'followers'
        batch.update(targetUserRef, {
            followers: arrayRemove(currentUserId)
        });
    } else {
        // FOLLOW 
        //Add target to my 'following'
        batch.update(currentUserRef, {
            following: arrayUnion(targetUserId)
        });
        //Add me to target's 'followers'
        batch.update(targetUserRef, {
            followers: arrayUnion(currentUserId)
        });
    }

    await batch.commit();

    if (!isFollowing && currentUserId !== targetUserId) {
        const actorSnap = await getDoc(currentUserRef);
        const actorData = actorSnap.exists() ? actorSnap.data() : {};
        const actorUsername = actorData.username || "Someone";

        await createNotification(targetUserId, {
            type: "follow",
            text: `@${actorUsername} followed you.`,
            link: `#/profile/${actorUsername}`
        });
    }
}
