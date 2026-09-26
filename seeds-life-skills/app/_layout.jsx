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

  // Listen for Firebase authentication changes
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

  // Control navigation based on authentication state
  useEffect(() => {
    if (loading) return;

    const isOnLoginScreen = segments[0] === "login";

    // Not logged in -> send to login
    if (!user && !isOnLoginScreen) {
      router.replace("/login");
      return;
    }

    // Logged in while on login screen -> send to Home
    if (user && isOnLoginScreen) {
      router.replace("/");
    }
  }, [user, loading, segments, router]);

  // Wait until Firebase finishes checking authentication
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
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </StudentProfileProvider>
    </ProgressProvider>
  );
}