import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePracticeLog } from "../../context/PracticeLogContext";
import IconBadge from "../../components/IconBadge";
import { colors, spacing, radius } from "../../constants/theme";

const NAV_CARDS = [
  {
    key: "overall-strategies",
    title: "Overall Strategies",
    subtitle: "General strategies that apply to all skills",
    icon: "users",
    color: "blue",
  },
  {
    key: "morning-routine",
    title: "Morning Routine Strategies",
    subtitle: "Strategies to help your child succeed",
    icon: "sunrise",
    color: "purple",
  },
  {
    key: "practice-log",
    title: "Practice Log",
    subtitle: "Track progress and practice attempts",
    icon: "clipboard",
    color: "green",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const handlePress = (key) => {
    if (key === "overall-strategies") router.push("/overall-strategies");
    if (key === "morning-routine") router.push("/morning-routine");
    if (key === "practice-log") router.push("/log");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcomeRow}>
          <Text style={styles.welcomeText}>Welcome, Parent! </Text>
          <Text style={styles.emoji}>👋</Text>
        </View>
        <Text style={styles.subtitle}>We're here to help you support your child's success.</Text>

        <View style={styles.cardsWrap}>
          {NAV_CARDS.map((card) => (
            <TouchableOpacity
              key={card.key}
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => handlePress(card.key)}
            >
              <IconBadge icon={card.icon} color={card.color} size={48} iconSize={22} />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  content: {
    padding: spacing.lg,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textDark,
  },
  emoji: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  cardsWrap: {
    gap: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textDark,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});