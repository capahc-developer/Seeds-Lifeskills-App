import { initializeApp } from "firebase/app";
import { collection, doc, getFirestore, writeBatch } from "firebase/firestore";
import { readFile } from "node:fs/promises";

const required = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
];

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
}

const app = initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);
const raw = await readFile(new URL("../data/strategyGuides.firebase.json", import.meta.url), "utf8");
const payload = JSON.parse(raw);

if (payload.collection !== "strategyGuides" || !Array.isArray(payload.documents)) {
  throw new Error("Invalid strategy guide seed file.");
}

const batch = writeBatch(db);
for (const strategy of payload.documents) {
  const { id, ...data } = strategy;
  if (!id) throw new Error("Every strategy guide needs an id.");
  batch.set(doc(collection(db, payload.collection), id), {
    ...data,
    schemaVersion: payload.schemaVersion ?? 1,
    active: true,
  });
}

await batch.commit();
console.log(`Seeded ${payload.documents.length} strategy guides into ${payload.collection}.`);
