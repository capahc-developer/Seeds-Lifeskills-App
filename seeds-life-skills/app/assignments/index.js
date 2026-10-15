import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, AccessibilityInfo, Easing, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import ScreenContainer from '../../components/ScreenContainer';
import ValidationBanner from '../../components/ValidationBanner';
import { practiceLogsForCurrentUser } from '../../lib/userData';
import { auth, db } from '../../lib/firebase';


const PURPLE = '#625CF5';
const NAVY = '#152354';
const CREAM = '#FFF9EE';
const OUTCOMES = [
  { label: 'Did it independently', emoji: '😊', tint: '#E3F9E6', border: '#66C97B' },
  { label: 'Some help needed', emoji: '😐', tint: '#FFF3D8', border: '#E9BD5C' },
  { label: 'Hard today', emoji: '😟', tint: '#FFE6E7', border: '#EF999E' },
];
const LEGACY_OUTCOMES = {
  'Very hard': 'Hard today', Hard: 'Hard today', Okay: 'Some help needed',
  Good: 'Did it independently', Great: 'Did it independently',
};
const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dateLabel = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const parseDate = (s) => {
  if (typeof s !== 'string') return new Date();
  const parts = s.split('-').map(Number);
  return parts.length === 3 && parts.every(Number.isFinite)
    ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(s);
};
const getOutcome = (rating) => OUTCOMES.find((x) => x.label === rating)
  || OUTCOMES.find((x) => x.label === LEGACY_OUTCOMES[rating]);

