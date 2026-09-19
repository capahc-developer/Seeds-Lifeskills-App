import React, { useEffect, useMemo, useState } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';

import { db } from '../lib/firebase';


const ratingInfo = [
  { label: 'Great', emoji: '😄' },
  { label: 'Good', emoji: '🙂' },
  { label: 'Okay', emoji: '😐' },
  { label: 'Hard', emoji: '☹️' },
  { label: 'Very hard', emoji: '😣' },
];


export default function Reports() {

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);


  // -----------------------------------
  // LOAD PRACTICE LOGS
  // -----------------------------------

  useEffect(() => {

    const loadReports = async () => {

      try {

        const logsQuery = query(
          collection(db, 'practiceLog'),
          orderBy('createdAt', 'desc')
        );

        const snapshot =
          await getDocs(logsQuery);

        const loadedLogs =
          snapshot.docs.map((logDoc) => ({
            id: logDoc.id,
            ...logDoc.data(),
          }));

        setLogs(loadedLogs);

      } catch (error) {

        console.error(
          'Error loading reports:',
          error
        );

      } finally {

        setLoading(false);

      }

    };

    loadReports();

  }, []);


  // -----------------------------------
  // LAST 4 WEEKS
  // -----------------------------------

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


  // -----------------------------------
  // TOTAL SESSIONS
  // -----------------------------------

  const totalSessions =
    recentLogs.length;


  // -----------------------------------
  // SUCCESS RATE
  // Good + Great = success
  // -----------------------------------

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


  // -----------------------------------
  // UNIQUE SKILLS
  // -----------------------------------

  const skillsPracticed =
    new Set(
      recentLogs
        .map(
          (log) =>
            log.skillId ||
            log.skill
        )
        .filter(Boolean)
    ).size;


  // -----------------------------------
  // RATING COUNTS
  // -----------------------------------

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
              (
                count /
                totalSessions
              ) * 100
            )
          : 0;

      return {
        ...rating,
        count,
        percent,
      };

    });


  // -----------------------------------
  // SKILL PROGRESS
  // -----------------------------------

  const skillProgress =
    useMemo(() => {

      const groups = {};

      recentLogs.forEach((log) => {

        const id =
          log.skillId ||
          log.skill;

        if (!id) {
          return;
        }

        if (!groups[id]) {

          groups[id] = {
            id,
            title:
              log.skill ||
              'Unnamed Skill',
            total: 0,
            successful: 0,
          };

        }

        groups[id].total += 1;

        if (
          log.rating === 'Good' ||
          log.rating === 'Great'
        ) {

          groups[id].successful += 1;

        }

      });


      return Object.values(groups)
        .map((skill) => ({

          ...skill,

          percent:
            skill.total > 0
              ? Math.round(
                  (
                    skill.successful /
                    skill.total
                  ) * 100
                )
              : 0,

        }))
        .sort(
          (a, b) =>
            b.total - a.total
        );

    }, [recentLogs]);


  // -----------------------------------
  // PRACTICE ACTIVITY
  // 4 rolling 7-day periods
  // Week 4 = most recent
  // -----------------------------------

  const weeklyActivity =
    useMemo(() => {

      const now = new Date();

      const weeks = [
        { label: 'Week 1', count: 0 },
        { label: 'Week 2', count: 0 },
        { label: 'Week 3', count: 0 },
        { label: 'Week 4', count: 0 },
      ];


      recentLogs.forEach((log) => {

        if (!log.createdAt?.toDate) {
          return;
        }

        const logDate =
          log.createdAt.toDate();

        const millisecondsAgo =
          now.getTime() -
          logDate.getTime();

        const daysAgo =
          Math.floor(
            millisecondsAgo /
            (
              1000 *
              60 *
              60 *
              24
            )
          );


        if (
          daysAgo >= 0 &&
          daysAgo < 28
        ) {

          const weekIndex =
            3 -
            Math.floor(
              daysAgo / 7
            );

          if (
            weekIndex >= 0 &&
            weekIndex <= 3
          ) {

            weeks[weekIndex].count += 1;

          }

        }

      });

      return weeks;

    }, [recentLogs]);


  const maxWeeklyActivity =
    Math.max(
      ...weeklyActivity.map(
        (week) => week.count
      ),
      1
    );


  // -----------------------------------
  // PRACTICE STREAK
  //
  // One or more logs on the same day
  // counts as one practice day.
  //
  // A current streak can have its most
  // recent practice today or yesterday.
  // -----------------------------------

  const practiceStreak =
    useMemo(() => {

      const practiceDays = [
        ...new Set(
          logs
            .filter(
              (log) =>
                log.createdAt?.toDate
            )
            .map((log) => {

              const date =
                log.createdAt.toDate();

              return new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
              ).getTime();

            })
        ),
      ].sort(
        (a, b) => b - a
      );


      if (
        practiceDays.length === 0
      ) {

        return 0;

      }


      const today = new Date();

      const todayStart =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        ).getTime();


      const oneDay =
        24 * 60 * 60 * 1000;


      const mostRecentDay =
        practiceDays[0];


      // No practice today or yesterday:
      // current streak has ended.

      if (
        mostRecentDay !==
          todayStart &&
        mostRecentDay !==
          todayStart - oneDay
      ) {

        return 0;

      }


      let streak = 1;


      for (
        let i = 1;
        i < practiceDays.length;
        i++
      ) {

        const difference =
          practiceDays[i - 1] -
          practiceDays[i];


        if (
          difference === oneDay
        ) {

          streak += 1;

        } else {

          break;

        }

      }


      return streak;

    }, [logs]);


  // -----------------------------------
  // LOADING
  // -----------------------------------

  if (loading) {

    return (

      <View style={s.loading}>

        <ActivityIndicator
          size="large"
        />

        <Text style={s.loadingText}>
          Building report...
        </Text>

      </View>

    );

  }


  // -----------------------------------
  // SCREEN
  // -----------------------------------

  return (

    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
    >

      {/* HEADER */}

      <View style={s.header}>

        <Pressable
          onPress={() =>
            router.back()
          }
        >

          <Ionicons
            name="chevron-back"
            size={28}
          />

        </Pressable>


        <Text style={s.headerTitle}>
          Reports
        </Text>


        <View style={{ width: 28 }} />

      </View>


      <Text style={s.intro}>
        See progress, celebrate success,
        and find areas for support.
      </Text>


      <View style={s.period}>

        <Text style={s.periodText}>
          Last 4 Weeks
        </Text>

        <Ionicons
          name="calendar-outline"
          size={16}
          color="#45556B"
        />

      </View>


      {/* SUMMARY */}

      <View style={s.summaryRow}>

        <View style={s.summaryCard}>

          <Ionicons
            name="clipboard-outline"
            size={26}
            color="#258DEB"
          />

          <Text style={s.metric}>
            {totalSessions}
          </Text>

          <Text style={s.metricLabel}>
            Practice
            {'\n'}
            Sessions
          </Text>

        </View>


        <View style={s.summaryCard}>

          <Ionicons
            name="stats-chart"
            size={26}
            color="#45A66B"
          />

          <Text style={s.metric}>
            {successRate}%
          </Text>

          <Text style={s.metricLabel}>
            Success
            {'\n'}
            Rate
          </Text>

        </View>


        <View style={s.summaryCard}>

          <Ionicons
            name="star"
            size={26}
            color="#F6B72B"
          />

          <Text style={s.metric}>
            {skillsPracticed}
          </Text>

          <Text style={s.metricLabel}>
            Skills
            {'\n'}
            Practiced
          </Text>

        </View>

      </View>


      {/* PRACTICE STREAK */}

      <View style={s.streakCard}>

        <View style={s.streakIcon}>

          <Ionicons
            name="flame"
            size={30}
            color="#F39A32"
          />

        </View>


        <View style={{ flex: 1 }}>

          <Text style={s.streakTitle}>

            {practiceStreak > 0
              ? `${practiceStreak}-Day Practice Streak`
              : 'Start a Practice Streak'}

          </Text>


          <Text style={s.streakSubtitle}>

            {practiceStreak > 0
              ? 'Keep practicing to continue the streak!'
              : 'Log practice today to begin a new streak.'}

          </Text>

        </View>

      </View>


      {/* PRACTICE ACTIVITY */}

      <View style={s.card}>

        <View style={s.chartHeader}>

          <View>

            <Text style={s.cardTitle}>
              Practice Activity
            </Text>

            <Text style={s.chartSubtitle}>
              Sessions per week
            </Text>

          </View>


          <View style={s.activityBadge}>

            <Ionicons
              name="calendar-outline"
              size={15}
              color="#258DEB"
            />

            <Text
              style={
                s.activityBadgeText
              }
            >
              {totalSessions} total
            </Text>

          </View>

        </View>


        <View style={s.chart}>

          {weeklyActivity.map(
            (week, index) => {

              const barHeight =
                week.count === 0
                  ? 4
                  : Math.max(
                      20,
                      (
                        week.count /
                        maxWeeklyActivity
                      ) * 120
                    );


              return (

                <View
                  key={week.label}
                  style={s.barColumn}
                >

                  <Text
                    style={s.barValue}
                  >
                    {week.count}
                  </Text>


                  <View
                    style={s.barArea}
                  >

                    <View
                      style={[
                        s.bar,
                        {
                          height:
                            barHeight,
                        },
                      ]}
                    />

                  </View>


                  <Text
                    style={s.barLabel}
                  >
                    Wk {index + 1}
                  </Text>

                </View>

              );

            }
          )}

        </View>


        <View
          style={s.chartDivider}
        />


        <View style={s.chartFooter}>

          <Ionicons
            name="information-circle-outline"
            size={17}
            color="#8290A2"
          />

          <Text
            style={s.chartFooterText}
          >
            Each bar shows the number of
            practice sessions logged during
            that week. Week 4 is the most
            recent week.
          </Text>

        </View>

      </View>


      {/* HOW DID IT GO */}

      <View style={s.card}>

        <Text style={s.cardTitle}>
          How Did It Go?
        </Text>


        {ratingCounts.map(
          (rating) => (

            <View
              key={rating.label}
              style={s.ratingRow}
            >

              <Text style={s.emoji}>
                {rating.emoji}
              </Text>


              <Text
                style={s.ratingLabel}
              >
                {rating.label}
              </Text>


              <View
                style={
                  s.progressBackground
                }
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


              <Text style={s.percent}>
                {rating.percent}%
              </Text>

            </View>

          )
        )}

      </View>


      {/* SKILLS PROGRESS */}

      <View style={s.card}>

        <Text style={s.cardTitle}>
          Skills Progress
        </Text>


        {skillProgress.length === 0 ? (

          <Text style={s.empty}>
            No practice data yet.
          </Text>

        ) : (

          skillProgress.map(
            (skill) => (

              <Pressable
                key={skill.id}
                style={s.skillRow}
                onPress={() =>
                  router.push(
                    `/reports/${skill.id}`
                  )
                }
              >

                <View
                  style={{ flex: 1 }}
                >

                  <Text
                    style={s.skillTitle}
                  >
                    {skill.title}
                  </Text>


                  <View
                    style={
                      s.skillProgressBackground
                    }
                  >

                    <View
                      style={[
                        s.skillProgressFill,
                        {
                          width:
                            `${skill.percent}%`,
                        },
                      ]}
                    />

                  </View>

                </View>


                <Text
                  style={s.skillPercent}
                >
                  {skill.percent}%
                </Text>


                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#8290A2"
                />

              </Pressable>

            )
          )

        )}

      </View>


      {/* RECENT PRACTICE */}

      <View style={s.card}>

        <Text style={s.cardTitle}>
          Recent Practice
        </Text>


        {recentLogs.length === 0 ? (

          <Text style={s.empty}>
            No recent practice logs.
          </Text>

        ) : (

          recentLogs
            .slice(0, 5)
            .map((log) => {

              const rating =
                ratingInfo.find(
                  (r) =>
                    r.label ===
                    log.rating
                );


              return (

                <View
                  key={log.id}
                  style={s.recentRow}
                >

                  <View
                    style={{ flex: 1 }}
                  >

                    <Text
                      style={s.recentSkill}
                    >
                      {log.skill}
                    </Text>

                    <Text
                      style={s.recentDate}
                    >
                      {log.date}
                    </Text>

                  </View>


                  <Text
                    style={s.recentRating}
                  >
                    {rating?.emoji}{' '}
                    {log.rating}
                  </Text>

                </View>

              );

            })

        )}

      </View>

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
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#17213A',
  },

  intro: {
    marginHorizontal: 20,
    marginTop: 22,
    fontSize: 16,
    lineHeight: 23,
    color: '#718096',
  },

  period: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 16,
    paddingHorizontal: 15,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  periodText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#17213A',
  },


  // SUMMARY

  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 18,
    gap: 8,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
  },

  metric: {
    fontSize: 24,
    fontWeight: '800',
    color: '#17213A',
    marginTop: 7,
  },

  metricLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },


  // STREAK

  streakCard: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: '#FFF7E8',
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  streakIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFE8BD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  streakTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#17213A',
  },

  streakSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
    lineHeight: 18,
  },


  // GENERAL CARD

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


  // ACTIVITY CHART

  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  chartSubtitle: {
    fontSize: 13,
    color: '#8290A2',
    marginTop: -8,
  },

  activityBadge: {
    backgroundColor: '#EAF5FF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  activityBadgeText: {
    color: '#258DEB',
    fontSize: 12,
    fontWeight: '700',
  },

  chart: {
    height: 175,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginTop: 18,
  },

  barColumn: {
    flex: 1,
    height: 170,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  barArea: {
    height: 125,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  bar: {
    width: 36,
    backgroundColor: '#64B5F6',
    borderRadius: 9,
  },

  barValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#45556B',
    marginBottom: 5,
  },

  barLabel: {
    fontSize: 12,
    color: '#8290A2',
    marginTop: 7,
  },

  chartDivider: {
    height: 1,
    backgroundColor: '#EEF1F5',
    marginTop: 7,
  },

  chartFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 11,
  },

  chartFooterText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#8290A2',
  },


  // RATINGS

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  emoji: {
    width: 30,
    fontSize: 20,
  },

  ratingLabel: {
    width: 75,
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
    backgroundColor: '#64B5F6',
    borderRadius: 5,
  },

  percent: {
    width: 45,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: '#45556B',
  },


  // SKILLS

  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
    gap: 10,
  },

  skillTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17213A',
    marginBottom: 8,
  },

  skillProgressBackground: {
    height: 9,
    backgroundColor: '#EDF1F5',
    borderRadius: 5,
    overflow: 'hidden',
  },

  skillProgressFill: {
    height: 9,
    backgroundColor: '#258DEB',
    borderRadius: 5,
  },

  skillPercent: {
    width: 42,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
    color: '#45556B',
  },


  // RECENT PRACTICE

  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },

  recentSkill: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17213A',
  },

  recentDate: {
    marginTop: 3,
    fontSize: 12,
    color: '#8290A2',
  },

  recentRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#45556B',
  },

  empty: {
    color: '#8290A2',
    fontSize: 14,
  },


  // LOADING

  loading: {
    flex: 1,
    backgroundColor: '#F2F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#718096',
  },

});