import { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Linking, Pressable,
  ScrollView, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { findSkill } from '../../../data/skills';
import { useStudentProfile } from '../../../context/StudentProfileContext';
import { auth, db, functions } from '../../../lib/firebase';

function PosterPage({ page, index, total, downloading, onSave }) {
  const { width: windowWidth } = useWindowDimensions();
  const [dimensions, setDimensions] = useState(null);
  const maxWidth = Math.max(240, Math.min(700, windowWidth - 76));
  const ratio = dimensions?.width && dimensions?.height
    ? dimensions.height / dimensions.width
    : ((page.steps?.length || 4) > 2 ? 1.55 : 0.85);
  const posterHeight = maxWidth * ratio;

  return (
    <View style={s.pageSection}>
      <Text style={s.pageHeading}>Page {index + 1} of {total}</Text>
      <View style={s.imageWrap}>
        <Image
          source={{ uri: page.posterUrl }}
          style={[s.poster, { width: maxWidth, height: posterHeight }]}
          resizeMode="contain"
          onLoad={(event) => {
            const source = event.nativeEvent?.source;
            if (source?.width && source?.height) {
              setDimensions({ width: source.width, height: source.height });
            }
          }}
        />
      </View>
      <Pressable
        style={[s.downloadButton, downloading && s.disabledButton]}
        disabled={downloading}
        onPress={() => onSave(page.posterUrl)}
      >
        <Ionicons name="download-outline" size={20} color="#FFF" />
        <Text style={s.buttonText}>Open / Save Page {index + 1}</Text>
      </Pressable>
    </View>
  );
}

export default function Visual() {
  const { skillId } = useLocalSearchParams();
  const resolvedSkillId = Array.isArray(skillId) ? skillId[0] : skillId;
  const skill = findSkill(resolvedSkillId);
  const { profile } = useStudentProfile();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [posterUrl, setPosterUrl] = useState(null);
  const [posterPages, setPosterPages] = useState([]);

  if (!skill) return null;
  const missing = !profile.strengths && !profile.barriers && !profile.interests;

  async function getStepsForVisual() {
    const user = auth.currentUser;
    if (!user) throw new Error('User is not signed in.');

    const customRef = doc(db, 'users', user.uid, 'skillCustomizations', String(resolvedSkillId));
    const customSnapshot = await getDoc(customRef);
    const customSteps = customSnapshot.exists() ? customSnapshot.data().steps : null;
    if (Array.isArray(customSteps) && customSteps.length) return customSteps;

    const skillSnapshot = await getDoc(doc(db, 'skills', String(resolvedSkillId)));
    if (!skillSnapshot.exists()) throw new Error('Skill could not be found in Firebase.');
    const defaultSteps = skillSnapshot.data().steps;
    if (!Array.isArray(defaultSteps) || !defaultSteps.length) {
      throw new Error('No steps are available for this skill.');
    }
    return defaultSteps;
  }

  async function generateVisual() {
    try {
      setLoading(true);
      setPosterUrl(null);
      setPosterPages([]);
      const steps = await getStepsForVisual();
      const generateVisualPlan = httpsCallable(functions, 'generateVisualPlan', { timeout: 540000 });
      const response = await generateVisualPlan({
        skillId: resolvedSkillId,
        skill: skill.title,
        steps,
        strengths: profile.strengths || '',
        barriers: profile.barriers || '',
        interests: profile.interests || '',
        gender: profile.gender || 'not-specified',
      });
      const url = response.data?.posterUrl;
      if (!url) throw new Error('No poster URL returned.');
      const returnedPages = Array.isArray(response.data?.pages) ? response.data.pages : [];
      setPosterUrl(url);
      setPosterPages(returnedPages.length
        ? returnedPages
        : [{ pageNumber: 1, posterUrl: url, startStep: 1, steps }]);
    } catch (error) {
      console.error('Error generating visual:', error);
      Alert.alert('Could not generate visual', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function downloadVisual(url) {
    if (!url) return;
    try {
      setDownloading(true);
      await Linking.openURL(url);
      Alert.alert('Save Visual', 'The visual has been opened. Use your device or browser save option to keep a copy.');
    } catch (error) {
      console.error('Visual download failed:', error);
      Alert.alert('Could not open visual', 'Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} />
        </Pressable>
        <Text style={s.title}>Step-by-Step Visual</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={s.hero}>
        <Ionicons name="sparkles" size={34} color="#7559E8" />
        <View style={{ flex: 1 }}>
          <Text style={s.heroTitle}>Personalized Visual</Text>
          <Text style={s.intro}>
            Create a personalized visual poster for {skill.title} using the steps you selected for your child.
          </Text>
        </View>
      </View>

      {missing && (
        <Pressable style={s.warning} onPress={() => router.push('/student-profile')}>
          <Ionicons name="information-circle-outline" size={22} color="#A56A00" />
          <Text style={s.warningText}>
            Add strengths, learning barriers, and interests to the Student Profile for better personalization.
          </Text>
        </Pressable>
      )}

      <View style={s.infoCard}>
        <Ionicons name="checkmark-circle-outline" size={22} color="#438A6A" />
        <Text style={s.infoText}>
          Your visual will follow the steps you selected for your child. AI is used to create and personalize the visual, not to decide the routine.
        </Text>
      </View>

      <Pressable style={[s.button, loading && s.disabledButton]} onPress={generateVisual} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Ionicons name="sparkles" size={20} color="#FFF" />}
        <Text style={s.buttonText}>
          {loading ? 'Creating Pages...' : posterUrl ? 'Regenerate Pages' : 'Generate My Child’s Visual'}
        </Text>
      </Pressable>

      {loading && (
        <View style={s.loadingCard}>
          <Ionicons name="image-outline" size={44} color="#7559E8" />
          <Text style={s.loadingTitle}>Creating your visual...</Text>
          <Text style={s.loadingText}>
            Your personalized poster is being created from the steps you selected. This can take a little while.
          </Text>
        </View>
      )}

      {posterUrl && (
        <View style={s.posterCard}>
          <Text style={s.posterHeading}>
            {profile.name ? `${profile.name}’s ` : ''}{skill.title}
          </Text>
          {posterPages.map((page, index) => (
            <PosterPage
              key={page.pageNumber || index}
              page={page}
              index={index}
              total={posterPages.length}
              downloading={downloading}
              onSave={downloadVisual}
            />
          ))}
          <Text style={s.disclaimer}>
            AI-generated illustrations may need to be adjusted for your child’s individual needs.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F2F9FF' },
  content: { paddingBottom: 40 },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 18, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  hero: { margin: 18, backgroundColor: '#FFF', borderRadius: 20, padding: 18, flexDirection: 'row', gap: 13 },
  heroTitle: { fontSize: 18, fontWeight: '800' },
  intro: { color: '#718096', lineHeight: 20, marginTop: 5 },
  warning: { marginHorizontal: 18, backgroundColor: '#FFF5D9', borderRadius: 14, padding: 13, flexDirection: 'row', gap: 9 },
  warningText: { flex: 1, color: '#76520E', lineHeight: 19 },
  infoCard: { marginHorizontal: 18, marginTop: 12, backgroundColor: '#EEF9F4', borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  infoText: { flex: 1, color: '#3D6D59', lineHeight: 19, fontSize: 13 },
  button: { margin: 18, backgroundColor: '#258DEB', borderRadius: 18, padding: 17, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  downloadButton: { marginTop: 16, backgroundColor: '#258DEB', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, alignSelf: 'stretch' },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  loadingCard: { marginHorizontal: 18, marginBottom: 18, backgroundColor: '#FFF', borderRadius: 20, padding: 28, alignItems: 'center' },
  loadingTitle: { fontSize: 18, fontWeight: '800', marginTop: 12 },
  loadingText: { color: '#718096', textAlign: 'center', lineHeight: 20, marginTop: 7 },
  posterCard: { marginHorizontal: 18, marginBottom: 36, backgroundColor: '#FFF', borderRadius: 20, padding: 14, alignItems: 'center' },
  posterHeading: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  pageSection: { width: '100%', alignItems: 'center', marginBottom: 28 },
  pageHeading: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  imageWrap: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  poster: { borderRadius: 12, backgroundColor: '#FFF' },
  disclaimer: { fontSize: 12, color: '#8A94A3', lineHeight: 17, marginTop: 14, textAlign: 'center' },
});