export default function PracticeLogScreen() {
  const { width } = useWindowDimensions();
  const [screen, setScreen] = useState('home');
  const [skills, setSkills] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showSkills, setShowSkills] = useState(false);
  const [selectedDate, setSelectedDate] = useState(localISO(new Date()));
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [outcome, setOutcome] = useState('');
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWasDifficult, setWhatWasDifficult] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Please sign in to view your skills.');

        const [builtInSnapshot, customSnapshot, logSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'skills'), where('active', '==', true))),
          getDocs(collection(db, 'users', user.uid, 'customSkills')),
          getDocs(practiceLogsForCurrentUser()),
        ]);
        if (!active) return;

        // Official skills are managed in Firestore. Keep the historical
        // duplicate hidden, but preserve all previously saved practice logs.
        const builtIn = builtInSnapshot.docs
          .filter((item) => item.id !== 'zip-winter-coat')
          .map((item) => ({ id: item.id, ...item.data(), custom: false }))
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title));
        const custom = customSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data(), custom: true }))
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));

        setSkills([...builtIn, ...custom]);
        setLogs(logSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error('Practice log load failed', e);
        if (active) setError('Could not load practice records. Please try again later.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const resetForm = () => {
    setSelectedSkill(null); setSelectedDate(localISO(new Date()));
    setOutcome(''); setWhatWentWell(''); setWhatWasDifficult('');
    setAdditionalNotes(''); setShowSkills(false); setShowCalendar(false); setError('');
  };
  const openForm = () => { resetForm(); setScreen('form'); };
  const saveLog = async () => {
    if (saving) return;
    if (!selectedSkill || !outcome) {
      setError('Please select a skill and how the practice went.');
      return;
    }
    if (parseDate(selectedDate).getTime() > Date.now()) {
      setError('Please choose today or an earlier date.');
      return;
    }
    try {
      setSaving(true); setError('');
      const newLog = {
        date: dateLabel(parseDate(selectedDate)),
        practiceDate: selectedDate,
        skill: selectedSkill.title,
        skillId: selectedSkill.id,
        rating: outcome,
        practiceFocus: 'Daily skill practice', // Retain compatibility with older Reports views.
        practiceActivity: '',
        whatWentWell: whatWentWell.trim(),
        whatWasDifficult: whatWasDifficult.trim(),
        adjustment: additionalNotes.trim(), // Legacy Reports field.
        additionalNotes: additionalNotes.trim(),
        createdAt: serverTimestamp(),
      };
      const saved = await addDoc(practiceLogsForCurrentUser(), newLog);
      setLogs((prev) => [{ id: saved.id, ...newLog }, ...prev]);
      setScreen('celebration');
    } catch (e) {
      console.error('Practice log save failed', e);
      setError('Your practice could not be saved. Check your connection and try again.');
    } finally { setSaving(false); }
  };

  const contentWidth = Math.min(width - 28, 520);
  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <ScrollView style={styles.page} contentContainerStyle={[styles.content, { width: contentWidth }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
        {screen === 'home' && <>
          <View style={styles.topRow}>
            <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.back}><Ionicons name="chevron-back" size={22} color={PURPLE}/><Text style={styles.backText}>Back</Text></Pressable>
            <Text style={styles.topTitle}>Practice Log</Text><View style={{ width: 65 }}/>
          </View>
          <View style={styles.hero}>
            <Text style={styles.heroArt}>☀️</Text>
            <Text style={styles.heroTitle}>Small steps.{ '\n' }Big growth.</Text>
            <Text style={styles.heroSubtitle}>Thank you for being such a supportive parent. 💛</Text>
            <Text style={styles.gardenArt}>🌷 🌱 🌻 🌿 🌸</Text>
          </View>
          <Pressable style={styles.gardenCard} onPress={() => router.push('/garden')}>
            <View style={styles.gardenHeader}><Text style={styles.cardHeading}>Your Garden</Text><Ionicons name="chevron-forward" size={22} color={NAVY}/></View>
            <Text style={styles.gardenPlants}>🪴 🌱 🌿 🌻 🌷</Text>
            <Text style={styles.gardenCount}>🌱 {logs.length} {logs.length === 1 ? 'seed' : 'seeds'} from practice</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={openForm}><Ionicons name="add" color="white" size={24}/><Text style={styles.primaryText}>Log a Practice</Text></Pressable>
          <View style={styles.sectionRow}><Text style={styles.sectionHeading}>Recent Logs</Text><Pressable onPress={() => router.push('/reports')}><Text style={styles.link}>View all ›</Text></Pressable></View>
          {loading ? <ActivityIndicator color={PURPLE}/> : logs.length === 0 ?
            <Text style={styles.empty}>Your practice records will appear here. Every practice counts. 🌱</Text> :
            logs.slice(0, 5).map((log) => {
              const choice = getOutcome(log.rating);
              return <View style={styles.historyRow} key={log.id}>
                <View style={styles.skillIcon}><Text style={{ fontSize: 24 }}>📝</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.historyTitle}>{log.skill || log.practiceItemTitle || 'Practice'}</Text>
                  <Text style={styles.historyDate}>{log.date || 'Saved practice'}</Text></View>
                <Text style={{ fontSize: 27 }}>{choice?.emoji || '🌱'}</Text>
              </View>;
            })}
          {!!error && <ValidationBanner message={error}/>}
        </>}

        {screen === 'form' && <>
          <View style={styles.topRow}>
            <Pressable style={styles.back} onPress={() => { setScreen('home'); setError(''); }}><Ionicons name="chevron-back" size={23} color={NAVY}/></Pressable>
            <Text style={styles.topTitle}>Log a Practice</Text><View style={{ width: 40 }}/>
          </View>
          <View style={styles.formCard}>
            <ValidationBanner message={error}/>
            <Text style={styles.label}>Date <Text style={styles.required}>*</Text></Text>
            <Pressable style={styles.input} onPress={() => { setCalendarMonth(parseDate(selectedDate)); setShowCalendar((v) => !v); }}>
              <Ionicons name="calendar-outline" size={23} color={NAVY}/>
              <Text style={styles.inputText}>{dateLabel(parseDate(selectedDate))}</Text>
              <Ionicons name={showCalendar ? 'chevron-up' : 'chevron-down'} size={20} color="#63718B"/>
            </Pressable>
            {showCalendar && <CalendarPicker month={calendarMonth} selectedDate={selectedDate}
              onMonthChange={setCalendarMonth} onSelect={(date) => { setSelectedDate(date); setShowCalendar(false); }}/>} 
            <Text style={styles.label}>Skill <Text style={styles.required}>*</Text></Text>
            <Pressable style={styles.input} onPress={() => setShowSkills((v) => !v)}>
              <Text style={styles.skillIconSmall}>🖍️</Text>
              <Text style={[styles.inputText, !selectedSkill && styles.muted]}>{selectedSkill?.title || 'Select a skill'}</Text>
              <Ionicons name="chevron-forward" size={21} color={NAVY}/>
            </Pressable>
            {showSkills && <View style={styles.dropdown}>{skills.length ? skills.map((skill) =>
              <Pressable key={skill.id} style={styles.dropdownItem} onPress={() => { setSelectedSkill(skill); setShowSkills(false); setError(''); }}>
                <Text style={styles.dropdownText}>{skill.title}</Text>
              </Pressable>) : <Text style={styles.empty}>No skills available.</Text>}</View>}
            <Text style={styles.label}>How did it go? <Text style={styles.required}>*</Text></Text>
            <View style={styles.outcomeRow}>{OUTCOMES.map((item) => <Pressable key={item.label}
              accessibilityRole="radio" accessibilityState={{ selected: outcome === item.label }}
              onPress={() => { setOutcome(item.label); setError(''); }}
              style={[styles.outcomeCard, { backgroundColor: item.tint }, outcome === item.label && { borderColor: item.border, borderWidth: 3 }]}>
              <Text style={styles.outcomeEmoji}>{item.emoji}</Text><Text style={styles.outcomeText}>{item.label}</Text>
            </Pressable>)}</View>
            <NoteField label="What went well? (optional)" value={whatWentWell} onChangeText={setWhatWentWell}
              placeholder="e.g. Followed the steps, stayed calm, finished brushing!"/>
            <NoteField label="What was difficult? (optional)" value={whatWasDifficult} onChangeText={setWhatWasDifficult}
              placeholder="e.g. Needed reminders, was distracted, didn't want to start..."/>
            <NoteField label="Additional notes or questions (optional)" value={additionalNotes} onChangeText={setAdditionalNotes}
              placeholder="e.g. Tried a new visual, ask about next step, anything else..."/>
            <Pressable style={[styles.primaryButton, saving && { opacity: 0.55 }]} disabled={saving} onPress={saveLog}>
              {saving ? <ActivityIndicator color="white"/> : <Text style={styles.primaryText}>Save Log</Text>}
            </Pressable>
          </View>
        </>}

        {screen === 'celebration' && <View style={styles.celebration}>
          <CelebrationEffects reducedMotion={reduceMotion} />
          <Text style={styles.confetti}>🎊 ✨ 🎉 ✨ 🎊</Text>
          <BouncingOtter reducedMotion={reduceMotion} />
          <Text style={styles.celebrateTitle}>You logged it!</Text>
          <Text style={styles.celebrateSubtitle}>Thank you for taking the time to support your child. 💛</Text>
          <View style={styles.messageCard}><Text style={styles.quote}>“Every step you take creates opportunities for growth!”</Text></View>
          <View style={styles.seedCard}><Text style={{ fontSize: 46 }}>🌱</Text><View><Text style={styles.seedTitle}>+1 seed</Text><Text style={styles.seedSub}>added to your garden</Text></View></View>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/garden')}><Text style={styles.primaryText}>View Garden</Text></Pressable>
          <Pressable style={styles.textButton} onPress={openForm}><Text style={styles.link}>Log Another Practice</Text></Pressable>
          <Pressable style={styles.textButton} onPress={() => setScreen('home')}><Text style={styles.smallLink}>Back to Practice Log</Text></Pressable>
        </View>}
      </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}


