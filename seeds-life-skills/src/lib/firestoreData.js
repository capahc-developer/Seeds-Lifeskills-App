import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export async function getOverallStrategies() {
  const q = query(collection(db, "overallStrategies"), orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function getMorningRoutineStrategies() {
  const q = query(collection(db, "morningRoutineStrategies"), orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function getPracticeLogEntries() {
  const q = query(collection(db, "practiceLog"), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function addPracticeLogEntry(entry) {
  const docRef = await addDoc(collection(db, "practiceLog"), {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...entry };
}