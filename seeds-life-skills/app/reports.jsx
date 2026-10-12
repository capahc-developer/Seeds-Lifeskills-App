import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { practiceLogsForCurrentUser } from '../lib/userData';

const NAVY = '#14245B';
const PURPLE = '#605BFA';

const outcomeInfo = {
  'Did it independently': { emoji: '😊', label: 'Did it independently', color: '#E5F8E8' },
  'Some help needed': { emoji: '😐', label: 'Some help needed', color: '#FFF3D9' },
  'Hard today': { emoji: '😟', label: 'Hard today', color: '#FFE8E8' },
  // Old entries are kept readable; these are not new rating choices.
  Great: { emoji: '😄', label: 'Great', color: '#E5F8E8' },
  Good: { emoji: '🙂', label: 'Good', color: '#E5F8E8' },
  Okay: { emoji: '😐', label: 'Okay', color: '#FFF3D9' },
  Hard: { emoji: '☹️', label: 'Hard', color: '#FFE8E8' },
  'Very hard': { emoji: '😣', label: 'Very hard', color: '#FFE8E8' },
};

function formatDate(log) {
  if (typeof log.date === 'string' && log.date.trim()) return log.date;
  const date = log.createdAt?.toDate?.();
  return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not available';
}

function LogNote({ label, value }) {
  if (!value || !String(value).trim()) return null;
  return (
    <View style={styles.note}>
      <Text style={styles.noteLabel}>{label}</Text>
      <Text style={styles.noteValue}>{String(value)}</Text>
    </View>
  );
}

