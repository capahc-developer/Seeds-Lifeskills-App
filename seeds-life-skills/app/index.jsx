import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PressableCard from '../components/PressableCard';
import { useStudentProfile } from '../context/StudentProfileContext';
import { auth } from '../lib/firebase';

const cards = [
  { title: 'Parent Assistant', subtitle: 'Ask a question or create a practice activity.', icon: 'sparkles-outline', tint: '#FFF3DE', color: '#A9690B', route: '/parent-assistant' },
  { title: 'Student Profile', subtitle: "Tell us about your child's strengths, learning barriers, and interests.", icon: 'person-circle-outline', tint: '#E6F2FF', color: '#3B82F6', route: '/student-profile' },
  { title: 'Your Skills', subtitle: 'Practice skills selected for your child. Morning Routine is included as an example.', icon: 'apps-outline', tint: '#EEE9FF', color: '#7C5CE7', route: '/all-skills' },
  { title: 'General Strategies', subtitle: 'Browse practical teaching strategies you can use across everyday skills.', icon: 'bulb-outline', tint: '#E8F7F2', color: '#248A6B', route: '/general-strategies' },
  { title: 'Practice Log', subtitle: 'Track progress and practice attempts.', icon: 'clipboard-outline', tint: '#E3F8EE', color: '#2FB578', route: '/assignments' },
  { title: 'Reports', subtitle: "See your child's progress over time.", icon: 'bar-chart-outline', tint: '#FFE9E7', color: '#FF7474', route: '/reports' },
];

export default function HomeScreen() {
  const { profile, loading } = useStudentProfile();
  const adultName = auth.currentUser?.displayName?.trim().split(' ')[0];
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <View><Text style={styles.brand}>🌱 SEEDS</Text><Text style={styles.tag}>Skills for a brighter tomorrow</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push('/settings')} style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsPressed]}>
          <Ionicons name="settings" size={28} color="#168CE8" />
        </Pressable>
      </View>
      <View style={styles.welcome}>
        <Text style={styles.title}>Welcome{adultName ? `, ${adultName}` : ''}! 👋</Text>
        <Text style={styles.subtitle}>We are here to help you support your child’s success.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit student profile" onPress={() => router.push('/student-profile')} style={styles.studentBanner}>
          <View style={styles.studentAvatar}><Text style={styles.studentEmoji}>{profile.avatar || '🌱'}</Text></View>
          <View style={styles.studentBannerText}>
            <Text style={styles.studentLabel}>STUDENT PROFILE</Text>
            <Text style={styles.studentName}>{loading ? 'Loading...' : profile.name || 'Add your child’s profile'}</Text>
            <Text style={styles.studentHint}>Personalize skills and visual guides</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#47749A" />
        </Pressable>
      </View>
      {cards.map((card) => (
        <PressableCard key={card.title} style={styles.card} onPress={() => router.push(card.route)}>
          <View style={[styles.iconWrap, { backgroundColor: card.tint }]}><Ionicons name={card.icon} size={30} color={card.color} /></View>
          <View style={styles.cardText}><Text style={styles.cardTitle}>{card.title}</Text><Text style={styles.cardSubtitle}>{card.subtitle}</Text></View>
          <Ionicons name="chevron-forward" size={22} color="#7B8794" />
        </PressableCard>
      ))}
      <Text style={styles.footer}>Small steps. Big progress. 💚</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#EEF8FF' }, content: { paddingBottom: 36 },
  top: { backgroundColor: '#FFF', paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  brand: { fontSize: 27, fontWeight: '800', color: '#245A87' }, tag: { fontSize: 13, color: '#69778A', marginTop: 3 },
  settingsButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, settingsPressed: { backgroundColor: '#EAF5FF' },
  welcome: { paddingHorizontal: 22, paddingTop: 36, paddingBottom: 16 }, title: { fontSize: 28, fontWeight: '800', color: '#171B34' }, subtitle: { fontSize: 16, color: '#7A8495', marginTop: 6 },
  studentBanner: { marginTop: 24, backgroundColor: '#FFF', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#DDECF8' },
  studentAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#E9F8F0', alignItems: 'center', justifyContent: 'center' }, studentEmoji: { fontSize: 29 }, studentBannerText: { flex: 1 },
  studentLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: '#438A6A' }, studentName: { fontSize: 17, fontWeight: '800', color: '#17213A', marginTop: 3 }, studentHint: { fontSize: 12, color: '#718096', marginTop: 2 },
  card: { marginHorizontal: 16, marginTop: 14, minHeight: 108, backgroundColor: '#FFF', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  iconWrap: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' }, cardText: { flex: 1 }, cardTitle: { fontSize: 18, fontWeight: '700', color: '#171B34' }, cardSubtitle: { fontSize: 14, lineHeight: 20, color: '#7A8495', marginTop: 4 },
  footer: { textAlign: 'center', marginTop: 34, fontSize: 16, color: '#47749A', fontStyle: 'italic' },
});
