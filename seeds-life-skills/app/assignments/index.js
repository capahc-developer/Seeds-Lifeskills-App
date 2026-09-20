import React, { useEffect, useState } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import ScreenContainer from '../../components/ScreenContainer';

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../../lib/firebase';


const ratings = [
  { label: 'Very hard', emoji: '😣' },
  { label: 'Hard', emoji: '☹️' },
  { label: 'Okay', emoji: '😐' },
  { label: 'Good', emoji: '🙂' },
  { label: 'Great', emoji: '😄' },
];


const statuses = [
  'Practicing',
  'Completed',
  'Needs Help',
];


export default function PracticeLogScreen() {

  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');

  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [comments, setComments] = useState('');

  const [showSkills, setShowSkills] = useState(false);
  const [showStatuses, setShowStatuses] = useState(false);

  const [skills, setSkills] = useState([]);
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  const today = new Date().toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );


  // -----------------------------------------
  // Load skills and existing practice logs
  // -----------------------------------------

  useEffect(() => {

    const loadData = async () => {

      try {

        setLoading(true);


        // ---------------------------
        // Load skills from Firebase
        // ---------------------------

        const skillsSnapshot =
          await getDocs(
            collection(db, 'skills')
          );


        const loadedSkills =
          skillsSnapshot.docs
            .map((skillDoc) => ({
              id: skillDoc.id,
              ...skillDoc.data(),
            }))
            .filter(
              (skill) =>
                skill.active !== false
            );


        loadedSkills.sort(
          (a, b) =>
            (a.order ?? 999) -
            (b.order ?? 999)
        );


        setSkills(loadedSkills);


        // ---------------------------
        // Load Practice Logs
        // ---------------------------

        const logsQuery = query(
          collection(db, 'practiceLog'),
          orderBy('createdAt', 'desc')
        );


        const logsSnapshot =
          await getDocs(logsQuery);


        const loadedLogs =
          logsSnapshot.docs.map(
            (logDoc) => {

              const data = logDoc.data();

              return {
                id: logDoc.id,
                ...data,
              };

            }
          );


        setLogs(loadedLogs);


      } catch (error) {

        console.error(
          'Error loading practice log:',
          error
        );

        Alert.alert(
          'Error',
          'Could not load the practice log.'
        );


      } finally {

        setLoading(false);

      }

    };


    loadData();

  }, []);


  // -----------------------------------------
  // Save Practice Log
  // -----------------------------------------

  const saveLog = async () => {

    if (!selectedSkill) {

      Alert.alert(
        'Select a skill',
        'Please select the skill that was practiced.'
      );

      return;

    }


    if (!selectedStatus) {

      Alert.alert(
        'Select a status',
        'Please select a practice status.'
      );

      return;

    }


    if (!selectedRating) {

      Alert.alert(
        'Add a rating',
        'Please tell us how the practice went.'
      );

      return;

    }


    try {

      setSaving(true);


      const newLog = {

        date: today,

        skill: selectedSkill,

        skillId: selectedSkillId,

        status: selectedStatus,

        rating: selectedRating,

        comments: comments.trim(),

        createdAt: serverTimestamp(),

      };


      const docRef = await addDoc(
        collection(db, 'practiceLog'),
        newLog
      );


      // Add immediately to the screen
      setLogs((current) => [

        {
          id: docRef.id,
          ...newLog,

          // createdAt is still being resolved by
          // Firebase, so the displayed date is
          // already available from "date".
        },

        ...current,

      ]);


      // Clear the form
      setSelectedSkill('');
      setSelectedSkillId('');

      setSelectedStatus('');
      setSelectedRating('');
      setComments('');

      setShowSkills(false);
      setShowStatuses(false);


      Alert.alert(
        'Saved',
        'Practice log saved successfully.'
      );


    } catch (error) {

      console.error(
        'Error saving practice log:',
        error
      );


      Alert.alert(
        'Error',
        'Could not save the practice log.'
      );


    } finally {

      setSaving(false);

    }

  };


  // -----------------------------------------
  // Screen
  // -----------------------------------------

  return (

    <ScreenContainer>

      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >

        {/* Header */}

        <View style={styles.header}>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >

            <Ionicons
              name="chevron-back"
              size={26}
              color="#168CE8"
            />

            <Text style={styles.backText}>
              Back
            </Text>

          </Pressable>


          <Text style={styles.headerTitle}>
            Practice Log
          </Text>


          <View style={styles.headerSpacer} />

        </View>


        <Text style={styles.headerSubtitle}>
          Track progress and practice attempts.
        </Text>


        {/* Add Practice Log */}

        <View style={styles.formCard}>

          <Text style={styles.sectionTitle}>
            Add a Practice Log
          </Text>


          {/* Date */}

          <Text style={styles.label}>
            Date
          </Text>


          <View style={styles.inputBox}>

            <Text style={styles.inputText}>
              {today}
            </Text>

            <Ionicons
              name="calendar-outline"
              size={22}
              color="#69778A"
            />

          </View>


          {/* Skill */}

          <Text style={styles.label}>
            Skill
          </Text>


          <Pressable
            style={styles.inputBox}
            onPress={() =>
              setShowSkills(!showSkills)
            }
          >

            <Text
              style={[
                styles.inputText,
                !selectedSkill &&
                  styles.placeholder,
              ]}
            >
              {selectedSkill ||
                'Select a skill'}
            </Text>


            <Ionicons
              name={
                showSkills
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={22}
              color="#69778A"
            />

          </Pressable>


          {showSkills && (

            <View style={styles.dropdown}>

              {skills.map((skill) => (

                <Pressable
                  key={skill.id}
                  style={styles.dropdownItem}
                  onPress={() => {

                    setSelectedSkill(
                      skill.title
                    );

                    setSelectedSkillId(
                      skill.id
                    );

                    setShowSkills(false);

                  }}
                >

                  <Text
                    style={styles.dropdownText}
                  >
                    {skill.title}
                  </Text>

                </Pressable>

              ))}

            </View>

          )}


          {/* Status */}

          <Text style={styles.label}>
            Status
          </Text>


          <Pressable
            style={styles.inputBox}
            onPress={() =>
              setShowStatuses(
                !showStatuses
              )
            }
          >

            <Text
              style={[
                styles.inputText,
                !selectedStatus &&
                  styles.placeholder,
              ]}
            >

              {selectedStatus ||
                'Select a status'}

            </Text>


            <Ionicons
              name={
                showStatuses
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={22}
              color="#69778A"
            />

          </Pressable>


          {showStatuses && (

            <View style={styles.dropdown}>

              {statuses.map((status) => (

                <Pressable
                  key={status}
                  style={styles.dropdownItem}
                  onPress={() => {

                    setSelectedStatus(
                      status
                    );

                    setShowStatuses(false);

                  }}
                >

                  <Text
                    style={styles.dropdownText}
                  >
                    {status}
                  </Text>

                </Pressable>

              ))}

            </View>

          )}


          {/* Rating */}

          <Text style={styles.label}>
            How did it go?
          </Text>


          <View style={styles.ratingRow}>

            {ratings.map((rating) => {

              const selected =
                selectedRating ===
                rating.label;


              return (

                <Pressable
                  key={rating.label}
                  style={[
                    styles.ratingButton,
                    selected &&
                      styles.ratingSelected,
                  ]}
                  onPress={() =>
                    setSelectedRating(
                      rating.label
                    )
                  }
                >

                  <Text style={styles.emoji}>
                    {rating.emoji}
                  </Text>

                  <Text
                    style={styles.ratingText}
                  >
                    {rating.label}
                  </Text>

                </Pressable>

              );

            })}

          </View>


          {/* Comments */}

          <Text style={styles.label}>
            Comments
          </Text>


          <TextInput
            style={styles.commentBox}
            value={comments}
            onChangeText={setComments}
            placeholder="Add any notes (optional)..."
            placeholderTextColor="#8A95A5"
            multiline
            maxLength={500}
            textAlignVertical="top"
          />


          <Text style={styles.characterCount}>
            {comments.length}/500
          </Text>


          {/* Save */}

          <Pressable
            style={[
              styles.saveButton,
              saving &&
                styles.saveButtonDisabled,
            ]}
            onPress={saveLog}
            disabled={saving}
          >

            {saving ? (

              <ActivityIndicator
                color="#FFFFFF"
              />

            ) : (

              <Text
                style={styles.saveButtonText}
              >
                Save Log
              </Text>

            )}

          </Pressable>

        </View>


        {/* Recent Logs */}

        <Text style={styles.recentTitle}>
          Recent Logs
        </Text>


        {loading ? (

          <View style={styles.emptyCard}>

            <ActivityIndicator size="large" />

            <Text style={styles.emptyText}>
              Loading practice logs...
            </Text>

          </View>

        ) : logs.length === 0 ? (

          <View style={styles.emptyCard}>

            <Ionicons
              name="clipboard-outline"
              size={34}
              color="#9AA7B5"
            />


            <Text style={styles.emptyTitle}>
              No practice logs yet
            </Text>


            <Text style={styles.emptyText}>
              Your saved practice attempts
              will appear here.
            </Text>

          </View>

        ) : (

          logs.map((log) => (

            <View
              key={log.id}
              style={styles.logCard}
            >

              <View style={styles.logDate}>

                <Text
                  style={styles.logDateText}
                >
                  {log.date}
                </Text>

              </View>


              <View style={styles.logDetails}>

                <Text style={styles.logSkill}>
                  {log.skill}
                </Text>


                {!!log.rating && (

                  <Text
                    style={styles.logRating}
                  >

                    {
                      ratings.find(
                        (r) =>
                          r.label ===
                          log.rating
                      )?.emoji
                    }{' '}

                    {log.rating}

                  </Text>

                )}


                {!!log.status && (

                  <Text
                    style={styles.logStatus}
                  >
                    Status: {log.status}
                  </Text>

                )}


                {!!log.comments && (

                  <Text
                    style={styles.logComments}
                  >
                    {log.comments}
                  </Text>

                )}

              </View>

            </View>

          ))

        )}

      </ScrollView>

    </ScreenContainer>

  );

}


const styles = StyleSheet.create({

  page: {
    flex: 1,
    backgroundColor: '#EEF8FF',
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
  },

  backText: {
    fontSize: 17,
    color: '#168CE8',
    fontWeight: '600',
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#171B34',
  },

  headerSpacer: {
    width: 90,
  },

  headerSubtitle: {
    textAlign: 'center',
    fontSize: 15,
    color: '#7A8495',
    marginTop: 7,
    marginBottom: 22,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },

  sectionTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#171B34',
    marginBottom: 18,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171B34',
    marginBottom: 8,
    marginTop: 10,
  },

  inputBox: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: '#F3F7FC',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  inputText: {
    fontSize: 16,
    color: '#39465A',
    flex: 1,
  },

  placeholder: {
    color: '#8A95A5',
  },

  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#E1E7EE',
    overflow: 'hidden',
  },

  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F4',
  },

  dropdownText: {
    fontSize: 16,
    color: '#171B34',
  },

  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },

  ratingButton: {
    flex: 1,
    minHeight: 78,
    backgroundColor: '#F3F7FC',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  ratingSelected: {
    borderColor: '#168CE8',
    backgroundColor: '#EAF5FF',
  },

  emoji: {
    fontSize: 25,
  },

  ratingText: {
    fontSize: 11,
    color: '#39465A',
    marginTop: 5,
    textAlign: 'center',
  },

  commentBox: {
    height: 115,
    backgroundColor: '#F3F7FC',
    borderRadius: 15,
    padding: 14,
    fontSize: 16,
    color: '#171B34',
  },

  characterCount: {
    alignSelf: 'flex-end',
    marginTop: -24,
    marginRight: 10,
    marginBottom: 12,
    color: '#8A95A5',
    fontSize: 12,
  },

  saveButton: {
    backgroundColor: '#168CE8',
    minHeight: 55,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  recentTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#171B34',
    marginTop: 28,
    marginBottom: 12,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#39465A',
    marginTop: 10,
  },

  emptyText: {
    fontSize: 14,
    color: '#7A8495',
    marginTop: 8,
    textAlign: 'center',
  },

  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
  },

  logDate: {
    width: 95,
    borderRightWidth: 1,
    borderRightColor: '#DCE3EA',
    justifyContent: 'center',
  },

  logDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#39465A',
  },

  logDetails: {
    flex: 1,
    paddingLeft: 16,
  },

  logSkill: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171B34',
  },

  logRating: {
    fontSize: 15,
    color: '#2B9A52',
    fontWeight: '600',
    marginTop: 4,
  },

  logStatus: {
    fontSize: 13,
    color: '#7A8495',
    marginTop: 4,
  },

  logComments: {
    fontSize: 14,
    color: '#69778A',
    marginTop: 7,
    lineHeight: 19,
  },

});