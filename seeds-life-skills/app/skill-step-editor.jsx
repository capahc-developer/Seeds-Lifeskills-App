import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import ValidationBanner from '../components/ValidationBanner';
import { auth, db } from '../lib/firebase';

const genericSteps = [
  'Get ready and gather what you need.',
  'Start the first part of the skill.',
  'Continue through the task one step at a time.',
  'Check that the task is complete.',
];

export default function SkillStepEditor() {
  const { skillId } = useLocalSearchParams();
  const user = auth.currentUser;

  const [skillTitle, setSkillTitle] = useState('Skill');
  const [baseSteps, setBaseSteps] = useState(genericSteps);
  const [steps, setSteps] = useState(genericSteps);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user || !skillId) {
        setError('Please sign in again.');
        setLoading(false);
        return;
      }

      try {
        const [skillSnapshot, customizationSnapshot] = await Promise.all([
          getDoc(doc(db, 'skills', String(skillId))),
          getDoc(
            doc(
              db,
              'users',
              user.uid,
              'skillCustomizations',
              String(skillId)
            )
          ),
        ]);

        if (!skillSnapshot.exists()) {
          setError('This skill could not be found.');
          return;
        }

        const skill = skillSnapshot.data();
        const initial =
          Array.isArray(skill.steps) && skill.steps.length
            ? skill.steps
            : genericSteps;

        setSkillTitle(skill.title || 'Skill');
        setBaseSteps(initial);

        if (
          customizationSnapshot.exists() &&
          Array.isArray(customizationSnapshot.data().steps) &&
          customizationSnapshot.data().steps.length
        ) {
          setSteps(customizationSnapshot.data().steps);
        } else {
          setSteps(initial);
        }
      } catch (cause) {
        console.error('Error loading step customization:', cause);
        setError('The steps could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [skillId, user]);

  const updateStep = (index, value) => {
    setSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index ? value : step
      )
    );
    setError('');
  };

  const addStep = () => setSteps((current) => [...current, '']);

  const removeStep = (index) => {
    if (steps.length <= 1) {
      setError('A skill needs at least one step.');
      return;
    }

    setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index));
  };

  const moveStep = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;

    setSteps((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = async () => {
    if (!user || !skillId) return;

    const cleanSteps = steps.map((step) => step.trim()).filter(Boolean);

    if (!cleanSteps.length) {
      setError('Add at least one step before saving.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await setDoc(
        doc(
          db,
          'users',
          user.uid,
          'skillCustomizations',
          String(skillId)
        ),
        {
          steps: cleanSteps,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.replace(`/skill/${String(skillId)}`);
    } catch (cause) {
      console.error('Error saving step customization:', cause);
      setError('The steps could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!user || !skillId) return;

    try {
      setSaving(true);
      await deleteDoc(
        doc(
          db,
          'users',
          user.uid,
          'skillCustomizations',
          String(skillId)
        )
      );
      setSteps(baseSteps);
      setError('');
    } catch (cause) {
      console.error('Error resetting step customization:', cause);
      setError('The steps could not be reset.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" />
        <Text style={s.loadingText}>Loading steps...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#17213A" />
        </Pressable>
        <Text style={s.headerTitle}>Adjust Steps</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={s.body}>
        <Text style={s.skillTitle}>{skillTitle}</Text>
        <Text style={s.intro}>
          Change the wording, add or remove steps, and move steps into the order that works best for your child.
        </Text>

        <ValidationBanner message={error} />

        <View style={s.row}>
          <Text style={s.sectionTitle}>Steps</Text>
          <Pressable style={s.addButton} onPress={addStep}>
            <Ionicons name="add" size={19} color="#258DEB" />
            <Text style={s.addText}>Add Step</Text>
          </Pressable>
        </View>

        {steps.map((step, index) => (
          <View key={index} style={s.stepCard}>
            <View style={s.stepNumber}>
              <Text style={s.stepNumberText}>{index + 1}</Text>
            </View>

            <TextInput
              style={s.input}
              value={step}
              onChangeText={(value) => updateStep(index, value)}
              multiline
              textAlignVertical="top"
              placeholder={`Step ${index + 1}`}
            />

            <View style={s.actions}>
              <Pressable
                onPress={() => moveStep(index, -1)}
                disabled={index === 0}
                style={[s.iconButton, index === 0 && s.disabledIcon]}
              >
                <Ionicons name="chevron-up" size={18} color="#526170" />
              </Pressable>
              <Pressable
                onPress={() => moveStep(index, 1)}
                disabled={index === steps.length - 1}
                style={[
                  s.iconButton,
                  index === steps.length - 1 && s.disabledIcon,
                ]}
              >
                <Ionicons name="chevron-down" size={18} color="#526170" />
              </Pressable>
              <Pressable
                onPress={() => removeStep(index)}
                style={s.iconButton}
              >
                <Ionicons name="trash-outline" size={18} color="#C93B3B" />
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable
          style={[s.saveButton, saving && s.disabled]}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={s.saveText}>Save Step Changes</Text>
          )}
        </Pressable>

        <Pressable
          style={s.resetButton}
          onPress={reset}
          disabled={saving}
        >
          <Text style={s.resetText}>Reset to Default Steps</Text>
        </Pressable>
      </View>
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
  headerTitle: { fontSize: 21, fontWeight: '800', color: '#17213A' },
  body: { padding: 20 },
  skillTitle: { fontSize: 24, fontWeight: '800', color: '#17213A' },
  intro: {
    marginTop: 7,
    marginBottom: 18,
    color: '#718096',
    fontSize: 14,
    lineHeight: 21,
  },
  row: {
    marginTop: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#17213A' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EAF5FF',
  },
  addText: { color: '#258DEB', fontWeight: '800', fontSize: 13 },
  stepCard: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
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
  input: {
    flex: 1,
    minHeight: 46,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F6F9FC',
    color: '#17213A',
    fontSize: 15,
    lineHeight: 20,
  },
  actions: { gap: 5 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F4F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledIcon: { opacity: 0.3 },
  saveButton: {
    marginTop: 20,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#258DEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  resetButton: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9E4EE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { color: '#526170', fontWeight: '800' },
  disabled: { opacity: 0.55 },
  center: {
    flex: 1,
    backgroundColor: '#F2F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { marginTop: 10, color: '#718096' },
});
