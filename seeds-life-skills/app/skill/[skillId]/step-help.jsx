import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { auth, db, functions } from '../../../lib/firebase';


const genericSteps = [
  'Get ready and gather what you need.',
  'Start the first part of the skill.',
  'Continue through the task one step at a time.',
  'Check that the task is complete.',
];

export default function StepHelp() {
  const { skillId } = useLocalSearchParams();
  const resolvedSkillId = Array.isArray(skillId) ? skillId[0] : skillId;

  const [skill, setSkill] = useState(null);
  const [steps, setSteps] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [details, setDetails] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const canonicalId = String(resolvedSkillId) === 'zip-winter-coat'
          ? 'zip-up-a-winter-coat' : String(resolvedSkillId);
        const skillSnap = await getDoc(doc(db, 'skills', canonicalId));

        if (!skillSnap.exists() || skillSnap.data().active === false) {
          setSkill(null);
          return;
        }

        const loadedSkill = { id: skillSnap.id, ...skillSnap.data() };

        let nextSteps =
          Array.isArray(loadedSkill.steps) && loadedSkill.steps.length
            ? loadedSkill.steps
            : genericSteps;

        const user = auth.currentUser;
        if (user) {
          let customSnap = await getDoc(
            doc(db, 'users', user.uid, 'skillCustomizations', canonicalId)
          );
          if (!customSnap.exists() && canonicalId === 'zip-up-a-winter-coat') {
            customSnap = await getDoc(
              doc(db, 'users', user.uid, 'skillCustomizations', 'zip-winter-coat')
            );
          }
          if (
            customSnap.exists() &&
            Array.isArray(customSnap.data().steps) &&
            customSnap.data().steps.length
          ) {
            nextSteps = customSnap.data().steps;
          }
        }

        setSkill(loadedSkill);
        setSteps(nextSteps);
      } catch (error) {
        console.error('Error loading step help:', error);
        Alert.alert('Could not load skill', 'Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (resolvedSkillId) load();
  }, [resolvedSkillId]);

  async function askForHelp() {
    if (selectedIndex == null) {
      Alert.alert('Choose a step', 'Select the step your child is having trouble with.');
      return;
    }

    try {
      setAsking(true);
      setAnswer('');

      const selectedStep = steps[selectedIndex];
      const previousStep = selectedIndex > 0 ? steps[selectedIndex - 1] : 'This is the first step.';
      const nextStep =
        selectedIndex < steps.length - 1 ? steps[selectedIndex + 1] : 'This is the last step.';

      const prompt = [
        `The skill is "${skill.title}".`,
        `My child is getting stuck on step ${selectedIndex + 1}: "${selectedStep}".`,
        `The step before it is: "${previousStep}".`,
        `The step after it is: "${nextStep}".`,
        details.trim()
          ? `What I am noticing: ${details.trim()}`
          : 'I am not sure exactly what is preventing the step.',
        'Help me identify one or more tiny missing physical or observable actions. Break the difficult step down into very small actions I can try. Tell me what to watch for before moving to the next action.',
      ].join('\n');

      const chatAssistant = httpsCallable(functions, 'chatAssistant');
      const result = await chatAssistant({
        screenPath: `/skill/${resolvedSkillId}/step-help`,
        params: { skillId: String(resolvedSkillId) },
        messages: [{ role: 'user', content: prompt }],
      });

      const response =
        typeof result.data?.answer === 'string' ? result.data.answer.trim() : '';

      if (!response) throw new Error('The assistant returned an empty response.');
      setAnswer(response);
    } catch (error) {
      console.warn('Step guidance request failed:', {
        code: error?.code,
        message: error?.message,
        details: error?.details,
      });

      const readableMessage =
        error?.code === 'functions/unauthenticated'
          ? 'Please sign in again, then retry.'
          : error?.code === 'functions/unavailable'
            ? 'The AI service is unavailable right now. Please try again.'
            : error?.message ||
              'The assistant is unavailable right now. Please try again.';

      Alert.alert('Could not get guidance', readableMessage);
    } finally {
      setAsking(false);
    }
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#6B5BD2" />
        <Text style={s.loadingText}>Loading steps...</Text>
      </View>
    );
  }

  if (!skill) {
    return (
      <View style={s.center}>
        <Text style={s.errorTitle}>Skill not found</Text>
        <Pressable style={s.primaryButton} onPress={() => router.back()}>
          <Text style={s.primaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.keyboardSafe}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={s.page}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#17213A" />
        </Pressable>
        <Text style={s.headerTitle}>Step Help</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={s.hero}>
        <View style={s.heroIcon}>
          <Ionicons name="sparkles-outline" size={28} color="#6B5BD2" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.heroTitle}>Find the missing micro-step</Text>
          <Text style={s.heroText}>
            Choose where your child gets stuck. AI will help break that transition into
            smaller, observable actions for you to try.
          </Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>1. Where is the difficulty?</Text>

      {steps.map((step, index) => {
        const selected = selectedIndex === index;
        return (
          <Pressable
            key={`${index}-${step}`}
            onPress={() => {
              setSelectedIndex(index);
              setAnswer('');
            }}
            style={[s.stepCard, selected && s.stepSelected]}
          >
            <View style={[s.number, selected && s.numberSelected]}>
              <Text style={[s.numberText, selected && s.numberTextSelected]}>
                {index + 1}
              </Text>
            </View>
            <Text style={s.stepText}>{step}</Text>
            <Ionicons
              name={selected ? 'checkmark-circle' : 'ellipse-outline'}
              size={23}
              color={selected ? '#6B5BD2' : '#B0B7C3'}
            />
          </Pressable>
        );
      })}

      <Text style={[s.sectionTitle, { marginTop: 10 }]}>
        2. What are you noticing?
      </Text>
      <TextInput
        value={details}
        onChangeText={setDetails}
        multiline
        maxLength={1200}
        placeholder="Example: They can hold the coat and find the zipper, but they cannot get it started before pulling up."
        placeholderTextColor="#98A0AD"
        style={s.input}
        onFocus={() => {
          setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
          }, 250);
        }}
      />

      <Pressable
        onPress={askForHelp}
        disabled={asking}
        style={[s.askButton, asking && s.disabled]}
      >
        {asking ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        )}
        <Text style={s.askButtonText}>
          {asking ? 'Looking for the missing step...' : 'Get Step-by-Step Guidance'}
        </Text>
      </Pressable>

      {!!answer && (
        <View style={s.answerCard}>
          <View style={s.answerHeading}>
            <Ionicons name="bulb-outline" size={23} color="#6B5BD2" />
            <Text style={s.answerTitle}>Ideas to try</Text>
          </View>
          <Text style={s.answerText}>{answer}</Text>

          <Pressable
            style={s.adjustButton}
            onPress={() =>
              router.push({
                pathname: '/skill-step-editor',
                params: { skillId: skill.id },
              })
            }
          >
            <Ionicons name="create-outline" size={18} color="#6B5BD2" />
            <Text style={s.adjustButtonText}>Adjust the skill steps</Text>
          </Pressable>
        </View>
      )}

      <Text style={s.disclaimer}>
        AI guidance is a brainstorming tool for caregivers. Review each suggestion and
        use only what is appropriate for your child.
      </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  keyboardSafe: { flex: 1, backgroundColor: '#F7F5FF' },
  page: { flex: 1, backgroundColor: '#F7F5FF' },
  content: { paddingBottom: 180 },
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
    padding: 17,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DCF9',
    flexDirection: 'row',
    gap: 13,
    alignItems: 'flex-start',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECE7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 17, fontWeight: '800', color: '#3C326D' },
  heroText: { marginTop: 5, fontSize: 13, lineHeight: 19, color: '#716A89' },
  sectionTitle: {
    marginHorizontal: 18,
    marginBottom: 10,
    fontSize: 17,
    fontWeight: '800',
    color: '#17213A',
  },
  stepCard: {
    marginHorizontal: 16,
    marginBottom: 9,
    borderRadius: 16,
    padding: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E2F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  stepSelected: { borderColor: '#8A78E3', backgroundColor: '#F3F0FF' },
  number: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EDF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberSelected: { backgroundColor: '#DED7FF' },
  numberText: { fontWeight: '800', color: '#6B6476' },
  numberTextSelected: { color: '#5544B7' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20, color: '#354052' },
  input: {
    marginHorizontal: 16,
    minHeight: 120,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD7EC',
    color: '#253044',
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 20,
  },
  askButton: {
    margin: 16,
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: '#6B5BD2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  askButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.6 },
  answerCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED7F5',
  },
  answerHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  answerTitle: { fontSize: 17, fontWeight: '800', color: '#3C326D' },
  answerText: { marginTop: 12, fontSize: 14, lineHeight: 21, color: '#3D4658' },
  adjustButton: {
    marginTop: 16,
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: '#F1EDFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  adjustButtonText: { color: '#5948BA', fontWeight: '800', fontSize: 13 },
  disclaimer: {
    marginHorizontal: 24,
    marginTop: 2,
    textAlign: 'center',
    color: '#89839A',
    fontSize: 11,
    lineHeight: 16,
  },
  center: {
    flex: 1,
    backgroundColor: '#F7F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  loadingText: { marginTop: 10, color: '#716A89' },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#17213A' },
  primaryButton: {
    marginTop: 18,
    backgroundColor: '#6B5BD2',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
});
