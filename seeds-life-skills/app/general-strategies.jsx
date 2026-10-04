import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStrategyGuides } from '../lib/strategyGuides';

export default function GeneralStrategies() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sectionOffsets, setSectionOffsets] = useState({});
  const scrollRef = useRef(null);
  const { width } = useWindowDimensions();
  const compact = width < 900;

  useEffect(() => {
    getStrategyGuides({ includeInactive: true })
      .then((items) => {
        const sorted = [...items].sort(
          (a, b) => (a.order ?? 999) - (b.order ?? 999)
        );
        setStrategies(sorted);
      })
      .catch((err) => {
        console.error('Error loading strategy guides:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const jumpToStrategy = (strategyId) => {
    const y = sectionOffsets[strategyId];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 18), animated: true });
      if (compact) setSidebarOpen(false);
    }
  };

  const renderBullets = (items = []) =>
    items.map((item, index) => (
      <View key={index} style={s.bulletRow}>
        <Text style={s.bullet}>•</Text>
        <Text style={s.bulletText}>
          {typeof item === 'string' ? item : item.description}
        </Text>
      </View>
    ));

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={s.headerButton}
        >
          <Ionicons name="chevron-back" size={28} color="#17365D" />
        </Pressable>

        <View style={s.headerTitleWrap}>
          <Text style={s.headerTitle}>General Strategies</Text>
          <Text style={s.headerSubtitle}>
            A quick-reference guide for supporting everyday independence
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={sidebarOpen ? 'Hide table of contents' : 'Show table of contents'}
          onPress={() => setSidebarOpen((value) => !value)}
          style={s.headerButton}
        >
          <Ionicons
            name={sidebarOpen ? 'close-outline' : 'list-outline'}
            size={28}
            color="#17365D"
          />
        </Pressable>
      </View>

      <View style={s.body}>
        {sidebarOpen && (
          <View
            style={[
              s.sidebar,
              compact && {
                position: 'absolute',
                width: Math.min(width * 0.82, 330),
                top: 0,
                bottom: 0,
                left: 0,
                zIndex: 20,
              },
            ]}
          >
            <View style={s.sidebarTop}>
              <Text style={s.sidebarEyebrow}>TABLE OF CONTENTS</Text>
              <Text style={s.sidebarTitle}>12 Strategies</Text>
            </View>

            <ScrollView
              style={s.sidebarScroll}
              contentContainerStyle={s.sidebarContent}
              showsVerticalScrollIndicator={false}
            >
              {strategies.map((strategy, index) => (
                <Pressable
                  key={strategy.id}
                  onPress={() => jumpToStrategy(strategy.id)}
                  style={({ pressed }) => [
                    s.tocItem,
                    pressed && s.tocItemPressed,
                  ]}
                >
                  <View style={s.tocNumber}>
                    <Text style={s.tocNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={s.tocText}>{strategy.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {compact && sidebarOpen && (
          <Pressable
            accessibilityLabel="Close table of contents"
            onPress={() => setSidebarOpen(false)}
            style={s.overlay}
          />
        )}

        <ScrollView
          ref={scrollRef}
          style={s.main}
          contentContainerStyle={s.mainContent}
          showsVerticalScrollIndicator
        >
          <View style={s.introCard}>
            <Text style={s.introTitle}>How to use this guide</Text>
            <Text style={s.introText}>
              These strategies are designed as a fast reference for parents and
              caregivers. Read straight through, or use the table of contents to
              jump to the strategy you need.
            </Text>
          </View>

          {loading && (
            <View style={s.status}>
              <ActivityIndicator size="large" />
              <Text style={s.statusText}>Loading strategies...</Text>
            </View>
          )}

          {!loading && error && (
            <View style={s.status}>
              <Text style={s.error}>We could not load the strategies.</Text>
            </View>
          )}

          {!loading &&
            !error &&
            strategies.map((strategy, index) => (
              <View
                key={strategy.id}
                onLayout={(event) => {
                  const y = event.nativeEvent.layout.y;
                  setSectionOffsets((currentOffsets) => {
                    if (currentOffsets[strategy.id] === y) return currentOffsets;
                    return { ...currentOffsets, [strategy.id]: y };
                  });
                }}
                style={s.strategySection}
              >
                <View style={s.strategyHeading}>
                  <View style={s.sectionNumber}>
                    <Text style={s.sectionNumberText}>{index + 1}</Text>
                  </View>
                  <View style={s.strategyHeadingText}>
                    <Text style={s.strategyTitle}>{strategy.title}</Text>
                    {strategy.tagline ? (
                      <Text style={s.tagline}>{strategy.tagline}</Text>
                    ) : null}
                  </View>
                </View>

                {strategy.summary ? (
                  <Text style={s.summary}>{strategy.summary}</Text>
                ) : null}

                {strategy.whenToUse?.length ? (
                  <GuideBlock title="When to use it">
                    {renderBullets(strategy.whenToUse)}
                  </GuideBlock>
                ) : null}

                {strategy.steps?.length ? (
                  <GuideBlock title="Steps">
                    {strategy.steps.map((step, stepIndex) => (
                      <View key={step.order || stepIndex} style={s.stepRow}>
                        <View style={s.stepNumber}>
                          <Text style={s.stepNumberText}>
                            {step.order || stepIndex + 1}
                          </Text>
                        </View>
                        <View style={s.stepBody}>
                          <Text style={s.stepTitle}>{step.title}</Text>
                          <Text style={s.stepText}>{step.description}</Text>
                        </View>
                      </View>
                    ))}
                  </GuideBlock>
                ) : null}

                {strategy.methods?.length ? (
                  <GuideBlock title="Ways to use this strategy">
                    {strategy.methods.map((method, methodIndex) => (
                      <View key={method.id || methodIndex} style={s.methodCard}>
                        <Text style={s.methodTitle}>{method.title}</Text>
                        <Text style={s.methodText}>{method.description}</Text>
                      </View>
                    ))}
                  </GuideBlock>
                ) : null}

                {strategy.promptTypes?.length ? (
                  <GuideBlock title="Types of prompts">
                    {strategy.promptTypes.map((prompt, promptIndex) => (
                      <View key={prompt.type || promptIndex} style={s.methodCard}>
                        <Text style={s.methodTitle}>{prompt.type}</Text>
                        <Text style={s.methodText}>{prompt.description}</Text>
                      </View>
                    ))}
                  </GuideBlock>
                ) : null}

                {strategy.examples?.length ? (
                  <GuideBlock title="Examples">
                    {strategy.examples.map((example, exampleIndex) => (
                      <View key={exampleIndex} style={s.exampleCard}>
                        <Text style={s.exampleTitle}>{example.title}</Text>
                        <Text style={s.exampleText}>{example.description}</Text>
                      </View>
                    ))}
                  </GuideBlock>
                ) : null}

                {strategy.implementationTips?.length ? (
                  <GuideBlock title="Helpful tips">
                    {renderBullets(strategy.implementationTips)}
                  </GuideBlock>
                ) : null}

                {strategy.adjustmentOptions?.length ? (
                  <GuideBlock title="Possible adjustments">
                    {renderBullets(strategy.adjustmentOptions)}
                  </GuideBlock>
                ) : null}

                {strategy.keyTakeaways?.length ? (
                  <GuideBlock title="Key takeaways" accent>
                    {renderBullets(strategy.keyTakeaways)}
                  </GuideBlock>
                ) : null}
              </View>
            ))}
        </ScrollView>
      </View>
    </View>
  );
}

function GuideBlock({ title, children, accent = false }) {
  return (
    <View style={[s.guideBlock, accent && s.guideBlockAccent]}>
      <Text style={s.guideTitle}>{title}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#EDF7FD',
  },
  header: {
    minHeight: 96,
    paddingTop: 36,
    paddingBottom: 14,
    paddingHorizontal: 18,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDEAF4',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 30,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#17213A',
  },
  headerSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: '#718096',
    marginTop: 2,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  sidebar: {
    width: 290,
    backgroundColor: '#FFF',
    borderRightWidth: 1,
    borderRightColor: '#DDEAF4',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 8,
  },
  sidebarTop: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  sidebarEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#438A6A',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17365D',
    marginTop: 4,
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarContent: {
    padding: 12,
    paddingBottom: 30,
  },
  tocItem: {
    minHeight: 48,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  tocItemPressed: {
    backgroundColor: '#EDF7FD',
  },
  tocNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tocNumberText: {
    color: '#287D64',
    fontSize: 12,
    fontWeight: '800',
  },
  tocText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: '#34435A',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 15,
    backgroundColor: 'rgba(20, 42, 66, 0.20)',
  },
  main: {
    flex: 1,
  },
  mainContent: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 60,
  },
  introCard: {
    backgroundColor: '#E6F4FB',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17365D',
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#526173',
    marginTop: 7,
  },
  status: {
    padding: 40,
    alignItems: 'center',
  },
  statusText: {
    marginTop: 10,
    color: '#718096',
  },
  error: {
    color: '#B42318',
  },
  strategySection: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E1ECF4',
  },
  strategyHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  sectionNumber: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#17365D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  strategyHeadingText: {
    flex: 1,
  },
  strategyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#17365D',
  },
  tagline: {
    fontSize: 15,
    lineHeight: 21,
    color: '#397A68',
    fontWeight: '700',
    marginTop: 4,
  },
  summary: {
    fontSize: 15,
    lineHeight: 24,
    color: '#526173',
    marginTop: 16,
  },
  guideBlock: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#E8EEF3',
  },
  guideBlockAccent: {
    backgroundColor: '#F3FAF7',
    borderTopWidth: 0,
    borderRadius: 14,
    padding: 16,
  },
  guideTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#17213A',
    marginBottom: 11,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 18,
    color: '#248A6B',
    lineHeight: 21,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: '#526173',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#248A6B',
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#17213A',
  },
  stepText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#617083',
    marginTop: 3,
  },
  methodCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 13,
    marginBottom: 9,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#17213A',
    textTransform: 'capitalize',
  },
  methodText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#617083',
    marginTop: 4,
  },
  exampleCard: {
    backgroundColor: '#FFF8E9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 9,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#704D11',
  },
  exampleText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#66583E',
    marginTop: 4,
  },
});
