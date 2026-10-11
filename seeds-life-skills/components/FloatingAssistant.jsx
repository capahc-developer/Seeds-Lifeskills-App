import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useGlobalSearchParams,
  usePathname,
} from 'expo-router';
import { httpsCallable } from 'firebase/functions';

import { functions } from '../lib/firebase';

const starterPrompts = [
  'How can I make this easier?',
  'Give me a practice idea.',
  'How should I prompt my child?',
];

export default function FloatingAssistant() {
  const pathname = usePathname();
  const routeParams = useGlobalSearchParams();
  const scrollRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi! I can help you teach skills, adjust steps, and come up with practice ideas. What would you like help with?',
    },
  ]);

  const hidden = useMemo(
    () =>
      pathname === '/login' ||
      pathname === '/delete-account' ||
      pathname === '/privacy-policy',
    [pathname]
  );

  if (hidden) return null;

  const sendMessage = async (preset) => {
    const text = String(preset ?? draft).trim();

    if (!text || sending) return;

    const nextMessages = [
      ...messages,
      { role: 'user', content: text },
    ];

    setMessages(nextMessages);
    setDraft('');
    setError('');
    setSending(true);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });

    try {
      const chatAssistant = httpsCallable(
        functions,
        'chatAssistant'
      );

      const safeParams = Object.fromEntries(
        Object.entries(routeParams || {}).map(([key, value]) => [
          key,
          Array.isArray(value)
            ? String(value[0] ?? '')
            : String(value ?? ''),
        ])
      );

      const result = await chatAssistant({
        screenPath: pathname,
        params: safeParams,
        messages: nextMessages.slice(-10),
      });

      const answer =
        typeof result.data?.answer === 'string'
          ? result.data.answer.trim()
          : '';

      if (!answer) {
        throw new Error('The assistant returned an empty response.');
      }

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: answer },
      ]);
    } catch (cause) {
      console.error('Assistant chat error:', cause);
      setError(
        cause?.message ||
          'The assistant is unavailable right now. Please try again.'
      );
    } finally {
      setSending(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open caregiver assistant"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.floatingButton,
          pressed && styles.floatingPressed,
        ]}
      >
        <Ionicons
          name="chatbubble-ellipses"
          size={28}
          color="#FFFFFF"
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Close assistant"
            onPress={() => setOpen(false)}
            style={styles.backdrop}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardArea}
          >
            <View style={styles.sheet}>
              <View style={styles.handle} />

              <View style={styles.header}>
                <View style={styles.assistantIcon}>
                  <Ionicons
                    name="sparkles"
                    size={20}
                    color="#258DEB"
                  />
                </View>

                <View style={styles.headerText}>
                  <Text style={styles.title}>SEEDS Assistant</Text>
                  <Text style={styles.subtitle}>
                    Caregiver support for everyday skills
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close assistant"
                  onPress={() => setOpen(false)}
                  style={styles.closeButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color="#526170"
                  />
                </Pressable>
              </View>

              <ScrollView
                ref={scrollRef}
                style={styles.messages}
                contentContainerStyle={styles.messagesContent}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() =>
                  scrollRef.current?.scrollToEnd({
                    animated: true,
                  })
                }
              >
                {messages.map((message, index) => (
                  <View
                    key={index}
                    style={[
                      styles.bubble,
                      message.role === 'user'
                        ? styles.userBubble
                        : styles.assistantBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        message.role === 'user' &&
                          styles.userBubbleText,
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>
                ))}

                {sending && (
                  <View
                    style={[
                      styles.bubble,
                      styles.assistantBubble,
                      styles.typingBubble,
                    ]}
                  >
                    <ActivityIndicator size="small" color="#258DEB" />
                    <Text style={styles.typingText}>Thinking...</Text>
                  </View>
                )}

                {!!error && (
                  <View style={styles.errorBox}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color="#B42318"
                    />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </ScrollView>

              {messages.length <= 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.promptRow}
                >
                  {starterPrompts.map((prompt) => (
                    <Pressable
                      key={prompt}
                      onPress={() => sendMessage(prompt)}
                      style={styles.promptChip}
                    >
                      <Text style={styles.promptText}>{prompt}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <View style={styles.composer}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Ask about a skill or strategy..."
                  placeholderTextColor="#8B98A8"
                  multiline
                  maxLength={1500}
                  style={styles.input}
                  onSubmitEditing={() => sendMessage()}
                  blurOnSubmit={false}
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                  onPress={() => sendMessage()}
                  disabled={!draft.trim() || sending}
                  style={[
                    styles.sendButton,
                    (!draft.trim() || sending) &&
                      styles.sendDisabled,
                  ]}
                >
                  <Ionicons
                    name="arrow-up"
                    size={21}
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>

              <Text style={styles.disclaimer}>
                AI can make mistakes. Review suggestions before using them.
              </Text>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#258DEB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
    zIndex: 100,
  },
  floatingPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 42, 66, 0.34)',
  },
  keyboardArea: {
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '78%',
    maxHeight: 720,
    backgroundColor: '#F4FAFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C8D3DE',
    marginTop: 9,
  },
  header: {
    minHeight: 72,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#DFEAF3',
    backgroundColor: '#FFFFFF',
  },
  assistantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#17213A',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#718096',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 10,
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 10,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#258DEB',
    borderBottomRightRadius: 6,
  },
  bubbleText: {
    color: '#35465A',
    fontSize: 14,
    lineHeight: 20,
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    color: '#718096',
    fontSize: 13,
  },
  errorBox: {
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#FFF1F0',
    borderWidth: 1,
    borderColor: '#FDA29B',
    flexDirection: 'row',
    gap: 7,
    alignItems: 'flex-start',
  },
  errorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 12,
    lineHeight: 17,
  },
  promptRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  promptChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#EAF5FF',
    borderWidth: 1,
    borderColor: '#CFE7FA',
  },
  promptText: {
    color: '#245A87',
    fontSize: 12,
    fontWeight: '700',
  },
  composer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DFEAF3',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: '#F2F6FA',
    color: '#17213A',
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#258DEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.4,
  },
  disclaimer: {
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
    textAlign: 'center',
    fontSize: 10,
    color: '#8995A4',
    backgroundColor: '#FFFFFF',
  },
});
