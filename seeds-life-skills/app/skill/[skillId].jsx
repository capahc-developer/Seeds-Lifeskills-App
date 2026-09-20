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
import { useEffect, useState } from 'react';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import { db } from '../../lib/firebase';


export default function Skill() {

  const { skillId } = useLocalSearchParams();

  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);


  useEffect(() => {

    const loadSkill = async () => {

      try {

        setLoading(true);
        setError(false);

        const skillRef = doc(
          db,
          'skills',
          String(skillId)
        );

        const skillSnap = await getDoc(skillRef);


        if (skillSnap.exists()) {

          setSkill({
            id: skillSnap.id,
            ...skillSnap.data(),
          });

        } else {

          setError(true);

        }

      } catch (err) {

        console.error(
          'Error loading skill from Firebase:',
          err
        );

        setError(true);

      } finally {

        setLoading(false);

      }

    };


    if (skillId) {
      loadSkill();
    }

  }, [skillId]);


  if (loading) {

    return (

      <View style={s.loadingContainer}>

        <ActivityIndicator size="large" />

        <Text style={s.loadingText}>
          Loading skill...
        </Text>

      </View>

    );

  }


  if (error || !skill) {

    return (

      <View style={s.loadingContainer}>

        <Text style={s.errorTitle}>
          Skill not found
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


        <Text style={s.headerTitle}>
          {skill.title}
        </Text>


        <View style={{ width: 28 }} />

      </View>


      <View style={s.hero}>

        <View style={s.heroIcon}>

          <Ionicons
            name={skill.icon || 'school-outline'}
            size={40}
            color="#EAA31B"
          />

        </View>


        <Text style={s.title}>
          {skill.title}
        </Text>


        <Text style={s.sub}>
          {skill.subtitle}
        </Text>

      </View>


      <View style={s.card}>

        <Text style={s.cardTitle}>
          About This Skill
        </Text>


        <Text style={s.body}>
          {skill.description}
        </Text>


        <Text
          style={[
            s.cardTitle,
            { marginTop: 18 },
          ]}
        >
          Common Goals
        </Text>


        {(skill.goals || []).map(
          (goal, index) => (

            <Text
              key={`${goal}-${index}`}
              style={s.goal}
            >
              • {goal}
            </Text>

          )
        )}

      </View>


      <Pressable
        style={s.button}
        onPress={() =>
          router.push(
            `/skill/${skill.id}/strategies`
          )
        }
      >

        <Text style={s.buttonText}>
          View Strategies
        </Text>

        <Ionicons
          name="arrow-forward"
          size={20}
          color="#FFF"
        />

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

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },

  hero: {
    alignItems: 'center',
    padding: 26,
  },

  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF1D4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
    marginTop: 12,
  },

  sub: {
    color: '#718096',
    marginTop: 5,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 20,
    padding: 18,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5F6B7A',
    marginTop: 7,
  },

  goal: {
    fontSize: 15,
    lineHeight: 26,
    color: '#45556B',
  },

  button: {
    margin: 16,
    backgroundColor: '#258DEB',
    padding: 17,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },

  buttonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 17,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F9FF',
    padding: 30,
  },

  loadingText: {
    marginTop: 12,
    color: '#718096',
    fontSize: 15,
  },

  errorTitle: {
    fontSize: 20,
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