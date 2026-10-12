import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../../lib/firebase';


const genericSteps = [
  'Get ready and gather what you need.',
  'Start the first part of the skill.',
  'Continue through the task one step at a time.',
  'Check that the task is complete.',
];

export default function Skill() {
  const { skillId } = useLocalSearchParams();
  const user = auth.currentUser;

  const [skill, setSkill] = useState(null);
  const [steps, setSteps] = useState(genericSteps);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadSkill = async () => {
      try {
        setLoading(true);
        setError(false);

        const canonicalId = String(skillId) === 'zip-winter-coat' ? 'zip-up-a-winter-coat' : String(skillId);
        const skillRef = doc(db, 'skills', canonicalId);
        const skillSnap = await getDoc(skillRef);

        if (!skillSnap.exists() || skillSnap.data().active === false) {
          setError(true);
          return;
        }
        const loadedSkill = { id: skillSnap.id, ...skillSnap.data() };
        setSkill(loadedSkill);

        let nextSteps =
          Array.isArray(loadedSkill.steps) && loadedSkill.steps.length
            ? loadedSkill.steps
            : genericSteps;

        if (user) {
          let customization = await getDoc(
            doc(db, 'users', user.uid, 'skillCustomizations', canonicalId)
          );
          // Older versions saved coat customizations under the legacy ID.
          if (!customization.exists() && canonicalId === 'zip-up-a-winter-coat') {
            customization = await getDoc(
              doc(db, 'users', user.uid, 'skillCustomizations', 'zip-winter-coat')
            );
          }
          if (
            customization.exists() &&
            Array.isArray(customization.data().steps) &&
            customization.data().steps.length
          ) {
            nextSteps = customization.data().steps;
          }
        }

        setSteps(nextSteps);
      } catch (err) {
        console.error('Error loading skill from Firebase:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (skillId) loadSkill();
  }, [skillId, user]);

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={s.loadingText}>Loading skill...</Text>
      </View>
    );
  }

  if (error || !skill) {
    return (
      <View style={s.loadingContainer}>
        <Text style={s.errorTitle}>Skill not found</Text>
        <Pressable style={s.backButton} onPress={() => router.back()}>
          <Text style={s.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} />
        </Pressable>

        <Text style={s.headerTitle}>{skill.title}</Text>

        <View style={{ width: 28 }} />
      </View>

      <View style={s.hero}>
        <View style={s.heroIcon}>
          <Ionicons
            name={skill.icon || 'school-outline'}
            size={40}
            color="#EAA31B"
          />
        </View>

        <Text style={s.title}>{skill.title}</Text>
        <Text style={s.sub}>{skill.subtitle}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>About This Skill</Text>

        <Text style={s.body}>{skill.description}</Text>

        {!!skill.goals?.length && (
          <>
            <Text style={[s.cardTitle, { marginTop: 18 }]}>Common Goals</Text>

            {skill.goals.map((goal, index) => (
              <Text key={`${goal}-${index}`} style={s.goal}>
                • {goal}
              </Text>
            ))}
          </>
        )}
      </View>

      <Pressable
        accessibilityRole="link"
        style={s.resourceCard}
        onPress={() =>
          Linking.openURL(
            skill.videoUrl || skill.resourceUrl || 'https://www.capa-hc.org/seeds-2/'
          )
        }
      >
        <View style={s.resourceIcon}>
          <Ionicons name="play-circle-outline" size={24} color="#248A6B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.resourceTitle}>{skill.title} Video</Text>
          <Text style={s.resourceText}>Watch this Independent Steps episode</Text>
        </View>
        <Ionicons name="open-outline" size={19} color="#718096" />
      </Pressable>

      <Pressable
        accessibilityRole="link"
        style={s.resourceCard}
        onPress={() =>
          Linking.openURL(skill.resourceUrl || 'https://www.capa-hc.org/seeds-2/')
        }
      >
        <View style={s.resourceIcon}>
          <Ionicons name="link-outline" size={22} color="#248A6B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.resourceTitle}>SEEDS Resources</Text>
          <Text style={s.resourceText}>Open the full Independent Steps series</Text>
        </View>
        <Ionicons name="open-outline" size={19} color="#718096" />
      </Pressable>

      <View style={s.card}>
        <View style={s.stepsHeading}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Steps</Text>
            <Text style={s.stepsHint}>
              Start with this list, then adjust the wording or order for your child.
            </Text>
          </View>

          <Pressable
            style={s.editStepsButton}
            onPress={() =>
              router.push({
                pathname: '/skill-step-editor',
                params: { skillId: skill.id },
              })
            }
          >
            <Ionicons name="create-outline" size={17} color="#258DEB" />
            <Text style={s.editStepsText}>Adjust</Text>
          </Pressable>
        </View>

        {steps.map((step, index) => (
          <View key={index} style={s.stepRow}>
            <View style={s.stepNumber}>
              <Text style={s.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={s.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={s.stepHelpCard}
        accessibilityRole="button"
        onPress={() => router.push(`/skill/${skill.id}/step-help`)}
      >
        <View style={s.stepHelpIcon}>
          <Ionicons name="sparkles-outline" size={23} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.stepHelpTitle}>Need help with a difficult step?</Text>
          <Text style={s.stepHelpText}>
            Ask AI to break a step into smaller actions or identify a missing micro-step.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
      </Pressable>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F2F9FF' },
  content: { paddingBottom: 40 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  hero: { alignItems: 'center', padding: 26 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF1D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 25, fontWeight: '800', marginTop: 12 },
  sub: { color: '#718096', marginTop: 5, textAlign: 'center' },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 18,
  },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  resourceCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#F3FAF7',
    borderWidth: 1,
    borderColor: '#D7ECE0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F3E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#315C42',
  },
  resourceText: {
    marginTop: 3,
    fontSize: 12,
    color: '#718096',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5F6B7A',
    marginTop: 7,
  },
  goal: { fontSize: 15, lineHeight: 26, color: '#45556B' },
  stepsHeading: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  stepsHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: '#718096',
  },
  editStepsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EAF5FF',
  },
  editStepsText: { color: '#258DEB', fontWeight: '800', fontSize: 13 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E9F8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { color: '#438A6A', fontWeight: '800' },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: '#34435A',
    paddingTop: 4,
  },
  stepHelpCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#6B5BD2',
    borderWidth: 1,
    borderColor: '#5C4BC6',
    padding: 15,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepHelpIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8173E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepHelpTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  stepHelpText: {
    marginTop: 4,
    color: '#F1EEFF',
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    marginHorizontal: 16,
    marginTop: 2,
    backgroundColor: '#258DEB',
    padding: 17,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: { color: '#FFF', fontWeight: '800', fontSize: 17 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F9FF',
    padding: 30,
  },
  loadingText: { marginTop: 12, color: '#718096', fontSize: 15 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#17213A' },
  backButton: {
    marginTop: 20,
    backgroundColor: '#258DEB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backButtonText: { color: '#FFF', fontWeight: '800' },
});
