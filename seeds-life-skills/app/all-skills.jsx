import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

const colors = ['#FFF0D7', '#E2F7EA', '#FFE5E8', '#EEE8FF', '#E3F7EA', '#E3F0FF'];

export default function YourSkills() {
  const [builtInSkills, setBuiltInSkills] = useState([]);
  const [customSkills, setCustomSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadSkills = async () => {
    const user = auth.currentUser;

    if (!user) {
      setError(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(false);

      const [builtInSnapshot, customSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'skills'), where('active', '==', true))),
        getDocs(collection(db, 'users', user.uid, 'customSkills')),
      ]);

      const loadedBuiltIn = builtInSnapshot.docs
        .map((item) => ({ id: item.id, ...item.data(), custom: false }))
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

      const loadedCustom = customSnapshot.docs
        .map((item) => ({ id: item.id, ...item.data(), custom: true }))
        .sort((a, b) => {
          const left = a.createdAt?.seconds ?? 0;
          const right = b.createdAt?.seconds ?? 0;
          return right - left;
        });

      setBuiltInSkills(loadedBuiltIn);
      setCustomSkills(loadedCustom);
    } catch (err) {
      console.error('Error loading skills from Firebase:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const renderSkill = (skill, index) => (
    <Pressable
      key={skill.id}
      style={s.card}
      onPress={() =>
        router.push(
          skill.custom
            ? `/custom-skill/${skill.id}`
            : `/skill/${skill.id}`
        )
      }
    >
      <View style={[s.icon, { backgroundColor: colors[index % colors.length] }]}>
        <Ionicons
          name={skill.icon || (skill.custom ? 'create-outline' : 'school-outline')}
          size={27}
          color="#4C78A8"
        />
      </View>

      <View style={{ flex: 1 }}>
        <View style={s.titleRow}>
          <Text style={s.cardTitle}>{skill.title}</Text>
          {skill.custom && (
            <View style={s.customBadge}>
              <Text style={s.customBadgeText}>Custom</Text>
            </View>
          )}
        </View>
        <Text style={s.sub}>
          {skill.subtitle || (skill.custom ? 'Created by you' : '')}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={22} color="#7B8794" />
    </Pressable>
  );

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} />
        </Pressable>
        <Text style={s.title}>Your Skills</Text>
        <View style={{ width: 28 }} />
      </View>

      <Text style={s.intro}>
        Use the built-in skills or create your own. Each skill has a simple step list that can be adjusted for your child.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create a custom skill"
        style={s.createButton}
        onPress={() => router.push('/custom-skill-editor')}
      >
        <View style={s.createIcon}>
          <Ionicons name="add" size={25} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.createTitle}>Create Your Own Skill</Text>
          <Text style={s.createSubtitle}>
            Add a skill and customize its steps.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
      </Pressable>

      {loading && (
        <View style={s.statusContainer}>
          <ActivityIndicator size="large" />
          <Text style={s.statusText}>Loading skills...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={s.statusContainer}>
          <Text style={s.errorText}>We could not load the skills.</Text>
          <Pressable style={s.retryButton} onPress={loadSkills}>
            <Text style={s.retryText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && customSkills.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Created by You</Text>
          {customSkills.map((skill, index) => renderSkill(skill, index))}
        </>
      )}

      {!loading && !error && (
        <>
          <Text style={s.sectionTitle}>SEEDS Skills</Text>
          {builtInSkills.length === 0 ? (
            <View style={s.statusContainer}>
              <Text style={s.statusText}>No built-in skills are available yet.</Text>
            </View>
          ) : (
            builtInSkills.map((skill, index) =>
              renderSkill(skill, index + customSkills.length)
            )
          )}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F1F9FF' },
  content: { paddingBottom: 36 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 21, fontWeight: '800' },
  intro: {
    fontSize: 15,
    color: '#718096',
    margin: 20,
    lineHeight: 21,
  },
  createButton: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#258DEB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  createIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  createTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  createSubtitle: {
    color: '#E8F4FF',
    fontSize: 13,
    marginTop: 3,
  },
  sectionTitle: {
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#526170',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#17213A' },
  sub: { fontSize: 13, color: '#718096', marginTop: 4 },
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#E9F8F0',
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#438A6A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusContainer: { padding: 30, alignItems: 'center' },
  statusText: { marginTop: 10, fontSize: 15, color: '#718096' },
  errorText: { fontSize: 15, color: '#B42318' },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#258DEB',
  },
  retryText: { color: '#FFFFFF', fontWeight: '800' },
});