// Animations are decorative only. They never trigger writes or alter practice data.
const PARTICLE_COLORS = ['#F9B73B', '#625CF5', '#F47C98', '#44BE84', '#3EA9F5', '#FF8060'];
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  x: ((i * 37 + 11) % 97) / 100,
  delay: (i * 113) % 950,
  duration: 1850 + ((i * 73) % 900),
  color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  rotate: (i * 41) % 360,
}));

function BouncingOtter({ reducedMotion }) {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion) { bounce.setValue(0); return; }
    bounce.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(bounce, { toValue: -25, duration: 230, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 0, friction: 4, tension: 100, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: -13, duration: 190, useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 0, friction: 5, tension: 90, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [bounce, reducedMotion]);
  return <Animated.Text accessible accessibilityLabel="Happy otter" style={[styles.otter, { transform: [{ translateY: bounce }] }]}>🦦</Animated.Text>;
}

function CelebrationEffects({ reducedMotion }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    if (reducedMotion) return;
    const animation = Animated.timing(progress, {
      toValue: 1, duration: 4500, easing: Easing.linear, useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion]);
  if (reducedMotion) return null;
  return <View pointerEvents="none" accessible={false} style={styles.effectOverlay}>
    {CONFETTI.map((piece) => {
      const start = piece.delay / 4500;
      const end = Math.min(1, (piece.delay + piece.duration) / 4500);
      const translateY = progress.interpolate({ inputRange: [0, start, end, 1].sort((a,b)=>a-b), outputRange: [-50, -50, 700, 700] });
      const opacity = progress.interpolate({ inputRange: [0, start, Math.min(1, start + 0.02), end, 1].sort((a,b)=>a-b), outputRange: [0, 0, 1, 1, 0] });
      return <Animated.View key={piece.id} style={{ position: 'absolute', left: `${piece.x * 100}%`, top: 0,
        width: piece.id % 3 === 0 ? 7 : 10, height: piece.id % 3 === 0 ? 17 : 9,
        borderRadius: 3, backgroundColor: piece.color, opacity,
        transform: [{ translateY }, { rotate: `${piece.rotate}deg` }] }} />;
    })}
    {[0, 1].map((burst) => {
      const t = progress.interpolate({ inputRange: [0, 0.08 + burst * 0.12, 0.36 + burst * 0.12, 1], outputRange: [0, 0, 1, 1] });
      const fade = progress.interpolate({ inputRange: [0, 0.08 + burst * 0.12, 0.15 + burst * 0.12, 0.36 + burst * 0.12, 1], outputRange: [0, 0, 1, 0, 0] });
      return Array.from({ length: 12 }, (_, i) => {
        const angle = i * Math.PI / 6;
        const radius = 48 + (i % 3) * 10;
        return <Animated.View key={`${burst}-${i}`} style={{ position: 'absolute',
          left: burst ? '77%' : '21%', top: burst ? 110 : 85,
          width: 7, height: 13, borderRadius: 4,
          backgroundColor: PARTICLE_COLORS[(i + burst) % PARTICLE_COLORS.length],
          opacity: fade, transform: [
            { translateX: Animated.multiply(t, Math.cos(angle) * radius) },
            { translateY: Animated.multiply(t, Math.sin(angle) * radius) },
            { rotate: `${i * 30}deg` },
          ] }} />;
      });
    })}
  </View>;
}

