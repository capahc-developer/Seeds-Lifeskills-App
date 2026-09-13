import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function CompleteScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Routine completed!</Text>

      <Pressable onPress={() => router.replace("/routines")} style={styles.button}>
        <Text style={styles.buttonText}>Choose Another Routine</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center",
    padding: 24, gap: 24 },
  emoji: { fontSize: 72 },
  title: { fontSize: 30, fontWeight: "700", textAlign: "center" },
  button: { backgroundColor: "#2563eb", padding: 16, borderRadius: 12 },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600" }
});
