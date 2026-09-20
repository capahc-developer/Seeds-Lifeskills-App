import { ScrollView, StyleSheet, Text } from 'react-native';
import AppHeader from '../../components/AppHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SkillAccordion from '../../components/SkillAccordion';
import { skills } from '../../data/skills';
import { COLORS, SPACING } from '../../constants/theme';

export default function LessonsScreen() {
  return (
    <ScreenContainer>
      <AppHeader activeTab="lessons" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Lessons</Text>
        {skills.map((skill) => (
          <SkillAccordion key={skill.id} skill={skill} />
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: 48 },
  title: { fontSize: 34, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
});