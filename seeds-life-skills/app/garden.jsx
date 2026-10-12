

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {

  ActivityIndicator,

  Animated,

  Image,
  Modal,
  useWindowDimensions,

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

const ROW_SPACING = 174;
const GARDEN_TOP_PADDING = 22;
const GARDEN_BOTTOM_PADDING = 32;

// Even columns, staggered rows, and a tiny stable offset per plant.
// No Math.random() during render: positions must not jump when React re-renders.
function stableFraction(value) {
  const string = String(value);
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = (hash * 31 + string.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

function initialPlantPosition(plant, index, columns, maxX, maxY) {
  const row = Math.floor(index / columns);
  const column = index % columns;
  const jitter = (stableFraction(plant.id || index) - 0.5) * Math.min(18, maxX * 0.04);
  const slotWidth = maxX / Math.max(1, columns - 1);
  // Odd rows shift slightly to the right; edge positions remain in bounds.
  const stagger = row % 2 ? slotWidth * 0.13 : 0;
  const x = clamp(column * slotWidth + stagger + jitter, 0, maxX);
  const y = clamp(GARDEN_TOP_PADDING + row * ROW_SPACING, 0, maxY);
  return { x, y };
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));



function DraggableFlower({ plant, index, gardenWidth, gardenHeight, columns, canWater, onWater, onMove, bloomToken }) {

  const stage = safeStage(plant.stage);

  const savedType = plant.type || AVAILABLE_FLOWERS[index % AVAILABLE_FLOWERS.length];

  const flowerType = AVAILABLE_FLOWERS.includes(savedType) ? savedType : 'sunflower';

  const customURL = Array.isArray(plant.customStages) ? plant.customStages[stage] : null;

  const imageSource = customURL ? { uri: customURL } : flowerImageSource(flowerType, stage);



  const maxX = Math.max(0, gardenWidth - FLOWER_WIDTH);

  const maxY = Math.max(0, gardenHeight - FLOWER_HEIGHT);
  const defaultPosition = initialPlantPosition(plant, index, columns, maxX, maxY);
  // Respect existing user-dragged coordinates stored in Firestore.
  const savedX = typeof plant.position?.x === 'number'
    ? clamp(plant.position.x, 0, 1) * maxX
    : defaultPosition.x;
  const savedY = typeof plant.position?.y === 'number'
    ? clamp(plant.position.y, 0, 1) * maxY
    : defaultPosition.y;

  const animatedPosition = useRef(new Animated.ValueXY()).current;
  const bloomScale = useRef(new Animated.Value(1)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!bloomToken || stage !== 3) return;
    bloomScale.setValue(0.65);
    sparkleOpacity.setValue(1);
    const animation = Animated.parallel([
      Animated.sequence([
        Animated.spring(bloomScale, {
          toValue: 1.25,
          friction: 4,
          tension: 85,
          useNativeDriver: true,
        }),
        Animated.spring(bloomScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(sparkleOpacity, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ]);
    animation.start();
    return () => animation.stop();
  }, [bloomToken, stage, bloomScale, sparkleOpacity]);

  const currentPosition = useRef({ x: 0, y: 0 });

  const startPosition = useRef({ x: 0, y: 0 });

  const latest = useRef({});

  latest.current = { maxX, maxY, canWater, onWater, onMove };



  useEffect(() => {

    const position = { x: savedX, y: savedY };

    currentPosition.current = position;

    animatedPosition.setValue(position);

  }, [savedX, savedY, animatedPosition]);



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

      <Animated.Image
        source={imageSource}
        resizeMode="contain"
        style={[s.dragFlowerArt, { transform: [{ scale: bloomScale }] }]}
      />
      {stage === 3 && !!bloomToken && (
        <Animated.Text
          pointerEvents="none"
          style={[s.bloomSparkles, { opacity: sparkleOpacity }]}
        >
          ✨🌟✨
        </Animated.Text>
      )}

    </Animated.View>

  );

}



// The celebration appears only after Firestore confirms the third watering.
// It stays visible until the parent chooses to continue.
const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: (i * 37 + 13) % 100,
  delay: (i % 6) * 105,
  color: ['#F6A23A', '#FF70A6', '#7367F0', '#4DBD86', '#FFD95A'][i % 5],
}));

