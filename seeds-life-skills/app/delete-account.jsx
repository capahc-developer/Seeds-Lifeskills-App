import { useState } from 'react';
import {
  ActivityIndicator,
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
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from 'firebase/firestore';

import ValidationBanner from '../components/ValidationBanner';
import { auth, db } from '../lib/firebase';

export default function DeleteAccountScreen() {
  const user = auth.currentUser;

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const [validationError, setValidationError] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [confirmationError, setConfirmationError] = useState(false);

  const validate = () => {
    const missingPassword = !password.trim();
    const invalidConfirmation =
      confirmation.trim().toUpperCase() !== 'DELETE';

    setPasswordError(missingPassword);
    setConfirmationError(invalidConfirmation);

    if (missingPassword && invalidConfirmation) {
      setValidationError(
        'Enter your current password and type DELETE to continue.'
      );
      return false;
    }

    if (missingPassword) {
      setValidationError(
        'Enter your current password before deleting your account.'
      );
      return false;
    }

    if (invalidConfirmation) {
      setValidationError(
        'Type DELETE exactly in the confirmation field.'
      );
      return false;
    }

    setValidationError('');
    return true;
  };

  const startDelete = () => {
    if (!validate()) return;
    setShowFinalConfirm(true);
  };

  const deleteCollectionDocs = async (pathParts) => {
    const ref = collection(db, ...pathParts);
    const snapshot = await getDocs(ref);

    await Promise.all(
      snapshot.docs.map((item) => deleteDoc(item.ref))
    );
  };

  const deleteAccount = async () => {
    if (!user?.email) {
      setValidationError(
        'No email address is associated with this account, so deletion cannot continue.'
      );
      return;
    }

    if (!validate() || deleting) return;

    try {
      setDeleting(true);
      setValidationError('');

      // Firebase requires a recent login before deleting an auth account.
      const credential = EmailAuthProvider.credential(
        user.email,
        password
      );

      await reauthenticateWithCredential(user, credential);

      const uid = user.uid;

      // Delete account-owned Firestore data while the user is still authenticated.
      await Promise.all([
        deleteDoc(doc(db, 'adultProfiles', uid)),
        deleteDoc(doc(db, 'studentProfiles', uid)),
        deleteCollectionDocs(['users', uid, 'practiceLog']),
        deleteCollectionDocs(['users', uid, 'practicePlans']),
      ]);

      // Delete the Firebase Authentication user last.
      await deleteUser(user);

      router.replace('/login');
    } catch (error) {
      console.error('Account deletion error:', error);

      setShowFinalConfirm(false);

      if (
        error?.code === 'auth/invalid-credential' ||
        error?.code === 'auth/wrong-password'
      ) {
        setPasswordError(true);
        setValidationError(
          'The password you entered is incorrect. Please try again.'
        );
      } else if (error?.code === 'auth/requires-recent-login') {
        setValidationError(
          'For security, please sign out, sign back in, and try deleting your account again.'
        );
      } else if (error?.code === 'permission-denied') {
        setValidationError(
          'Firebase blocked part of the deletion. Please make sure the latest Firestore rules are deployed, then try again.'
        );
      } else {
        setValidationError(
          `Account deletion failed${error?.code ? ` (${error.code})` : ''}. Your account is still active. Please try again.`
        );
      }
    } finally {
      setDeleting(false);
    }
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

      <Text style={styles.title}>
        This permanently deletes your account
      </Text>

      <Text style={styles.body}>
        This removes your Independent Steps login, adult profile, student
        profile, practice records, and saved practice plans. This action cannot
        be undone.
      </Text>

      <View style={styles.bannerWrap}>
        <ValidationBanner message={validationError} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Current password <Text style={styles.required}>*</Text>
        </Text>

        <TextInput
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setPasswordError(false);
            setValidationError('');
            setShowFinalConfirm(false);
          }}
          placeholder="Enter your password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, passwordError && styles.inputError]}
        />

        {passwordError && (
          <Text style={styles.fieldErrorText}>
            Enter the correct current password.
          </Text>
        )}

        <Text style={styles.label}>
          Type DELETE to confirm <Text style={styles.required}>*</Text>
        </Text>

        <TextInput
          value={confirmation}
          onChangeText={(value) => {
            setConfirmation(value);
            setConfirmationError(false);
            setValidationError('');
            setShowFinalConfirm(false);
          }}
          placeholder="DELETE"
          autoCapitalize="characters"
          autoCorrect={false}
          style={[
            styles.input,
            confirmationError && styles.inputError,
          ]}
        />

        {confirmationError && (
          <Text style={styles.fieldErrorText}>
            Type DELETE exactly to continue.
          </Text>
        )}
      </View>

      {!showFinalConfirm ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue account deletion"
          onPress={startDelete}
          disabled={deleting}
          style={({ pressed }) => [
            styles.deleteButton,
            deleting && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.deleteButtonText}>
            Permanently Delete Account
          </Text>
        </Pressable>
      ) : (
        <View style={styles.finalConfirmCard}>
          <Text style={styles.finalConfirmTitle}>
            Final confirmation
          </Text>

          <Text style={styles.finalConfirmText}>
            Are you absolutely sure? Your account and account-linked data will
            be permanently deleted.
          </Text>

          <View style={styles.confirmRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowFinalConfirm(false)}
              disabled={deleting}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={deleteAccount}
              disabled={deleting}
              style={[
                styles.confirmDeleteButton,
                deleting && styles.disabled,
              ]}
            >
              {deleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmDeleteText}>
                  Delete Now
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      <Text style={styles.footer}>
        If deletion fails, your account remains active. Deletion is complete
        only after you are returned to the login screen.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FFF7F7',
  },
  content: {
    paddingBottom: 44,
  },
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#17213A',
  },
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
  bannerWrap: {
    marginHorizontal: 20,
    marginTop: 22,
  },
  card: {
    margin: 20,
    marginTop: 6,
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
  required: {
    color: '#B42318',
  },
  input: {
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: '#D9E4EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#D92D20',
    backgroundColor: '#FFF8F7',
  },
  fieldErrorText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 18,
    lineHeight: 18,
  },
  deleteButton: {
    marginHorizontal: 20,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#C93B3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  finalConfirmCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FDA29B',
  },
  finalConfirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#B42318',
  },
  finalConfirmText: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
    color: '#6E5555',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9E4EE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#526170',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmDeleteButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C93B3B',
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
  footer: {
    marginHorizontal: 24,
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#8A6B6B',
  },
});
