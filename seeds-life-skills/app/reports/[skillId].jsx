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
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';

import { practiceLogsForCurrentUser } from '../../lib/userData';

import { db } from '../../lib/firebase';


const ratingInfo = [
  { label: 'Did it independently', emoji: '😊' },
  { label: 'Some help needed', emoji: '😐' },
  { label: 'Hard today', emoji: '😟' },
];
const legacyRatings = {
  Great: 'Did it independently',
  Good: 'Did it independently',
  Okay: 'Some help needed',
  Hard: 'Hard today',
  'Very hard': 'Hard today',
};
const normalizeRating = (log) => {
  const value = log.rating || log.outcome;
  return legacyRatings[value] || value;
};


const STATUS_COLORS = {
  'Did it independently': '#42B96C',
  'Some help needed': '#F2BF4A',
  'Hard today': '#E77A80',
};
const dateKeyForLog = (log) => {
  if (typeof log.practiceDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(log.practiceDate)) {
    return log.practiceDate;
  }
  const timestamp = log.createdAt?.toDate?.();
  if (timestamp instanceof Date && !Number.isNaN(timestamp.getTime())) {
    return `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}`;
  }
  if (log.date) {
    const parsed = new Date(log.date);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    }
  }
  return null;
};

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
          practiceLogsForCurrentUser(),
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
            normalizeRating(log) === rating.label
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


  const practiceTimeline = useMemo(() => {
    const grouped = new Map();
    recentLogs.forEach((log) => {
      const date = dateKeyForLog(log);
      if (!date) return;
      if (!grouped.has(date)) {
        grouped.set(date, { date, counts: { 'Did it independently': 0, 'Some help needed': 0, 'Hard today': 0 }, total: 0 });
      }
      const row = grouped.get(date);
      const status = normalizeRating(log);
      if (Object.prototype.hasOwnProperty.call(row.counts, status)) {
        row.counts[status] += 1;
      }
      row.total += 1;
    });
    return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [recentLogs]);
  const maxDailySessions = Math.max(1, ...practiceTimeline.map((day) => day.total));

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
          onPress={() => router.canGoBack() ? router.back() : router.replace('/reports')}
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
          onPress={() => router.canGoBack() ? router.back() : router.replace('/reports')}
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
            {ratingCounts[0].count}
          </Text>

          <Text style={s.metricLabel}>
            Independent Practices
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


      {/* PRACTICE OVER TIME */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Practice Over Time</Text>
        <Text style={s.chartSubtitle}>Daily practice sessions in the last 4 weeks</Text>
        <View style={s.chartLegend}>
          {ratingInfo.map((rating) => (
            <View key={rating.label} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: STATUS_COLORS[rating.label] }]} />
              <Text style={s.legendText}>{rating.label}</Text>
            </View>
          ))}
        </View>
        {practiceTimeline.length === 0 ? (
          <Text style={s.emptyText}>No dated practice sessions to chart yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={s.timelineScroll}>
            {practiceTimeline.map((day) => {
              const parts = ratingInfo.filter((rating) => day.counts[rating.label] > 0);
              return (
                <View key={day.date} style={s.timelineColumn}>
                  <Text style={s.barCount}>{day.total}</Text>
                  <View style={s.barTrack}>
                    <View style={[s.barStack, { height: Math.max(12, (day.total / maxDailySessions) * 130) }]}>
                      {parts.map((rating) => (
                        <View
                          key={rating.label}
                          style={{
                            flex: day.counts[rating.label],
                            backgroundColor: STATUS_COLORS[rating.label],
                            width: '100%',
                          }}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={s.barDate}>{day.date.slice(5).replace('-', '/')}</Text>
                </View>
              );
            })}
          </ScrollView>
        )}
        <Text style={s.chartFootnote}>Bar height = number of sessions; color = recorded outcome.</Text>
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
            .map((log) => {

              const rating =
                ratingInfo.find(
                  (r) =>
                    r.label === normalizeRating(log)
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
                      {normalizeRating(log) || 'Not rated'}
                    </Text>

                  </View>


                  {!!log.status && (

                    <Text style={s.logStatus}>
                      {log.status}
                    </Text>

                  )}


                  {!!log.whatWentWell && (
                    <Text style={s.logComment}>Went well: {log.whatWentWell}</Text>
                  )}
                  {!!log.whatWasDifficult && (
                    <Text style={s.logComment}>Difficult: {log.whatWasDifficult}</Text>
                  )}
                  {!!(log.additionalNotes || log.adjustment) && (
                    <Text style={s.logComment}>Notes: {log.additionalNotes || log.adjustment}</Text>
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
        onPress={() => router.replace('/reports')}
      >

        <Text style={s.strategyButtonText}>
          Back to Reports
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

  chartSubtitle: { color: '#718096', fontSize: 13, marginBottom: 12 },
  chartLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#45556B' },
  timelineScroll: { alignItems: 'flex-end', paddingBottom: 4, paddingRight: 8, minWidth: '100%' },
  timelineColumn: { width: 54, alignItems: 'center', marginRight: 9 },
  barCount: { fontSize: 12, color: '#45556B', fontWeight: '700', marginBottom: 5 },
  barTrack: { height: 130, width: 29, justifyContent: 'flex-end', backgroundColor: '#F1F4F8', borderRadius: 5, overflow: 'hidden' },
  barStack: { width: '100%', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden', borderRadius: 4 },
  barDate: { fontSize: 11, color: '#718096', marginTop: 7 },
  chartFootnote: { fontSize: 12, color: '#8290A2', marginTop: 12 },
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