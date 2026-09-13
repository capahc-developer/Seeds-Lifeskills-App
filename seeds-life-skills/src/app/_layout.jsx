import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PracticeLogProvider } from "../context/PracticeLogContext";

export default function RootLayout() {
  return (
    <PracticeLogProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="overall-strategies" />
        <Stack.Screen name="morning-routine" />
        <Stack.Screen name="strategy/[category]/[id]" />
        <Stack.Screen name="add-entry" options={{ presentation: "modal" }} />
      </Stack>
    </PracticeLogProvider>
  );
}