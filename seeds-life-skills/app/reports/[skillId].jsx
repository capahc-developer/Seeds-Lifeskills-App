import React, { useEffect, useMemo, useState } from 'react';

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
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';

import { db } from '../../lib/firebase';


const ratingInfo = [
  { label: 'Great', emoji: '😄' },
  { label: 'Good', emoji: '🙂' },
  { label: 'Okay', emoji: '😐' },
  { label: 'Hard', emoji: '☹️' },
  { label: 'Very hard', emoji: '😣' },
];


export default function SkillReport() {

  const { skillId } = useLocalSearchParams();

  const [skill, setSkill] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const loadReport = async () => {

      try {

        // -------------------------
        // Load skill information
        // -------------------------

        const skillRef = doc(
          db,
          'skills',
          String(skillId)
        );

        const skillSnap =
          await getDoc(skillRef);


        if (skillSnap.exists()) {

          setSkill({
            id: skillSnap.id,
            ...skillSnap.data(),
          });

        }


        // -------------------------
        // Load practice logs
        // -------------------------

        const logsQuery = query(
          collection(db, 'practiceLog'),
          orderBy('createdAt', 'desc')
        );


        const snapshot =
          await getDocs(logsQuery);


        const loadedLogs =
          snapshot.docs
            .map((logDoc) => ({
              id: logDoc.id,
              ...logDoc.data(),
            }))
            .filter(
              (log) =>
                log.skillId === skillId
            );


        setLogs(loadedLogs);


      } catch (error) {

        console.error(
          'Error loading skill report:',
          error
        );


      } finally {

        setLoading(false);

      }

    };


    if (skillId) {
      loadReport();
    }

  }, [skillId]);


  // --------------------------------
  // LAST 4 WEEKS
  // --------------------------------

  const recentLogs = useMemo(() => {

    const cutoff = new Date();

    cutoff.setDate(
      cutoff.getDate() - 28
    );


    return logs.filter((log) => {

      if (!log.createdAt?.toDate) {
        return true;
      }

      return (
        log.createdAt.toDate() >= cutoff
      );

    });

  }, [logs]);


  const totalSessions =
    recentLogs.length;


  // --------------------------------
  // RATING BREAKDOWN
  // --------------------------------

  const ratingCounts =
    ratingInfo.map((rating) => {

      const count =
        recentLogs.filter(
          (log) =>
            log.rating === rating.label
        ).length;


      const percent =
        totalSessions > 0
          ? Math.round(
              (count / totalSessions) * 100
            )
          : 0;


      return {
        ...rating,
        count,
        percent,
      };

    });


  // --------------------------------
  // SUCCESS RATE
  // --------------------------------

  const successfulSessions =
    recentLogs.filter(
      (log) =>
        log.rating === 'Good' ||
        log.rating === 'Great'
    ).length;


  const successRate =
    totalSessions > 0
      ? Math.round(
          (
            successfulSessions /
            totalSessions
          ) * 100
        )
      : 0;


  if (loading) {

    return (

      <View style={s.loading}>

        <ActivityIndicator size="large" />

        <Text style={s.loadingText}>
          Building skill report...
        </Text>

      </View>

    );

  }


  if (!skill) {

    return (

      <View style={s.loading}>

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

    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
    >

      {/* HEADER */}

      <View style={s.header}>

        <Pressable
          style={s.headerBack}
          onPress={() => router.back()}
        >

          <Ionicons
            name="chevron-back"
            size={27}
            color="#258DEB"
          />

          <Text style={s.headerBackText}>
            Back
          </Text>

        </Pressable>


        <Text style={s.headerTitle}>
          Skill Report
        </Text>


        <View style={{ width: 65 }} />

      </View>


      {/* SKILL */}

      <View style={s.skillHero}>

        <View style={s.skillIcon}>

          <Ionicons
            name={
              skill.icon ||
              'school-outline'
            }
            size={34}
            color="#EAA31B"
          />

        </View>


        <View style={{ flex: 1 }}>

          <Text style={s.skillName}>
            {skill.title}
          </Text>

          <Text style={s.skillSubtitle}>
            {totalSessions} practice{' '}
            {totalSessions === 1
              ? 'session'
              : 'sessions'}{' '}
            in the last 4 weeks
          </Text>

        </View>

      </View>


      {/* SUMMARY */}

      <View style={s.summaryRow}>

        <View style={s.summaryCard}>

          <Ionicons
            name="clipboard-outline"
            size={25}
            color="#258DEB"
          />

          <Text style={s.metric}>
            {totalSessions}
          </Text>

          <Text style={s.metricLabel}>
            Sessions
          </Text>

        </View>


        <View style={s.summaryCard}>

          <Ionicons
            name="stats-chart"
            size={25}
            color="#43A66A"
          />

          <Text style={s.metric}>
            {successRate}%
          </Text>

          <Text style={s.metricLabel}>
            Success Rate
          </Text>

        </View>

      </View>


      {/* PRACTICE RESULTS */}

      <View style={s.card}>

        <Text style={s.cardTitle}>
          Practice Results
        </Text>


        {ratingCounts.map((rating) => (

          <View
            key={rating.label}
            style={s.resultRow}
          >

            <Text style={s.emoji}>
              {rating.emoji}
            </Text>


            <Text style={s.resultLabel}>
              {rating.label}
            </Text>


            <View
              style={s.progressBackground}
            >

              <View
                style={[
                  s.progressFill,
                  {
                    width:
                      `${rating.percent}%`,
                  },
                ]}
              />

            </View>


            <Text style={s.resultPercent}>
              {rating.percent}%
            </Text>


            <Text style={s.resultCount}>
              {rating.count}
            </Text>

          </View>

        ))}

      </View>


      {/* RECENT LOGS */}

      <View style={s.card}>

        <Text style={s.cardTitle}>
          Recent Practice Logs
        </Text>


        {recentLogs.length === 0 ? (

          <Text style={s.emptyText}>
            No practice has been logged
            for this skill yet.
          </Text>

        ) : (

          recentLogs
            .slice(0, 5)
            .map((log) => {

              const rating =
                ratingInfo.find(
                  (r) =>
                    r.label === log.rating
                );


              return (

                <View
                  key={log.id}
                  style={s.logRow}
                >

                  <View style={s.logTop}>

                    <Text style={s.logDate}>
                      {log.date}
                    </Text>


                    <Text style={s.logRating}>
                      {rating?.emoji}{' '}
                      {log.rating}
                    </Text>

                  </View>


                  {!!log.status && (

                    <Text style={s.logStatus}>
                      {log.status}
                    </Text>

                  )}


                  {!!log.comments && (

                    <Text style={s.logComment}>
                      {log.comments}
                    </Text>

                  )}

                </View>

              );

            })

        )}

      </View>


      {/* STRATEGIES */}

      <Pressable
        style={s.strategyButton}
        onPress={() =>
          router.push(
            `/skill/${skill.id}/strategies`
          )
        }
      >

        <Text style={s.strategyButtonText}>
          View Skill Strategies
        </Text>


        <Ionicons
          name="arrow-forward"
          size={20}
          color="#FFFFFF"
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

  content: {
    paddingBottom: 50,
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 17,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerBack: {
    width: 65,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerBackText: {
    color: '#258DEB',
    fontSize: 16,
    fontWeight: '600',
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#17213A',
  },

  skillHero: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  skillIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF1D4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  skillName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#17213A',
  },

  skillSubtitle: {
    color: '#718096',
    fontSize: 13,
    marginTop: 4,
  },

  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    alignItems: 'center',
  },

  metric: {
    fontSize: 25,
    fontWeight: '800',
    color: '#17213A',
    marginTop: 7,
  },

  metricLabel: {
    fontSize: 13,
    color: '#718096',
    marginTop: 3,
  },

  card: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#17213A',
    marginBottom: 15,
  },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  emoji: {
    width: 30,
    fontSize: 20,
  },

  resultLabel: {
    width: 72,
    fontSize: 14,
    color: '#45556B',
  },

  progressBackground: {
    flex: 1,
    height: 10,
    backgroundColor: '#EDF1F5',
    borderRadius: 5,
    overflow: 'hidden',
  },

  progressFill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#64B5F6',
  },

  resultPercent: {
    width: 45,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: '#45556B',
  },

  resultCount: {
    width: 24,
    textAlign: 'right',
    fontSize: 12,
    color: '#8290A2',
  },

  logRow: {
    backgroundColor: '#F6F9FC',
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
  },

  logTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  logDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#45556B',
  },

  logRating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#45556B',
  },

  logStatus: {
    fontSize: 12,
    color: '#8290A2',
    marginTop: 5,
  },

  logComment: {
    fontSize: 13,
    color: '#657386',
    lineHeight: 18,
    marginTop: 5,
  },

  emptyText: {
    color: '#8290A2',
    fontSize: 14,
  },

  strategyButton: {
    margin: 18,
    marginTop: 24,
    backgroundColor: '#258DEB',
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },

  strategyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F9FF',
  },

  loadingText: {
    marginTop: 12,
    color: '#718096',
  },

  errorTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#17213A',
  },

  backButton: {
    marginTop: 20,
    backgroundColor: '#258DEB',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

});