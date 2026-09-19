import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import {
  useEffect,
  useState,
} from 'react';

import {
  doc,
  getDoc,
  collection,
  getDocs,
} from 'firebase/firestore';

import { db } from '../../../lib/firebase';


export default function Strategies() {

  const { skillId } = useLocalSearchParams();

  const [skill, setSkill] = useState(null);
  const [strategies, setStrategies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);


  useEffect(() => {

    const loadData = async () => {

      try {

        setLoading(true);
        setError(false);


        // --------------------------------
        // 1. Load the selected skill
        // --------------------------------

        const skillRef = doc(
          db,
          'skills',
          String(skillId)
        );

        const skillSnap = await getDoc(skillRef);


        if (!skillSnap.exists()) {
          setError(true);
          return;
        }


        const skillData = {
          id: skillSnap.id,
          ...skillSnap.data(),
        };


        setSkill(skillData);


        // --------------------------------
        // 2. Determine strategy collection
        // --------------------------------

        let strategyCollection;


        if (skillId === 'morning-routine') {

          strategyCollection =
            'morningRoutineStrategies';

        } else {

          console.log(
            'No strategy collection configured for:',
            skillId
          );

          setStrategies([]);
          return;

        }


        // --------------------------------
        // 3. Load strategies
        // --------------------------------

        const strategySnapshot =
          await getDocs(
            collection(
              db,
              strategyCollection
            )
          );


        const loadedStrategies =
          strategySnapshot.docs.map(
            (strategyDoc) => ({
              id: strategyDoc.id,
              ...strategyDoc.data(),
            })
          );


        // Sort according to Firebase order field
        loadedStrategies.sort(
          (a, b) =>
            (a.order ?? 999) -
            (b.order ?? 999)
        );


        setStrategies(
          loadedStrategies
        );


      } catch (err) {

        console.error(
          'Error loading strategies:',
          err
        );

        setError(true);


      } finally {

        setLoading(false);

      }

    };


    if (skillId) {
      loadData();
    }

  }, [skillId]);


  // --------------------------------
  // Loading
  // --------------------------------

  if (loading) {

    return (

      <View style={s.statusContainer}>

        <ActivityIndicator size="large" />

        <Text style={s.statusText}>
          Loading strategies...
        </Text>

      </View>

    );

  }


  // --------------------------------
  // Error
  // --------------------------------

  if (error || !skill) {

    return (

      <View style={s.statusContainer}>

        <Text style={s.errorTitle}>
          Could not load strategies.
        </Text>


        <Pressable
          style={s.backButton}
          onPress={() => router.back()}
        >

          <Text style={s.backButtonText}>
            Go Back
          </Text>

        </Pressable>

      </View>

    );

  }


  // --------------------------------
  // Main screen
  // --------------------------------

  return (

    <ScrollView style={s.page}>

      <View style={s.header}>

        <Pressable
          onPress={() => router.back()}
        >

          <Ionicons
            name="chevron-back"
            size={28}
          />

        </Pressable>


        <Text style={s.title}>
          {skill.title}
        </Text>


        <View style={{ width: 28 }} />

      </View>


      <Text style={s.heading}>
        Recommended Strategies
      </Text>


      <Text style={s.intro}>
        Evidence-based guidance from the
        psychologists supporting this skill.
      </Text>


      {strategies.length === 0 ? (

        <View style={s.emptyCard}>

          <Text style={s.statusText}>
            No strategies have been added yet.
          </Text>

        </View>

      ) : (

        strategies.map((strategy, index) => (

          <View
            key={strategy.id}
            style={s.card}
          >

            <View style={s.number}>

              <Text style={s.numberText}>
                {index + 1}
              </Text>

            </View>


            <View style={{ flex: 1 }}>

              <Text style={s.cardTitle}>
                {strategy.title}
              </Text>


              {!!strategy.summary && (

                <Text style={s.detail}>
                  {strategy.summary}
                </Text>

              )}


              {!!strategy.recommendation && (

                <Text style={s.recommendation}>
                  {strategy.recommendation}
                </Text>

              )}

            </View>

          </View>

        ))

      )}


      <Pressable
        style={s.button}
        onPress={() =>
          router.push(
            `/skill/${skill.id}/visual`
          )
        }
      >

        <Ionicons
          name="sparkles"
          size={20}
          color="#FFF"
        />


        <Text style={s.buttonText}>
          Generate Step-by-Step Visual
        </Text>

      </Pressable>

    </ScrollView>

  );

}


const s = StyleSheet.create({

  page: {
    flex: 1,
    backgroundColor: '#F2F9FF',
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

  heading: {
    fontSize: 22,
    fontWeight: '800',
    marginHorizontal: 20,
    marginTop: 24,
  },

  intro: {
    marginHorizontal: 20,
    marginTop: 6,
    color: '#718096',
    lineHeight: 20,
  },

  card: {
    marginHorizontal: 16,
    marginTop: 13,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },

  number: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E3F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  numberText: {
    fontWeight: '800',
    color: '#2F9B69',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  detail: {
    fontSize: 14,
    color: '#657386',
    lineHeight: 20,
    marginTop: 4,
  },

  recommendation: {
    fontSize: 14,
    color: '#45556B',
    lineHeight: 20,
    marginTop: 8,
  },

  button: {
    margin: 18,
    marginTop: 26,
    backgroundColor: '#258DEB',
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 9,
  },

  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },

  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F9FF',
    padding: 30,
  },

  statusText: {
    marginTop: 10,
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
  },

  emptyCard: {
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17213A',
  },

  backButton: {
    marginTop: 20,
    backgroundColor: '#258DEB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },

  backButtonText: {
    color: '#FFF',
    fontWeight: '800',
  },

});