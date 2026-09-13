import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing } from "../constants/theme";

export default function ScreenHeader({ title, tint = colors.purple, showBack = true }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={22} color={tint} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backButton} />
      )}
      <Text style={[styles.title, { color: tint }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.backButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});