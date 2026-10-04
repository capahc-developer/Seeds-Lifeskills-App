import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStrategyGuides } from '../lib/strategyGuides';

const colors = ['#E8F7F2','#EEF3FF','#FFF3DE','#F2ECFF','#EAF7FF','#FFF0F0'];

export default function GeneralStrategies() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getStrategyGuides({ includeInactive: true })
      .then(setStrategies)
      .catch((err) => { console.error('Error loading strategy guides:', err); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={28} /></Pressable>
        <Text style={s.title}>General Strategies</Text><View style={{ width: 28 }} />
      </View>
      <Text style={s.intro}>Practical strategies you can use across many daily living skills. Choose a strategy to see the key steps, examples, and tips.</Text>
      {loading && <View style={s.status}><ActivityIndicator size="large" /><Text style={s.statusText}>Loading strategies...</Text></View>}
      {!loading && error && <View style={s.status}><Text style={s.error}>We could not load the strategies.</Text></View>}
      {!loading && !error && strategies.map((strategy, i) => (
        <Pressable key={strategy.id} style={s.card} onPress={() => router.push(`/strategy/${strategy.id}`)}>
          <View style={[s.icon,{backgroundColor:colors[i % colors.length]}]}><Ionicons name="bulb-outline" size={26} color="#397A68" /></View>
          <View style={s.cardText}><Text style={s.cardTitle}>{strategy.title}</Text><Text style={s.sub}>{strategy.tagline || strategy.summary}</Text></View>
          <Ionicons name="chevron-forward" size={22} color="#7B8794" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F1F9FF'},content:{paddingBottom:36},header:{paddingTop:56,paddingHorizontal:20,paddingBottom:18,backgroundColor:'#FFF',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},title:{fontSize:21,fontWeight:'800',color:'#17213A'},intro:{fontSize:15,color:'#718096',margin:20,lineHeight:22},card:{marginHorizontal:16,marginBottom:12,backgroundColor:'#FFF',borderRadius:18,padding:15,flexDirection:'row',alignItems:'center',gap:13},icon:{width:52,height:52,borderRadius:26,alignItems:'center',justifyContent:'center'},cardText:{flex:1},cardTitle:{fontSize:16,fontWeight:'800',color:'#17213A'},sub:{fontSize:13,color:'#718096',marginTop:4,lineHeight:18},status:{padding:30,alignItems:'center'},statusText:{marginTop:10,color:'#718096'},error:{color:'#B42318'}});
