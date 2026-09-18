// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Import the Firebase services used by this app
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBjep2PWCgmOpuIiQur8Iscl-QIrwBLCnw",
  authDomain: "seeds-mobile-app-v2-c15eb.firebaseapp.com",
  projectId: "seeds-mobile-app-v2-c15eb",
  storageBucket: "seeds-mobile-app-v2-c15eb.firebasestorage.app",
  messagingSenderId: "471262071869",
  appId: "1:471262071869:web:144c0640949a6b3a11ee54"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Make Firebase services available to other files
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
