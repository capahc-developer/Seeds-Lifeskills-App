import { StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import ScreenContainer from '../components/ScreenContainer';
import { COLORS } from '../constants/theme';

export default function ProfileScreen() {
  return (
    <ScreenContainer>
      <AppHeader showHome />
      <View style={styles.content}>
        <Text style={styles.avatar}>🙂</Text>
        <Text style={styles.title}>Learner profile</Text>
        <Text style={styles.body}>
          Avatar, communication preferences, accessibility settings, and
          caregiver controls can be added here.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  avatar: { fontSize: 96 },
  title: { marginTop: 16, fontSize: 32, fontWeight: '700', color: COLORS.text },
  body: { marginTop: 12, maxWidth: 520, textAlign: 'center', fontSize: 18, lineHeight: 26 },
});