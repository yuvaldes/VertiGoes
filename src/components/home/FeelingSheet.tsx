import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { Microphone, Stop } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { MoodCheckIn, MoodTag } from '../../data/dayRecords';
import { color, font } from '../../theme/tokens';
import { TaskSheet } from './TaskSheet';

type Props = { visible: boolean; onDismiss: () => void; onSubmit: (feeling: MoodCheckIn) => void };
const MOODS = [{ score:5 as const,emoji:'😄',label:'Excellent'},{score:4 as const,emoji:'🙂',label:'Good'},{score:3 as const,emoji:'😐',label:'So-so'},{score:2 as const,emoji:'😟',label:'Not good'},{score:1 as const,emoji:'😣',label:'Very difficult'}];
const TAGS: { id: MoodTag; label: string }[] = [{id:'calm',label:'😌 Calm'},{id:'anxious',label:'😰 Anxious'},{id:'sad',label:'😔 Sad'},{id:'frustrated',label:'😤 Frustrated'},{id:'tired',label:'😴 Tired'},{id:'lonely',label:'🫥 Lonely'},{id:'hopeful',label:'💪 Hopeful'}];

export function FeelingSheet({ visible, onDismiss, onSubmit }: Props) {
  const [score,setScore]=useState<MoodCheckIn['score']|null>(null); const [tags,setTags]=useState<MoodTag[]>([]); const [note,setNote]=useState(''); const [voiceUri,setVoiceUri]=useState<string|null>(null);
  const recorder=useAudioRecorder({...RecordingPresets.LOW_QUALITY,directory:'document'}); const state=useAudioRecorderState(recorder);
  useEffect(()=>{if(visible){setScore(null);setTags([]);setNote('');setVoiceUri(null);}},[visible]);
  const toggle=(id:MoodTag)=>setTags(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
  const record=async()=>{if(state.isRecording){await recorder.stop();setVoiceUri(recorder.uri);return;} const p=await requestRecordingPermissionsAsync();if(!p.granted)return;await setAudioModeAsync({allowsRecording:true,playsInSilentMode:true});await recorder.prepareToRecordAsync();recorder.record();};
  return <TaskSheet visible={visible} title="How are you feeling today?" canSubmit={score!==null} onSubmit={()=>score&&onSubmit({score,tags,note:note.trim(),voiceUri})} onDismiss={onDismiss}><View style={s.root}>
    <View style={s.moods}>{MOODS.map(m=><Pressable key={m.score} onPress={()=>setScore(m.score)} style={[s.mood,score===m.score&&s.selected]}><Text style={s.emoji}>{m.emoji}</Text><Text style={s.small}>{m.label}</Text></Pressable>)}</View>
    <Text style={s.heading}>What is with you today? (optional)</Text><View style={s.tags}>{TAGS.map(t=><Pressable key={t.id} onPress={()=>toggle(t.id)} style={[s.tag,tags.includes(t.id)&&s.selected]}><Text style={s.tagText}>{t.label}</Text></Pressable>)}</View>
    <TextInput value={note} onChangeText={setNote} maxLength={500} multiline placeholder="Want to add something? (optional)" style={s.input}/>
    <Pressable onPress={record} style={s.record}><Text style={s.recordText}>{state.isRecording?'Stop recording':voiceUri?'Record again':'Add voice note'}</Text>{state.isRecording?<Stop size={18} color={color.error500}/>:<Microphone size={18} color={color.brand500}/>}</Pressable>
  </View></TaskSheet>;
}
const s=StyleSheet.create({root:{gap:14,width:'100%'},moods:{flexDirection:'row',gap:6},mood:{flex:1,alignItems:'center',paddingVertical:8,borderWidth:1,borderColor:color.gray200,borderRadius:12},selected:{backgroundColor:color.brand50,borderColor:color.brand500},emoji:{fontSize:24},small:{fontFamily:font.body,fontSize:10,textAlign:'center',color:color.gray700},heading:{fontFamily:font.bodySemiBold,fontSize:13,color:color.gray900},tags:{flexDirection:'row',flexWrap:'wrap',gap:8},tag:{paddingHorizontal:10,paddingVertical:7,borderWidth:1,borderColor:color.gray200,borderRadius:99},tagText:{fontFamily:font.body,fontSize:12,color:color.gray900},input:{minHeight:72,borderWidth:1,borderColor:color.gray200,borderRadius:12,padding:12,fontFamily:font.body,color:color.gray900,textAlignVertical:'top'},record:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,padding:10},recordText:{fontFamily:font.bodySemiBold,color:color.brand600}});
