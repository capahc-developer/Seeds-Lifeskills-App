import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getPracticeLogEntries, addPracticeLogEntry } from "../lib/firestoreData";

const PracticeLogContext = createContext(null);

export function PracticeLogProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPracticeLogEntries();
      setEntries(data);
    } catch (err) {
      console.error("Failed to load practice log:", err);
      setError("Unable to load practice log entries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = useCallback(
    async (entry) => {
      const saved = await addPracticeLogEntry(entry);
      setEntries((prev) => [saved, ...prev]);
      refresh();
    },
    [refresh]
  );

  return (
    <PracticeLogContext.Provider value={{ entries, loading, error, addEntry, refresh }}>
      {children}
    </PracticeLogContext.Provider>
  );
}

export function usePracticeLog() {
  const ctx = useContext(PracticeLogContext);
  if (!ctx) {
    throw new Error("usePracticeLog must be used within a PracticeLogProvider");
  }
  return ctx;
}