import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PressableCard from '../components/PressableCard';
import { useStudentProfile } from '../context/StudentProfileContext';
import { auth } from '../lib/firebase';

const cards = [
  {
    title: 'General Strategies',
    emoji: '💡',
    subtitle:
      'Browse practical teaching strategies you can use across everyday skills.',
    icon: 'bulb-outline',
    tint: '#E8F7F2',
    color: '#248A6B',
    route: '/general-strategies',
  },
  {
    title: 'My Skills',
    emoji: '📚',
    subtitle:
      'Practice the Independent Steps skills and customize steps for your child.',
    icon: 'apps-outline',
    tint: '#EEE9FF',
    color: '#7C5CE7',
    route: '/all-skills',
  },
  {
    title: 'My Visuals',
    emoji: '🖼️',
    subtitle:
      'Choose a skill, background, and add your own local photos.',
    icon: 'images-outline',
    tint: '#F2EAFE',
    color: '#7559E8',
    route: '/my-visuals',
  },
  {
    title: 'Practice Log',
    emoji: '📝',
    subtitle: 'Track progress and practice attempts.',
    icon: 'clipboard-outline',
    tint: '#E3F8EE',
    color: '#2FB578',
    route: '/assignments',
  },
  {
    title: 'My Garden',
    emoji: '🌻',
    subtitle: 'See the seeds planted with every practice.',
    icon: 'flower-outline',
    tint: '#E7F5DF',
    color: '#4A9660',
    route: '/garden',
  },
  {
    title: 'Reports',
    emoji: '📊',
    subtitle: "See your child's progress over time.",
    icon: 'bar-chart-outline',
    tint: '#FFE9E7',
    color: '#FF7474',
    route: '/reports',
  },
];

export default function HomeScreen() {
  const { profile, loading } = useStudentProfile();
  const adultName = auth.currentUser?.displayName?.trim().split(' ')[0];
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <View><Text style={styles.brand}>🌱 Independent Steps</Text><Text style={styles.tag}>Skills for a brighter tomorrow</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push('/settings')} style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsPressed]}>
          <Ionicons name="settings" size={28} color="#168CE8" />
        </Pressable>
      </View>
      <View style={styles.welcome}>
        <View style={styles.gardenWelcome}>
          <View style={styles.skyCloudLeft}><Text style={styles.cloudText}>☁️</Text></View>
          <View style={styles.skyCloudRight}><Text style={styles.cloudText}>☁️</Text></View>
          <View style={styles.sunCircle}>
            <Text style={styles.sunFace}>☀️</Text>
          </View>
          <View style={styles.welcomeSign}>
            <Text style={styles.gardenTitle}>Welcome{adultName ? ', ' + adultName : ''}!</Text>
            <Text style={styles.gardenSubtitle}>Let's grow skills for a brighter, more independent tomorrow.</Text>
          </View>
          <View style={styles.gardenLandscape}>
            <View style={styles.hillBack} />
            <View style={styles.hillFront} />
            <Text style={styles.flowerLeft}>🌷🌼</Text>
            <Text style={styles.growingPlants}>🌱🌿🌻</Text>
            <Text style={styles.wateringCan}>🪴💧</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit student profile" onPress={() => router.push('/student-profile')} style={styles.studentBanner}>
          <View style={styles.studentAvatar}><Text style={styles.studentEmoji}>{profile.avatar || '🌱'}</Text></View>
          <View style={styles.studentBannerText}>
            <Text style={styles.studentLabel}>STUDENT PROFILE</Text>
            <Text style={styles.studentName}>{loading ? 'Loading...' : profile.name || 'Add your child’s profile'}</Text>
            <Text style={styles.studentHint}>Personalize skills and learning supports</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#47749A" />
        </Pressable>
      </View>
      {cards.map((card) => (
        <PressableCard key={card.title} style={[styles.card, { backgroundColor: card.tint }]} onPress={() => router.push(card.route)}>
          <View style={[styles.iconWrap, { backgroundColor: card.tint }]}><Text style={styles.cardEmoji}>{card.emoji}</Text></View>
          <View style={styles.cardText}><Text style={styles.cardTitle}>{card.title}</Text><Text style={styles.cardSubtitle}>{card.subtitle}</Text></View>
          <Ionicons name="chevron-forward" size={22} color="#14385D" />
        </PressableCard>
      ))}
      <Text style={styles.footer}>Small steps. Big progress. 💚</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FAFCFF' },
  content: { paddingBottom: 36 },
  top: { backgroundColor: '#FFF', paddingTop: 56, paddingBottom: 19, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  brand: { fontSize: 23, fontWeight: '900', color: '#153E64' },
  tag: { fontSize: 12, color: '#69778A', marginTop: 3 },
  settingsButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  settingsPressed: { backgroundColor: '#EAF5FF' },
  welcome: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  gardenWelcome: { height: 246, borderRadius: 25, backgroundColor: '#8FD7FC', overflow: 'hidden', position: 'relative' },
  skyCloudLeft: { position: 'absolute', left: 12, top: 0 },
  skyCloudRight: { position: 'absolute', right: 76, top: 19 },
  cloudText: { fontSize: 37 },
  sunCircle: { position: 'absolute', top: 4, right: 6, width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  sunFace: { fontSize: 68 },
  welcomeSign: { position: 'absolute', top: 49, left: 15, right: 73, zIndex: 2, backgroundColor: '#FFF9E9', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 19, borderWidth: 2, borderColor: '#F0E4BC', shadowColor: '#476B45', shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
  gardenTitle: { fontSize: 26, fontWeight: '900', color: '#113660' },
  gardenSubtitle: { fontSize: 13, lineHeight: 19, color: '#3C5874', marginTop: 6 },
  gardenLandscape: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, overflow: 'hidden' },
  hillBack: { position: 'absolute', left: -30, bottom: -45, width: '125%', height: 115, backgroundColor: '#A9DB80', borderRadius: 90 },
  hillFront: { position: 'absolute', left: -25, bottom: -66, width: '120%', height: 105, backgroundColor: '#6FC774', borderRadius: 80 },
  flowerLeft: { position: 'absolute', bottom: 5, left: 12, fontSize: 30 },
  growingPlants: { position: 'absolute', bottom: 4, left: '40%', fontSize: 31 },
  wateringCan: { position: 'absolute', bottom: 7, right: 10, fontSize: 27 },
  studentBanner: { marginTop: 12, backgroundColor: '#E4F2FF', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#DDECF8' },
  studentAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#E9F8F0', alignItems: 'center', justifyContent: 'center' }, studentEmoji: { fontSize: 29 }, studentBannerText: { flex: 1 },
  studentLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: '#438A6A' }, studentName: { fontSize: 17, fontWeight: '800', color: '#17213A', marginTop: 3 }, studentHint: { fontSize: 12, color: '#718096', marginTop: 2 },
  card: { marginHorizontal: 16, marginTop: 12, minHeight: 102, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  iconWrap: { width: 65, height: 65, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, cardEmoji: { fontSize: 39 }, cardText: { flex: 1 }, cardTitle: { fontSize: 19, fontWeight: '800', color: '#171B34' }, cardSubtitle: { fontSize: 14, lineHeight: 20, color: '#7A8495', marginTop: 4 },
  footer: { textAlign: 'center', marginTop: 34, fontSize: 16, color: '#47749A', fontStyle: 'italic' },
});
