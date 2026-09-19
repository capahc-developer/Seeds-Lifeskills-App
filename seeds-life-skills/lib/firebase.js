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
  apiKey: "AIzaSyB-vKhIKVTPEybCVFT0PkOAUtNOxgs7Yzw",
  authDomain: "seeds-life-skills.firebaseapp.com",
  projectId: "seeds-life-skills",
  storageBucket: "seeds-life-skills.firebasestorage.app",
  messagingSenderId: "831460812957",
  appId: "1:831460812957:web:5d639da68b12d03b110c74"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Make Firebase services available to other files
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
