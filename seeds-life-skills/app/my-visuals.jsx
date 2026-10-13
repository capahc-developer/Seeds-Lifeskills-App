import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { independentStepsSkills } from '../data/independentStepsSkills';

export default function VisualTemplates() {
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#17213A" />
        </Pressable>
        <Text style={s.title}>My Visuals</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={s.introCard}>
        <Ionicons name="images-outline" size={30} color="#7559E8" />
        <View style={{ flex: 1 }}>
          <Text style={s.introTitle}>Build a visual schedule</Text>
          <Text style={s.introText}>
            Choose a skill, select a pre-made background and layout, then add your own
            photos. Photos stay on the device and are not uploaded to Firebase.
          </Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Choose a skill</Text>

      {independentStepsSkills.map((skill) => (
        <Pressable
          key={skill.id}
          style={s.card}
          onPress={() => router.push(`/skill/${skill.id}/visual`)}
        >
          <View style={s.iconWrap}>
            <Ionicons name={skill.icon || 'apps-outline'} size={26} color="#7559E8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.skillTitle}>{skill.title}</Text>
            <Text style={s.skillSubtitle}>{skill.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#7B8794" />
        </Pressable>
      ))}

      <Text style={s.note}>
        Visual templates use existing skill steps. The app does not generate new images.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F6F3FF' },
  content: { paddingBottom: 44 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#17213A' },
  introCard: {
    margin: 16,
    borderRadius: 20,
    padding: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DDF9',
    flexDirection: 'row',
    gap: 13,
    alignItems: 'flex-start',
  },
  introTitle: { fontSize: 17, fontWeight: '800', color: '#3D336C' },
  introText: { marginTop: 5, color: '#716A89', lineHeight: 20, fontSize: 13 },
  sectionTitle: {
    marginHorizontal: 18,
    marginTop: 4,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#17213A',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 11,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E0F5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEE8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillTitle: { fontSize: 16, fontWeight: '800', color: '#27223D' },
  skillSubtitle: { marginTop: 3, fontSize: 12, color: '#7A738E' },
  note: {
    marginHorizontal: 22,
    marginTop: 8,
    textAlign: 'center',
    color: '#857E97',
    fontSize: 11,
    lineHeight: 16,
  },
});
