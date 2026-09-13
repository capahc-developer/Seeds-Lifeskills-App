// import { StyleSheet, Text, View } from 'react-native';
// import { router } from 'expo-router';


// import PressableCard from '../components/PressableCard';
// import { COLORS, SPACING } from '../constants/theme';


// export default function HomeScreen() {
//   return (
//     <View style={styles.page}>
//       <Text style={styles.title}>SEEDS</Text>
//       <Text style={styles.subtitle}>Choose a section</Text>


//       <View style={styles.cardRow}>
//         <PressableCard
//           style={styles.lessonsCard}
//           onPress={() => router.push('/lessons')}
//         >
//           <Text style={styles.emoji}>📚</Text>
//           <Text style={styles.cardTitle}>Lessons</Text>
//           <Text style={styles.cardDescription}>
//             Learn life skills step by step.
//           </Text>
//         </PressableCard>


//         <PressableCard
//           style={styles.assignmentsCard}
//           onPress={() => router.push('/assignments')}
//         >
//           <Text style={styles.emoji}>✅</Text>
//           <Text style={styles.cardTitle}>Assignments</Text>
//           <Text style={styles.cardDescription}>
//             View and complete assigned tasks.
//           </Text>
//         </PressableCard>
//       </View>
//     </View>
//   );
// }


// const styles = StyleSheet.create({
//   page: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//     paddingHorizontal: SPACING.md,
//     paddingTop: 80,
//   },


//   title: {
//     fontSize: 36,
//     fontWeight: '700',
//     color: COLORS.text,
//     textAlign: 'center',
//   },


//   subtitle: {
//     marginTop: 8,
//     fontSize: 18,
//     color: COLORS.text,
//     textAlign: 'center',
//   },


//   cardRow: {
//     flexDirection: 'row',
//     gap: SPACING.sm,
//     marginTop: 40,
//   },


//   lessonsCard: {
//     flex: 1,
//     minHeight: 260,
//     backgroundColor: COLORS.surface,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: SPACING.lg,
//   },


//   assignmentsCard: {
//     flex: 1,
//     minHeight: 260,
//     backgroundColor: COLORS.surface,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: SPACING.lg,
//   },


//   emoji: {
//     fontSize: 64,
//   },


//   cardTitle: {
//     marginTop: 16,
//     fontSize: 26,
//     fontWeight: '700',
//     color: COLORS.text,
//   },


//   cardDescription: {
//     marginTop: 10,
//     fontSize: 16,
//     lineHeight: 22,
//     textAlign: 'center',
//     color: COLORS.text,
//   },
// });



