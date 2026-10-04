import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

export default function VisualDetail() {
  const { visualId } = useLocalSearchParams();

  const resolvedVisualId = Array.isArray(visualId)
    ? visualId[0]
    : visualId;

  const [visual, setVisual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVisual();
  }, [resolvedVisualId]);

  async function loadVisual() {
    try {
      setLoading(true);
      setError('');

      const user = auth.currentUser;

      if (!user) {
        throw new Error('No logged-in user.');
      }

      if (!resolvedVisualId) {
        throw new Error('No visual ID provided.');
      }

      const visualRef = doc(
        db,
        'studentProfiles',
        user.uid,
        'generatedVisuals',
        resolvedVisualId
      );

      const snapshot = await getDoc(visualRef);

      if (!snapshot.exists()) {
        throw new Error('Visual not found.');
      }

      setVisual({
        id: snapshot.id,
        ...snapshot.data(),
      });
    } catch (err) {
      console.error(
        'Error loading visual:',
        err
      );

      setError(
        'Could not load this visual.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadVisual() {
    if (!visual?.posterUrl) return;

    try {
      setDownloading(true);

      const safeName = String(visual.skill || 'saved-visual')
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();

      if (Platform.OS === 'web') {
        const response = await fetch(visual.posterUrl);

        if (!response.ok) {
          throw new Error('Could not download image.');
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = objectUrl;
        link.download = `${safeName || 'saved-visual'}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(objectUrl);
      } else {
        await Linking.openURL(visual.posterUrl);

        Alert.alert(
          'Save Visual',
          'The visual has been opened. Use your device’s save or share option to keep a copy.'
        );
      }
    } catch (err) {
      console.error('Visual download failed:', err);

      Alert.alert(
        'Could not download visual',
        'Please try again.'
      );
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator
          size="large"
          color="#7559E8"
        />

        <Text style={s.loadingText}>
          Loading visual...
        </Text>
      </View>
    );
  }

  if (error || !visual) {
    return (
      <View style={s.page}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons
              name="chevron-back"
              size={28}
            />
          </Pressable>

          <Text style={s.title}>
            Saved Visual
          </Text>

          <View style={{ width: 28 }} />
        </View>

        <View style={s.center}>
          <Ionicons
            name="image-outline"
            size={54}
            color="#A0AEC0"
          />

          <Text style={s.errorText}>
            {error || 'Could not load this visual.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={28}
          />
        </Pressable>

        <Text
          style={s.title}
          numberOfLines={1}
        >
          {visual.skill || 'Saved Visual'}
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
      >
        <View style={s.posterCard}>
          <Image
            source={{ uri: visual.posterUrl }}
            style={s.poster}
            resizeMode="contain"
            onLoad={() => {
              console.log(
                'Saved visual loaded successfully'
              );
            }}
            onError={(event) => {
              console.error(
                'Saved visual image error:',
                event.nativeEvent.error
              );
            }}
          />

          <Pressable
            style={({ pressed }) => [
              s.downloadButton,
              pressed && s.downloadButtonPressed,
              downloading && s.downloadButtonDisabled,
            ]}
            onPress={downloadVisual}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Ionicons
                name="download-outline"
                size={21}
                color="#FFF"
              />
            )}

            <Text style={s.downloadButtonText}>
              {downloading ? 'Downloading...' : 'Download Visual'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F2F9FF',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F9FF',
    padding: 30,
  },

  loadingText: {
    marginTop: 12,
    color: '#718096',
  },

  errorText: {
    marginTop: 14,
    color: '#718096',
    textAlign: 'center',
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '800',
    marginHorizontal: 10,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  posterCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 12,
  },

  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: '#FFF',
    borderRadius: 14,
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

  downloadButtonPressed: {
    opacity: 0.85,
  },

  downloadButtonDisabled: {
    opacity: 0.6,
  },

  downloadButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});