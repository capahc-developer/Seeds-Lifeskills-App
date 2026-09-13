import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePracticeLog } from "../../context/PracticeLogContext";
import { colors, spacing, radius } from "../../constants/theme";

const RESULT_META = {
  success: { label: "Success", color: colors.green, bg: colors.greenLight, icon: "check-circle" },
  partial: { label: "Partial", color: colors.orange, bg: colors.orangeLight, icon: "alert-circle" },
  failed: { label: "Failed", color: colors.red, bg: colors.redLight, icon: "x-circle" },
  skipped: { label: "Skipped", color: colors.textMuted, bg: colors.border, icon: "minus-circle" },
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function PracticeLogScreen() {
  const router = useRouter();
  const { entries, loading } = usePracticeLog();

  if (loading) {                                    
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.green} />
        </View>
      </SafeAreaView>
    );
  }


  const stats = useMemo(() => {
    const thisWeek = entries.slice(0, 7); // simple recency-based "this week" approximation
    const success = thisWeek.filter((e) => e.result === "success").length;
    const partial = thisWeek.filter((e) => e.result === "partial").length;
    const failed = thisWeek.filter((e) => e.result === "failed").length;
    const total = thisWeek.length || 1;
    const rate = Math.round((success / total) * 100);
    return { success, partial, failed, rate };
  }, [entries]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practice Log</Text>
        <Text style={styles.headerSubtitle}>Morning Routine</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>This Week Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryStat}>
            <Text style={[styles.summaryNumber, { color: colors.green }]}>{stats.success}</Text>
            <Text style={styles.summaryStatLabel}>Success</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={[styles.summaryNumber, { color: colors.orange }]}>{stats.partial}</Text>
            <Text style={styles.summaryStatLabel}>Partial</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={[styles.summaryNumber, { color: colors.red }]}>{stats.failed}</Text>
            <Text style={styles.summaryStatLabel}>Failed</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${stats.rate}%` }]} />
        </View>
        <Text style={styles.progressLabel}>Success Rate {stats.rate}%</Text>
      </View>

      <Text style={styles.recentLabel}>Recent Entries</Text>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const meta = RESULT_META[item.result] || RESULT_META.skipped;
          return (
            <View style={styles.entryRow}>
              <View style={[styles.entryIcon, { backgroundColor: meta.bg }]}>
                <Feather name={meta.icon} size={18} color={meta.color} />
              </View>
              <View style={styles.entryText}>
                <Text style={styles.entryTitle}>{item.strategy}</Text>
                <Text style={styles.entryMeta}>
                  {formatDate(item.date)} · {meta.label}
                </Text>
                {item.notes ? <Text style={styles.entryNotes}>{item.notes}</Text> : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No practice attempts logged yet.</Text>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.85}
        onPress={() => router.push("/add-entry")}
      >
        <Feather name="plus" size={18} color={colors.white} />
        <Text style={styles.addButtonText}>Add New Entry</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.green,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.85,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.md,
  },
  summaryStat: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: "800",
  },
  summaryStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    backgroundColor: colors.green,
    borderRadius: radius.pill,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  recentLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textDark,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  entryRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  entryText: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
  },
  entryMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  entryNotes: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: "italic",
  },
  emptyText: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
    marginLeft: spacing.sm,
  },
});