import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import IconBadge from "./IconBadge";
import { colors, spacing, radius } from "../constants/theme";

export default function StrategyListItem({ number, title, summary, icon, color, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <IconBadge icon={icon} color={color} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>
          {number ? `${number}. ` : ""}
          {title}
        </Text>
        {summary ? <Text style={styles.summary}>{summary}</Text> : null}
      </View>
      <Feather name="chevron-right" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  textWrap: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  summary: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});