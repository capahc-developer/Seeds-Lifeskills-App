import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../../lib/firebase';

export default function CustomSkillDetail() {
  const { skillId } = useLocalSearchParams();
  const user = auth.currentUser;

  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSkill = async () => {
    if (!user || !skillId) return;

    try {
      const snapshot = await getDoc(
        doc(db, 'users', user.uid, 'customSkills', String(skillId))
      );

      setSkill(
        snapshot.exists()
          ? { id: snapshot.id, ...snapshot.data() }
          : null
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkill();
  }, [skillId, user]);

  const deleteSkill = async () => {
    if (!user || !skill) return;

    await deleteDoc(
      doc(db, 'users', user.uid, 'customSkills', skill.id)
    );

    router.replace('/all-skills');
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!skill) {
    return (
      <View style={s.center}>
        <Text style={s.errorTitle}>Skill not found</Text>
        <Pressable style={s.primaryButton} onPress={() => router.replace('/all-skills')}>
          <Text style={s.primaryText}>Back to Skills</Text>
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
        <Text style={s.headerTitle}>Custom Skill</Text>
        <Pressable
          accessibilityLabel="Edit skill"
          onPress={() =>
            router.push({
              pathname: '/custom-skill-editor',
              params: { skillId: skill.id },
            })
          }
        >
          <Ionicons name="create-outline" size={24} color="#258DEB" />
        </Pressable>
      </View>

      <View style={s.hero}>
        <View style={s.heroIcon}>
          <Ionicons name="create-outline" size={38} color="#7C5CE7" />
        </View>
        <Text style={s.title}>{skill.title}</Text>
        {!!skill.subtitle && <Text style={s.subtitle}>{skill.subtitle}</Text>}
      </View>

      {!!skill.description && (
        <View style={s.card}>
          <Text style={s.cardTitle}>About This Skill</Text>
          <Text style={s.body}>{skill.description}</Text>
        </View>
      )}

      <View style={s.card}>
        <View style={s.stepsHeading}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Steps</Text>
            <Text style={s.stepsSubtitle}>
              Use these as a starting point and adjust them whenever needed.
            </Text>
          </View>
          <Pressable
            style={s.editStepsButton}
            onPress={() =>
              router.push({
                pathname: '/custom-skill-editor',
                params: { skillId: skill.id },
              })
            }
          >
            <Ionicons name="create-outline" size={17} color="#258DEB" />
            <Text style={s.editStepsText}>Edit</Text>
          </Pressable>
        </View>

        {(skill.steps || []).map((step, index) => (
          <View key={index} style={s.stepRow}>
            <View style={s.stepNumber}>
              <Text style={s.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={s.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={s.editButton}
        onPress={() =>
          router.push({
            pathname: '/custom-skill-editor',
            params: { skillId: skill.id },
          })
        }
      >
        <Ionicons name="options-outline" size={20} color="#FFFFFF" />
        <Text style={s.editButtonText}>Adjust This Skill</Text>
      </Pressable>

      <Pressable style={s.deleteButton} onPress={deleteSkill}>
        <Ionicons name="trash-outline" size={19} color="#C93B3B" />
        <Text style={s.deleteText}>Delete Custom Skill</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F2F9FF' },
  content: { paddingBottom: 48 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#17213A' },
  hero: { alignItems: 'center', padding: 26 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEE9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 12,
    fontSize: 25,
    fontWeight: '800',
    color: '#17213A',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 5,
    color: '#718096',
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#17213A' },
  body: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#526170',
  },
  stepsHeading: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  stepsSubtitle: {
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
  editButton: {
    marginHorizontal: 16,
    marginTop: 4,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#258DEB',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 12,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0CACA',
    backgroundColor: '#FFF7F7',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#C93B3B', fontWeight: '800' },
  center: {
    flex: 1,
    backgroundColor: '#F2F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#17213A' },
  primaryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#258DEB',
  },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
});
