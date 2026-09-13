import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import ScreenHeader from "../../../components/ScreenHeader";
import IconBadge from "../../../components/IconBadge";
import { getOverallStrategies, getMorningRoutineStrategies } from "../../../lib/firestoreData";
import { colors, spacing, radius } from "../../../constants/theme";

export default function StrategyDetailScreen() {
  const { category, id } = useLocalSearchParams();
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFn = category === "morning-routine" ? getMorningRoutineStrategies : getOverallStrategies;
    fetchFn()
      .then((list) => setStrategy(list.find((item) => item.id === id) || null))
      .catch((err) => console.error("Failed to load strategy:", err))
      .finally(() => setLoading(false));
  }, [category, id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="Strategy" tint={colors.purple} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      </SafeAreaView>
    );
  }

  if (!strategy) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="Strategy" tint={colors.purple} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>We couldn't find that strategy.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenHeader
        title={strategy.number ? `${strategy.number}. ${strategy.title}` : strategy.title}
        tint={colors.purple}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCard}>
          <IconBadge icon={strategy.icon} color={strategy.color} size={72} iconSize={32} />
        </View>

        <Text style={styles.title}>{strategy.title}</Text>

        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationLabel}>Psychologist's Recommendation</Text>
          <Text style={styles.recommendationText}>{strategy.recommendation}</Text>
        </View>

        <TouchableOpacity
          style={styles.aiButton}
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert("Coming soon", "The AI Assistant isn't available in this build yet.")
          }
        >
          <Feather name="zap" size={18} color={colors.white} />
          <Text style={styles.aiButtonText}>Ask AI Assistant</Text>
          <Text style={styles.aiButtonBadge}>Coming soon</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
          <Feather name="book-open" size={18} color={colors.textMuted} />
          <Text style={styles.linkText}>Examples from Psychologist</Text>
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, alignItems: "center" },
  iconCard: { marginTop: spacing.md, marginBottom: spacing.md },
  title: { fontSize: 20, fontWeight: "700", color: colors.textDark, textAlign: "center", marginBottom: spacing.lg },
  recommendationCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  recommendationLabel: { fontSize: 13, fontWeight: "700", color: colors.purple, marginBottom: spacing.sm },
  recommendationText: { fontSize: 14, lineHeight: 21, color: colors.textDark },
  aiButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.purple,
    opacity: 0.55,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  aiButtonText: { color: colors.white, fontWeight: "700", fontSize: 15, marginLeft: spacing.sm },
  aiButtonBadge: { color: colors.white, fontSize: 11, marginLeft: spacing.sm, opacity: 0.9 },
  linkRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  linkText: { flex: 1, marginLeft: spacing.sm, fontSize: 14, color: colors.textDark, fontWeight: "500" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { color: colors.textMuted },
});