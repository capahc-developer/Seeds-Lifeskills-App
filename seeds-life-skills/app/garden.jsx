import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { getDocs, orderBy, query } from 'firebase/firestore';
import { practiceLogsForCurrentUser } from '../lib/userData';

export default function GardenScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const snapshot = await getDocs(query(practiceLogsForCurrentUser(), orderBy('createdAt', 'desc')));
        if (mounted) setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error('Error loading garden:', e);
        if (mounted) setError('Your garden could not load. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []));
  const count = logs.length;
  const seedlings = Math.min(count, 8);
  const flowers = Math.min(Math.floor(count / 5), 8);
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={27} color="#3B7851" />
        </Pressable>
        <Text style={s.title}>🌷 My Garden</Text>
        <View style={{ width: 27 }} />
      </View>
      <Text style={s.subtitle}>Every time you practice, a seed is planted.</Text>
      {loading ? <ActivityIndicator size="large" color="#4B9E65" /> : error ? <Text style={s.error}>{error}</Text> : (
        <>
          <View style={s.garden}>
            <Text style={s.sun}>☀️    🦋    ☁️</Text>
            <Text style={s.plants}>{count ? '🌱'.repeat(seedlings) : '🌾'}</Text>
            {!!flowers && <Text style={s.plants}>{'🌻'.repeat(flowers)}</Text>}
            <Text style={s.ground}>━━━━━━━━━━━━━━━━━━</Text>
            <Text style={s.seedCount}>{count} {count === 1 ? 'seed' : 'seeds'} planted</Text>
            <Text style={s.note}>{count ? 'Every practice counts, including the hard days.' : 'Your garden is ready for its first seed!'}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.section}>🌿 Growing Together</Text>
            <Text style={s.body}>Each saved practice record adds one seed. Your garden includes all your saved practices and never resets.</Text>
          </View>
          <Pressable style={s.button} onPress={() => router.push('/assignments')}>
            <Text style={s.buttonText}>🌱 Log a Practice</Text>
          </Pressable>
          <Pressable style={s.link} onPress={() => router.push('/reports')}>
            <Text style={s.linkText}>View Reports →</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F1F8EF' },
  content: { padding: 20, paddingTop: 55, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 25, fontWeight: '800', color: '#346C48' },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#65816B', marginTop: 20, marginBottom: 24 },
  garden: { backgroundColor: '#E0F3DE', borderRadius: 28, padding: 24, alignItems: 'center', minHeight: 280 },
  sun: { fontSize: 34, marginBottom: 22 },
  plants: { fontSize: 28, textAlign: 'center', lineHeight: 47 },
  ground: { fontSize: 17, color: '#8AB780', marginTop: 14 },
  seedCount: { fontSize: 26, fontWeight: '800', color: '#34764C', marginTop: 20 },
  note: { color: '#5D7D64', fontSize: 14, textAlign: 'center', marginTop: 10 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginTop: 20 },
  section: { fontSize: 19, fontWeight: '800', color: '#346C48' },
  body: { fontSize: 15, color: '#687C6B', lineHeight: 23, marginTop: 9 },
  button: { backgroundColor: '#48A46D', borderRadius: 22, padding: 17, alignItems: 'center', marginTop: 24 },
  buttonText: { fontSize: 17, fontWeight: '800', color: 'white' },
  link: { alignItems: 'center', padding: 18 },
  linkText: { color: '#34764C', fontSize: 16, fontWeight: '700' },
  error: { color: '#B42318', marginTop: 20 }
});