function NoteField({ label, placeholder, value, onChangeText }) {
  return <View><Text style={styles.label}>{label}</Text><TextInput multiline
    style={styles.notes} placeholder={placeholder} placeholderTextColor="#94A0B5"
    value={value} onChangeText={onChangeText} maxLength={500} textAlignVertical="top"/></View>;
}

function CalendarPicker({ month, selectedDate, onMonthChange, onSelect }) {
  const year = month.getFullYear(), index = month.getMonth();
  const first = new Date(year, index, 1).getDay();
  const days = new Date(year, index + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return <View style={styles.calendar}>
    <View style={styles.calendarHeader}>
      <Pressable onPress={() => onMonthChange(new Date(year, index - 1, 1))}><Ionicons name="chevron-back" size={22} color={PURPLE}/></Pressable>
      <Text style={styles.calendarTitle}>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
      <Pressable onPress={() => onMonthChange(new Date(year, index + 1, 1))}><Ionicons name="chevron-forward" size={22} color={PURPLE}/></Pressable>
    </View>
    <View style={styles.calendarGrid}>{['S','M','T','W','T','F','S'].map((d,i) => <Text key={i} style={styles.weekday}>{d}</Text>)}
      {cells.map((day,i) => {
        const date = day ? localISO(new Date(year,index,day)) : '';
        const disabled = day && new Date(year,index,day).getTime() > Date.now();
        return <Pressable key={i} disabled={!day || disabled} onPress={() => onSelect(date)}
          style={[styles.calendarDay, date === selectedDate && { backgroundColor: PURPLE }]}>
          <Text style={[styles.calendarDayText, disabled && { opacity: .25 }, date === selectedDate && { color: 'white' }]}>{day || ''}</Text>
        </Pressable>;
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: CREAM },
  content: { alignSelf: 'center', paddingTop: 12, paddingBottom: 180 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, marginBottom: 12 },
  back: { width: 65, flexDirection: 'row', alignItems: 'center' }, backText: { color: PURPLE, fontWeight: '600' },
  topTitle: { fontSize: 21, fontWeight: '800', color: NAVY },
  hero: { borderRadius: 26, backgroundColor: '#E8F8F1', padding: 20, alignItems: 'center', marginBottom: 14 },
  heroArt: { fontSize: 72 }, heroTitle: { fontSize: 27, fontWeight: '900', color: NAVY, textAlign: 'center', lineHeight: 32 },
  heroSubtitle: { fontSize: 15, lineHeight: 22, color: NAVY, textAlign: 'center', marginTop: 10, maxWidth: 260 },
  gardenArt: { fontSize: 34, marginTop: 14 },
  gardenCard: { backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#F0E7D8' },
  gardenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeading: { color: NAVY, fontWeight: '800', fontSize: 19 },
  gardenPlants: { fontSize: 35, textAlign: 'center', marginTop: 14 },
  gardenCount: { color: NAVY, fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  primaryButton: { minHeight: 56, backgroundColor: PURPLE, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 14 },
  primaryText: { fontSize: 18, fontWeight: '800', color: 'white' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 12 },
  sectionHeading: { fontSize: 20, color: NAVY, fontWeight: '800' }, link: { fontSize: 15, color: PURPLE, fontWeight: '800' },
  empty: { color: '#6B7890', fontSize: 14, textAlign: 'center', padding: 18 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', padding: 13, borderRadius: 16, marginBottom: 9 },
  skillIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center' },
  historyTitle: { fontSize: 16, fontWeight: '800', color: NAVY }, historyDate: { fontSize: 13, color: '#7A859C', marginTop: 3 },
  formCard: { backgroundColor: '#FFFCF6', borderRadius: 23, padding: 14, borderWidth: 1, borderColor: '#F1E8DC' },
  label: { color: NAVY, fontSize: 15, fontWeight: '800', marginTop: 16, marginBottom: 8 }, required: { color: '#D64040' },
  input: { minHeight: 54, borderWidth: 1, borderColor: '#DCE3EE', backgroundColor: 'white', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12 },
  inputText: { fontSize: 16, fontWeight: '600', color: NAVY, flex: 1 }, muted: { color: '#8390A6' }, skillIconSmall: { fontSize: 24 },
  dropdown: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#DCE3EE', marginTop: 5, overflow: 'hidden' },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F1F4' }, dropdownText: { fontSize: 15, color: NAVY },
  outcomeRow: { flexDirection: 'row', gap: 7 },
  outcomeCard: { flex: 1, borderRadius: 13, minHeight: 110, padding: 7, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  outcomeEmoji: { fontSize: 30 }, outcomeText: { color: NAVY, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  notes: { backgroundColor: 'white', borderWidth: 1, borderColor: '#DFE4EF', borderRadius: 12, minHeight: 78, padding: 12, fontSize: 15, color: NAVY },
  effectOverlay: { position: 'absolute', left: 0, right: 0, top: 0, height: 700, overflow: 'hidden', zIndex: 5 },
  celebration: { paddingTop: 38, alignItems: 'center' }, confetti: { fontSize: 28, textAlign: 'center' }, otter: { fontSize: 110, marginTop: 12 },
  celebrateTitle: { fontSize: 32, fontWeight: '900', color: NAVY, marginTop: 15 },
  celebrateSubtitle: { fontSize: 19, color: NAVY, textAlign: 'center', lineHeight: 27, marginTop: 10 },
  messageCard: { backgroundColor: 'white', borderRadius: 17, padding: 23, marginTop: 25, width: '100%' },
  quote: { fontSize: 19, lineHeight: 27, textAlign: 'center', color: NAVY },
  seedCard: { width: '100%', borderRadius: 16, backgroundColor: 'white', padding: 18, flexDirection: 'row', gap: 14, justifyContent: 'center', alignItems: 'center', marginTop: 13 },
  seedTitle: { fontSize: 23, fontWeight: '900', color: NAVY }, seedSub: { fontSize: 16, color: NAVY },
  textButton: { padding: 16 }, smallLink: { fontSize: 14, color: '#77849D', fontWeight: '700' },
  calendar: { borderRadius: 14, padding: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#DFE4EF', marginTop: 6 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calendarTitle: { fontSize: 15, color: NAVY, fontWeight: '800' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, weekday: { width: '14.2857%', textAlign: 'center', color: '#79869C', fontWeight: '700', paddingVertical: 6 },
  calendarDay: { width: '14.2857%', height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  calendarDayText: { fontSize: 14, color: NAVY },
});
