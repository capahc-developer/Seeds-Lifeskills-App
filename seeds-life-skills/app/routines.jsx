import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { dummyRoutine } from "../data/dummyRoutine";

export default function RoutinesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Choose a routine</Text>

      <View style={styles.card}>
        <Text style={styles.title}>{dummyRoutine.title}</Text>
        <Text>{dummyRoutine.description}</Text>
        <Link href="/routine" style={styles.button}>Start</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 20 },
  heading: { fontSize: 28, fontWeight: "700" },
  card: { padding: 20, borderWidth: 1, borderColor: "#ddd", borderRadius: 14, gap: 12 },
  title: { fontSize: 22, fontWeight: "600" },
  button: { backgroundColor: "#2563eb", color: "white", padding: 14,
    borderRadius: 10, textAlign: "center", fontSize: 18 }
});
