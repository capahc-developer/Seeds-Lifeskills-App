import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "../../constants/theme";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.content}>
        <Feather name="user" size={40} color={colors.purple} />
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Account settings will live here. Not part of the current build yet.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textDark,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});