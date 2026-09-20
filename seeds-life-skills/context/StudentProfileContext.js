import React, { createContext, useContext, useMemo, useState } from 'react';

const StudentProfileContext = createContext(null);

export function StudentProfileProvider({ children }) {
  const [profile, setProfile] = useState({ name: '', age: '', strengths: '', barriers: '', interests: '' });
  const value = useMemo(() => ({ profile, setProfile, updateProfile: (patch) => setProfile((current) => ({ ...current, ...patch })) }), [profile]);
  return <StudentProfileContext.Provider value={value}>{children}</StudentProfileContext.Provider>;
}

export function useStudentProfile() {
  const value = useContext(StudentProfileContext);
  if (!value) throw new Error('useStudentProfile must be used inside StudentProfileProvider');
  return value;
}
