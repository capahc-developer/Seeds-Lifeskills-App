import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

export default function ProfileScreen() {
  const user = auth.currentUser;

  const [loggingOut, setLoggingOut] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [adultProfile, setAdultProfile] = useState({
    fullName: '',
    relationship: '',
    phone: '',
  });

  useEffect(() => {
    const loadAdultProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, 'adultProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const data = profileSnap.data();

          setAdultProfile({
            fullName: data.fullName || '',
            relationship: data.relationship || '',
            phone: data.phone || '',
          });
        }
      } catch (error) {
        console.error('Error loading adult profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadAdultProfile();
  }, [user]);

  const providerLabel = useMemo(() => {
    const providerId = user?.providerData?.[0]?.providerId;

    if (providerId === 'password') return 'Email & Password';
    if (providerId === 'google.com') return 'Google';
    return providerId || 'Firebase account';
  }, [user]);

  const createdDate = useMemo(() => {
    if (!user?.metadata?.creationTime) return 'Unavailable';

    return new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [user]);

  const displayName =
    adultProfile.fullName ||
    user?.displayName ||
    'Parent / Caregiver';

  const handlePasswordReset = async () => {
    if (!user?.email) {
      Alert.alert('No email found', 'This account does not have an email address.');
      return;
    }

    try {
      setSendingReset(true);
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert(
        'Reset email sent',
        `A password reset link was sent to ${user.email}.`
      );
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert(
        'Could not send reset email',
        'Please try again in a moment.'
      );
    } finally {
      setSendingReset(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out?',
      'You will need to sign in again to access Independent Steps.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoggingOut(true);
              await signOut(auth);
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Could not log out', 'Please try again.');
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

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

        <Text style={styles.headerTitle}>Adult Profile</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit account"
          onPress={() => router.push('/account-edit')}
          style={styles.headerButton}
        >
          <Ionicons name="create-outline" size={24} color="#168CE8" />
        </Pressable>
      </View>

      <View style={styles.avatar}>
        <Text style={styles.avatarInitials}>{displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}</Text>
      </View>

      {profileLoading ? (
        <ActivityIndicator style={styles.profileSpinner} />
      ) : (
        <>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email || 'No email available'}</Text>

          {!!adultProfile.relationship && (
            <Text style={styles.relationship}>{adultProfile.relationship}</Text>
          )}
        </>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{user?.email || 'Unavailable'}</Text>
        </View>

        {!!adultProfile.phone && (
          <>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{adultProfile.phone}</Text>
            </View>
          </>
        )}

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Sign-in method</Text>
          <Text style={styles.detailValue}>{providerLabel}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Member since</Text>
          <Text style={styles.detailValue}>{createdDate}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>User ID</Text>
          <Text style={styles.uid} numberOfLines={1}>
            {user?.uid || 'Unavailable'}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit account details"
        onPress={() => router.push('/account-edit')}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="create-outline" size={22} color="#168CE8" />
        <Text style={styles.secondaryButtonText}>Edit Account Details</Text>
      </Pressable>

      {providerLabel === 'Email & Password' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send password reset email"
          onPress={handlePasswordReset}
          disabled={sendingReset}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
            sendingReset && styles.disabled,
          ]}
        >
          {sendingReset ? (
            <ActivityIndicator color="#168CE8" />
          ) : (
            <>
              <Ionicons name="key-outline" size={22} color="#168CE8" />
              <Text style={styles.secondaryButtonText}>Reset Password</Text>
            </>
          )}
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out"
        onPress={handleLogout}
        disabled={loggingOut}
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.pressed,
          loggingOut && styles.disabled,
        ]}
      >
        {loggingOut ? (
          <ActivityIndicator color="#C93B3B" />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={22} color="#C93B3B" />
            <Text style={styles.logoutText}>Log Out</Text>
          </>
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
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DDEEFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  avatarInitials: { fontSize: 32, fontWeight: '800', color: '#2F8CF0' },
  profileSpinner: {
    marginTop: 18,
  },
  name: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#17213A',
  },
  email: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 15,
    color: '#718096',
  },
  relationship: {
    marginTop: 7,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#47749A',
  },
  card: {
    marginHorizontal: 18,
    marginTop: 28,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    marginBottom: 6,
    fontSize: 18,
    fontWeight: '800',
    color: '#17213A',
  },
  detailRow: {
    paddingVertical: 13,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A8795',
  },
  detailValue: {
    marginTop: 4,
    fontSize: 16,
    color: '#17213A',
  },
  uid: {
    marginTop: 4,
    fontSize: 13,
    color: '#526170',
  },
  divider: {
    height: 1,
    backgroundColor: '#E7EDF3',
  },
  secondaryButton: {
    marginHorizontal: 18,
    marginTop: 14,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CFE4F7',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#168CE8',
  },
  logoutButton: {
    marginHorizontal: 18,
    marginTop: 24,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0CACA',
    backgroundColor: '#FFF7F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#C93B3B',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.55,
  },
});
