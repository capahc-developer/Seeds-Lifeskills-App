
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import {
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { practiceLogsForCurrentUser } from '../lib/userData';
import { GardenBackdrop } from '../components/GardenIllustration';
import {
  FLOWER_TYPES,
  flowerImageSource,
} from '../components/GardenFlowerAssets';

const STAGES = [
  { name: 'Seed' },
  { name: 'Sprout' },
  { name: 'Plant' },
  { name: 'Flower' },
];

// Daisy is intentionally excluded.
const AVAILABLE_FLOWERS = [
  'sunflower',
  'tulip',
  'rose',
  'lavender',
  'hydrangea',
];

function randomFlowerType() {
  return AVAILABLE_FLOWERS[
    Math.floor(Math.random() * AVAILABLE_FLOWERS.length)
  ];
}

function safeStage(value) {
  return Math.min(3, Math.max(0, Number(value) || 0));
}

function gardenRef() {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error('Please sign in to use your garden.');
  }

  return doc(db, 'users', uid, 'garden', 'state');
}


const FLOWER_WIDTH = 90;
const FLOWER_HEIGHT = 132;
const GRASS_AREA_HEIGHT = 280;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function DraggableFlower({ plant, index, gardenWidth, canWater, onWater, onMove }) {
  const stage = safeStage(plant.stage);
  const savedType = plant.type || AVAILABLE_FLOWERS[index % AVAILABLE_FLOWERS.length];
  const flowerType = AVAILABLE_FLOWERS.includes(savedType) ? savedType : 'sunflower';
  const customURL = Array.isArray(plant.customStages) ? plant.customStages[stage] : null;
  const imageSource = customURL ? { uri: customURL } : flowerImageSource(flowerType, stage);

  const maxX = Math.max(0, gardenWidth - FLOWER_WIDTH);
  const maxY = GRASS_AREA_HEIGHT - FLOWER_HEIGHT;
  const savedX = clamp(typeof plant.position?.x === 'number' ? plant.position.x : ((index % 3) + 0.5) / 3, 0, 1);
  const savedY = clamp(typeof plant.position?.y === 'number' ? plant.position.y : Math.min(0.9, 0.15 + Math.floor(index / 3) * 0.24), 0, 1);
  const animatedPosition = useRef(new Animated.ValueXY()).current;
  const currentPosition = useRef({ x: 0, y: 0 });
  const startPosition = useRef({ x: 0, y: 0 });
  const latest = useRef({});
  latest.current = { maxX, maxY, canWater, onWater, onMove };

  useEffect(() => {
    const position = { x: savedX * maxX, y: savedY * maxY };
    currentPosition.current = position;
    animatedPosition.setValue(position);
  }, [savedX, savedY, maxX, maxY, animatedPosition]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
    onPanResponderGrant: () => {
      startPosition.current = { ...currentPosition.current };
    },
    onPanResponderMove: (_, g) => {
      const { maxX: width, maxY: height } = latest.current;
      const position = {
        x: clamp(startPosition.current.x + g.dx, 0, width),
        y: clamp(startPosition.current.y + g.dy, 0, height),
      };
      currentPosition.current = position;
      animatedPosition.setValue(position);
    },
    onPanResponderRelease: (_, g) => {
      const moved = Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6;
      const { maxX: width, maxY: height, canWater: waterable, onWater: water, onMove: move } = latest.current;
      if (!moved) {
        if (waterable) water();
        return;
      }
      move({
        x: width > 0 ? currentPosition.current.x / width : 0,
        y: height > 0 ? currentPosition.current.y / height : 0,
      });
    },
    onPanResponderTerminationRequest: () => false,
  }), [animatedPosition]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      accessibilityLabel={`Flower ${index + 1}, ${STAGES[stage].name}. Drag to move, tap to water.`}
      style={[s.draggableFlower, { transform: animatedPosition.getTranslateTransform() }]}
    >
      <Image source={imageSource} resizeMode="contain" style={s.dragFlowerArt} />
    </Animated.View>
  );
}

