import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStudentProfile } from '../context/StudentProfileContext';

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../lib/firebase';


const fields = [
  {
    key: 'strengths',
    label: 'Strengths',
    hint: 'What does your child do well?',
    placeholder:
      'Example: learns well with pictures, strong memory, enjoys routines',
  },
  {
    key: 'barriers',
    label: 'Learning Barriers',
    hint: 'What makes learning challenging?',
    placeholder:
      'Example: difficulty following multistep directions, sensitivity to sounds/smells, mobility issues',
  },
  {
    key: 'interests',
    label: 'Interests',
    hint: 'What does your child enjoy?',
    placeholder:
      'Example: trains, music, animals, space, favorite characters',
  },
];


export default function StudentProfile() {

  const { profile, updateProfile } = useStudentProfile();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  // Load saved student profile from Firebase
  useEffect(() => {

    const loadProfile = async () => {

      try {

        const profileRef = doc(
          db,
          'studentProfiles',
          'currentStudent'
        );

        const profileSnap = await getDoc(profileRef);


        if (profileSnap.exists()) {

          const data = profileSnap.data();

          updateProfile({
            name: data.name || '',
            age: data.age != null
              ? String(data.age)
              : '',
            strengths: data.strengths || '',
            barriers: data.barriers || '',
            interests: data.interests || '',
          });

        }

      } catch (error) {

        console.error(
          'Error loading student profile:',
          error
        );

        Alert.alert(
          'Error',
          'Could not load the student profile.'
        );

      } finally {

        setLoading(false);

      }

    };


    loadProfile();

  }, []);


  // Save/update student profile in Firebase
  const saveProfile = async () => {

    try {

      setSaving(true);


      await setDoc(
        doc(
          db,
          'studentProfiles',
          'currentStudent'
        ),
        {
          name: profile.name.trim(),

          age: profile.age
            ? Number(profile.age)
            : null,

          strengths: profile.strengths.trim(),

          barriers: profile.barriers.trim(),

          interests: profile.interests.trim(),

          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );


      Alert.alert(
        'Saved',
        'Student profile saved successfully.'
      );


      router.back();


    } catch (error) {

      console.error(
        'Error saving student profile:',
        error
      );

      Alert.alert(
        'Error',
        'Could not save the student profile.'
      );


    } finally {

      setSaving(false);

    }

  };


  // Show loading screen while Firebase retrieves profile
  if (loading) {

    return (

      <View style={s.loadingContainer}>

        <ActivityIndicator size="large" />

        <Text style={s.loadingText}>
          Loading profile...
        </Text>

      </View>

    );

  }


  return (

    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
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


        <Text style={s.headerTitle}>
          Student Profile
        </Text>


        <View style={{ width: 28 }} />

      </View>


      <View style={s.avatar}>

        <Ionicons
          name="person-outline"
          size={48}
          color="#2F8CF0"
        />

      </View>


      <Text style={s.section}>
        Basic Information
      </Text>


      <TextInput
        style={s.input}
        value={profile.name}
        onChangeText={(v) =>
          updateProfile({
            name: v,
          })
        }
        placeholder="Child's first name or nickname"
      />


      <TextInput
        style={s.input}
        value={profile.age}
        onChangeText={(v) =>
          updateProfile({
            age: v,
          })
        }
        placeholder="Age (optional)"
        keyboardType="number-pad"
      />


      {fields.map((f) => (

        <View
          key={f.key}
          style={s.field}
        >

          <Text style={s.label}>
            {f.label}
          </Text>


          <Text style={s.hint}>
            {f.hint}
          </Text>


          <TextInput
            style={s.textarea}
            multiline
            value={profile[f.key]}
            onChangeText={(v) =>
              updateProfile({
                [f.key]: v,
              })
            }
            placeholder={f.placeholder}
            textAlignVertical="top"
          />

        </View>

      ))}


      <View style={s.note}>

        <Ionicons
          name="shield-checkmark-outline"
          size={22}
          color="#438A6A"
        />


        <Text style={s.noteText}>
          This profile is used to personalize
          strategies and step-by-step visuals
          for your child.
        </Text>

      </View>


      <Pressable
        style={[
          s.button,
          saving && s.buttonDisabled,
        ]}
        onPress={saveProfile}
        disabled={saving}
      >

        {saving ? (

          <ActivityIndicator color="#FFF" />

        ) : (

          <Text style={s.buttonText}>
            Save Profile
          </Text>

        )}

      </Pressable>

    </ScrollView>

  );

}


const s = StyleSheet.create({

  page: {
    flex: 1,
    backgroundColor: '#F2F9FF',
  },

  content: {
    paddingBottom: 40,
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#DDEEFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  section: {
    fontSize: 17,
    fontWeight: '800',
    margin: 20,
    marginBottom: 10,
  },

  input: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D9E4EE',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },

  field: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
  },

  label: {
    fontSize: 17,
    fontWeight: '800',
    color: '#17213A',
  },

  hint: {
    fontSize: 13,
    color: '#718096',
    marginTop: 3,
    marginBottom: 10,
  },

  textarea: {
    minHeight: 92,
    borderWidth: 1,
    borderColor: '#D9E4EE',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    lineHeight: 21,
  },

  note: {
    margin: 20,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#E9F8F0',
    padding: 14,
    borderRadius: 14,
  },

  noteText: {
    flex: 1,
    color: '#426557',
    lineHeight: 19,
  },

  button: {
    marginHorizontal: 20,
    backgroundColor: '#258DEB',
    borderRadius: 18,
    padding: 17,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F9FF',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#718096',
  },

});