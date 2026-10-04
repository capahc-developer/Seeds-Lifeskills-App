import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ValidationBanner({ message, type = 'error' }) {
  if (!message) return null;

  const isError = type === 'error';

  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, isError ? styles.errorBanner : styles.infoBanner]}
    >
      <Ionicons
        name={isError ? 'alert-circle' : 'information-circle'}
        size={22}
        color={isError ? '#B42318' : '#245A87'}
      />
      <Text style={[styles.text, isError ? styles.errorText : styles.infoText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorBanner: {
    backgroundColor: '#FFF1F0',
    borderColor: '#FDA29B',
  },
  infoBanner: {
    backgroundColor: '#EAF5FF',
    borderColor: '#B7DDFB',
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  errorText: {
    color: '#B42318',
  },
  infoText: {
    color: '#245A87',
  },
});
