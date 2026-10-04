import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStrategyGuide } from '../../lib/strategyGuides';

export default function StrategyDetail() {
  const { strategyId } = useLocalSearchParams();
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getStrategyGuide(strategyId)
      .then((data) => { if (!data) setError(true); else setStrategy(data); })
      .catch((err) => { console.error('Error loading strategy:', err); setError(true); })
      .finally(() => setLoading(false));
  }, [strategyId]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" /></View>;
  if (error || !strategy) return <View style={s.center}><Text>We could not load this strategy.</Text><Pressable onPress={() => router.back()}><Text style={s.link}>Go back</Text></Pressable></View>;

  const renderList = (items=[]) => items.map((item, i) => <View key={i} style={s.bulletRow}><Text style={s.bullet}>•</Text><Text style={s.bulletText}>{typeof item === 'string' ? item : item.description}</Text></View>);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.header}><Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={28} /></Pressable><Text style={s.headerTitle}>Strategy Guide</Text><View style={{width:28}} /></View>
      <View style={s.hero}><Text style={s.title}>{strategy.title}</Text>{strategy.tagline ? <Text style={s.tagline}>{strategy.tagline}</Text> : null}<Text style={s.summary}>{strategy.summary}</Text></View>

      {strategy.whenToUse?.length ? <Section title="When to use it">{renderList(strategy.whenToUse)}</Section> : null}
      {strategy.steps?.length ? <Section title="Steps">{strategy.steps.map((step, i)=><View key={step.order || i} style={s.step}><View style={s.stepNumber}><Text style={s.stepNumberText}>{step.order || i+1}</Text></View><View style={{flex:1}}><Text style={s.stepTitle}>{step.title}</Text><Text style={s.stepText}>{step.description}</Text></View></View>)}</Section> : null}
      {strategy.methods?.length ? <Section title="Ways to use this strategy">{strategy.methods.map((item,i)=><View key={item.id || i} style={s.item}><Text style={s.itemTitle}>{item.title}</Text><Text style={s.itemText}>{item.description}</Text></View>)}</Section> : null}
      {strategy.examples?.length ? <Section title="Examples">{strategy.examples.map((item,i)=><View key={i} style={s.example}><Text style={s.itemTitle}>{item.title}</Text><Text style={s.itemText}>{item.description}</Text></View>)}</Section> : null}
      {strategy.implementationTips?.length ? <Section title="Helpful tips">{renderList(strategy.implementationTips)}</Section> : null}
      {strategy.keyTakeaways?.length ? <Section title="Key takeaways">{renderList(strategy.keyTakeaways)}</Section> : null}
    </ScrollView>
  );
}

function Section({title,children}) { return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{children}</View>; }

const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F1F9FF'},content:{paddingBottom:40},center:{flex:1,alignItems:'center',justifyContent:'center',padding:30},link:{marginTop:16,color:'#168CE8',fontWeight:'700'},header:{paddingTop:56,paddingHorizontal:20,paddingBottom:18,backgroundColor:'#FFF',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},headerTitle:{fontSize:18,fontWeight:'800'},hero:{backgroundColor:'#FFF',padding:22,borderBottomLeftRadius:26,borderBottomRightRadius:26},title:{fontSize:28,fontWeight:'800',color:'#17365D'},tagline:{fontSize:16,color:'#397A68',fontWeight:'700',marginTop:8},summary:{fontSize:15,lineHeight:23,color:'#526173',marginTop:14},section:{backgroundColor:'#FFF',marginHorizontal:16,marginTop:16,borderRadius:18,padding:18},sectionTitle:{fontSize:19,fontWeight:'800',color:'#17365D',marginBottom:12},step:{flexDirection:'row',gap:12,marginBottom:16},stepNumber:{width:30,height:30,borderRadius:15,backgroundColor:'#E8F7F2',alignItems:'center',justifyContent:'center'},stepNumberText:{fontWeight:'800',color:'#248A6B'},stepTitle:{fontSize:15,fontWeight:'800',color:'#17213A'},stepText:{fontSize:14,lineHeight:20,color:'#617083',marginTop:3},bulletRow:{flexDirection:'row',gap:9,marginBottom:9},bullet:{fontSize:18,color:'#248A6B'},bulletText:{flex:1,fontSize:14,lineHeight:20,color:'#526173'},item:{marginBottom:14},example:{backgroundColor:'#F7FAFC',borderRadius:12,padding:13,marginBottom:10},itemTitle:{fontSize:15,fontWeight:'800',color:'#17213A'},itemText:{fontSize:14,lineHeight:20,color:'#617083',marginTop:4}});
