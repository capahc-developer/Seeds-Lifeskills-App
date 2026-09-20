import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function ChecklistItem({ label, checked, onPress }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={[styles.row, checked && styles.checkedRow]}
    >
      <Text style={[styles.label, checked && styles.checkedLabel]}>{label}</Text>
      <View style={[styles.circle, checked && styles.checkedCircle]}>
        {checked && <Ionicons name="checkmark" size={28} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 20,
  },
  checkedRow: { backgroundColor: COLORS.successSoft },
  label: { flex: 1, paddingRight: 16, fontSize: 20, fontWeight: '600' },
  checkedLabel: { textDecorationLine: 'line-through' },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 4,
    borderColor: COLORS.text,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCircle: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success,
  },
});