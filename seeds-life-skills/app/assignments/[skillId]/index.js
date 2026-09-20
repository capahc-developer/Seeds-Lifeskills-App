import { useLocalSearchParams, router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import AppHeader from '../../../components/AppHeader';
import PressableCard from '../../../components/PressableCard';
import ScreenContainer from '../../../components/ScreenContainer';
import { findSkill } from '../../../data/skills';
import { COLORS, SPACING } from '../../../constants/theme';

export default function SkillAssignmentsScreen() {
  const { skillId } = useLocalSearchParams();
  const skill = findSkill(skillId);

  if (!skill) {
    return <ScreenContainer><Text>Skill not found.</Text></ScreenContainer>;
  }

  return (
    <ScreenContainer>
      <AppHeader activeTab="assignments" showHome />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Assignments</Text>
        <Text style={styles.title}>{skill.title}</Text>

        {skill.modules.map((module) => (
          <PressableCard
            key={module.assignmentId}
            style={styles.assignmentCard}
            onPress={() =>
              router.push(`/assignments/${skill.id}/${module.assignmentId}`)
            }
          >
            <Text style={styles.assignmentTitle}>{module.assignmentTitle}</Text>
            <Text style={styles.moduleName}>Based on: {module.title}</Text>
          </PressableCard>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: 48 },
  eyebrow: { fontSize: 18, color: COLORS.mutedText },
  title: { marginTop: 4, marginBottom: 18, fontSize: 34, fontWeight: '700' },
  assignmentCard: {
    minHeight: 140,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    padding: 24,
  },
  assignmentTitle: { fontSize: 24, fontWeight: '700' },
  moduleName: { marginTop: 8, fontSize: 16, color: COLORS.mutedText },
});