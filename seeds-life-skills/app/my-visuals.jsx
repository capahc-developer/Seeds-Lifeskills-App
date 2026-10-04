import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  collection,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

export default function MyVisuals() {
  const [visuals, setVisuals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisuals();
  }, []);

  async function loadVisuals() {
    try {
      setLoading(true);

      const user = auth.currentUser;

      if (!user) {
        console.log('No logged-in user');
        setVisuals([]);
        return;
      }

      const uid = user.uid;

      console.log('Loading visuals for student:', uid);

      const visualsRef = collection(
        db,
        'studentProfiles',
        uid,
        'generatedVisuals'
      );

      const visualsQuery = query(
        visualsRef,
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(visualsQuery);

      const savedVisuals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(
        'Saved visuals:',
        savedVisuals
      );

      setVisuals(savedVisuals);
    } catch (error) {
      console.error(
        'Error loading saved visuals:',
        error
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(timestamp) {
    if (!timestamp?.toDate) {
      return '';
    }

    return timestamp
      .toDate()
      .toLocaleDateString();
  }

  function openVisual(item) {
    console.log(
      'Opening visual:',
      item.id
    );

    router.push(
      `/visual-detail?visualId=${encodeURIComponent(
        item.id
      )}`
    );
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator
          size="large"
          color="#7559E8"
        />

        <Text style={s.loadingText}>
          Loading saved visuals...
        </Text>
      </View>
    );
  }

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111"
          />
        </Pressable>

        <Text style={s.title}>
          My Visuals
        </Text>

        <View style={{ width: 28 }} />
      </View>

      {visuals.length === 0 ? (
        <View style={s.empty}>
          <Ionicons
            name="images-outline"
            size={64}
            color="#A0AEC0"
          />

          <Text style={s.emptyTitle}>
            No saved visuals yet
          </Text>

          <Text style={s.emptyText}>
            Visuals you generate for life skills
            will appear here automatically.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visuals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <Pressable
              style={s.card}
              onPress={() =>
                openVisual(item)
              }
            >
              <Image
                source={{
                  uri: item.posterUrl,
                }}
                style={s.thumbnail}
                resizeMode="cover"
              />

              <View style={s.cardInfo}>
                <Text style={s.skill}>
                  {item.skill ||
                    'Saved Visual'}
                </Text>

                <Text style={s.date}>
                  {formatDate(
                    item.createdAt
                  )}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#718096"
              />
            </Pressable>
          )}
        />
      )}
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
  },

  loadingText: {
    marginTop: 12,
    color: '#718096',
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
  },

  list: {
    padding: 18,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  thumbnail: {
    width: 85,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#EDF2F7',
  },

  cardInfo: {
    flex: 1,
    marginLeft: 15,
  },

  skill: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A202C',
  },

  date: {
    marginTop: 6,
    fontSize: 13,
    color: '#718096',
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: '800',
  },

  emptyText: {
    marginTop: 8,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 21,
  },
});