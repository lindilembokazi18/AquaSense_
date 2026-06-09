import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles as s } from '../theme/styles';
import { BLUE } from '../theme/colors';
import { ListRow, SmallPill, StitchBar } from '../components/Core';
import { createHydrationLog, deleteHydrationLog, getHydrationLogs, updateHydrationLog } from '../services/api';

export default function HydrateScreen({ profile }) {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');

  const refresh = async () => {
    if (!profile?.id) return;
    const { data, error } = await getHydrationLogs(profile.id).catch(e => ({ data: [], error: e }));
    if (error) setError(error.message);
    setLogs(data || []);
  };
  useEffect(() => { refresh(); }, [profile?.id]);

  const add = async (amount_ml, drink_type = 'Water') => {
    const amount = Number(amount_ml);
    if (!amount || amount < 1) return setError('Enter a valid amount.');
    const { error } = await createHydrationLog(profile.id, amount, drink_type);
    if (error) setError(error.message);
    setCustomAmount('');
    await refresh();
  };

  const saveEdit = async (id) => {
    const amount = Number(editAmount);
    if (!amount || amount < 1) return setError('Enter a valid amount.');
    const { error } = await updateHydrationLog(id, { amount_ml: amount });
    if (error) setError(error.message);
    setEditingId(null);
    await refresh();
  };

  const remove = (id) => Alert.alert('Delete intake', 'Remove this intake record?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await deleteHydrationLog(id); refresh(); } },
  ]);

  const total = logs.reduce((sum, item) => sum + Number(item.amount_ml || 0), 0);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.bottomPad}>
      <StitchBar />
      <View style={s.alertCard}>
        <Text style={s.sectionTitle}>Track Your Water Intake</Text>
        <View style={s.pillRow}>
          <SmallPill icon="water" text={`${total}ml today`} />
          <SmallPill icon="trophy" text="Goal 2000ml" gray />
        </View>
      </View>
      {error ? <Text style={s.errorMsg}>{error}</Text> : null}
      <View style={s.twoCols}>
        <Pressable onPress={() => add(250)} style={s.tipCard}>
          <Ionicons name="water" color={BLUE} size={30} />
          <Text style={s.body}>Quick Add</Text>
          <Text style={s.sectionTitle}>250ml Water</Text>
        </Pressable>
        <Pressable onPress={() => add(500)} style={s.tipCard}>
          <Ionicons name="add-circle" color={BLUE} size={30} />
          <Text style={s.body}>Quick Add</Text>
          <Text style={s.statValueDark}>500ml</Text>
        </Pressable>
      </View>
      <View style={[s.feedCard, { marginTop: 6 }]}> 
        <Text style={s.sectionTitle}>Custom Intake</Text>
        <TextInput style={s.adminInput} placeholder="Amount in ml" keyboardType="numeric" value={customAmount} onChangeText={setCustomAmount} />
        <Pressable onPress={() => add(customAmount)} style={[s.actionBtnActive, { marginTop: 12, alignSelf: 'flex-start' }]}><Text style={s.actionTextActive}>Save Intake</Text></Pressable>
      </View>
      <View style={s.rowBetween}>
        <Text style={s.sectionTitle}>Recent Intake</Text>
        <Text style={s.link}>{logs.length} records</Text>
      </View>
      {logs.map(item => editingId === item.id ? (
        <View key={item.id} style={s.feedCard}>
          <Text style={s.reportTitle}>Edit intake</Text>
          <TextInput style={s.adminInput} placeholder="Amount in ml" keyboardType="numeric" value={editAmount} onChangeText={setEditAmount} />
          <View style={s.mapActions}>
            <Pressable onPress={() => saveEdit(item.id)} style={s.actionBtnActive}><Text style={s.actionTextActive}>Save</Text></Pressable>
            <Pressable onPress={() => setEditingId(null)} style={s.actionBtn}><Text style={s.actionText}>Cancel</Text></Pressable>
          </View>
        </View>
      ) : (
        <Pressable key={item.id} onPress={() => { setEditingId(item.id); setEditAmount(String(item.amount_ml)); }} onLongPress={() => remove(item.id)}>
          <ListRow icon="water" title={item.drink_type || 'Water'} sub={`${new Date(item.created_at).toLocaleString()} • tap to edit, long press to delete`} right={`${item.amount_ml}ml`} />
        </Pressable>
      ))}
      {!logs.length ? <Text style={s.body}>No intake records yet. Tap a quick-add card to save your first record.</Text> : null}
    </ScrollView>
  );
}
