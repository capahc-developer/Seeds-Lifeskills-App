import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../lib/firebase';


const colors = [
  '#FFF0D7',
  '#E2F7EA',
  '#FFE5E8',
  '#EEE8FF',
  '#E3F7EA',
  '#E3F0FF',
];


export default function AllSkills() {

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);


  useEffect(() => {

    const loadSkills = async () => {

      try {

        setLoading(true);
        setError(false);

        console.log('Starting to load skills from Firebase...');

        const skillsQuery = query(
          collection(db, 'skills'),
          where('active', '==', true)
        );

        const snapshot = await getDocs(skillsQuery);

        console.log(
          'Skills query successful. Documents found:',
          snapshot.size
        );


        const loadedSkills = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));


        // Sort by the order field in Firebase
        loadedSkills.sort(
          (a, b) => (a.order ?? 999) - (b.order ?? 999)
        );


        console.log('Loaded skills:', loadedSkills);

        setSkills(loadedSkills);


      } catch (err) {

        console.error(
          'Error loading skills from Firebase:',
          err
        );

        console.log(
          'FIREBASE ERROR CODE:',
          err?.code
        );

        console.log(
          'FIREBASE ERROR MESSAGE:',
          err?.message
        );

        setError(true);


      } finally {

        setLoading(false);

      }

    };


    loadSkills();

  }, []);


  return (

    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
    >

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
          All Skills
        </Text>


        <View style={{ width: 28 }} />

      </View>


      <Text style={s.intro}>
        Choose an area to find the specific skill
        you want to practice.
      </Text>


      {loading && (

        <View style={s.statusContainer}>

          <ActivityIndicator size="large" />

          <Text style={s.statusText}>
            Loading skills...
          </Text>

        </View>

      )}


      {!loading && error && (

        <View style={s.statusContainer}>

          <Text style={s.errorText}>
            We couldn't load the skills.
          </Text>

        </View>

      )}


      {!loading && !error && skills.length === 0 && (

        <View style={s.statusContainer}>

          <Text style={s.statusText}>
            No skills are available yet.
          </Text>

        </View>

      )}


      {!loading &&
        !error &&
        skills.map((skill, i) => (

          <Pressable
            key={skill.id}
            style={s.card}
            onPress={() =>
              router.push(`/skill/${skill.id}`)
            }
          >

            <View
              style={[
                s.icon,
                {
                  backgroundColor:
                    colors[i % colors.length],
                },
              ]}
            >

              <Ionicons
                name={skill.icon || 'school-outline'}
                size={27}
                color="#4C78A8"
              />

            </View>


            <View style={{ flex: 1 }}>

              <Text style={s.cardTitle}>
                {skill.title}
              </Text>

              <Text style={s.sub}>
                {skill.subtitle}
              </Text>

            </View>


            <Ionicons
              name="chevron-forward"
              size={22}
              color="#7B8794"
            />

          </Pressable>

        ))}

    </ScrollView>

  );

}


const s = StyleSheet.create({

  page: {
    flex: 1,
    backgroundColor: '#F1F9FF',
  },

  content: {
    paddingBottom: 36,
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
    fontSize: 21,
    fontWeight: '800',
  },

  intro: {
    fontSize: 15,
    color: '#718096',
    margin: 20,
    lineHeight: 21,
  },

  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#17213A',
  },

  sub: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
  },

  statusContainer: {
    padding: 30,
    alignItems: 'center',
  },

  statusText: {
    marginTop: 10,
    fontSize: 15,
    color: '#718096',
  },

  errorText: {
    fontSize: 15,
    color: '#B42318',
  },

});