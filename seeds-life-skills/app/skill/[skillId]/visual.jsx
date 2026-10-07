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
import { doc, getDoc } from 'firebase/firestore';

import { findSkill } from '../../../data/skills';
import { useStudentProfile } from '../../../context/StudentProfileContext';
import {
  auth,
  db,
  functions,
} from '../../../lib/firebase';

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

  /**
   * Get the steps that should be used for this visual.
   *
   * Priority:
   * 1. Parent-adjusted steps for this user
   * 2. Default steps from the master skill document
   */
  async function getStepsForVisual() {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User is not signed in.');
    }

    // --------------------------------------------------
    // 1. Check for parent-adjusted steps
    // --------------------------------------------------

    const customizationRef = doc(
      db,
      'users',
      user.uid,
      'skillCustomizations',
      String(resolvedSkillId)
    );

    const customizationSnapshot =
      await getDoc(customizationRef);

    if (
      customizationSnapshot.exists() &&
      Array.isArray(
        customizationSnapshot.data().steps
      ) &&
      customizationSnapshot.data().steps.length
    ) {
      console.log(
        'Using customized steps:',
        customizationSnapshot.data().steps
      );

      return customizationSnapshot.data().steps;
    }

    // --------------------------------------------------
    // 2. Otherwise use the default Firebase skill steps
    // --------------------------------------------------

    const skillRef = doc(
      db,
      'skills',
      String(resolvedSkillId)
    );

    const skillSnapshot = await getDoc(skillRef);

    if (!skillSnapshot.exists()) {
      throw new Error(
        'Skill could not be found in Firebase.'
      );
    }

    const defaultSteps =
      skillSnapshot.data().steps;

    if (
      !Array.isArray(defaultSteps) ||
      !defaultSteps.length
    ) {
      throw new Error(
        'No steps are available for this skill.'
      );
    }

    console.log(
      'Using default skill steps:',
      defaultSteps
    );

    return defaultSteps;
  }

  async function generateVisual() {
    try {
      setLoading(true);

      // Get the exact steps selected/approved by the parent.
      const steps = await getStepsForVisual();

      console.log(
        'Steps being sent to AI:',
        steps
      );

      const generateVisualPlan = httpsCallable(
        functions,
        'generateVisualPlan'
      );

      const response =
        await generateVisualPlan({
          skillId: resolvedSkillId,

          skill: skill.title,

          // IMPORTANT:
          // These are now the parent-approved steps.
          steps,

          strengths:
            profile.strengths || '',

          barriers:
            profile.barriers || '',

          interests:
             profile.interests || '',

          gender:
            profile.gender || 'not-specified',
        });

      console.log(
        'AI response:',
        response.data
      );

      const url =
        response.data?.posterUrl;

      if (!url) {
        throw new Error(
          'No poster URL returned.'
        );
      }

      console.log(
        'Poster URL:',
        url
      );

      setPosterUrl(url);
    } catch (error) {
      console.error(
        'Error generating visual:',
        error
      );

      Alert.alert(
        'Could not generate visual',
        error?.message ||
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

      await Linking.openURL(
        posterUrl
      );

      Alert.alert(
        'Save Visual',
        'The visual has been opened. Use your device or browser save option to keep a copy.'
      );
    } catch (error) {
      console.error(
        'Visual download failed:',
        error
      );

      Alert.alert(
        'Could not open visual',
        'Please try again.'
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
    >
      {/* Header */}

      <View style={s.header}>
        <Pressable
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="chevron-back"
            size={28}
          />
        </Pressable>

        <Text style={s.title}>
          Step-by-Step Visual
        </Text>

        <View
          style={{ width: 28 }}
        />
      </View>

      {/* Hero */}

      <View style={s.hero}>
        <Ionicons
          name="sparkles"
          size={34}
          color="#7559E8"
        />

        <View style={{ flex: 1 }}>
          <Text
            style={s.heroTitle}
          >
            Personalized Visual
          </Text>

          <Text style={s.intro}>
            Create a personalized
            visual poster for{' '}
            {skill.title} using the
            steps you selected for
            your child.
          </Text>
        </View>
      </View>

      {/* Profile warning */}

      {missing && (
        <Pressable
          style={s.warning}
          onPress={() =>
            router.push(
              '/student-profile'
            )
          }
        >
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#A56A00"
          />

          <Text
            style={s.warningText}
          >
            Add strengths,
            learning barriers,
            and interests to the
            Student Profile for
            better personalization.
          </Text>
        </Pressable>
      )}

      {/* Explanation */}

      <View style={s.infoCard}>
        <Ionicons
          name="checkmark-circle-outline"
          size={22}
          color="#438A6A"
        />

        <Text
          style={s.infoText}
        >
          Your visual will follow
          the steps you selected
          for your child. AI is
          used to create and
          personalize the visual,
          not to decide the
          routine.
        </Text>
      </View>

      {/* Generate */}

      <Pressable
        style={[
          s.button,
          loading &&
            s.disabledButton,
        ]}
        onPress={generateVisual}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator
            color="#FFF"
          />
        ) : (
          <Ionicons
            name="sparkles"
            size={20}
            color="#FFF"
          />
        )}

        <Text
          style={s.buttonText}
        >
          {loading
            ? 'Creating Poster...'
            : posterUrl
            ? 'Regenerate Poster'
            : 'Generate My Child’s Visual'}
        </Text>
      </Pressable>

      {/* Loading */}

      {loading && (
        <View
          style={s.loadingCard}
        >
          <Ionicons
            name="image-outline"
            size={44}
            color="#7559E8"
          />

          <Text
            style={s.loadingTitle}
          >
            Creating your
            visual...
          </Text>

          <Text
            style={s.loadingText}
          >
            Your personalized
            poster is being
            created from the
            steps you selected.
            This can take a
            little while.
          </Text>
        </View>
      )}

      {/* Poster */}

      {posterUrl && (
        <View
          style={s.posterCard}
        >
          <Text
            style={
              s.posterHeading
            }
          >
            {profile.name
              ? `${profile.name}’s `
              : ''}
            {skill.title}
          </Text>

          <Image
            source={{
              uri: posterUrl,
            }}
            style={s.poster}
            resizeMode="contain"
            onLoad={() =>
              console.log(
                'Poster image loaded successfully'
              )
            }
            onError={(event) => {
              console.error(
                'Poster image failed to load:',
                event.nativeEvent
                  .error
              );
            }}
          />

          <Pressable
            style={({
              pressed,
            }) => [
              s.downloadButton,
              pressed &&
                s.downloadButtonPressed,
              downloading &&
                s.disabledButton,
            ]}
            onPress={
              downloadVisual
            }
            disabled={
              downloading
            }
          >
            {downloading ? (
              <ActivityIndicator
                color="#FFF"
              />
            ) : (
              <Ionicons
                name="download-outline"
                size={20}
                color="#FFF"
              />
            )}

            <Text
              style={s.buttonText}
            >
              {downloading
                ? 'Opening...'
                : 'Download Visual'}
            </Text>
          </Pressable>

          <Text
            style={s.disclaimer}
          >
            AI-generated
            illustrations may
            need to be adjusted
            for your child’s
            individual needs.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const s =
  StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor:
        '#F2F9FF',
    },

    content: {
      paddingBottom: 40,
    },

    header: {
      paddingTop: 56,
      paddingHorizontal: 20,
      paddingBottom: 18,
      backgroundColor:
        '#FFF',
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    title: {
      fontSize: 20,
      fontWeight: '800',
    },

    hero: {
      margin: 18,
      backgroundColor:
        '#FFF',
      borderRadius: 20,
      padding: 18,
      flexDirection: 'row',
      gap: 13,
    },

    heroTitle: {
      fontSize: 18,
      fontWeight: '800',
    },

    intro: {
      color: '#718096',
      lineHeight: 20,
      marginTop: 5,
    },

    warning: {
      marginHorizontal: 18,
      backgroundColor:
        '#FFF5D9',
      borderRadius: 14,
      padding: 13,
      flexDirection: 'row',
      gap: 9,
    },

    warningText: {
      flex: 1,
      color: '#76520E',
      lineHeight: 19,
    },

    infoCard: {
      marginHorizontal: 18,
      marginTop: 12,
      backgroundColor:
        '#EEF9F4',
      borderRadius: 14,
      padding: 13,
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 9,
    },

    infoText: {
      flex: 1,
      color: '#3D6D59',
      lineHeight: 19,
      fontSize: 13,
    },

    button: {
      margin: 18,
      backgroundColor:
        '#258DEB',
      borderRadius: 18,
      padding: 17,
      flexDirection: 'row',
      justifyContent:
        'center',
      alignItems: 'center',
      gap: 9,
    },

    downloadButton: {
      marginTop: 16,
      backgroundColor:
        '#258DEB',
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 18,
      flexDirection: 'row',
      justifyContent:
        'center',
      alignItems: 'center',
      gap: 8,
    },

    downloadButtonPressed: {
      opacity: 0.85,
    },

    disabledButton: {
      opacity: 0.6,
    },

    buttonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '800',
    },

    loadingCard: {
      marginHorizontal: 18,
      marginBottom: 18,
      backgroundColor:
        '#FFF',
      borderRadius: 20,
      padding: 28,
      alignItems: 'center',
    },

    loadingTitle: {
      fontSize: 18,
      fontWeight: '800',
      marginTop: 12,
    },

    loadingText: {
      color: '#718096',
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 7,
    },

    posterCard: {
      marginHorizontal: 18,
      marginBottom: 36,
      backgroundColor:
        '#FFF',
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
      backgroundColor:
        '#F7F8FA',
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