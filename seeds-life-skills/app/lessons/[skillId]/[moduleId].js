import { useLocalSearchParams, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../../components/AppHeader';
import PressableCard from '../../../components/PressableCard';
import ScreenContainer from '../../../components/ScreenContainer';
import { findModule, findSkill } from '../../../data/skills';
import { COLORS, SPACING } from '../../../constants/theme';

export default function LessonDetailScreen() {
  const { skillId, moduleId } = useLocalSearchParams();
  const skill = findSkill(skillId);
  const module = findModule(skillId, moduleId);

  if (!skill || !module) {
    return (
      <ScreenContainer>
        <Text>Lesson not found.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader activeTab="lessons" showHome />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{skill.title}</Text>
        <Text style={styles.title}>{module.title}</Text>

        <View style={styles.videoCard}>
          <Ionicons name="play-circle" size={84} color={COLORS.primary} />
          <Text style={styles.videoText}>Lesson video</Text>
        </View>

        <PressableCard
          style={styles.practiceCard}
          onPress={() =>
            router.push(`/assignments/${skill.id}/${module.assignmentId}`)
          }
        >
          <Ionicons name="bulb-outline" size={48} color={COLORS.text} />
          <Text style={styles.practiceTitle}>Practice questions</Text>
          <Text style={styles.practiceBody}>
            Review the lesson, then complete the step-by-step checklist.
          </Text>
        </PressableCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: 48 },
  eyebrow: { fontSize: 18, color: COLORS.mutedText },
  title: { marginTop: 4, fontSize: 36, fontWeight: '700', color: COLORS.text },
  videoCard: {
    marginTop: 20,
    minHeight: 330,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: { marginTop: 8, fontSize: 26, fontWeight: '600' },
  practiceCard: {
    marginTop: 20,
    minHeight: 210,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  practiceTitle: { marginTop: 8, fontSize: 28, fontWeight: '700' },
  practiceBody: { marginTop: 8, fontSize: 17, textAlign: 'center' },
});