import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-vKhIKVTPEybCVFT0PkOAUtNOxgs7Yzw",
  authDomain: "seeds-life-skills.firebaseapp.com",
  projectId: "seeds-life-skills",
  storageBucket: "seeds-life-skills.firebasestorage.app",
  messagingSenderId: "831460812957",
  appId: "1:831460812957:web:5d639da68b12d03b110c74"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export default app;