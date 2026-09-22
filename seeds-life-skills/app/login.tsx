import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import {
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function LoginScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      setError(null);

      const result = await GoogleSignin.signIn();

      const idToken = result.data?.idToken;

      if (!idToken) {
        throw new Error("Google did not return an ID token.");
      }

      const credential =
        GoogleAuthProvider.credential(idToken);

      const firebaseResult =
        await signInWithCredential(auth, credential);

      console.log("LOGIN SUCCESS");
      console.log("UID:", firebaseResult.user.uid);
      console.log("EMAIL:", firebaseResult.user.email);
      console.log("NAME:", firebaseResult.user.displayName);

      router.replace("/");
    } catch (err: any) {
      console.error("Google sign-in error:", err);

      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        setError("Sign in was cancelled.");
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setError("Sign in is already in progress.");
      } else {
        setError(
          err?.message ??
            "Something went wrong while signing in."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Welcome to Independent Steps
      </Text>

      <Text style={styles.subtitle}>
        Sign in to continue.
      </Text>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.googleText}>
            Continue with Google
          </Text>
        )}
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: "#F4FAF7",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    color: "#2F3B45",
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#6B737A",
    marginTop: 10,
    marginBottom: 40,
  },

  googleButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADCE0",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },

  googleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },

  errorText: {
    marginTop: 20,
    color: "#C62828",
    textAlign: "center",
  },
});