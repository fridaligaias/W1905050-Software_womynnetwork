import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBrngK_p6kJcJ7DFRcgGG_H9-0czxFhlqU",
  authDomain: "womyn-app.firebaseapp.com",
  projectId: "womyn-app",
  storageBucket: "womyn-app.firebasestorage.app",
  messagingSenderId: "867582150874",
  appId: "1:867582150874:web:6e299ff40ef2dc62417de3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// export auth and database instances
export const auth = getAuth(app);
export const db = getFirestore(app);
