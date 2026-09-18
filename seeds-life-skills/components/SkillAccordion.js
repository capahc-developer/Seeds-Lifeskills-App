import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function SkillAccordion({ skill }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.skillRow}
      >
        <Text style={styles.skillTitle}>{skill.title}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={30}
          color={COLORS.text}
        />
      </Pressable>

      {open &&
        skill.modules.map((module) => (
          <Pressable
            key={module.id}
            style={styles.moduleRow}
            onPress={() =>
              router.push(`/lessons/${skill.id}/${module.id}`)
            }
          >
            <Text style={styles.moduleText}>{module.title}</Text>
            <Ionicons name="chevron-forward" size={24} />
          </Pressable>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skillRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 20,
  },
  skillTitle: { flex: 1, fontSize: 22, fontWeight: '700' },
  moduleRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  moduleText: { flex: 1, fontSize: 19 },
});