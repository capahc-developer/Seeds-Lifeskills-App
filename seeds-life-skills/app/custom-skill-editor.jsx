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
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import ValidationBanner from '../components/ValidationBanner';
import { auth, db } from '../lib/firebase';

const defaultSteps = [
  'Get ready for the skill.',
  'Start the first part of the task.',
  'Continue through the main steps.',
  'Check that the task is finished.',
];

export default function CustomSkillEditor() {
  const { skillId } = useLocalSearchParams();
  const editing = Boolean(skillId);
  const user = auth.currentUser;

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState(defaultSteps);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing || !user) return;

    getDoc(doc(db, 'users', user.uid, 'customSkills', String(skillId)))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          setError('This custom skill could not be found.');
          return;
        }

        const data = snapshot.data();
        setTitle(data.title || '');
        setSubtitle(data.subtitle || '');
        setDescription(data.description || '');
        setSteps(
          Array.isArray(data.steps) && data.steps.length
            ? data.steps
            : defaultSteps
        );
      })
      .catch(() => setError('This custom skill could not be loaded.'))
      .finally(() => setLoading(false));
  }, [editing, skillId, user]);

  const updateStep = (index, value) => {
    setSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index ? value : step
      )
    );
    setError('');
  };

  const addStep = () => {
    setSteps((current) => [...current, '']);
  };

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

  const saveSkill = async () => {
    if (!user) {
      setError('Please sign in again before saving.');
      return;
    }

    const cleanTitle = title.trim();
    const cleanSteps = steps.map((step) => step.trim()).filter(Boolean);

    if (!cleanTitle) {
      setError('Give the skill a name before saving.');
      return;
    }

    if (cleanSteps.length === 0) {
      setError('Add at least one step before saving.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        title: cleanTitle,
        subtitle: subtitle.trim(),
        description: description.trim(),
        steps: cleanSteps,
        icon: 'create-outline',
        updatedAt: serverTimestamp(),
      };

      let savedId = String(skillId || '');

      if (editing) {
        await setDoc(
          doc(db, 'users', user.uid, 'customSkills', savedId),
          payload,
          { merge: true }
        );
      } else {
        const created = await addDoc(
          collection(db, 'users', user.uid, 'customSkills'),
          {
            ...payload,
            createdAt: serverTimestamp(),
          }
        );
        savedId = created.id;
      }

      router.replace(`/custom-skill/${savedId}`);
    } catch (cause) {
      console.error('Error saving custom skill:', cause);
      setError('The skill could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" />
        <Text style={s.loadingText}>Loading skill...</Text>
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
        <Text style={s.headerTitle}>
          {editing ? 'Edit Skill' : 'Create Skill'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={s.form}>
        <ValidationBanner message={error} />

        <Text style={s.label}>
          Skill Name <Text style={s.required}>*</Text>
        </Text>
        <TextInput
          style={s.input}
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            setError('');
          }}
          placeholder="Example: Make a snack"
          autoCapitalize="sentences"
          maxLength={80}
        />

        <Text style={s.label}>Short Description</Text>
        <TextInput
          style={s.input}
          value={subtitle}
          onChangeText={setSubtitle}
          placeholder="Example: Prepare a simple snack independently"
          maxLength={120}
        />

        <Text style={s.label}>About This Skill</Text>
        <TextInput
          style={s.textarea}
          value={description}
          onChangeText={setDescription}
          placeholder="Add any notes or goal for this skill."
          multiline
          maxLength={500}
          textAlignVertical="top"
        />

        <View style={s.stepsHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.stepsTitle}>Steps</Text>
            <Text style={s.stepsHint}>
              Edit the starter steps, add more, remove them, or change their order.
            </Text>
          </View>
          <Pressable style={s.addButton} onPress={addStep}>
            <Ionicons name="add" size={20} color="#258DEB" />
            <Text style={s.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {steps.map((step, index) => (
          <View key={index} style={s.stepCard}>
            <View style={s.stepNumber}>
              <Text style={s.stepNumberText}>{index + 1}</Text>
            </View>

            <TextInput
              style={s.stepInput}
              value={step}
              onChangeText={(value) => updateStep(index, value)}
              placeholder={`Step ${index + 1}`}
              multiline
              textAlignVertical="top"
            />

            <View style={s.stepActions}>
              <Pressable
                accessibilityLabel="Move step up"
                onPress={() => moveStep(index, -1)}
                disabled={index === 0}
                style={[s.iconButton, index === 0 && s.iconDisabled]}
              >
                <Ionicons name="chevron-up" size={18} color="#526170" />
              </Pressable>

              <Pressable
                accessibilityLabel="Move step down"
                onPress={() => moveStep(index, 1)}
                disabled={index === steps.length - 1}
                style={[
                  s.iconButton,
                  index === steps.length - 1 && s.iconDisabled,
                ]}
              >
                <Ionicons name="chevron-down" size={18} color="#526170" />
              </Pressable>

              <Pressable
                accessibilityLabel="Remove step"
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
          onPress={saveSkill}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={s.saveButtonText}>
              {editing ? 'Save Changes' : 'Create Skill'}
            </Text>
          )}
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
  form: { padding: 20 },
  label: {
    marginTop: 16,
    marginBottom: 7,
    fontSize: 15,
    fontWeight: '800',
    color: '#526170',
  },
  required: { color: '#B42318' },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E4EE',
    fontSize: 16,
    color: '#17213A',
  },
  textarea: {
    minHeight: 100,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E4EE',
    fontSize: 15,
    color: '#17213A',
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
    marginBottom: 12,
  },
  stepsTitle: { fontSize: 20, fontWeight: '800', color: '#17213A' },
  stepsHint: {
    marginTop: 4,
    color: '#718096',
    fontSize: 13,
    lineHeight: 18,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#EAF5FF',
  },
  addButtonText: { color: '#258DEB', fontWeight: '800' },
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
  stepInput: {
    flex: 1,
    minHeight: 44,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F6F9FC',
    fontSize: 15,
    lineHeight: 20,
    color: '#17213A',
  },
  stepActions: { gap: 5 },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F4F7FA',
  },
  iconDisabled: { opacity: 0.3 },
  saveButton: {
    minHeight: 56,
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: '#258DEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  disabled: { opacity: 0.55 },
  loading: {
    flex: 1,
    backgroundColor: '#F2F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { marginTop: 10, color: '#718096' },
});
