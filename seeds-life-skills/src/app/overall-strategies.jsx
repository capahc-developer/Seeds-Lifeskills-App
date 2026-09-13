import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ScreenHeader from "../components/ScreenHeader";
import StrategyListItem from "../components/StrategyListItem";
import { getOverallStrategies } from "../lib/firestoreData";
import { colors, spacing } from "../constants/theme";

export default function OverallStrategiesScreen() {
  const router = useRouter();
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverallStrategies()
      .then(setStrategies)
      .catch((err) => console.error("Failed to load overall strategies:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="Overall Strategies" tint={colors.purple} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenHeader title="Overall Strategies" tint={colors.purple} />
      <Text style={styles.helperText}>These strategies can help with every skill and everyday routines.</Text>
      <FlatList
        data={strategies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <StrategyListItem
            title={item.title}
            summary={item.summary}
            icon={item.icon}
            color={item.color}
            onPress={() => router.push(`/strategy/overall/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  helperText: { fontSize: 13, color: colors.textMuted, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
});