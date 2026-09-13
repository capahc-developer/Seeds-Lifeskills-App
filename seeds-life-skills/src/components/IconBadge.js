import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radius } from "../constants/theme";

// Maps a semantic color name (from constants/data.js) to actual theme colors.
const colorMap = {
  purple: { bg: colors.purpleLight, fg: colors.purple },
  blue: { bg: colors.blueLight, fg: colors.blue },
  green: { bg: colors.greenLight, fg: colors.green },
  orange: { bg: colors.orangeLight, fg: colors.orange },
  red: { bg: colors.redLight, fg: colors.red },
  gold: { bg: colors.goldLight, fg: colors.gold },
};

export default function IconBadge({ icon, color = "purple", size = 44, iconSize = 20 }) {
  const palette = colorMap[color] || colorMap.purple;
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Feather name={icon} size={iconSize} color={palette.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
});