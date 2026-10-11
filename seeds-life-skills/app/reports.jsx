import React,{useEffect,useState} from 'react';
import {ScrollView,StyleSheet,Text,View,Pressable,ActivityIndicator} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {router,useFocusEffect} from 'expo-router';
import {getDocs,query,orderBy} from 'firebase/firestore';
import {practiceLogsForCurrentUser} from '../lib/userData';

export default function Reports(){
 const [logs,setLogs]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useFocusEffect(React.useCallback(()=>{let active=true;(async()=>{try{setLoading(true);setError('');const snapshot=await getDocs(query(practiceLogsForCurrentUser(),orderBy('createdAt','desc')));if(active)setLogs(snapshot.docs.map(d=>({id:d.id,...d.data()})));}catch(e){console.error(e);if(active)setError('Could not load practice history.');}finally{if(active)setLoading(false);}})();return()=>{active=false};},[]));
 const grouped={};logs.forEach(log=>{const key=log.skillId||log.skill||log.practiceItemTitle||'Other';if(!grouped[key])grouped[key]={id:log.skillId||null,title:log.skill||log.practiceItemTitle||'Other',count:0};grouped[key].count++;});
 const skills=Object.values(grouped).sort((a,b)=>b.count-a.count);
 const plants=Math.floor(logs.length/5),flowers=Math.floor(logs.length/15);
 return <ScrollView style={s.page} contentContainerStyle={s.content}>
  <View style={s.header}><Pressable onPress={()=>router.back()}><Ionicons name="chevron-back" size={28} color="#397C5B"/></Pressable><Text style={s.title}>Reports</Text><View style={{width:28}}/></View>
  <Text style={s.intro}>A place to remember every effort, big or small.</Text>
  {loading?<ActivityIndicator size="large" color="#469E6A"/>:error?<Text style={s.error}>{error}</Text>:<>
   <View style={s.garden}>
    <Text style={s.gardenTitle}>🌷 Your Garden 🌷</Text>
    <Text style={s.gardenArt}>☀️  🦋  🌈</Text>
    <Text style={s.gardenArt}>{'🌱'.repeat(Math.min(6,Math.max(1,logs.length-plants*5)))}</Text>
    <Text style={s.gardenArt}>{'🌿'.repeat(Math.min(6,plants))}{'🌸'.repeat(Math.min(5,flowers))}</Text>
    <Text style={s.count}>{logs.length} {logs.length===1?'seed':'seeds'} planted</Text>
    <Text style={s.gardenSub}>Each saved practice adds a seed. Your garden never resets.</Text>
    <Text style={s.gardenSub}>{logs.length===0?'Your first seed is waiting!':'Thank you for every time you showed up.'}</Text>
   </View>
   <View style={s.card}><Text style={s.heading}>Skills You've Practiced</Text>
    {skills.length===0?<Text style={s.muted}>No practice records yet.</Text>:skills.map(x=><Pressable key={x.id||x.title} style={s.skillRow} onPress={()=>x.id&&router.push('/reports/'+encodeURIComponent(x.id))}><Text style={s.skillName}>🌱  {x.title}</Text><Text style={s.countSmall}>{x.count} {x.count===1?'practice log':'practice logs'} {x.id?'›':''}</Text></Pressable>)}
   </View>
   <View style={s.card}><Text style={s.heading}>Practice History</Text>
    {logs.length===0?<Text style={s.muted}>Saved practice records will appear here.</Text>:logs.map(x=><View key={x.id} style={s.log}>
      <Text style={s.logTitle}>{x.skill||x.practiceItemTitle||'Practice'}</Text>
      <Text style={s.muted}>{x.date||'Date unavailable'} · {x.rating||x.status||'Practice logged'}</Text>
      {!!x.whatWentWell&&<Text style={s.note}>Went well: {x.whatWentWell}</Text>}
      {!!x.whatWasDifficult&&<Text style={s.note}>Difficult: {x.whatWasDifficult}</Text>}
      {!!x.adjustment&&<Text style={s.note}>Notes: {x.adjustment}</Text>}
      {!!x.comments&&<Text style={s.note}>{x.comments}</Text>}
     </View>)}
   </View>
   <View style={s.card}><Text style={s.heading}>💡 Helpful Ideas</Text><Text style={s.muted}>Ideas you choose to save will appear here when AI troubleshooting is connected.</Text></View>
  </>}
 </ScrollView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F2F9F3'},content:{padding:18,paddingBottom:65},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:12},title:{fontSize:24,fontWeight:'800',color:'#315B42'},intro:{textAlign:'center',fontSize:15,color:'#728575',marginVertical:20},garden:{backgroundColor:'#E2F4E3',borderRadius:26,padding:25,alignItems:'center',marginBottom:18},gardenTitle:{fontSize:25,fontWeight:'800',color:'#35764C'},gardenArt:{fontSize:29,marginTop:12,textAlign:'center'},count:{fontSize:25,fontWeight:'800',color:'#37784E',marginTop:16},gardenSub:{color:'#66816C',textAlign:'center',marginTop:8,fontSize:14,lineHeight:20},card:{backgroundColor:'white',borderRadius:22,padding:18,marginBottom:18},heading:{fontSize:20,fontWeight:'800',color:'#315B42',marginBottom:12},skillRow:{paddingVertical:13,borderBottomWidth:1,borderBottomColor:'#ECF1EB'},skillName:{fontSize:16,fontWeight:'700',color:'#345842'},countSmall:{fontSize:13,color:'#758675',marginLeft:30,marginTop:4},log:{paddingVertical:13,borderBottomWidth:1,borderBottomColor:'#ECF1EB'},logTitle:{fontSize:16,fontWeight:'700',color:'#345842'},muted:{fontSize:14,color:'#778879',marginTop:4,lineHeight:21},note:{fontSize:14,color:'#536D58',marginTop:5,lineHeight:20},error:{color:'#B42318',marginTop:20}});
