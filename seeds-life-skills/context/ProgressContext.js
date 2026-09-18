import { createContext, useContext, useMemo, useState } from 'react';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const [completedSteps, setCompletedSteps] = useState({});

  function toggleStep(key) {
    setCompletedSteps((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const activeProgress = Math.min(100, Math.round((completedCount / 4) * 100));

  const value = useMemo(
    () => ({
      streak: 5,
      level: 5,
      activeModule: 'Washing your hands',
      activeProgress,
      completedSteps,
      toggleStep,
    }),
    [activeProgress, completedSteps]
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used inside ProgressProvider');
  }
  return context;
}