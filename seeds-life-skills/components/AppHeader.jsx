import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function AppHeader({ activeTab = 'home', showHome = false }) {
  return (
    <View style={styles.header}>
      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open lessons"
          onPress={() => router.push('/lessons')}
          style={[
            styles.tab,
            activeTab === 'lessons' && styles.activeTab,
          ]}
        >
          <Text style={styles.tabText}>Lessons</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open assignments"
          onPress={() => router.push('/assignments')}
          style={[
            styles.tab,
            activeTab === 'assignments' && styles.activeTab,
          ]}
        >
          <Text style={styles.tabText}>Assignments</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to home"
        onPress={() => router.replace('/')}
        style={styles.homeButton}
      >
        <Ionicons
          name={showHome ? 'home' : 'person-circle'}
          size={42}
          color={COLORS.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  tabs: { flex: 1, maxWidth: 520, flexDirection: 'row' },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 18, fontWeight: '600' },
  homeButton: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
});