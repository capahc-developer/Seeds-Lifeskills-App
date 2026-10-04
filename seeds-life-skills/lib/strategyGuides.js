import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION = "strategyGuides";

export async function getStrategyGuides({ includeInactive = false } = {}) {
  const ref = collection(db, COLLECTION);
  const q = includeInactive
    ? query(ref, orderBy("order", "asc"))
    : query(ref, where("active", "==", true), orderBy("order", "asc"));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function getStrategyGuide(strategyId) {
  if (!strategyId) return null;
  const snapshot = await getDoc(doc(db, COLLECTION, strategyId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export function getStrategyAIContext(strategy) {
  if (!strategy) return null;
  return {
    id: strategy.id,
    title: strategy.title,
    summary: strategy.aiSummary || strategy.summary || "",
    tags: strategy.aiTags || [],
    routing: strategy.aiRouting || {},
  };
}
