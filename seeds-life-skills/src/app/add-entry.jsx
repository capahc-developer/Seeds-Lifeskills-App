import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ScreenHeader from "../components/ScreenHeader";
import { usePracticeLog } from "../context/PracticeLogContext";
import { skillOptions, strategyOptionsBySkill } from "../constants/data";
import { colors, spacing, radius } from "../constants/theme";

const RESULT_OPTIONS = [
  { key: "success", label: "Success", icon: "smile", color: colors.green, bg: colors.greenLight },
  { key: "partial", label: "Partial", icon: "meh", color: colors.orange, bg: colors.orangeLight },
  { key: "failed", label: "Failed", icon: "frown", color: colors.red, bg: colors.redLight },
  { key: "skipped", label: "Skipped", icon: "skip-forward", color: colors.textMuted, bg: colors.border },
];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddEntryScreen() {
  const router = useRouter();
  const { addEntry } = usePracticeLog();

  const [skill, setSkill] = useState(skillOptions[0]);
  const [strategy, setStrategy] = useState(strategyOptionsBySkill[skillOptions[0]][0]);
  const [date, setDate] = useState(todayString());
  const [result, setResult] = useState(null);
  const [notes, setNotes] = useState("");

  const strategyChoices = strategyOptionsBySkill[skill] || [];

  const handleSave = () => {
    if (!result) return;
    addEntry({ skill, strategy, date, result, notes });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenHeader title="Add New Entry" tint={colors.green} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Skill</Text>
        <View style={styles.pillRow}>
          {skillOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.pill, skill === option && styles.pillActive]}
              onPress={() => {
                setSkill(option);
                setStrategy(strategyOptionsBySkill[option][0]);
              }}
            >
              <Text style={[styles.pillText, skill === option && styles.pillTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Strategy Used</Text>
        <View style={styles.pillColumn}>
          {strategyChoices.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.selectRow, strategy === option && styles.selectRowActive]}
              onPress={() => setStrategy(option)}
            >
              <Text
                style={[styles.selectRowText, strategy === option && styles.selectRowTextActive]}
              >
                {option}
              </Text>
              {strategy === option ? (
                <Feather name="check" size={16} color={colors.green} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Result</Text>
        <View style={styles.resultRow}>
          {RESULT_OPTIONS.map((option) => {
            const active = result === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.resultOption,
                  { backgroundColor: active ? option.bg : colors.card },
                  active && { borderColor: option.color },
                ]}
                onPress={() => setResult(option.key)}
              >
                <Feather name={option.icon} size={22} color={option.color} />
                <Text style={[styles.resultLabel, { color: option.color }]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any details about this attempt..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.saveButton, !result && styles.saveButtonDisabled]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={!result}
        >
          <Text style={styles.saveButtonText}>Save Entry</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textDark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.purpleLight,
    borderColor: colors.purple,
  },
  pillText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },
  pillTextActive: {
    color: colors.purple,
  },
  pillColumn: {
    gap: spacing.sm,
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  selectRowActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenLight,
  },
  selectRowText: {
    fontSize: 14,
    color: colors.textDark,
  },
  selectRowTextActive: {
    fontWeight: "700",
    color: colors.textDark,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textDark,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  resultOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.green,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
});