export default function GardenScreen() {
  const [logsCount, setLogsCount] = useState(0);
  const [garden, setGarden] = useState({ plants: [] });
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [gardenWidth, setGardenWidth] = useState(300);

  const refresh = useCallback(async () => {
    const [logsSnapshot, gardenSnapshot] = await Promise.all([
      getDocs(
        query(
          practiceLogsForCurrentUser(),
          orderBy('createdAt', 'desc')
        )
      ),
      getDoc(gardenRef()),
    ]);

    const state = gardenSnapshot.exists()
      ? gardenSnapshot.data()
      : { plants: [] };

    setLogsCount(logsSnapshot.size);
    setGarden({
      plants: Array.isArray(state.plants) ? state.plants : [],
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setLoading(true);
      setError('');

      Promise.all([
        getDocs(
          query(
            practiceLogsForCurrentUser(),
            orderBy('createdAt', 'desc')
          )
        ),
        getDoc(gardenRef()),
      ])
        .then(([logsSnapshot, gardenSnapshot]) => {
          if (!active) return;

          const state = gardenSnapshot.exists()
            ? gardenSnapshot.data()
            : { plants: [] };

          setLogsCount(logsSnapshot.size);
          setGarden({
            plants: Array.isArray(state.plants)
              ? state.plants
              : [],
          });
        })
        .catch(e => {
          console.error('Error loading garden:', e);

          if (active) {
            setError(
              'Your garden could not load. Please try again.'
            );
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [])
  );

  const plants = garden.plants;

  const waterUsed = plants.reduce(
    (total, plant) => total + safeStage(plant.stage),
    0
  );

  const seedsAvailable = Math.max(
    0,
    logsCount - plants.length
  );

  const waterAvailable = Math.max(
    0,
    logsCount - waterUsed
  );

  const moveFlower = async (plantId, position) => {
    try {
      await runTransaction(db, async transaction => {
        const ref = gardenRef();
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) return;
        const plants = Array.isArray(snapshot.data().plants) ? snapshot.data().plants : [];
        transaction.update(ref, {
          plants: plants.map(plant => plant.id === plantId ? { ...plant, position } : plant),
          updatedAt: new Date(),
        });
      });
      await refresh();
    } catch (e) {
      console.error('Could not save flower position:', e);
      setError('Could not save flower position. Please try again.');
      await refresh();
    }
  };

  const changeGarden = async (action, plantId) => {
    if (working) return;

    setWorking(true);
    setError('');
    setMessage('');

    // Pick once per planting attempt, not on every screen render.
    const newFlowerType =
      action === 'plant' ? randomFlowerType() : null;

    try {
      // Each saved practice earns one seed and one water.
      const snapshot = await getDocs(
        practiceLogsForCurrentUser()
      );

      const earned = snapshot.size;

      await runTransaction(db, async transaction => {
        const ref = gardenRef();
        const current = await transaction.get(ref);

        const savedPlants =
          current.exists() &&
          Array.isArray(current.data().plants)
            ? current.data().plants
            : [];

        const spentWater = savedPlants.reduce(
          (sum, plant) => sum + safeStage(plant.stage),
          0
        );

        let nextPlants;

        if (action === 'plant') {
          if (savedPlants.length >= earned) {
            throw new Error(
              'No seeds available yet. Log a practice to earn one!'
            );
          }

          nextPlants = [
            ...savedPlants,
            {
              id: `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`,
              type: newFlowerType,
              stage: 0,
            },
          ];
        } else {
          if (spentWater >= earned) {
            throw new Error(
              'No watering credits left. Log a practice to earn one!'
            );
          }

          const target = savedPlants.find(
            plant => plant.id === plantId
          );

          if (!target || safeStage(target.stage) >= 3) {
            throw new Error(
              'This flower is fully grown. Choose another plant!'
            );
          }

          nextPlants = savedPlants.map(plant =>
            plant.id === plantId
              ? {
                  ...plant,
                  stage: safeStage(plant.stage) + 1,
                }
              : plant
          );
        }

        transaction.set(ref, {
          plants: nextPlants,
          updatedAt: new Date(),
        });
      });

      await refresh();

      setMessage(
        action === 'plant'
          ? '🌱 A surprise seed is planted!'
          : '💧 Your plant grew!'
      );
    } catch (e) {
      console.error('Garden update failed:', e);
      setError(
        e.message ||
          'Could not save your garden. Please try again.'
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
    >
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.replace('/')}
        >
          <Ionicons
            name="chevron-back"
            size={27}
            color="#3B7851"
          />
        </Pressable>

        <Text style={s.title}>🌷 My Garden</Text>

        <View style={{ width: 27 }} />
      </View>

      <Text style={s.subtitle}>
        Practice earns seeds and water.
        Plant a surprise seed and watch it grow!
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4B9E65"
        />
      ) : (
        <>
          <View style={s.balances}>
            <View style={s.balance}>
              <Text style={s.balanceNumber}>
                🫘 {seedsAvailable}
              </Text>
              <Text style={s.balanceLabel}>
                Seeds to plant
              </Text>
            </View>

            <View style={s.balance}>
              <Text style={s.balanceNumber}>
                💧 {waterAvailable}
              </Text>
              <Text style={s.balanceLabel}>
                Water available
              </Text>
            </View>
          </View>

          {!!error && (
            <Text style={s.error}>{error}</Text>
          )}

          {!!message && (
            <Text style={s.success}>{message}</Text>
          )}

          <GardenBackdrop>
            <View
              style={s.grassArea}
              onLayout={event => setGardenWidth(event.nativeEvent.layout.width)}
            >
              {plants.map((plant, index) => (
                <DraggableFlower
                  key={plant.id}
                  plant={plant}
                  index={index}
                  gardenWidth={gardenWidth}
                  canWater={waterAvailable > 0 && safeStage(plant.stage) < 3 && !working}
                  onWater={() => changeGarden('water', plant.id)}
                  onMove={position => moveFlower(plant.id, position)}
                />
              ))}
              {plants.length === 0 && (
                <Text style={s.empty}>Your garden is waiting for its first seed.</Text>
              )}
            </View>

            <Text style={s.note}>
              {plants.length} planted · {logsCount} practices logged
            </Text>
          </GardenBackdrop>

          <Pressable
            disabled={working || seedsAvailable < 1}
            style={[
              s.button,
              (working || seedsAvailable < 1) &&
                s.disabled,
            ]}
            onPress={() => changeGarden('plant')}
          >
            <Text style={s.buttonText}>
              {working
                ? 'Saving...'
                : '🌱 Plant a Surprise Seed'}
            </Text>
          </Pressable>

          <View style={s.card}>
            <Text style={s.section}>
              🌿 How your garden grows
            </Text>

            <Text style={s.body}>
              Each saved practice earns one seed and one
              watering credit. Plant a surprise seed,
              then tap any growing plant to water it.
              Each watering moves it forward one stage:
              seed → sprout → plant → flower. Fully grown
              flowers stay in your garden.
            </Text>

            <Text
              style={[
                s.body,
                { marginTop: 10 },
              ]}
            >
              All your existing practice logs count
              toward your available seeds and water.
            </Text>
          </View>

          <Pressable
            style={s.link}
            onPress={() => router.push('/assignments')}
          >
            <Text style={s.linkText}>
              🌱 Log a Practice
            </Text>
          </Pressable>

          <Pressable
            style={s.link}
            onPress={() => router.push('/reports')}
          >
            <Text style={s.linkText}>
              View Reports →
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F1F8EF',
  },
  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#346C48',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#65816B',
    marginTop: 20,
    marginBottom: 24,
  },
  balances: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  balance: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 15,
    alignItems: 'center',
  },
  balanceNumber: {
    fontSize: 25,
    fontWeight: '800',
    color: '#34764C',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#607D66',
    marginTop: 5,
  },
  grassArea: {
    height: GRASS_AREA_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  draggableFlower: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: FLOWER_WIDTH,
    height: FLOWER_HEIGHT,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dragFlowerArt: {
    width: FLOWER_WIDTH,
    height: FLOWER_HEIGHT,
  },
  empty: {
    color: '#66806A',
    fontSize: 15,
    marginVertical: 24,
    textAlign: 'center',
  },
  note: {
    color: '#285D35',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '700',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
  },
  section: {
    fontSize: 19,
    fontWeight: '800',
    color: '#346C48',
  },
  body: {
    fontSize: 15,
    color: '#687C6B',
    lineHeight: 23,
    marginTop: 9,
  },
  button: {
    backgroundColor: '#48A46D',
    borderRadius: 22,
    padding: 17,
    alignItems: 'center',
    marginTop: 18,
  },
  disabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
    color: 'white',
  },
  link: {
    alignItems: 'center',
    padding: 12,
  },
  linkText: {
    color: '#34764C',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: '#B42318',
    marginBottom: 12,
    textAlign: 'center',
  },
  success: {
    color: '#287A48',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '700',
  },
});
