import { db, auth } from "./firebase";
import { 
    doc, 
    setDoc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove, 
    collection, 
    getDocs, 
    getDoc,
    deleteDoc, 
    increment
} from "firebase/firestore";

//fetching all circles
export async function getCircles() {
    const snap = await getDocs(collection(db, "circles"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Join or Leave a circle, update member count 
export async function toggleCircleMembership(circleId, isJoining) {
    if (!auth.currentUser) return false;

    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);
    const circleRef = doc(db, "circles", circleId);

    try {
        if (isJoining) {
            await updateDoc(userRef, { joinedCircles: arrayUnion(circleId) });
            await updateDoc(circleRef, { memberCount: increment(1) });
        } else {
            await updateDoc(userRef, { joinedCircles: arrayRemove(circleId) });
            await updateDoc(circleRef, { memberCount: increment(-1) });
        }
        return true;
    } catch (error) {
        console.error("Error toggling circle membership:", error);
        return false;
    }
}

export async function createCircle(name, description, avatarSeed) {
    if (!auth.currentUser) throw new Error("Must be logged in");

    //create circl "Slug" (ID) from the name
    // eg: "Bookish Myns" -> "bookish-myns"
    const slug = name.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-') // Replace any non-letter/number with dash
        .replace(/^-+|-+$/g, '');    // Remove dashes from start or end

    if (slug.length < 3) {
        throw new Error("Circle name is too short or contains invalid characters.");
    }
    // CHECK UNIQUENESS
    const circleRef = doc(db, "circles", slug);
    const circleSnap = await getDoc(circleRef);
    // If it exists, STOP the creation process.
    if (circleSnap.exists()) {
        throw new Error(`A circle named "${name}" already exists. Please choose a different name.`);
    }
    // Generate random avatar if the caller did not provide one.
    const finalAvatarSeed = avatarSeed || Math.random().toString(36).substring(7);
    // save to Firestore
    await setDoc(circleRef, {
        name: name.trim(),
        description: description.trim(),
        avatarSeed: finalAvatarSeed,
        creatorUID: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        memberCount: 0 
    });
    // auto-join the creator
    await toggleCircleMembership(slug, true);
    return slug;
}
// --- Delete Circle  ---
export async function deleteCircle(circleId) {
    if (!auth.currentUser) throw new Error("Must be logged in");
    const circleRef = doc(db, "circles", circleId);
    const circleSnap = await getDoc(circleRef);
    if (!circleSnap.exists()) {
        throw new Error("Circle does not exist.");
    }
    const circleData = circleSnap.data();
    // only the creator can delete
    if (circleData.creatorUID !== auth.currentUser.uid) {
        throw new Error("Only the creator can delete this circle.");
    }

    try {
        // Delete the Circle 
        await deleteDoc(circleRef);
        return true;
    } catch (error) {
        console.error("Error deleting circle:", error);
        throw error;
    }
}
