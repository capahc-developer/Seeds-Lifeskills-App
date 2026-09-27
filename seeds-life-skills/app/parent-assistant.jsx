import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import app from '../lib/firebase';
import { practicePlansForCurrentUser } from '../lib/userData';
import { useStudentProfile } from '../context/StudentProfileContext';

const assistant = httpsCallable(getFunctions(app), 'parentAssistant');

export default function ParentAssistant() {
  const { profile, loading: profileLoading } = useStudentProfile();
  const [mode, setMode] = useState('advice');
  const [question, setQuestion] = useState('');
  const [useProfile, setUseProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    let active = true;
    getDocs(query(practicePlansForCurrentUser(), orderBy('createdAt', 'desc')))
      .then((snapshot) => { if (active) setPlans(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))); })
      .catch(() => { if (active) Alert.alert('Could not load plans', 'Please try again later.'); });
    return () => { active = false; };
  }, []);

  async function generate() {
    if (question.trim().length < 5 || question.trim().length > 600) {
      Alert.alert('Add more detail', 'Enter 5 to 600 characters.');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const response = await assistant({ mode, question: question.trim(), useProfile });
      setResult(response.data);
    } catch (error) {
      Alert.alert('Could not generate', error.code === 'functions/resource-exhausted'
        ? 'You have reached the daily limit of 10 requests. Try again tomorrow.'
        : 'Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function savePlan() {
    if (!result || mode !== 'activity' || busy) return;
    setBusy(true);
    try {
      const plan = {
        title: result.title, goal: result.goal, steps: result.steps,
        durationMinutes: result.durationMinutes, createdAt: serverTimestamp(),
      };
      const ref = await addDoc(practicePlansForCurrentUser(), plan);
      setPlans((current) => [{ ...plan, id: ref.id }, ...current]);
      setResult(null);
      Alert.alert('Saved', 'The activity is in your practice plans.');
    } catch (_error) {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color="#245A87" /><Text style={styles.backText}>Home</Text></Pressable>
      <Text style={styles.title}>Parent Assistant ✨</Text>
      <Text style={styles.intro}>Ask for practical ideas to support daily life skills. Review every suggestion before using it with your child.</Text>
      <View style={styles.row}>
        {[[ 'advice', 'Ask a question' ], [ 'activity', 'Make an activity' ]].map(([value, label]) => (
          <Pressable key={value} accessibilityRole="button" onPress={() => { setMode(value); setResult(null); }} style={[styles.choice, mode === value && styles.selected]}><Text style={[styles.choiceText, mode === value && styles.selectedText]}>{label}</Text></Pressable>
        ))}
      </View>
      <Text style={styles.label}>{mode === 'advice' ? 'What would you like help with?' : 'What skill would you like to practice?'}</Text>
      <TextInput style={styles.input} multiline maxLength={600} value={question} onChangeText={setQuestion} placeholder={mode === 'advice' ? 'For example: How can I make morning routines easier?' : 'For example: Practice packing a backpack independently'} placeholderTextColor="#7A8495" />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: useProfile }} onPress={() => setUseProfile((value) => !value)} style={styles.optIn} disabled={profileLoading}>
        <Ionicons name={useProfile ? 'checkbox' : 'square-outline'} size={25} color="#258DEB" />
        <Text style={styles.optText}>Use this account’s student age, strengths, barriers, and interests to personalize this request{profile.name ? ` for ${profile.name}` : ''}. The profile name is not sent.</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={busy || profileLoading} onPress={generate} style={[styles.button, (busy || profileLoading) && styles.disabled]}><Text style={styles.buttonText}>{busy ? 'Working...' : mode === 'advice' ? 'Get ideas' : 'Create activity'}</Text></Pressable>
      {busy && <ActivityIndicator style={styles.spinner} />}
      {result && <View style={styles.result}>
        <Text style={styles.section}>{mode === 'advice' ? 'Suggestion' : result.title}</Text>
        {mode === 'advice' ? <Text style={styles.body}>{result.answer}</Text> : <>
          <Text style={styles.body}>{result.goal} · About {result.durationMinutes} minutes</Text>
          {result.steps.map((step, index) => <Text key={`${index}-${step}`} style={styles.step}>{index + 1}. {step}</Text>)}
          <Pressable accessibilityRole="button" onPress={savePlan} disabled={busy} style={styles.button}><Text style={styles.buttonText}>Save this activity</Text></Pressable>
        </>}
      </View>}
      {plans.length > 0 && <View style={styles.saved}><Text style={styles.section}>Saved practice plans</Text>{plans.map((plan) => <View key={plan.id} style={styles.plan}><Text style={styles.planTitle}>{plan.title}</Text><Text style={styles.body}>{plan.goal} · About {plan.durationMinutes} minutes</Text>{plan.steps?.map((step, index) => <Text key={`${index}-${step}`} style={styles.step}>{index + 1}. {step}</Text>)}</View>)}</View>}
      <Text style={styles.note}>AI suggestions can be mistaken. This assistant does not provide medical or diagnostic advice. Up to 10 requests per account each day.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#EEF8FF' }, content: { padding: 22, paddingTop: 55, paddingBottom: 45 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }, backText: { color: '#245A87', fontSize: 16, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '800', color: '#171B34' }, intro: { fontSize: 15, lineHeight: 22, color: '#526170', marginTop: 10 },
  row: { flexDirection: 'row', gap: 10, marginTop: 24 }, choice: { flex: 1, borderRadius: 14, padding: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDECF8', alignItems: 'center' }, selected: { backgroundColor: '#DDF0FF', borderColor: '#258DEB' }, choiceText: { fontWeight: '700', color: '#526170' }, selectedText: { color: '#245A87' },
  label: { fontSize: 17, fontWeight: '700', color: '#171B34', marginTop: 25, marginBottom: 9 }, input: { minHeight: 112, backgroundColor: '#FFF', borderRadius: 16, padding: 15, fontSize: 16, textAlignVertical: 'top', color: '#171B34' },
  optIn: { flexDirection: 'row', gap: 10, marginVertical: 20, alignItems: 'flex-start' }, optText: { flex: 1, lineHeight: 21, color: '#35465A' },
  button: { backgroundColor: '#258DEB', borderRadius: 15, padding: 15, alignItems: 'center', marginTop: 12 }, disabled: { opacity: 0.5 }, buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' }, spinner: { marginTop: 15 },
  result: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginTop: 22 }, section: { fontSize: 20, fontWeight: '800', color: '#171B34', marginBottom: 10 }, body: { color: '#35465A', lineHeight: 23, fontSize: 15 }, step: { color: '#35465A', lineHeight: 23, marginTop: 7, fontSize: 15 },
  saved: { marginTop: 30 }, plan: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12 }, planTitle: { fontSize: 17, fontWeight: '800', color: '#171B34', marginBottom: 6 }, note: { color: '#64758A', marginTop: 22, lineHeight: 20, fontSize: 13 },
});