export default function Reports() {
  const [logs, setLogs] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [expandedLog, setExpandedLog] = useState(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('Please sign in to view reports.');
        const [logsSnapshot, gardenSnapshot] = await Promise.all([
          getDocs(query(practiceLogsForCurrentUser(), orderBy('createdAt', 'desc'))),
          getDoc(doc(db, 'users', uid, 'garden', 'state')),
        ]);
        if (!active) return;
        setLogs(logsSnapshot.docs.map(item => ({ id: item.id, ...item.data() })));
        const garden = gardenSnapshot.exists() ? gardenSnapshot.data() : {};
        setPlants(Array.isArray(garden.plants) ? garden.plants : []);
      } catch (e) {
        console.error('Error loading reports:', e);
        if (active) setError('Unable to load your practice history. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []));

  const skills = useMemo(() => {
    const bySkill = new Map();
    logs.forEach(log => {
      const key = log.skillId || log.skill || log.practiceItemTitle || 'Other practice';
      const item = bySkill.get(key) || {
        id: log.skillId || null,
        name: log.skill || log.practiceItemTitle || 'Other practice',
        count: 0,
      };
      item.count += 1;
      bySkill.set(key, item);
    });
    return Array.from(bySkill.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [logs]);

  const visibleLogs = showAllHistory ? logs : logs.slice(0, 6);
  const availableSeeds = Math.max(0, logs.length - plants.length);
  const waterUsed = plants.reduce((sum, plant) => sum + Math.min(3, Math.max(0, Number(plant.stage) || 0)), 0);
  const availableWater = Math.max(0, logs.length - waterUsed);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={styles.back}>
          <Ionicons name="chevron-back" size={23} color={PURPLE} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Reports</Text>
        <View style={styles.back} />
      </View>
      <Text style={styles.subtitle}>A record of the time and care you've put into practicing together. 💛</Text>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={PURPLE} /><Text style={styles.muted}>Loading your practice history...</Text></View>
      ) : error ? (
        <View style={styles.card}><Text style={styles.error}>{error}</Text></View>
      ) : (
        <View style={styles.column}>
          <View style={styles.gardenCard}>
            <Text style={styles.gardenArt}>🌻  🌱  🌷  🌿</Text>
            <Text style={styles.gardenTitle}>Your Garden</Text>
            <Text style={styles.gardenMessage}>Every practice adds something to your garden.</Text>
            <View style={styles.gardenStats}>
              <View style={styles.gardenStat}><Text style={styles.statNumber}>{logs.length}</Text><Text style={styles.statLabel}>Seeds earned</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.gardenStat}><Text style={styles.statNumber}>{plants.length}</Text><Text style={styles.statLabel}>Plants growing</Text></View>
            </View>
            <Text style={styles.gardenBalance}>{availableSeeds} seeds ready to plant  ·  {availableWater} watering credits</Text>
            <Pressable style={styles.primaryButton} onPress={() => router.push('/garden')}>
              <Text style={styles.primaryButtonText}>Visit Your Garden</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>🌱 Skills You've Practiced</Text><Text style={styles.count}>{skills.length} skills</Text></View>
            {skills.length === 0 ? <Text style={styles.muted}>Your practiced skills will appear here after your first log.</Text> : skills.map(skill => (
              <Pressable key={skill.id || skill.name} style={styles.skillRow} onPress={() => skill.id && router.push(`/reports/${encodeURIComponent(skill.id)}`)} disabled={!skill.id}>
                <View style={styles.skillIcon}><Text style={styles.skillEmoji}>🌼</Text></View>
                <View style={styles.flex}><Text style={styles.skillName}>{skill.name}</Text><Text style={styles.muted}>{skill.count} practice {skill.count === 1 ? 'log' : 'logs'}</Text></View>
                {skill.id ? <Ionicons name="chevron-forward" size={19} color="#8390A7" /> : null}
              </Pressable>
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>📖 Practice History</Text><Text style={styles.count}>{logs.length} total</Text></View>
            <Text style={styles.sectionSubtitle}>Every entry counts, whether the day was easy or difficult.</Text>
            {logs.length === 0 ? (
              <View style={styles.empty}><Text style={styles.emptyEmoji}>📝</Text><Text style={styles.muted}>No practice logs yet.</Text><Pressable onPress={() => router.push('/assignments')}><Text style={styles.link}>Log your first practice</Text></Pressable></View>
            ) : visibleLogs.map(log => {
              const outcome = outcomeInfo[log.rating] || outcomeInfo[log.outcome] || null;
              const isExpanded = expandedLog === log.id;
              return (
                <View key={log.id} style={styles.historyItem}>
                  <Pressable style={styles.historyTop} onPress={() => setExpandedLog(isExpanded ? null : log.id)}>
                    <View style={styles.historyIcon}><Text style={styles.skillEmoji}>📝</Text></View>
                    <View style={styles.flex}><Text style={styles.skillName}>{log.skill || log.practiceItemTitle || 'Practice'}</Text><Text style={styles.muted}>{formatDate(log)}</Text></View>
                    {outcome ? <View style={[styles.outcomeChip, { backgroundColor: outcome.color }]}><Text style={styles.outcomeEmoji}>{outcome.emoji}</Text></View> : null}
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#8290A7" />
                  </Pressable>
                  {isExpanded ? (
                    <View style={styles.historyDetails}>
                      {outcome ? <Text style={styles.outcomeText}>How it went: {outcome.emoji} {outcome.label}</Text> : null}
                      <LogNote label="What went well" value={log.whatWentWell} />
                      <LogNote label="What was difficult" value={log.whatWasDifficult} />
                      <LogNote label="Additional notes or questions" value={log.additionalNotes || log.additionalNotesOrQuestions || log.adjustment} />
                      <LogNote label="Practice activity" value={log.practiceActivity} />
                      <LogNote label="Comments" value={log.comments} />
                    </View>
                  ) : null}
                </View>
              );
            })}
            {logs.length > 6 ? <Pressable style={styles.showMore} onPress={() => setShowAllHistory(!showAllHistory)}><Text style={styles.link}>{showAllHistory ? 'Show less' : `View all ${logs.length} logs`}</Text><Ionicons name={showAllHistory ? 'chevron-up' : 'chevron-down'} size={16} color={PURPLE} /></Pressable> : null}
          </View>
          <Text style={styles.footer}>Your garden never resets when you take a break. 💚</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF9F0' },
  content: { paddingHorizontal: 16, paddingBottom: 50, alignItems: 'center' },
  column: { width: '100%', maxWidth: 760, gap: 18 },
  header: { width: '100%', maxWidth: 760, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 22 },
  back: { width: 75, flexDirection: 'row', alignItems: 'center' },
  backText: { color: PURPLE, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: NAVY },
  subtitle: { color: '#75819B', textAlign: 'center', fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 24, maxWidth: 520 },
  loading: { padding: 60, alignItems: 'center', gap: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 23, padding: 20, borderWidth: 1, borderColor: '#F0EDE7' },
  gardenCard: { backgroundColor: '#F1F9E8', borderRadius: 25, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: '#E0EECF' },
  gardenArt: { fontSize: 44, marginVertical: 12, textAlign: 'center' },
  gardenTitle: { color: NAVY, fontSize: 24, fontWeight: '800', marginBottom: 8 },
  gardenMessage: { color: '#536E57', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  gardenStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 12, gap: 22 },
  gardenStat: { alignItems: 'center', minWidth: 115 },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#327A4C' },
  statLabel: { fontSize: 13, color: '#56765C', marginTop: 3 },
  statDivider: { width: 1, height: 36, backgroundColor: '#C7DDBE' },
  gardenBalance: { color: '#56765C', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: PURPLE, borderRadius: 16, minHeight: 52, paddingHorizontal: 25, width: '100%', maxWidth: 380 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: NAVY, flexShrink: 1 },
  sectionSubtitle: { color: '#7B8597', fontSize: 13, marginBottom: 14 },
  count: { fontSize: 12, color: '#66836E', fontWeight: '700' },
  skillRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F1F1F1', gap: 12 },
  skillIcon: { width: 43, height: 43, borderRadius: 13, backgroundColor: '#FFF4DE', alignItems: 'center', justifyContent: 'center' },
  skillEmoji: { fontSize: 23 },
  flex: { flex: 1 },
  skillName: { fontSize: 15, fontWeight: '750', color: NAVY, marginBottom: 4 },
  muted: { fontSize: 13, color: '#8490A3', lineHeight: 20 },
  historyItem: { borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  historyTop: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 10 },
  historyIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#EEF1FF', alignItems: 'center', justifyContent: 'center' },
  outcomeChip: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  outcomeEmoji: { fontSize: 21 },
  historyDetails: { paddingHorizontal: 12, paddingBottom: 15, paddingTop: 2, backgroundColor: '#FCFCFF', borderRadius: 12 },
  outcomeText: { fontSize: 14, color: NAVY, marginTop: 10, marginBottom: 4 },
  note: { marginTop: 10 },
  noteLabel: { fontSize: 12, fontWeight: '700', color: '#63728A' },
  noteValue: { fontSize: 14, color: '#36445D', marginTop: 3, lineHeight: 20 },
  showMore: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 18, gap: 8 },
  link: { color: PURPLE, fontWeight: '800', fontSize: 14 },
  empty: { alignItems: 'center', padding: 24, gap: 9 },
  emptyEmoji: { fontSize: 34 },
  footer: { color: '#8B967E', textAlign: 'center', fontSize: 13, marginTop: 2 },
  error: { color: '#B42318', fontSize: 14 },
});
