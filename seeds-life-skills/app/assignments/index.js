import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenContainer from '../../components/ScreenContainer';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { practiceLogsForCurrentUser } from '../../lib/userData';
import { db } from '../../lib/firebase';
import { getStrategyGuides } from '../../lib/strategyGuides';

const ratings = [
  { label: 'Very hard', emoji: '😣' },
  { label: 'Hard', emoji: '☹️' },
  { label: 'Okay', emoji: '😐' },
  { label: 'Good', emoji: '🙂' },
  { label: 'Great', emoji: '😄' },
];

export default function PracticeLogScreen() {
  const [practiceType, setPracticeType] = useState('skill');
  const [selectedItem, setSelectedItem] = useState(null);
  const [practiceActivity, setPracticeActivity] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWasDifficult, setWhatWasDifficult] = useState('');
  const [adjustment, setAdjustment] = useState('');
  const [independentSteps, setIndependentSteps] = useState('');
  const [supportNeeded, setSupportNeeded] = useState('');
  const [changesOverTime, setChangesOverTime] = useState('');
  const [showItems, setShowItems] = useState(false);
  const [skills, setSkills] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [skillsSnapshot, loadedStrategies, logsSnapshot] = await Promise.all([
          getDocs(collection(db, 'skills')),
          getStrategyGuides({ includeInactive: true }),
          getDocs(query(practiceLogsForCurrentUser(), orderBy('createdAt', 'desc'))),
        ]);

        const loadedSkills = skillsSnapshot.docs
          .map((skillDoc) => ({ id: skillDoc.id, ...skillDoc.data() }))
          .filter((skill) => skill.active !== false)
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

        setSkills(loadedSkills);
        setStrategies([...loadedStrategies].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
        setLogs(logsSnapshot.docs.map((logDoc) => ({ id: logDoc.id, ...logDoc.data() })));
      } catch (error) {
        console.error('Error loading practice log:', error);
        Alert.alert('Error', 'Could not load the practice log.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const choices = practiceType === 'skill' ? skills : strategies;

  const changePracticeType = (nextType) => {
    setPracticeType(nextType);
    setSelectedItem(null);
    setShowItems(false);
  };

  const saveLog = async () => {
    if (!selectedItem) {
      Alert.alert(
        practiceType === 'skill' ? 'Select a skill' : 'Select a strategy',
        practiceType === 'skill'
          ? 'Please select the skill that was practiced.'
          : 'Please select the strategy that was practiced.'
      );
      return;
    }

    if (!whatWentWell.trim() && !whatWasDifficult.trim() && !adjustment.trim()) {
      Alert.alert(
        'Add a practice note',
        'Please record what went well, what was difficult, or an adjustment for next time.'
      );
      return;
    }

    try {
      setSaving(true);
      const newLog = {
        date: today,
        practiceType,
        practiceItemId: selectedItem.id,
        practiceItemTitle: selectedItem.title,
        practiceActivity: practiceActivity.trim(),
        rating: selectedRating,
        whatWentWell: whatWentWell.trim(),
        whatWasDifficult: whatWasDifficult.trim(),
        adjustment: adjustment.trim(),
        independentSteps: independentSteps.trim(),
        supportNeeded: supportNeeded.trim(),
        changesOverTime: changesOverTime.trim(),
        createdAt: serverTimestamp(),
        skill: practiceType === 'skill' ? selectedItem.title : '',
        skillId: practiceType === 'skill' ? selectedItem.id : '',
      };

      const docRef = await addDoc(practiceLogsForCurrentUser(), newLog);
      setLogs((current) => [{ id: docRef.id, ...newLog }, ...current]);

      setSelectedItem(null);
      setPracticeActivity('');
      setSelectedRating('');
      setWhatWentWell('');
      setWhatWasDifficult('');
      setAdjustment('');
      setIndependentSteps('');
      setSupportNeeded('');
      setChangesOverTime('');
      setShowItems(false);

      Alert.alert('Saved', 'Practice record saved successfully.');
    } catch (error) {
      console.error('Error saving practice log:', error);
      Alert.alert('Error', 'Could not save the practice record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#168CE8" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Practice Log</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.headerSubtitle}>
          Learn from each practice: record progress, notice difficulties, and adjust support.
        </Text>

        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>Keep a simple practice record</Text>
          <Text style={styles.guideText}>
            Track what went well, what was difficult, and what you want to adjust next time.
          </Text>
          <View style={styles.guideRow}>
            <MiniGuide icon="checkmark-circle-outline" title="Independent steps" text="What can they do on their own?" />
            <MiniGuide icon="hand-left-outline" title="Support needed" text="What kind of help is still useful?" />
            <MiniGuide icon="trending-up-outline" title="Changes over time" text="What is getting easier?" />
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Add a Practice Record</Text>

          <Text style={styles.label}>Date</Text>
          <View style={styles.inputBox}>
            <Text style={styles.inputText}>{today}</Text>
            <Ionicons name="calendar-outline" size={22} color="#69778A" />
          </View>

          <Text style={styles.label}>What are you practicing?</Text>
          <View style={styles.typeRow}>
            <TypeButton
              label="Your Skill"
              icon="school-outline"
              selected={practiceType === 'skill'}
              onPress={() => changePracticeType('skill')}
            />
            <TypeButton
              label="General Strategy"
              icon="bulb-outline"
              selected={practiceType === 'strategy'}
              onPress={() => changePracticeType('strategy')}
            />
          </View>

          <Text style={styles.label}>{practiceType === 'skill' ? 'Skill' : 'Strategy'}</Text>
          <Pressable style={styles.inputBox} onPress={() => setShowItems(!showItems)}>
            <Text style={[styles.inputText, !selectedItem && styles.placeholder]}>
              {selectedItem?.title ||
                (practiceType === 'skill' ? 'Select a skill' : 'Select a strategy')}
            </Text>
            <Ionicons name={showItems ? 'chevron-up' : 'chevron-down'} size={22} color="#69778A" />
          </Pressable>

          {showItems && (
            <View style={styles.dropdown}>
              {choices.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedItem(item);
                    setShowItems(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{item.title}</Text>
                  {!!item.tagline && practiceType === 'strategy' && (
                    <Text style={styles.dropdownSub}>{item.tagline}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.label}>Practice activity (optional)</Text>
          <TextInput
            style={styles.shortInput}
            value={practiceActivity}
            onChangeText={setPracticeActivity}
            placeholder={
              practiceType === 'strategy'
                ? 'e.g., finger-tracing breathing, grounding, meditation'
                : 'e.g., brushing teeth, getting dressed'
            }
            placeholderTextColor="#8A95A5"
            maxLength={120}
          />

          <Text style={styles.label}>How did it go? (optional)</Text>
          <View style={styles.ratingRow}>
            {ratings.map((rating) => {
              const selected = selectedRating === rating.label;
              return (
                <Pressable
                  key={rating.label}
                  style={[styles.ratingButton, selected && styles.ratingSelected]}
                  onPress={() => setSelectedRating(selected ? '' : rating.label)}
                >
                  <Text style={styles.emoji}>{rating.emoji}</Text>
                  <Text style={styles.ratingText}>{rating.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <RecordField
            label="What went well?"
            placeholder="What worked? What was completed independently?"
            value={whatWentWell}
            onChangeText={setWhatWentWell}
          />
          <RecordField
            label="What was difficult?"
            placeholder="Which step was hard? What got in the way?"
            value={whatWasDifficult}
            onChangeText={setWhatWasDifficult}
          />
          <RecordField
            label="Adjustment for next time"
            placeholder="What could help? Change the order, cue, material, environment, or support."
            value={adjustment}
            onChangeText={setAdjustment}
          />

          <Text style={styles.progressTitle}>Optional progress details</Text>
          <RecordField
            label="Independent steps"
            placeholder="What can the learner do on their own?"
            value={independentSteps}
            onChangeText={setIndependentSteps}
            compact
          />
          <RecordField
            label="Support needed"
            placeholder="What kind of help is still useful?"
            value={supportNeeded}
            onChangeText={setSupportNeeded}
            compact
          />
          <RecordField
            label="Changes over time"
            placeholder="What is getting easier or changing?"
            value={changesOverTime}
            onChangeText={setChangesOverTime}
            compact
          />

          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveLog}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Practice Record</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.recentTitle}>Recent Practice Records</Text>

        {loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="large" />
            <Text style={styles.emptyText}>Loading practice records...</Text>
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="clipboard-outline" size={34} color="#9AA7B5" />
            <Text style={styles.emptyTitle}>No practice records yet</Text>
            <Text style={styles.emptyText}>Your saved practice records will appear here.</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logDate}>
                <Text style={styles.logDateText}>{log.date}</Text>
                {!!log.practiceType && (
                  <Text style={styles.logType}>{log.practiceType === 'strategy' ? 'STRATEGY' : 'SKILL'}</Text>
                )}
              </View>

              <View style={styles.logDetails}>
                <Text style={styles.logSkill}>{log.practiceItemTitle || log.skill || 'Practice'}</Text>
                {!!log.practiceActivity && <Text style={styles.logActivity}>{log.practiceActivity}</Text>}
                {!!log.rating && (
                  <Text style={styles.logRating}>
                    {ratings.find((r) => r.label === log.rating)?.emoji} {log.rating}
                  </Text>
                )}

                {!!(log.whatWentWell || log.whatWasDifficult || log.adjustment) ? (
                  <>
                    {!!log.whatWentWell && <LogNote label="Went well" value={log.whatWentWell} />}
                    {!!log.whatWasDifficult && <LogNote label="Difficult" value={log.whatWasDifficult} />}
                    {!!log.adjustment && <LogNote label="Next adjustment" value={log.adjustment} />}
                  </>
                ) : (
                  <>
                    {!!log.status && <Text style={styles.legacyText}>Status: {log.status}</Text>}
                    {!!log.comments && <Text style={styles.legacyText}>{log.comments}</Text>}
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function TypeButton({ label, icon, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.typeButton, selected && styles.typeButtonSelected]}>
      <Ionicons name={icon} size={21} color={selected ? '#168CE8' : '#69778A'} />
      <Text style={[styles.typeButtonText, selected && styles.typeButtonTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function MiniGuide({ icon, title, text }) {
  return (
    <View style={styles.miniGuide}>
      <Ionicons name={icon} size={22} color="#2B9273" />
      <Text style={styles.miniGuideTitle}>{title}</Text>
      <Text style={styles.miniGuideText}>{text}</Text>
    </View>
  );
}

function RecordField({ label, placeholder, value, onChangeText, compact = false }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.commentBox, compact && styles.compactBox]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A95A5"
        multiline
        maxLength={500}
        textAlignVertical="top"
      />
    </>
  );
}

function LogNote({ label, value }) {
  return (
    <View style={styles.logNote}>
      <Text style={styles.logNoteLabel}>{label}</Text>
      <Text style={styles.logNoteText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#EEF8FF' },
  content: { paddingHorizontal: 16, paddingBottom: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  backButton: { flexDirection: 'row', alignItems: 'center', width: 90 },
  backText: { fontSize: 17, color: '#168CE8', fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#171B34' },
  headerSpacer: { width: 90 },
  headerSubtitle: { textAlign: 'center', fontSize: 15, lineHeight: 21, color: '#7A8495', marginTop: 7, marginBottom: 18 },
  guideCard: { backgroundColor: '#E8F7F2', borderRadius: 22, padding: 18, marginBottom: 16 },
  guideTitle: { fontSize: 20, fontWeight: '800', color: '#17365D' },
  guideText: { fontSize: 14, lineHeight: 20, color: '#526173', marginTop: 5 },
  guideRow: { flexDirection: 'row', gap: 10, marginTop: 15, flexWrap: 'wrap' },
  miniGuide: { flexGrow: 1, flexBasis: 180, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 13 },
  miniGuideTitle: { fontSize: 13, fontWeight: '800', color: '#17213A', marginTop: 6 },
  miniGuideText: { fontSize: 12, lineHeight: 17, color: '#718096', marginTop: 3 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18 },
  sectionTitle: { fontSize: 23, fontWeight: '800', color: '#171B34', marginBottom: 18 },
  label: { fontSize: 16, fontWeight: '600', color: '#171B34', marginBottom: 8, marginTop: 14 },
  progressTitle: { fontSize: 18, fontWeight: '800', color: '#17365D', marginTop: 24, marginBottom: 2 },
  inputBox: { minHeight: 54, borderRadius: 15, backgroundColor: '#F3F7FC', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shortInput: { minHeight: 54, borderRadius: 15, backgroundColor: '#F3F7FC', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#39465A' },
  inputText: { fontSize: 16, color: '#39465A', flex: 1 },
  placeholder: { color: '#8A95A5' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeButton: { flex: 1, minHeight: 54, borderRadius: 15, borderWidth: 2, borderColor: '#E5EBF2', backgroundColor: '#F8FAFC', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 10 },
  typeButtonSelected: { borderColor: '#168CE8', backgroundColor: '#EAF5FF' },
  typeButtonText: { fontSize: 14, fontWeight: '700', color: '#69778A' },
  typeButtonTextSelected: { color: '#168CE8' },
  dropdown: { backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 5, borderWidth: 1, borderColor: '#E1E7EE', overflow: 'hidden' },
  dropdownItem: { paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#EEF1F4' },
  dropdownText: { fontSize: 16, fontWeight: '700', color: '#171B34' },
  dropdownSub: { fontSize: 12, lineHeight: 17, color: '#718096', marginTop: 3 },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 5 },
  ratingButton: { flex: 1, minHeight: 78, backgroundColor: '#F3F7FC', borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: 'transparent' },
  ratingSelected: { borderColor: '#168CE8', backgroundColor: '#EAF5FF' },
  emoji: { fontSize: 25 },
  ratingText: { fontSize: 11, color: '#39465A', marginTop: 5, textAlign: 'center' },
  commentBox: { minHeight: 96, backgroundColor: '#F3F7FC', borderRadius: 15, padding: 14, fontSize: 15, lineHeight: 21, color: '#171B34' },
  compactBox: { minHeight: 76 },
  saveButton: { backgroundColor: '#168CE8', minHeight: 55, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  recentTitle: { fontSize: 23, fontWeight: '800', color: '#171B34', marginTop: 28, marginBottom: 12 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#39465A', marginTop: 10 },
  emptyText: { fontSize: 14, color: '#7A8495', marginTop: 8, textAlign: 'center' },
  logCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row' },
  logDate: { width: 105, borderRightWidth: 1, borderRightColor: '#DCE3EA', justifyContent: 'flex-start', paddingTop: 2 },
  logDateText: { fontSize: 14, fontWeight: '700', color: '#39465A' },
  logType: { marginTop: 7, fontSize: 10, fontWeight: '800', letterSpacing: 0.7, color: '#438A6A' },
  logDetails: { flex: 1, paddingLeft: 16 },
  logSkill: { fontSize: 18, fontWeight: '800', color: '#171B34' },
  logActivity: { fontSize: 13, color: '#526173', marginTop: 3, fontStyle: 'italic' },
  logRating: { fontSize: 15, color: '#2B9A52', fontWeight: '600', marginTop: 5 },
  logNote: { marginTop: 8 },
  logNoteLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, color: '#718096' },
  logNoteText: { fontSize: 14, lineHeight: 19, color: '#39465A', marginTop: 2 },
  legacyText: { fontSize: 14, color: '#69778A', marginTop: 7, lineHeight: 19 },
});
