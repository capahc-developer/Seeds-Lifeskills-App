import { useState } from "react";
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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [createAccount, setCreateAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        case "auth/user-not-found":
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
            createAccount ? "newPassword" : "password"
          }
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleEmailAuth}
          disabled={loading}
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
          disabled={loading}
        >
          <Text style={styles.switchText}>
            {createAccount
              ? "Already have an account? Sign in"
              : "Don't have an account? Create one"}
          </Text>
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

  errorText: {
    color: "#C62828",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 20,
  },
});