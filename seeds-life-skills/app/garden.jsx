import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { doc, getDoc, getDocs, orderBy, query, runTransaction } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { practiceLogsForCurrentUser } from '../lib/userData';
import { GardenBackdrop } from '../components/GardenIllustration';
import { FLOWER_TYPES, flowerImageSource } from '../components/GardenFlowerAssets';

const STAGES = [
  { emoji: '🫘', name: 'Seed' },
  { emoji: '🌱', name: 'Sprout' },
  { emoji: '🌿', name: 'Plant' },
  { emoji: '🌻', name: 'Flower' },
];

function gardenRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Please sign in to use your garden.');
  return doc(db, 'users', uid, 'garden', 'state');
}

export default function GardenScreen() {
  const [logsCount, setLogsCount] = useState(0);
  const [garden, setGarden] = useState({ plants: [] });
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFlower, setSelectedFlower] = useState('sunflower');

  const refresh = useCallback(async () => {
    const [logsSnapshot, gardenSnapshot] = await Promise.all([
      getDocs(query(practiceLogsForCurrentUser(), orderBy('createdAt', 'desc'))),
      getDoc(gardenRef()),
    ]);
    const state = gardenSnapshot.exists() ? gardenSnapshot.data() : { plants: [] };
    setLogsCount(logsSnapshot.size);
    setGarden({ plants: Array.isArray(state.plants) ? state.plants : [] });
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      getDocs(query(practiceLogsForCurrentUser(), orderBy('createdAt', 'desc'))),
      getDoc(gardenRef()),
    ]).then(([logsSnapshot, gardenSnapshot]) => {
      if (!active) return;
      const state = gardenSnapshot.exists() ? gardenSnapshot.data() : { plants: [] };
      setLogsCount(logsSnapshot.size);
      setGarden({ plants: Array.isArray(state.plants) ? state.plants : [] });
    }).catch(e => {
      console.error('Error loading garden:', e);
      if (active) setError('Your garden could not load. Please try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  const plants = garden.plants;
  const waterUsed = plants.reduce((total, plant) => total + Math.min(3, Math.max(0, plant.stage || 0)), 0);
  const seedsAvailable = Math.max(0, logsCount - plants.length);
  const waterAvailable = Math.max(0, logsCount - waterUsed);

  const changeGarden = async (action, plantId) => {
    if (working) return;
    setWorking(true);
    setError('');
    setMessage('');
    try {
      // Practice logs are the source of truth: each saved log earns one seed and one water.
      const snapshot = await getDocs(practiceLogsForCurrentUser());
      const earned = snapshot.size;
      await runTransaction(db, async transaction => {
        const ref = gardenRef();
        const current = await transaction.get(ref);
        const savedPlants = current.exists() && Array.isArray(current.data().plants)
          ? current.data().plants : [];
        const spentWater = savedPlants.reduce((sum, p) => sum + Math.min(3, Math.max(0, p.stage || 0)), 0);
        let nextPlants;
        if (action === 'plant') {
          if (savedPlants.length >= earned) throw new Error('No seeds available yet. Log a practice to earn one!');
          nextPlants = [...savedPlants, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, type: FLOWER_TYPES[Math.floor(Math.random() * FLOWER_TYPES.length)],
stage: 0 }];<View style={s.flowerPicker}>
        } else {
          if (spentWater >= earned) throw new Error('No watering credits left. Log a practice to earn one!');
          const target = savedPlants.find(p => p.id === plantId);
          if (!target || target.stage >= 3) throw new Error('This flower is fully grown. Choose another plant!');
          nextPlants = savedPlants.map(p => p.id === plantId ? { ...p, stage: p.stage + 1 } : p);
        }
        transaction.set(ref, { plants: nextPlants, updatedAt: new Date() });
      });
      await refresh();
      setMessage(action === 'plant' ? '🫘 A new seed is planted!' : '💧 Your plant grew!');
    } catch (e) {
      console.error('Garden update failed:', e);
      setError(e.message || 'Could not save your garden. Please try again.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.replace('/')}>
          <Ionicons name="chevron-back" size={27} color="#3B7851" />
        </Pressable>
        <Text style={s.title}>🌷 My Garden</Text>
        <View style={{ width: 27 }} />
      </View>
      <Text style={s.subtitle}>Practice earns seeds and water. Choose what to grow!</Text>
      {loading ? <ActivityIndicator size="large" color="#4B9E65" /> : (
        <>
          <View style={s.balances}>
            <View style={s.balance}><Text style={s.balanceNumber}>🫘 {seedsAvailable}</Text><Text style={s.balanceLabel}>Seeds to plant</Text></View>
            <View style={s.balance}><Text style={s.balanceNumber}>💧 {waterAvailable}</Text><Text style={s.balanceLabel}>Water available</Text></View>
          </View>
          {!!error && <Text style={s.error}>{error}</Text>}
          {!!message && <Text style={s.success}>{message}</Text>}
          <GardenBackdrop>
            {plants.length ? (
              <View style={s.plantGrid}>
                {plants.map((plant, i) => {
                  const stage = STAGES[Math.min(3, Math.max(0, plant.stage || 0))];
                  const canWater = waterAvailable > 0 && plant.stage < 3 && !working;
                  const flowerType = plant.type || FLOWER_TYPES[i % FLOWER_TYPES.length];
                  // Future custom flowers may supply customStages: [seedURL, sproutURL, plantURL, flowerURL].
                  const customURL = Array.isArray(plant.customStages) ? plant.customStages[plant.stage] : null;
                  const imageSource = customURL ? { uri: customURL } : flowerImageSource(flowerType, plant.stage);
                  return (
                    <Pressable key={plant.id} accessibilityRole="button"
                      accessibilityLabel={`Plant ${i + 1}, ${stage.name}. ${canWater ? 'Tap to water' : 'Cannot water now'}`}
                      disabled={!canWater} onPress={() => changeGarden('water', plant.id)}
                      style={[s.illustratedPot, canWater && s.waterable]}>
                      <Image source={imageSource} resizeMode="contain" style={s.flowerArt} />
                      <Text style={s.plantLabel}>{stage.name}</Text>
                      {canWater && <Text style={s.waterHint}>💧 Water me</Text>}
                      {plant.stage >= 3 && <Text style={s.grown}>Fully grown!</Text>}
                    </Pressable>
                  );
                })}
              </View>
            ) : <Text style={s.empty}>Your garden is waiting for its first seed.</Text>}
            <Text style={s.note}>{plants.length} planted · {logsCount} practices logged</Text>
          </GardenBackdrop>
          <View style={s.flowerPicker}>
            <Text style={s.pickerHeading}>Choose your next flower</Text>
            <View style={s.flowerOptions}>
              {FLOWER_TYPES.map(type => (
                <Pressable key={type} accessibilityRole="button" accessibilityLabel={`Choose ${type}`}
                  onPress={() => setSelectedFlower(type)}
                  style={[s.flowerOption, selectedFlower === type && s.flowerOptionSelected]}>
                  <Image source={flowerImageSource(type, 3)} resizeMode="contain" style={s.flowerPreview} />
                  <Text style={s.flowerOptionName}>{type[0].toUpperCase() + type.slice(1)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable disabled={working || seedsAvailable < 1}
            style={[s.button, (working || seedsAvailable < 1) && s.disabled]}
            onPress={() => changeGarden('plant')}>
            <Text style={s.buttonText}>{working ? 'Saving...' : '🫘 Plant a Seed'}</Text>
          </Pressable>
          <View style={s.card}>
            <Text style={s.section}>🌿 How your garden grows</Text>
            <Text style={s.body}>Each saved practice earns one seed and one watering credit. Plant a seed, then tap any growing plant to water it. Each watering moves it forward one stage: seed → sprout → plant → flower. Fully grown flowers stay in your garden.</Text>
            <Text style={[s.body, { marginTop: 10 }]}>All your existing practice logs count toward your available seeds and water.</Text>
          </View>
          <Pressable style={s.link} onPress={() => router.push('/assignments')}><Text style={s.linkText}>🌱 Log a Practice</Text></Pressable>
          <Pressable style={s.link} onPress={() => router.push('/reports')}><Text style={s.linkText}>View Reports →</Text></Pressable>
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
  balances: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  balance: { flex: 1, backgroundColor: '#FFF', borderRadius: 18, padding: 15, alignItems: 'center' },
  balanceNumber: { fontSize: 25, fontWeight: '800', color: '#34764C' },
  balanceLabel: { fontSize: 13, color: '#607D66', marginTop: 5 },
  garden: { backgroundColor: '#E0F3DE', borderRadius: 28, padding: 18, alignItems: 'center', minHeight: 240 },
  sun: { fontSize: 30, marginBottom: 16 },
  plantGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 6, rowGap: 18 },
  flowerArt: { width: 91, height: 145 },
  flowerPicker: { backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginTop: 16 },
  pickerHeading: { color: '#346C48', fontWeight: '800', fontSize: 16, marginBottom: 12 },
  flowerOptions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  flowerOption: { width: 91, alignItems: 'center', padding: 6, borderWidth: 2, borderColor: '#E4F1E3', borderRadius: 12 },
  flowerOptionSelected: { borderColor: '#409D62', backgroundColor: '#EAF8E8' },
  flowerPreview: { width: 65, height: 76 },
  flowerOptionName: { fontSize: 11, color: '#356B49', fontWeight: '700' },
  illustratedPot: { alignItems: 'center', width: 98, paddingBottom: 7, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.12)' },
  plant: { minWidth: 90, backgroundColor: '#F8FFF6', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  waterable: { borderColor: '#FFF5B8' },
  plantEmoji: { fontSize: 40 },
  plantLabel: { color: '#285D35', fontWeight: '800', marginTop: 5, backgroundColor: '#FFF6D8', paddingHorizontal: 9, borderRadius: 8 },
  waterHint: { color: '#267B99', fontSize: 12, fontWeight: '700', marginTop: 4 },
  grown: { color: '#6E8B62', fontSize: 11, marginTop: 4 },
  empty: { color: '#66806A', fontSize: 15, marginVertical: 24, textAlign: 'center' },
  ground: { fontSize: 17, color: '#8AB780', marginTop: 14 },
  note: { color: '#285D35', fontSize: 14, textAlign: 'center', marginTop: 10, fontWeight: '700' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginTop: 20 },
  section: { fontSize: 19, fontWeight: '800', color: '#346C48' },
  body: { fontSize: 15, color: '#687C6B', lineHeight: 23, marginTop: 9 },
  button: { backgroundColor: '#48A46D', borderRadius: 22, padding: 17, alignItems: 'center', marginTop: 18 },
  disabled: { opacity: 0.45 },
  buttonText: { fontSize: 17, fontWeight: '800', color: 'white' },
  link: { alignItems: 'center', padding: 12 },
  linkText: { color: '#34764C', fontSize: 16, fontWeight: '700' },
  error: { color: '#B42318', marginBottom: 12, textAlign: 'center' },
  success: { color: '#287A48', marginBottom: 12, textAlign: 'center', fontWeight: '700' },
});
