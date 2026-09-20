import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../../components/AppHeader';
import ChecklistItem from '../../../components/ChecklistItem';
import PressableCard from '../../../components/PressableCard';
import ScreenContainer from '../../../components/ScreenContainer';
import { findAssignment } from '../../../data/skills';
import { COLORS, SPACING } from '../../../constants/theme';
import { useProgress } from '../../../context/ProgressContext';

export default function ChecklistScreen() {
  const { skillId, assignmentId } = useLocalSearchParams();
  const assignment = findAssignment(skillId, assignmentId);
  const { completedSteps, toggleStep } = useProgress();

  if (!assignment) {
    return <ScreenContainer><Text>Assignment not found.</Text></ScreenContainer>;
  }

  return (
    <ScreenContainer>
      <AppHeader activeTab="assignments" showHome />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Checklist</Text>
        <Text style={styles.title}>{assignment.assignmentTitle}</Text>

        <View style={styles.list}>
          {assignment.steps.map((step) => {
            const key = `${skillId}:${assignmentId}:${step.id}`;
            return (
              <ChecklistItem
                key={step.id}
                label={step.label}
                checked={Boolean(completedSteps[key])}
                onPress={() => toggleStep(key)}
              />
            );
          })}
        </View>

        <PressableCard style={styles.aiCard} onPress={() => {}}>
          <Ionicons name="chatbubble-ellipses-outline" size={54} />
          <Text style={styles.aiTitle}>Ask for help</Text>
          <Text style={styles.aiBody}>
            The AI assistant can repeat a step, simplify the wording, or give
            a visual prompt.
          </Text>
        </PressableCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: 48 },
  eyebrow: { fontSize: 18, color: COLORS.mutedText },
  title: { marginTop: 4, fontSize: 34, fontWeight: '700' },
  list: { marginTop: 22, gap: 12 },
  aiCard: {
    marginTop: 32,
    minHeight: 220,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  aiTitle: { marginTop: 12, fontSize: 26, fontWeight: '700' },
  aiBody: { marginTop: 8, maxWidth: 460, textAlign: 'center', fontSize: 17 },
});