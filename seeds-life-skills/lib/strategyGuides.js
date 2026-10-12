import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "./firebase";
import strategySeed from "../data/strategyGuides.firebase.json";

const COLLECTION = "strategyGuides";

function bundledStrategies({ includeInactive = false } = {}) {
  const docs = Array.isArray(strategySeed?.documents)
    ? strategySeed.documents
    : [];

  return docs
    .filter((item) => includeInactive || item.active !== false)
    .map((item) => ({
      ...item,
      active: item.active !== false,
      schemaVersion: item.schemaVersion ?? strategySeed?.schemaVersion ?? 1,
    }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export async function getStrategyGuides({ includeInactive = false } = {}) {
  try {
    const ref = collection(db, COLLECTION);
    const q = includeInactive
      ? query(ref, orderBy("order", "asc"))
      : query(ref, where("active", "==", true), orderBy("order", "asc"));

    const snapshot = await getDocs(q);
    const remote = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

    // If Firebase has not been seeded yet, the app still has the bundled guide.
    return remote.length ? remote : bundledStrategies({ includeInactive });
  } catch (error) {
    console.warn(
      "Strategy guides could not load from Firestore; using bundled guide:",
      error?.code || error?.message || error
    );
    return bundledStrategies({ includeInactive });
  }
}

export async function getStrategyGuide(strategyId) {
  if (!strategyId) return null;

  try {
    const snapshot = await getDoc(doc(db, COLLECTION, strategyId));
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
  } catch (error) {
    console.warn(
      "Strategy guide could not load from Firestore; using bundled guide:",
      error?.code || error?.message || error
    );
  }

  return (
    bundledStrategies({ includeInactive: true }).find(
      (item) => item.id === String(strategyId)
    ) || null
  );
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
