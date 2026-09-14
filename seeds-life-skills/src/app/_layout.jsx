import { Stack } from "expo-router";
import { PracticeLogProvider } from "../context/PracticeLogContext";

console.log("Stack =", Stack);
console.log("PracticeLogProvider =", PracticeLogProvider);

export default function RootLayout() {
  return (
    <PracticeLogProvider>
      <Stack />
    </PracticeLogProvider>
  );
}