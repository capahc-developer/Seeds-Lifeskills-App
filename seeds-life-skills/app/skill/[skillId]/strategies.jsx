import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { findSkill } from '../../../data/skills';
import { findIndependentStepsSkill } from '../../../data/independentStepsSkills';

export default function SkillStrategies() {
  const { skillId } = useLocalSearchParams();
  const resolvedSkillId = Array.isArray(skillId) ? skillId[0] : skillId;

  const localSkill = findSkill(resolvedSkillId);
  const independentSkill = findIndependentStepsSkill(resolvedSkillId);
  const skill = {
    ...localSkill,
    ...independentSkill,
    strategies:
      independentSkill?.strategies?.length
        ? independentSkill.strategies
        : localSkill?.strategies || [],
  };

  if (!skill?.title) {
    return (
      <View style={s.center}>
        <Text style={s.errorTitle}>Strategies not found</Text>
        <Pressable onPress={() => router.back()} style={s.backButton}>
          <Text style={s.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#17213A" />
        </Pressable>
        <Text style={s.headerTitle}>Strategies</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={s.hero}>
        <View style={s.heroIcon}>
          <Ionicons name="bulb-outline" size={29} color="#248A6B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{skill.title}</Text>
          <Text style={s.subtitle}>
            Practical ways to make this skill easier to teach and practice.
          </Text>
        </View>
      </View>

      {(skill.strategies || []).map((strategy, index) => (
        <View key={`${strategy.title}-${index}`} style={s.card}>
          <View style={s.number}>
            <Text style={s.numberText}>{index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{strategy.title}</Text>
            <Text style={s.cardText}>{strategy.detail}</Text>
          </View>
        </View>
      ))}

      {!skill.strategies?.length && (
        <View style={s.emptyCard}>
          <Text style={s.emptyText}>
            No specific strategies have been added for this skill yet.
          </Text>
        </View>
      )}

      <Pressable
        style={s.helpButton}
        onPress={() => router.push(`/skill/${resolvedSkillId}/step-help`)}
      >
        <Ionicons name="sparkles-outline" size={20} color="#6B5BD2" />
        <Text style={s.helpButtonText}>Get help with a difficult step</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F2F9FF' },
  content: { paddingBottom: 42 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#17213A' },
  hero: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center',
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 19, fontWeight: '800', color: '#17365D' },
  subtitle: { marginTop: 4, fontSize: 13, lineHeight: 19, color: '#718096' },
  card: {
    marginHorizontal: 16,
    marginBottom: 11,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1EAF1',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  number: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { color: '#248A6B', fontWeight: '800' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#17213A' },
  cardText: { marginTop: 5, fontSize: 14, lineHeight: 20, color: '#617083' },
  emptyCard: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  emptyText: { textAlign: 'center', color: '#718096' },
  helpButton: {
    marginHorizontal: 16,
    marginTop: 5,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#F1EDFF',
    borderWidth: 1,
    borderColor: '#DED7F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  helpButtonText: { color: '#5948BA', fontWeight: '800', fontSize: 15 },
  center: {
    flex: 1,
    backgroundColor: '#F2F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#17213A' },
  backButton: {
    marginTop: 18,
    backgroundColor: '#258DEB',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backButtonText: { color: '#FFFFFF', fontWeight: '800' },
});
