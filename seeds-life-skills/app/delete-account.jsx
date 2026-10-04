import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

export default function DeleteAccountScreen() {
  const user = auth.currentUser;
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canDelete =
    password.length > 0 &&
    confirmation.trim().toUpperCase() === 'DELETE';

  const deleteAccount = async () => {
    if (!user?.email) {
      Alert.alert(
        'Unable to delete account',
        'No email address is associated with this account.'
      );
      return;
    }

    if (!canDelete || deleting) return;

    try {
      setDeleting(true);

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      const uid = user.uid;

      await Promise.all([
        deleteDoc(doc(db, 'adultProfiles', uid)),
        deleteDoc(doc(db, 'studentProfiles', uid)),
      ]);

      await deleteUser(user);

      router.replace('/login');
    } catch (error) {
      console.error('Account deletion error:', error);

      if (
        error?.code === 'auth/invalid-credential' ||
        error?.code === 'auth/wrong-password'
      ) {
        Alert.alert('Incorrect password', 'Please enter your current password.');
      } else if (error?.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Please sign in again',
          'For security, sign out and sign in again before deleting your account.'
        );
      } else {
        Alert.alert(
          'Could not delete account',
          'Your account was not fully deleted. Please try again before closing the app.'
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Permanently delete account?',
      'This cannot be undone. Your adult profile, student profile, and login account will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: deleteAccount,
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={28} color="#17213A" />
        </Pressable>

        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.warningIcon}>
        <Ionicons name="warning-outline" size={44} color="#C93B3B" />
      </View>

      <Text style={styles.title}>This permanently deletes your account</Text>
      <Text style={styles.body}>
        This will delete your Independent Steps login, adult profile, and the
        student profile stored under your account. This action cannot be undone.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Current password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Type DELETE to confirm</Text>
        <TextInput
          value={confirmation}
          onChangeText={setConfirmation}
          placeholder="DELETE"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Permanently delete account"
        onPress={confirmDelete}
        disabled={!canDelete || deleting}
        style={({ pressed }) => [
          styles.deleteButton,
          (!canDelete || deleting) && styles.disabled,
          pressed && canDelete && styles.pressed,
        ]}
      >
        {deleting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.deleteButtonText}>Permanently Delete Account</Text>
        )}
      </Pressable>

      <Text style={styles.footer}>
        If account deletion fails, your account remains active. Do not assume
        deletion is complete unless you are returned to the login screen.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF7F7' },
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
  warningIcon: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignSelf: 'center',
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE8E8',
  },
  title: {
    marginHorizontal: 24,
    marginTop: 18,
    textAlign: 'center',
    fontSize: 23,
    fontWeight: '800',
    color: '#7F2323',
  },
  body: {
    marginHorizontal: 24,
    marginTop: 10,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: '#6E5555',
  },
  card: {
    margin: 20,
    marginTop: 28,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  label: {
    marginBottom: 7,
    fontSize: 14,
    fontWeight: '700',
    color: '#526170',
  },
  input: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#D9E4EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  deleteButton: {
    marginHorizontal: 20,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#C93B3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  footer: {
    marginHorizontal: 24,
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#8A6B6B',
  },
});
