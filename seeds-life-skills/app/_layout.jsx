import { Stack } from 'expo-router';
import { ProgressProvider } from '../context/ProgressContext';
import { StudentProfileProvider } from '../context/StudentProfileContext';

export default function RootLayout() {
  return (
    <ProgressProvider>
      <StudentProfileProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </StudentProfileProvider>
    </ProgressProvider>
  );
}
