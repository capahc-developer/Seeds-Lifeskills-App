import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [createAccount, setCreateAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  async function handleEmailAuth() {
    try {
      setLoading(true);
      setError(null);

      const cleanEmail = email.trim();

      if (!cleanEmail || !password) {
        setError("Please enter your email and password.");
        return;
      }

      if (createAccount) {
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );
      } else {
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );
      }

      router.replace("/");
    } catch (err: any) {
      console.error("Email auth error:", err);

      switch (err.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/weak-password":
          setError("Your password must be at least 6 characters.");
          break;

        case "auth/invalid-credential":
          setError("Incorrect email or password.");
          break;

        case "auth/user-not-found":
          setError("No account was found with this email.");
          break;

        case "auth/wrong-password":
          setError("Incorrect email or password.");
          break;

        default:
          setError(
            err?.message ??
              "Something went wrong. Please try again."
          );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setGoogleLoading(true);
      setError(null);

      const result = await GoogleSignin.signIn();

      const idToken = result.data?.idToken;

      if (!idToken) {
        throw new Error("Google did not return an ID token.");
      }

      const credential =
        GoogleAuthProvider.credential(idToken);

      await signInWithCredential(
        auth,
        credential
      );

      router.replace("/");
    } catch (err: any) {
      console.error("Google sign-in error:", err);

      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        setError("Google sign in was cancelled.");
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setError("Google sign in is already in progress.");
      } else {
        setError(
          err?.message ??
            "Something went wrong with Google sign in."
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  function toggleMode() {
    setCreateAccount(!createAccount);
    setError(null);
    setPassword("");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Independent Steps
        </Text>

        <Text style={styles.subtitle}>
          {createAccount
            ? "Create an account to get started."
            : "Sign in to continue."}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          textContentType={
            createAccount
              ? "newPassword"
              : "password"
          }
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleEmailAuth}
          disabled={loading || googleLoading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {createAccount
                ? "Create Account"
                : "Sign In"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleMode}
          disabled={loading || googleLoading}
        >
          <Text style={styles.switchText}>
            {createAccount
              ? "Already have an account? Sign in"
              : "Don't have an account? Create one"}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>
            OR
          </Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.googleButtonText}>
              Continue with Google
            </Text>
          )}
        </TouchableOpacity>

        {error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4FAF7",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    color: "#2F3B45",
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#6B737A",
    marginTop: 8,
    marginBottom: 32,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9DEE3",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: "#2F3B45",
    marginBottom: 14,
  },

  primaryButton: {
    backgroundColor: "#55A8F7",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  switchText: {
    textAlign: "center",
    color: "#55A8F7",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 18,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 28,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#D9DEE3",
  },

  dividerText: {
    marginHorizontal: 14,
    color: "#929AA1",
    fontSize: 12,
    fontWeight: "600",
  },

  googleButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADCE0",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },

  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },

  errorText: {
    color: "#C62828",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 20,
  },
});