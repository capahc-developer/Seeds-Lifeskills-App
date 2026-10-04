import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const sections = [
  {
    title: '1. Information We Collect',
    body:
      'Independent Steps may collect account information such as your email address, name, relationship to the student, and an optional phone number. The app may also store student profile information that you choose to provide, including a first name or nickname, age, strengths, learning barriers, interests, and a selected avatar.',
  },
  {
    title: '2. How We Use Information',
    body:
      'We use this information to provide account access, save your preferences, personalize student learning supports, display progress and profile information, improve app functionality, and provide features you request.',
  },
  {
    title: '3. Student Information',
    body:
      'Student profile information is entered by an adult account holder and is associated with that adult account. Please only provide information that is reasonably necessary to use Independent Steps. Independent Steps is intended to support parents, guardians, caregivers, and educators and is not intended to replace professional medical, educational, psychological, or therapeutic advice.',
  },
  {
    title: '4. Firebase',
    body:
      'Independent Steps uses Google Firebase services for authentication and cloud data storage. Firebase may process account identifiers and app data as needed to provide these services. Information stored in Firestore is associated with the signed-in account where supported by the app.',
  },
  {
    title: '5. AI Features',
    body:
      'If you use an AI-powered feature, the text you submit and relevant context needed to answer your request may be sent to our AI service provider, including OpenAI, to generate a response. Do not submit information that is unnecessary for the request. AI responses may be incomplete or inaccurate and should be reviewed by an adult before being relied upon.',
  },
  {
    title: '6. Sharing of Information',
    body:
      'We do not sell personal information. We may share information with service providers only as needed to operate app features, such as authentication, cloud storage, hosting, and AI processing. We may also disclose information when required by law or to protect the safety and security of users or the service.',
  },
  {
    title: '7. Data Retention and Account Deletion',
    body:
      'You may request deletion directly in the app by using Delete Account. When the deletion process succeeds, Independent Steps deletes the Firebase Authentication account and the adult and student profile documents associated with that account that are managed by the current app. Some information may remain temporarily in service-provider backups or logs where required for security, legal, or operational purposes.',
  },
  {
    title: '8. Security',
    body:
      'We use reasonable technical and organizational measures to protect information. However, no method of electronic storage or transmission can be guaranteed to be completely secure.',
  },
  {
    title: '9. Your Choices',
    body:
      'You can update adult profile information in the app, update the student profile, reset your password, sign out, or delete your account. You can choose not to provide optional profile information.',
  },
  {
    title: '10. Changes to This Policy',
    body:
      'We may update this Privacy Policy as Independent Steps changes. The effective date shown on this page should be updated whenever material changes are made.',
  },
  {
    title: '11. Contact',
    body:
      'Questions about privacy or account deletion may be directed to SEEDS / CAPA-HC through the official contact information provided with Independent Steps.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={28} color="#17213A" />
        </Pressable>

        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.introCard}>
        <Text style={styles.title}>Independent Steps Privacy Policy</Text>
        <Text style={styles.effective}>Effective: October 4, 2026</Text>
        <Text style={styles.intro}>
          This policy explains how Independent Steps, a SEEDS / CAPA-HC project,
          handles information provided through the app.
        </Text>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </View>
      ))}

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={22} color="#47749A" />
        <Text style={styles.noteText}>
          This policy should be reviewed before App Store release and updated
          whenever the app adds new data collection, analytics, storage, or AI
          features.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F2F9FF' },
  content: { paddingBottom: 44 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#17213A' },
  introCard: {
    margin: 18,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#17213A' },
  effective: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#718096',
  },
  intro: { marginTop: 14, fontSize: 15, lineHeight: 22, color: '#526170' },
  section: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#17213A' },
  body: { marginTop: 8, fontSize: 15, lineHeight: 22, color: '#526170' },
  note: {
    margin: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#E6F2FF',
    flexDirection: 'row',
    gap: 10,
  },
  noteText: { flex: 1, color: '#47749A', lineHeight: 20 },
});
