import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '../../../lib/firebase';
import { ResourceList } from '../../../components/EmbeddedResourceCard';

const seedsResource = {
  title: 'SEEDS skill resources',
  description: 'Open the SEEDS resource page for videos and supporting materials.',
  url: 'https://www.capa-hc.org/seeds-2/',
  type: 'link',
};

export default function SkillStrategies() {
  const { skillId } = useLocalSearchParams();
  const resolvedSkillId = Array.isArray(skillId)
    ? skillId[0]
    : skillId;

  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resolvedSkillId) return;

    getDoc(
      doc(
        db,
        'skills',
        String(resolvedSkillId)
      )
    )
      .then((snapshot) => {
        if (snapshot.exists()) {
          setSkill({
            id: snapshot.id,
            ...snapshot.data(),
          });
        }
      })
      .catch((error) => {
        console.error(
          'Error loading skill strategies:',
          error
        );
      })
      .finally(() => setLoading(false));
  }, [resolvedSkillId]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" />
        <Text style={s.loadingText}>
          Loading strategies...
        </Text>
      </View>
    );
  }

  if (!skill) {
    return (
      <View style={s.center}>
        <Text style={s.emptyTitle}>
          Skill not found
        </Text>
        <Pressable
          style={s.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={s.primaryText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const strategies = Array.isArray(
    skill.strategies
  )
    ? skill.strategies
    : [];

  const resources = [
    ...(Array.isArray(skill.resources)
      ? skill.resources
      : []),
    seedsResource,
  ];

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

        <Text style={s.headerTitle}>
          Strategies
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <View style={s.hero}>
        <Ionicons
          name="bulb-outline"
          size={32}
          color="#248A6B"
        />

        <View style={{ flex: 1 }}>
          <Text style={s.title}>
            {skill.title}
          </Text>
          <Text style={s.subtitle}>
            Practical ideas for supporting
            this skill.
          </Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>
          Teaching Strategies
        </Text>

        {strategies.length === 0 ? (
          <Text style={s.emptyText}>
            No skill-specific strategies have
            been added yet. Use General
            Strategies or ask the SEEDS
            Assistant for help troubleshooting
            a difficult step.
          </Text>
        ) : (
          strategies.map(
            (strategy, index) => (
              <View
                key={
                  strategy.id ||
                  strategy.title ||
                  index
                }
                style={s.strategyRow}
              >
                <View style={s.number}>
                  <Text style={s.numberText}>
                    {index + 1}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={s.strategyTitle}>
                    {typeof strategy === 'string'
                      ? strategy
                      : strategy.title}
                  </Text>

                  {typeof strategy !== 'string' &&
                    !!(
                      strategy.detail ||
                      strategy.description
                    ) && (
                      <Text style={s.strategyText}>
                        {strategy.detail ||
                          strategy.description}
                      </Text>
                    )}
                </View>
              </View>
            )
          )
        )}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>
          Videos & Resources
        </Text>
        <Text style={s.resourceHint}>
          Links added to this skill's
          resources array in Firebase appear
          here automatically.
        </Text>
        <ResourceList resources={resources} />
      </View>

      <View style={s.aiCard}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={24}
          color="#258DEB"
        />
        <View style={{ flex: 1 }}>
          <Text style={s.aiTitle}>
            Stuck on one step?
          </Text>
          <Text style={s.aiText}>
            Open the SEEDS Assistant in the
            corner and describe exactly where
            your child gets stuck. It can help
            identify a smaller missing step.
          </Text>
        </View>
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
    paddingBottom: 44,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#17213A',
  },
  hero: {
    margin: 16,
    marginBottom: 0,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#E8F7F2',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#17365D',
  },
  subtitle: {
    marginTop: 4,
    color: '#617083',
    lineHeight: 19,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17213A',
    marginBottom: 12,
  },
  strategyRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  number: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#248A6B',
  },
  strategyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#17213A',
  },
  strategyText: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#617083',
  },
  emptyText: {
    color: '#718096',
    lineHeight: 21,
  },
  resourceHint: {
    marginTop: -4,
    marginBottom: 12,
    fontSize: 12,
    lineHeight: 17,
    color: '#718096',
  },
  aiCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#EAF5FF',
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#245A87',
  },
  aiText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#526173',
  },
  center: {
    flex: 1,
    backgroundColor: '#F2F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    color: '#718096',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#17213A',
  },
  primaryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#258DEB',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
