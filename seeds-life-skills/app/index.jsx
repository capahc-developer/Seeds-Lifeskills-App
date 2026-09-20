import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PressableCard from '../components/PressableCard';

const cards = [
  { 
    title: 'Student Profile', 
    subtitle: "Tell us about your child's strengths, learning barriers, and interests.", 
    icon: 'person-circle-outline', 
    tint: '#E6F2FF', 
    color: '#3B82F6', 
    route: '/student-profile' 
  },
  { 
    title: 'All Skills', 
    subtitle: 'Browse skills and strategies by daily life area.', 
    icon: 'apps-outline', 
    tint: '#EEE9FF', 
    color: '#7C5CE7', 
    route: '/all-skills' 
  },
  { 
    title: 'Practice Log', 
    subtitle: 'Track progress and practice attempts.', 
    icon: 'clipboard-outline', 
    tint: '#E3F8EE', 
    color: '#2FB578', 
    route: '/assignments' 
  },
  { 
    title: 'Reports', 
    subtitle: "See your child's progress over time.", 
    icon: 'bar-chart-outline', 
    tint: '#FFE9E7', 
    color: '#FF7474', 
    route: '/reports' 
  },
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.top}><View><Text style={styles.brand}>🌱 SEEDS</Text><Text style={styles.tag}>Skills for a brighter tomorrow</Text></View><Ionicons name="settings" size={28} color="#168CE8" /></View>
      <View style={styles.welcome}><Text style={styles.title}>Welcome, Parent! 👋</Text><Text style={styles.subtitle}>We're here to help you support your child's success.</Text></View>
      {cards.map((card) => <PressableCard key={card.title} style={styles.card} onPress={() => router.push(card.route)}><View style={[styles.iconWrap,{backgroundColor:card.tint}]}><Ionicons name={card.icon} size={30} color={card.color}/></View><View style={styles.cardText}><Text style={styles.cardTitle}>{card.title}</Text><Text style={styles.cardSubtitle}>{card.subtitle}</Text></View><Ionicons name="chevron-forward" size={22} color="#7B8794"/></PressableCard>)}
      <Text style={styles.footer}>Small steps. Big progress. 💚</Text>
    </ScrollView>
  );
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#EEF8FF'},content:{paddingBottom:36},top:{backgroundColor:'#FFF',paddingTop:56,paddingBottom:24,paddingHorizontal:24,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderBottomLeftRadius:32,borderBottomRightRadius:32},brand:{fontSize:27,fontWeight:'800',color:'#245A87'},tag:{fontSize:13,color:'#69778A',marginTop:3},welcome:{paddingHorizontal:22,paddingTop:36,paddingBottom:16},title:{fontSize:28,fontWeight:'800',color:'#171B34'},subtitle:{fontSize:16,color:'#7A8495',marginTop:6},card:{marginHorizontal:16,marginTop:14,minHeight:108,backgroundColor:'#FFF',padding:16,flexDirection:'row',alignItems:'center',gap:14,shadowColor:'#000',shadowOpacity:.05,shadowRadius:12,elevation:2},iconWrap:{width:58,height:58,borderRadius:29,alignItems:'center',justifyContent:'center'},cardText:{flex:1},cardTitle:{fontSize:18,fontWeight:'700',color:'#171B34'},cardSubtitle:{fontSize:14,lineHeight:20,color:'#7A8495',marginTop:4},footer:{textAlign:'center',marginTop:34,fontSize:16,color:'#47749A',fontStyle:'italic'}});
