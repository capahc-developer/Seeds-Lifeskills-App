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
import ValidationBanner from '../../components/ValidationBanner';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { practiceLogsForCurrentUser } from '../../lib/userData';
import { db } from '../../lib/firebase';

const ratings = [
  { label: 'Very hard', emoji: '😣' },
  { label: 'Hard', emoji: '☹️' },
  { label: 'Okay', emoji: '😐' },
  { label: 'Good', emoji: '🙂' },
  { label: 'Great', emoji: '😄' },
];

const practiceFocusOptions = [
  'Daily skill practice',
  'Relaxation / calming',
  'Communication',
  'Visual support',
  'Prompting / reminders',
  'Motivation / reinforcement',
  'Other',
];

export default function PracticeLogScreen() {
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [practiceFocus, setPracticeFocus] = useState('Daily skill practice');
  const [practiceActivity, setPracticeActivity] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWasDifficult, setWhatWasDifficult] = useState('');
  const [adjustment, setAdjustment] = useState('');

  const [showSkills, setShowSkills] = useState(false);
  const [showFocus, setShowFocus] = useState(false);
  const [skills, setSkills] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [skillsSnapshot, logsSnapshot] = await Promise.all([
          getDocs(collection(db, 'skills')),
          getDocs(query(practiceLogsForCurrentUser(), orderBy('createdAt', 'desc'))),
        ]);

        const loadedSkills = skillsSnapshot.docs
          .map((skillDoc) => ({ id: skillDoc.id, ...skillDoc.data() }))
          .filter((skill) => skill.active !== false)
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

        setSkills(loadedSkills);
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

  const clearFieldError = (key) => {
    setFieldErrors((current) => ({ ...current, [key]: false }));
    setValidationError('');
  };

  const saveLog = async () => {
    const errors = {};
    const notesComplete =
      whatWentWell.trim() ||
      whatWasDifficult.trim() ||
      adjustment.trim();

    if (!selectedSkill) errors.skill = true;
    if (!notesComplete) errors.notes = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setValidationError(
        'Practice record is incomplete. Select a skill and add at least one practice note before saving.'
      );
      return;
    }

    setValidationError('');
    setFieldErrors({});

    try {
      setSaving(true);

      const newLog = {
        date: today,
        skill: selectedSkill.title,
        skillId: selectedSkill.id,
        practiceFocus,
        practiceActivity: practiceActivity.trim(),
        rating: selectedRating,
        whatWentWell: whatWentWell.trim(),
        whatWasDifficult: whatWasDifficult.trim(),
        adjustment: adjustment.trim(),
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(practiceLogsForCurrentUser(), newLog);
      setLogs((current) => [{ id: docRef.id, ...newLog }, ...current]);

      setSelectedSkill(null);
      setPracticeFocus('Daily skill practice');
      setPracticeActivity('');
      setSelectedRating('');
      setWhatWentWell('');
      setWhatWasDifficult('');
      setAdjustment('');
      setShowSkills(false);
      setShowFocus(false);

      Alert.alert('Saved', 'Practice record saved successfully.');
    } catch (error) {
      console.error('Error saving practice log:', error);
      setValidationError('The practice record could not be saved. Please check your connection and try again.');
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
          Keep a simple record of what worked, what was difficult, and what to try next.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Add a Practice Record</Text>

          <ValidationBanner message={validationError} />

          <Text style={styles.label}>Date</Text>
          <View style={styles.inputBox}>
            <Text style={styles.inputText}>{today}</Text>
            <Ionicons name="calendar-outline" size={22} color="#69778A" />
          </View>

          <Text style={styles.label}>Skill <Text style={styles.required}>*</Text></Text>
          <Pressable
            style={[styles.inputBox, fieldErrors.skill && styles.fieldError]}
            onPress={() => {
              clearFieldError('skill');
              setShowSkills(!showSkills);
            }}
          >
            <Text style={[styles.inputText, !selectedSkill && styles.placeholder]}>
              {selectedSkill?.title || 'Select a skill'}
            </Text>
            <Ionicons
              name={showSkills ? 'chevron-up' : 'chevron-down'}
              size={22}
              color={fieldErrors.skill ? '#B42318' : '#69778A'}
            />
          </Pressable>
          {fieldErrors.skill && (
            <Text style={styles.fieldErrorText}>Please select the skill that was practiced.</Text>
          )}

          {showSkills && (
            <View style={styles.dropdown}>
              {skills.map((skill) => (
                <Pressable
                  key={skill.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedSkill(skill);
                    setShowSkills(false);
                    clearFieldError('skill');
                  }}
                >
                  <Text style={styles.dropdownText}>{skill.title}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.label}>Practice focus</Text>
          <Pressable style={styles.inputBox} onPress={() => setShowFocus(!showFocus)}>
            <Text style={styles.inputText}>{practiceFocus}</Text>
            <Ionicons
              name={showFocus ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#69778A"
            />
          </Pressable>

          {showFocus && (
            <View style={styles.dropdown}>
              {practiceFocusOptions.map((option) => (
                <Pressable
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setPracticeFocus(option);
                    setShowFocus(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{option}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.label}>Practice activity (optional)</Text>
          <TextInput
            style={styles.shortInput}
            value={practiceActivity}
            onChangeText={setPracticeActivity}
            placeholder="e.g., finger-tracing breathing, meditation, brushing teeth"
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

          <Text style={styles.noteRequirement}>
            Add at least one note below. <Text style={styles.required}>*</Text>
          </Text>

          <RecordField
            label="What went well?"
            placeholder="What worked? What was completed successfully?"
            value={whatWentWell}
            onChangeText={(value) => {
              setWhatWentWell(value);
              if (value.trim()) clearFieldError('notes');
            }}
            hasError={fieldErrors.notes}
          />

          <RecordField
            label="What was difficult?"
            placeholder="What was hard? What got in the way?"
            value={whatWasDifficult}
            onChangeText={(value) => {
              setWhatWasDifficult(value);
              if (value.trim()) clearFieldError('notes');
            }}
            hasError={fieldErrors.notes}
          />

          <RecordField
            label="Adjustment for next time"
            placeholder="What could help next time?"
            value={adjustment}
            onChangeText={(value) => {
              setAdjustment(value);
              if (value.trim()) clearFieldError('notes');
            }}
            hasError={fieldErrors.notes}
          />

          {fieldErrors.notes && (
            <Text style={styles.fieldErrorText}>
              Add something that went well, something difficult, or an adjustment for next time.
            </Text>
          )}

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
              </View>

              <View style={styles.logDetails}>
                <Text style={styles.logSkill}>{log.skill || log.practiceItemTitle || 'Practice'}</Text>

                {!!log.practiceFocus && <Text style={styles.logFocus}>{log.practiceFocus}</Text>}
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

function RecordField({ label, placeholder, value, onChangeText, hasError }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.commentBox, hasError && styles.fieldError]}
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
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18 },
  sectionTitle: { fontSize: 23, fontWeight: '800', color: '#171B34', marginBottom: 18 },
  label: { fontSize: 16, fontWeight: '600', color: '#171B34', marginBottom: 8, marginTop: 14 },
  required: { color: '#B42318' },
  noteRequirement: { marginTop: 18, marginBottom: 2, fontSize: 13, color: '#69778A', fontWeight: '600' },
  inputBox: { minHeight: 54, borderRadius: 15, backgroundColor: '#F3F7FC', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: 'transparent' },
  shortInput: { minHeight: 54, borderRadius: 15, backgroundColor: '#F3F7FC', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#39465A' },
  inputText: { fontSize: 16, color: '#39465A', flex: 1 },
  placeholder: { color: '#8A95A5' },
  fieldError: { borderColor: '#D92D20', backgroundColor: '#FFF8F7' },
  fieldErrorText: { marginTop: 6, color: '#B42318', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  dropdown: { backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 5, borderWidth: 1, borderColor: '#E1E7EE', overflow: 'hidden' },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#EEF1F4' },
  dropdownText: { fontSize: 16, color: '#171B34' },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 5 },
  ratingButton: { flex: 1, minHeight: 78, backgroundColor: '#F3F7FC', borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: 'transparent' },
  ratingSelected: { borderColor: '#168CE8', backgroundColor: '#EAF5FF' },
  emoji: { fontSize: 25 },
  ratingText: { fontSize: 11, color: '#39465A', marginTop: 5, textAlign: 'center' },
  commentBox: { minHeight: 92, backgroundColor: '#F3F7FC', borderRadius: 15, padding: 14, fontSize: 15, lineHeight: 21, color: '#171B34', borderWidth: 1.5, borderColor: 'transparent' },
  saveButton: { backgroundColor: '#168CE8', minHeight: 55, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  recentTitle: { fontSize: 23, fontWeight: '800', color: '#171B34', marginTop: 28, marginBottom: 12 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#39465A', marginTop: 10 },
  emptyText: { fontSize: 14, color: '#7A8495', marginTop: 8, textAlign: 'center' },
  logCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row' },
  logDate: { width: 95, borderRightWidth: 1, borderRightColor: '#DCE3EA', justifyContent: 'flex-start', paddingTop: 2 },
  logDateText: { fontSize: 14, fontWeight: '700', color: '#39465A' },
  logDetails: { flex: 1, paddingLeft: 16 },
  logSkill: { fontSize: 18, fontWeight: '800', color: '#171B34' },
  logFocus: { fontSize: 12, color: '#438A6A', fontWeight: '800', marginTop: 4 },
  logActivity: { fontSize: 13, color: '#526173', marginTop: 3, fontStyle: 'italic' },
  logRating: { fontSize: 15, color: '#2B9A52', fontWeight: '600', marginTop: 5 },
  logNote: { marginTop: 8 },
  logNoteLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, color: '#718096' },
  logNoteText: { fontSize: 14, lineHeight: 19, color: '#39465A', marginTop: 2 },
  legacyText: { fontSize: 14, color: '#69778A', marginTop: 7, lineHeight: 19 },
});