function BloomCelebration({ visible, flowerType, customStages, onContinue }) {
  const { width } = useWindowDimensions();
  const scale = useRef(new Animated.Value(0.55)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const fall = useRef(CONFETTI.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.55);
    glow.setValue(0);
    fall.forEach(value => value.setValue(0));

    const animation = Animated.parallel([
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.18, friction: 4, tension: 90, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.35, duration: 1100, useNativeDriver: true }),
      ]),
      ...fall.map((value, index) => Animated.sequence([
        Animated.delay(CONFETTI[index].delay),
        Animated.timing(value, { toValue: 1, duration: 2200 + (index % 4) * 220, useNativeDriver: true }),
      ])),
    ]);
    animation.start();
    return () => animation.stop();
  }, [visible, scale, glow, fall]);

  const safeType = AVAILABLE_FLOWERS.includes(flowerType) ? flowerType : 'sunflower';
  const customURL = Array.isArray(customStages) ? customStages[3] : null;
  const flowerSource = customURL ? { uri: customURL } : flowerImageSource(safeType, 3);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={s.bloomOverlay}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {CONFETTI.map((piece, index) => (
            <Animated.View
              key={piece.id}
              style={[
                s.confettiPiece,
                {
                  left: (width * piece.x) / 100,
                  backgroundColor: piece.color,
                  transform: [
                    { translateY: fall[index].interpolate({ inputRange: [0, 1], outputRange: [-90, 760] }) },
                    { rotate: fall[index].interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] }) },
                  ],
                  opacity: fall[index].interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 1, 1, 0] }),
                },
              ]}
            />
          ))}
        </View>
        <View style={s.bloomCard}>
          <Text style={s.bloomTopEmoji}>🎉 ✨ 🌸 ✨ 🎉</Text>
          <Animated.View style={[s.bloomFlowerFrame, { transform: [{ scale }] }]}>
            <Animated.View style={[s.bloomHalo, { opacity: glow }]} />
            <Image source={flowerSource} resizeMode="contain" style={s.bloomFlowerImage} />
          </Animated.View>
          <Text style={s.bloomHeading}>Your flower bloomed!</Text>
          <Text style={s.bloomSubheading}>Look what your care helped grow. 🌷</Text>
          <Text style={s.bloomBody}>
            Every practice matters. Your flower will stay in your garden!
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue Growing"
            style={s.bloomContinue}
            onPress={onContinue}
          >
            <Text style={s.bloomContinueText}>Continue Growing 🌱</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function GardenScreen() {

  const [logsCount, setLogsCount] = useState(0);

  const [garden, setGarden] = useState({ plants: [] });

  const [loading, setLoading] = useState(true);

  const [working, setWorking] = useState(false);

  const [error, setError] = useState('');

  const [message, setMessage] = useState('');
  const [bloom, setBloom] = useState({ plantId: null, token: 0 });
  const [bloomCelebration, setBloomCelebration] = useState(null);

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
  const columns = gardenWidth < 460 ? 2 : 3;
  const rows = Math.max(1, Math.ceil(plants.length / columns));
  const gardenHeight = Math.max(
    330,
    GARDEN_TOP_PADDING + (rows - 1) * ROW_SPACING + FLOWER_HEIGHT + GARDEN_BOTTOM_PADDING
  );



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

    let reachedFlower = false;

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



          reachedFlower = safeStage(target.stage) === 2;

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

      if (action === 'water' && reachedFlower) {
        setBloom(previous => ({ plantId, token: previous.token + 1 }));
        const bloomedPlant = garden.plants.find(plant => plant.id === plantId);
        setBloomCelebration({
          plantId,
          type: bloomedPlant?.type || 'sunflower',
          customStages: bloomedPlant?.customStages || null,
        });
      }

      setMessage(

        action === 'plant'

          ? '🌱 A surprise seed is planted!'

          : reachedFlower
            ? '🌸 Your flower bloomed! Beautiful!'
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

    <View style={{ flex: 1 }}>
      <BloomCelebration
        visible={!!bloomCelebration}
        flowerType={bloomCelebration?.type}
        customStages={bloomCelebration?.customStages}
        onContinue={() => setBloomCelebration(null)}
      />
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

              style={[s.grassArea, { height: gardenHeight }]}

              onLayout={event => setGardenWidth(event.nativeEvent.layout.width)}

            >

              {plants.map((plant, index) => (

                <DraggableFlower

                  key={plant.id}

                  plant={plant}

                  index={index}

                  gardenWidth={gardenWidth}
                  gardenHeight={gardenHeight}
                  columns={columns}

                  canWater={waterAvailable > 0 && safeStage(plant.stage) < 3 && !working}

                  onWater={() => changeGarden('water', plant.id)}

                  onMove={position => moveFlower(plant.id, position)}
                  bloomToken={bloom.plantId === plant.id ? bloom.token : 0}

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
            <Text style={s.section}>🌿 How Your Garden Works</Text>
            <Text style={s.body}>
              Every practice you log earns 1 seed 🌱 and 1 watering credit 💧 —
              whether the day felt easy or hard. Your rewards never expire.
            </Text>

            <View style={s.guideRow}>
              <Text style={s.guideEmoji}>🌱</Text>
              <View style={s.guideText}>
                <Text style={s.guideTitle}>1. Plant a seed</Text>
                <Text style={s.guideDescription}>
                  Tap “Plant a Surprise Seed” to use 1 seed and add a new plant to your garden.
                </Text>
              </View>
            </View>

            <View style={s.guideRow}>
              <Text style={s.guideEmoji}>💧</Text>
              <View style={s.guideText}>
                <Text style={s.guideTitle}>2. Water your plant</Text>
                <Text style={s.guideDescription}>
                  Tap a growing plant to use 1 watering credit. Each tap moves it forward one stage.
                </Text>
              </View>
            </View>

            <View style={s.growthStages}>
              <Text style={s.growthStagesText}>🫘 Seed  →  🌱 Sprout  →  🌿 Plant  →  🌸 Flower</Text>
              <Text style={s.growthCaption}>Three watering credits grow a seed into a full flower.</Text>
            </View>

            <View style={s.guideRow}>
              <Text style={s.guideEmoji}>🌸</Text>
              <View style={s.guideText}>
                <Text style={s.guideTitle}>3. Celebrate your flower!</Text>
                <Text style={s.guideDescription}>
                  On the third watering, your flower blooms with a little celebration. Fully grown flowers stay in your garden.
                </Text>
              </View>
            </View>

            <Text style={s.guideFooter}>
              You can save up seeds and water for later. Previous practice logs also count toward your rewards. There is no daily watering limit.
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
    </View>
  );
}

const s = StyleSheet.create({
  bloomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 36, 33, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bloomCard: {
    width: '100%',
    maxWidth: 410,
    backgroundColor: '#FFF8E9',
    borderRadius: 30,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  bloomTopEmoji: { fontSize: 26, marginBottom: 4 },
  bloomFlowerFrame: {
    width: 180,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  bloomHalo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FFDB82',
  },
  bloomFlowerImage: { width: 170, height: 180 },
  bloomHeading: {
    fontSize: 28,
    fontWeight: '900',
    color: '#243C34',
    textAlign: 'center',
    marginTop: 5,
  },
  bloomSubheading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B7851',
    textAlign: 'center',
    marginTop: 12,
  },
  bloomBody: {
    fontSize: 15,
    lineHeight: 23,
    color: '#5D7165',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  bloomContinue: {
    backgroundColor: '#625AF6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 22,
    width: '100%',
    alignItems: 'center',
  },
  bloomContinueText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  confettiPiece: {
    position: 'absolute',
    top: 0,
    width: 11,
    height: 19,
    borderRadius: 3,
  },

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

    minHeight: 330,

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

  bloomSparkles: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    fontSize: 21,
    zIndex: 2,
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

  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 18,
    gap: 12,
  },
  guideEmoji: { fontSize: 26, width: 34, textAlign: 'center' },
  guideText: { flex: 1 },
  guideTitle: { fontSize: 16, fontWeight: '800', color: '#346C48' },
  guideDescription: { fontSize: 14, color: '#687C6B', lineHeight: 21, marginTop: 4 },
  growthStages: {
    backgroundColor: '#EFF8E9',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    alignItems: 'center',
  },
  growthStagesText: { fontSize: 14, color: '#285D35', fontWeight: '700', textAlign: 'center' },
  growthCaption: { fontSize: 13, color: '#65816B', textAlign: 'center', marginTop: 7 },
  guideFooter: { fontSize: 13, color: '#65816B', lineHeight: 20, marginTop: 18 },
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

    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 4,
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
