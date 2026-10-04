import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';

import { findSkill } from '../../../data/skills';
import { useStudentProfile } from '../../../context/StudentProfileContext';
import { functions } from '../../../lib/firebase';

export default function Visual() {
  const { skillId } = useLocalSearchParams();

  const resolvedSkillId = Array.isArray(skillId)
    ? skillId[0]
    : skillId;

  const skill = findSkill(resolvedSkillId);
  const { profile } = useStudentProfile();

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [posterUrl, setPosterUrl] = useState(null);

  if (!skill) return null;

  const missing =
    !profile.strengths &&
    !profile.barriers &&
    !profile.interests;

  async function generateVisual() {
    try {
      setLoading(true);

      const generateVisualPlan = httpsCallable(
        functions,
        'generateVisualPlan'
      );

      const response = await generateVisualPlan({
        skillId: resolvedSkillId,
        skill: skill.title,
        strengths: profile.strengths || '',
        barriers: profile.barriers || '',
        interests: profile.interests || '',
      });

      console.log('AI response:', response.data);

      const url = response.data?.posterUrl;

      if (!url) {
        throw new Error('No poster URL returned.');
      }

      console.log('Poster URL:', url);
      setPosterUrl(url);
    } catch (error) {
      console.error('Error generating visual:', error);

      Alert.alert(
        'Could not generate visual',
        'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadVisual() {
    if (!posterUrl) return;

    try {
      setDownloading(true);
      await Linking.openURL(posterUrl);

      Alert.alert(
        'Save Visual',
        'The visual has been opened. Use your device or browser save option to keep a copy.'
      );
    } catch (error) {
      console.error('Visual download failed:', error);

      Alert.alert(
        'Could not open visual',
        'Please try again.'
      );
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
            Create a personalized visual poster for {skill.title}.
          </Text>
        </View>
      </View>

      {missing && (
        <Pressable
          style={s.warning}
          onPress={() => router.push('/student-profile')}
        >
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#A56A00"
          />

          <Text style={s.warningText}>
            Add strengths, learning barriers, and interests to the
            Student Profile for better personalization.
          </Text>
        </Pressable>
      )}

      <Pressable
        style={[s.button, loading && s.disabledButton]}
        onPress={generateVisual}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Ionicons name="sparkles" size={20} color="#FFF" />
        )}

        <Text style={s.buttonText}>
          {loading
            ? 'Creating Poster...'
            : posterUrl
            ? 'Regenerate Poster'
            : 'Generate My Child’s Visual'}
        </Text>
      </Pressable>

      {loading && (
        <View style={s.loadingCard}>
          <Ionicons name="image-outline" size={44} color="#7559E8" />
          <Text style={s.loadingTitle}>Creating your visual...</Text>
          <Text style={s.loadingText}>
            Your personalized poster is being created.
            This can take a little while.
          </Text>
        </View>
      )}

      {posterUrl && (
        <View style={s.posterCard}>
          <Text style={s.posterHeading}>
            {profile.name ? `${profile.name}’s ` : ''}
            {skill.title}
          </Text>

          <Image
            source={{ uri: posterUrl }}
            style={s.poster}
            resizeMode="contain"
            onLoad={() => console.log('Poster image loaded successfully')}
            onError={(event) => {
              console.error('Poster image failed to load:', event.nativeEvent.error);
            }}
          />

          <Pressable
            style={({ pressed }) => [
              s.downloadButton,
              pressed && s.downloadButtonPressed,
              downloading && s.disabledButton,
            ]}
            onPress={downloadVisual}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#FFF" />
            )}

            <Text style={s.buttonText}>
              {downloading ? 'Opening...' : 'Download Visual'}
            </Text>
          </Pressable>

          <Text style={s.disclaimer}>
            AI-generated visuals may need to be adjusted for your
            child’s individual needs.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F2F9FF' },
  content: { paddingBottom: 40 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '800' },
  hero: {
    margin: 18,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    gap: 13,
  },
  heroTitle: { fontSize: 18, fontWeight: '800' },
  intro: { color: '#718096', lineHeight: 20, marginTop: 5 },
  warning: {
    marginHorizontal: 18,
    backgroundColor: '#FFF5D9',
    borderRadius: 14,
    padding: 13,
    flexDirection: 'row',
    gap: 9,
  },
  warningText: { flex: 1, color: '#76520E', lineHeight: 19 },
  button: {
    margin: 18,
    backgroundColor: '#258DEB',
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },
  downloadButton: {
    marginTop: 16,
    backgroundColor: '#258DEB',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  downloadButtonPressed: { opacity: 0.85 },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  loadingCard: {
    marginHorizontal: 18,
    marginBottom: 18,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  loadingTitle: { fontSize: 18, fontWeight: '800', marginTop: 12 },
  loadingText: {
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 7,
  },
  posterCard: {
    marginHorizontal: 18,
    marginBottom: 36,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 14,
  },
  posterHeading: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  poster: {
    width: '100%',
    height: 520,
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
  },
  disclaimer: {
    fontSize: 12,
    color: '#8A94A3',
    lineHeight: 17,
    marginTop: 14,
    textAlign: 'center',
  },
});