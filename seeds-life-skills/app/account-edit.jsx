import { useEffect, useState } from 'react';
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
import { updateProfile } from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

export default function AccountEditScreen() {
  const user = auth.currentUser;

  const [fullName, setFullName] = useState(user?.displayName || '');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, 'adultProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const data = profileSnap.data();

          setFullName(data.fullName || user.displayName || '');
          setRelationship(data.relationship || '');
          setPhone(data.phone || '');
        }
      } catch (error) {
        console.error('Error loading adult profile:', error);
        Alert.alert(
          'Could not load profile',
          'Your account details could not be loaded right now.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const saveProfile = async () => {
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in again and retry.');
      return;
    }

    const cleanName = fullName.trim();

    if (!cleanName) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    try {
      setSaving(true);

      await updateProfile(user, {
        displayName: cleanName,
      });

      await setDoc(
        doc(db, 'adultProfiles', user.uid),
        {
          uid: user.uid,
          fullName: cleanName,
          relationship: relationship.trim(),
          phone: phone.trim(),
          email: user.email || '',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert('Saved', 'Your account details were updated.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error saving adult profile:', error);
      Alert.alert(
        'Could not save profile',
        'Please try again in a moment.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading account...</Text>
      </View>
    );
  }

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

        <Text style={styles.headerTitle}>Edit Account</Text>

        <View style={styles.headerButton} />
      </View>

      <View style={styles.avatar}>
        <Ionicons name="person-outline" size={48} color="#2F8CF0" />
      </View>

      <Text style={styles.sectionTitle}>Adult Information</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Your full name"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Relationship to Student</Text>
      <TextInput
        style={styles.input}
        value={relationship}
        onChangeText={setRelationship}
        placeholder="Example: Parent, Guardian, Caregiver"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Optional"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Email</Text>
      <View style={styles.readOnlyField}>
        <Text style={styles.readOnlyText}>
          {user?.email || 'No email available'}
        </Text>
        <Ionicons name="lock-closed-outline" size={18} color="#8794A5" />
      </View>

      <Text style={styles.helperText}>
        Your email is tied to your login and cannot be changed from this page.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save account details"
        onPress={saveProfile}
        disabled={saving}
        style={({ pressed }) => [
          styles.saveButton,
          pressed && styles.pressed,
          saving && styles.disabled,
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F2F9FF',
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
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#DDEEFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },
  sectionTitle: {
    marginHorizontal: 20,
    marginTop: 26,
    marginBottom: 18,
    fontSize: 19,
    fontWeight: '800',
    color: '#17213A',
  },
  label: {
    marginHorizontal: 20,
    marginBottom: 7,
    fontSize: 14,
    fontWeight: '700',
    color: '#526170',
  },
  input: {
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E4EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#17213A',
  },
  readOnlyField: {
    marginHorizontal: 20,
    minHeight: 52,
    backgroundColor: '#EEF2F6',
    borderWidth: 1,
    borderColor: '#D9E4EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    color: '#647386',
  },
  helperText: {
    marginHorizontal: 20,
    marginTop: 7,
    fontSize: 12,
    lineHeight: 17,
    color: '#8794A5',
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 30,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#258DEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F9FF',
  },
  loadingText: {
    marginTop: 12,
    color: '#718096',
  },
});
