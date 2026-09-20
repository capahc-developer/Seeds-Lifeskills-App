import { Pressable, StyleSheet } from 'react-native';

export default function PressableCard({ children, style, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        style,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 26 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});