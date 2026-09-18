import { StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';

export default function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: safeValue }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${safeValue}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 18,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: COLORS.background,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
});