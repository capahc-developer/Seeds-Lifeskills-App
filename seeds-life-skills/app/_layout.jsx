import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { ProgressProvider } from "../context/ProgressContext";
import { StudentProfileProvider } from "../context/StudentProfileContext";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    const isOnLoginScreen = segments[0] === "login";

    if (!user && !isOnLoginScreen) {
      router.replace("/login");
    }

    if (user && isOnLoginScreen) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F4FAF7",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ProgressProvider>
      <StudentProfileProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </StudentProfileProvider>
    </ProgressProvider>
  );
}