import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const accountRows = [
  {
    title: 'Adult Profile',
    subtitle: 'View your account details, password options, and logout.',
    icon: 'person-circle-outline',
    color: '#2F8CF0',
    tint: '#E6F2FF',
    route: '/profile',
  },
  {
    title: 'Edit Account',
    subtitle: 'Update your name, relationship to the student, and contact information.',
    icon: 'create-outline',
    color: '#7C5CE7',
    tint: '#EEE9FF',
    route: '/account-edit',
  },
];

const privacyRows = [
  {
    title: 'Privacy Policy',
    subtitle: 'See how Independent Steps handles account and student information.',
    icon: 'shield-checkmark-outline',
    color: '#438A6A',
    tint: '#E9F8F0',
    route: '/privacy-policy',
  },
  {
    title: 'Delete Account',
    subtitle: 'Permanently delete your login and account-linked profile data.',
    icon: 'trash-outline',
    color: '#C93B3B',
    tint: '#FFE8E8',
    route: '/delete-account',
  },
];

function SettingsRow({ row }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={row.title}
      onPress={() => router.push(row.route)}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: row.tint }]}>
        <Ionicons name={row.icon} size={28} color={row.color} />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{row.title}</Text>
        <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={22} color="#8995A4" />
    </Pressable>
  );
}

export default function SettingsScreen() {
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

        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerButton} />
      </View>

      <Text style={styles.sectionLabel}>Account</Text>
      {accountRows.map((row) => <SettingsRow key={row.title} row={row} />)}

      <Text style={styles.sectionLabel}>Privacy & Data</Text>
      {privacyRows.map((row) => <SettingsRow key={row.title} row={row} />)}

      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark-outline" size={24} color="#438A6A" />
        <Text style={styles.infoText}>
          Your account and student profile are saved separately under your signed-in account.
        </Text>
      </View>

      <Text style={styles.footer}>Independent Steps • SEEDS</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F2F9FF' },
  content: { paddingBottom: 40 },
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
  sectionLabel: {
    marginTop: 28,
    marginBottom: 10,
    marginHorizontal: 20,
    fontSize: 15,
    fontWeight: '800',
    color: '#5F6F82',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    minHeight: 96,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  rowPressed: { opacity: 0.75 },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 18, fontWeight: '800', color: '#17213A' },
  rowSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#718096',
  },
  infoCard: {
    margin: 20,
    marginTop: 28,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#E9F8F0',
    flexDirection: 'row',
    gap: 10,
  },
  infoText: { flex: 1, color: '#426557', lineHeight: 20 },
  footer: {
    textAlign: 'center',
    color: '#8995A4',
    marginTop: 10,
    fontSize: 13,
  },
});
