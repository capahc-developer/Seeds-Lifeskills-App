import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import ScreenContainer from '../../components/ScreenContainer';
import { practiceLogsForCurrentUser } from '../../lib/userData';
import { db } from '../../lib/firebase';

const outcomes = [
  { label: 'Did it independently', emoji: '🌟' },
  { label: 'Some help needed', emoji: '🤝' },
  { label: 'Hard today', emoji: '💛' },
];
const focusOptions = ['Daily skill practice','Relaxation / calming','Communication','Visual support','Prompting / reminders','Motivation / reinforcement','Other'];
const formatDate = d => d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const isoDate = d => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const readableDate = value => { const [y,m,d]=value.split('-').map(Number); return formatDate(new Date(y,m-1,d)); };

export default function PracticeLogScreen() {
  const [skills,setSkills]=useState([]);
  const [logs,setLogs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [skill,setSkill]=useState(null);
  const [showSkills,setShowSkills]=useState(false);
  const [focus,setFocus]=useState(focusOptions[0]);
  const [showFocus,setShowFocus]=useState(false);
  const [activity,setActivity]=useState('');
  const [outcome,setOutcome]=useState('');
  const [well,setWell]=useState('');
  const [difficult,setDifficult]=useState('');
  const [notes,setNotes]=useState('');
  const [date,setDate]=useState(isoDate(new Date()));
  const [dateError,setDateError]=useState('');
  const [error,setError]=useState('');
  const [celebrating,setCelebrating]=useState(false);
  const [savedDifficulty,setSavedDifficulty]=useState('');
  useEffect(()=>{let active=true;(async()=>{try{
    const [ss,ls]=await Promise.all([getDocs(collection(db,'skills')),getDocs(query(practiceLogsForCurrentUser(),orderBy('createdAt','desc')))]);
    if(active){setSkills(ss.docs.map(x=>({id:x.id,...x.data()})).filter(x=>x.active!==false).sort((a,b)=>(a.order??999)-(b.order??999)));setLogs(ls.docs.map(x=>({id:x.id,...x.data()})));}
  }catch(e){console.error(e);Alert.alert('Error','Could not load practice records.');}finally{if(active)setLoading(false);}})();return()=>{active=false};},[]);
  const reset=()=>{setSkill(null);setFocus(focusOptions[0]);setActivity('');setOutcome('');setWell('');setDifficult('');setNotes('');setDate(isoDate(new Date()));setError('');};
  const save=async()=>{
    if(saving)return;
    if(!skill){setError('Please select a skill.');return;}
    if(!outcome){setError('Please choose how practice went.');return;}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){setDateError('Enter a date as YYYY-MM-DD.');return;}
    const [y,m,d]=date.split('-').map(Number);const parsed=new Date(y,m-1,d);
    if(parsed.getFullYear()!==y||parsed.getMonth()!==m-1||parsed.getDate()!==d||parsed>new Date()){setDateError('Choose a valid date, today or earlier.');return;}
    setError('');setDateError('');setSaving(true);
    try{
      const record={date:readableDate(date),practiceDate:date,skill:skill.title,skillId:skill.id,practiceFocus:focus,practiceActivity:activity.trim(),rating:outcome,whatWentWell:well.trim(),whatWasDifficult:difficult.trim(),adjustment:notes.trim(),createdAt:serverTimestamp()};
      const result=await addDoc(practiceLogsForCurrentUser(),record);
      setLogs(current=>[{...record,id:result.id},...current]);
      setSavedDifficulty(difficult.trim());reset();setCelebrating(true);
    }catch(e){console.error(e);setError('Could not save your practice. Please try again.');}finally{setSaving(false);}
  };
  if(celebrating)return <ScreenContainer><ScrollView style={s.page} contentContainerStyle={s.celebrate}>
    <Text style={s.confetti}>🎉 ✨ 🎊 🌟 🎉</Text>
    <Text style={s.mascot}>🦦</Text>
    <Text style={s.big}>Awesome!</Text>
    <Text style={s.center}>You logged a practice today!</Text>
    <Text style={s.subcenter}>Thank you for showing up. Every effort matters.</Text>
    <View style={s.seedCard}><Text style={s.seedIcon}>🌱</Text><Text style={s.seedText}>+1 seed added to your garden!</Text></View>
    <Pressable style={s.primary} onPress={()=>router.push('/reports')}><Text style={s.primaryText}>🌷 View Your Garden</Text></Pressable>
    <Pressable style={s.secondary} onPress={()=>setCelebrating(false)}><Text style={s.secondaryText}>Log Another Practice</Text></Pressable>
    {!!savedDifficulty&&<View style={s.helpCard}><Text style={s.helpTitle}>Need an idea for next time?</Text><Text style={s.muted}>Optional AI troubleshooting isn't connected yet. Your notes have not been sent to AI.</Text><Text style={s.muted}>You noted: {savedDifficulty}</Text></View>}
  </ScrollView></ScreenContainer>;
  return <ScreenContainer><ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <View style={s.header}><Pressable onPress={()=>router.back()}><Ionicons name="chevron-back" size={28} color="#327B62"/></Pressable><Text style={s.title}>Practice Log</Text><View style={{width:28}}/></View>
    <Text style={s.subtitle}>Every practice is worth celebrating. 🌱</Text>
    <View style={s.card}>
      <Text style={s.heading}>Add a Practice Record</Text>
      {!!error&&<Text style={s.error}>{error}</Text>}
      <Text style={s.label}>Date</Text>
      <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" maxLength={10}/>
      <Text style={s.hint}>Today or an earlier date (YYYY-MM-DD)</Text>
      {!!dateError&&<Text style={s.error}>{dateError}</Text>}
      <Text style={s.label}>Skill *</Text>
      <Pressable style={s.inputRow} onPress={()=>setShowSkills(!showSkills)}><Text style={s.value}>{skill?.title||'Select a skill'}</Text><Ionicons name="chevron-down" size={20} color="#526B5B"/></Pressable>
      {showSkills&&<View style={s.menu}>{skills.map(x=><Pressable key={x.id} style={s.menuItem} onPress={()=>{setSkill(x);setShowSkills(false);setError('');}}><Text>{x.title}</Text></Pressable>)}</View>}
      <Text style={s.label}>How did it go? *</Text>
      {outcomes.map(x=><Pressable key={x.label} onPress={()=>setOutcome(x.label)} style={[s.choice,outcome===x.label&&s.choiceSelected]}><Text style={s.choiceText}>{x.emoji}  {x.label}</Text><Ionicons name={outcome===x.label?'radio-button-on':'radio-button-off'} size={22} color="#438C68"/></Pressable>)}
      <Text style={s.label}>Practice focus</Text>
      <Pressable style={s.inputRow} onPress={()=>setShowFocus(!showFocus)}><Text style={s.value}>{focus}</Text><Ionicons name="chevron-down" size={20}/></Pressable>
      {showFocus&&<View style={s.menu}>{focusOptions.map(x=><Pressable key={x} style={s.menuItem} onPress={()=>{setFocus(x);setShowFocus(false);}}><Text>{x}</Text></Pressable>)}</View>}
      <Field label="Practice activity (optional)" value={activity} onChangeText={setActivity} placeholder="What did you practice?" single/>
      <Field label="What went well? (optional)" value={well} onChangeText={setWell} placeholder="Anything that worked today"/>
      <Field label="What was difficult? (optional)" value={difficult} onChangeText={setDifficult} placeholder="Anything that felt tricky"/>
      <Field label="Additional notes or questions (optional)" value={notes} onChangeText={setNotes} placeholder="Ideas to try next time, or questions"/>
      <Pressable style={[s.primary,saving&&{opacity:.6}]} onPress={save} disabled={saving}>{saving?<ActivityIndicator color="white"/>:<Text style={s.primaryText}>🌱 Save Practice</Text>}</Pressable>
    </View>
    <Text style={s.heading}>Recent Practice Records</Text>
    {loading?<ActivityIndicator/>:logs.length===0?<Text style={s.muted}>Your practice history will appear here.</Text>:logs.map(x=><View key={x.id} style={s.history}><Text style={s.historyTitle}>{x.skill||x.practiceItemTitle||'Practice'}</Text><Text style={s.muted}>{x.date||'Date not available'} · {x.rating||x.status||'Recorded'}</Text>{!!x.whatWentWell&&<Text style={s.muted}>Went well: {x.whatWentWell}</Text>}{!!x.whatWasDifficult&&<Text style={s.muted}>Difficult: {x.whatWasDifficult}</Text>}{!!x.adjustment&&<Text style={s.muted}>Notes: {x.adjustment}</Text>}{!!x.comments&&<Text style={s.muted}>{x.comments}</Text>}</View>)}
  </ScrollView></ScreenContainer>;
}
function Field({label,value,onChangeText,placeholder,single}){return <><Text style={s.label}>{label}</Text><TextInput style={[s.input,!single&&s.multiline]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#84968D" multiline={!single} textAlignVertical="top" maxLength={500}/></>}
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:'#F1F9F1'},content:{padding:18,paddingBottom:60},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:12},title:{fontSize:23,fontWeight:'800',color:'#294C3C'},subtitle:{textAlign:'center',color:'#64816F',marginVertical:16,fontSize:15},card:{backgroundColor:'white',padding:19,borderRadius:24,marginBottom:24},heading:{fontSize:22,fontWeight:'800',color:'#2D6147',marginBottom:14},label:{fontSize:15,fontWeight:'700',color:'#334E40',marginTop:17,marginBottom:8},input:{backgroundColor:'#F3F8F4',borderRadius:14,padding:14,fontSize:16,color:'#233F32',minHeight:52},multiline:{minHeight:90},hint:{fontSize:12,color:'#758A7C',marginTop:5},error:{color:'#B42318',marginVertical:7},inputRow:{backgroundColor:'#F3F8F4',borderRadius:14,padding:15,flexDirection:'row',justifyContent:'space-between'},value:{fontSize:16,color:'#334E40',flex:1},menu:{backgroundColor:'#F8FCF8',borderRadius:12,marginTop:4},menuItem:{padding:14,borderBottomWidth:1,borderBottomColor:'#E6EEE7'},choice:{flexDirection:'row',justifyContent:'space-between',padding:14,backgroundColor:'#F5F8F4',borderRadius:14,marginBottom:8,borderWidth:2,borderColor:'transparent'},choiceSelected:{backgroundColor:'#E2F5E6',borderColor:'#59AB75'},choiceText:{fontSize:16,color:'#315543'},primary:{backgroundColor:'#46A56C',padding:17,borderRadius:26,alignItems:'center',marginTop:22},primaryText:{color:'white',fontWeight:'800',fontSize:17},secondary:{padding:16,alignItems:'center'},secondaryText:{color:'#367B55',fontWeight:'700',fontSize:16},history:{backgroundColor:'white',borderRadius:16,padding:16,marginBottom:10},historyTitle:{fontSize:17,fontWeight:'700',color:'#2D6147'},muted:{fontSize:14,color:'#667A6C',lineHeight:21,marginTop:5},celebrate:{padding:25,paddingTop:55,alignItems:'center',flexGrow:1},confetti:{fontSize:30},mascot:{fontSize:105,marginTop:20},big:{fontSize:40,fontWeight:'900',color:'#308E5B',marginTop:10},center:{fontSize:21,fontWeight:'700',color:'#305742',textAlign:'center',marginTop:10},subcenter:{fontSize:16,color:'#657C69',textAlign:'center',marginTop:10},seedCard:{backgroundColor:'#FFF5CE',padding:22,borderRadius:24,alignItems:'center',marginTop:25,width:'100%'},seedIcon:{fontSize:52},seedText:{fontSize:20,fontWeight:'800',color:'#487043',textAlign:'center'},helpCard:{backgroundColor:'white',borderRadius:20,padding:18,marginTop:25,width:'100%'},helpTitle:{fontSize:17,fontWeight:'700',color:'#305742'}
});