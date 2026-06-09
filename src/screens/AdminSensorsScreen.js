import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles as s } from '../theme/styles';
import { BLUE, GREEN, RED, shadow } from '../theme/colors';
import { Input, Label, TopHeader } from '../components/Core';
import { useNodes } from '../hooks/useNodes';

const emptyForm = { campus: 'APK', location_name: '', latitude: '-26.1824', longitude: '28.0009', status: 'SAFE' };

export default function AdminSensorsScreen({ onLogout }) {
  const { nodes, error, addNode, editNode, removeNode } = useNodes();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  const startAdd = () => { setEditing(null); setForm(emptyForm); setMessage(''); setOpen(true); };
  const startEdit = (node) => {
    setEditing(node);
    setForm({
      campus: node.campus || 'APK',
      location_name: node.location_name || '',
      latitude: String(node.latitude || ''),
      longitude: String(node.longitude || ''),
      status: node.status || 'SAFE',
    });
    setMessage('');
    setOpen(true);
  };

  const save = async () => {
    const payload = {
      campus: form.campus.trim(),
      location_name: form.location_name.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      status: form.status.trim().toUpperCase(),
      last_seen: new Date().toISOString(),
    };
    if (!payload.location_name || Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
      setMessage('Location name, latitude and longitude are required.');
      return;
    }
    const result = editing ? await editNode(editing.node_id, payload) : await addNode(payload);
    if (result.error) setMessage(result.error.message);
    else setOpen(false);
  };

  const confirmDelete = (node) => {
    Alert.alert('Delete station', `Delete ${node.location_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeNode(node.node_id) },
    ]);
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.bottomPad}>
      <TopHeader admin onLogout={onLogout} />
      <View style={s.rowBetween}><View><Text style={s.screenTitle}>Sensors</Text><Text style={s.subTitle}>Create, update and remove live Supabase water stations.</Text></View><Pressable onPress={startAdd} style={s.floatingMini}><Ionicons name="add" size={24} color="white" /></Pressable></View>
      {error ? <Text style={s.errorMsg}>{error}</Text> : null}
      {nodes.map(n => <View key={n.node_id} style={[s.sensorCard, shadow]}><View style={[s.userAvatar, { backgroundColor: n.status === 'SAFE' ? '#E6FFF3' : '#FFE8EA' }]}><Ionicons name="hardware-chip" size={24} color={n.status === 'SAFE' ? GREEN : RED} /></View><View style={{ flex: 1 }}><Text style={s.reportTitle}>{n.location_name}</Text><Text style={s.body}>{n.campus} • {n.status} • {n.last_seen ? new Date(n.last_seen).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'waiting'}</Text><Text style={s.micro}>{Number(n.latitude).toFixed(4)}, {Number(n.longitude).toFixed(4)}</Text></View><View><Pressable onPress={() => startEdit(n)} style={s.iconAction}><Ionicons name="create" size={18} color={BLUE} /></Pressable><Pressable onPress={() => confirmDelete(n)} style={s.iconAction}><Ionicons name="trash" size={18} color={RED} /></Pressable></View></View>)}
      {!nodes.length ? <Text style={s.body}>No stations found. Add your first station using the + button.</Text> : null}

      <Modal transparent visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={s.modalShade}><View style={[s.modalCard, shadow]}>
          <Text style={s.h1}>{editing ? 'Update Station' : 'Add Station'}</Text>
          <Label>Location Name</Label><Input icon="location" placeholder="Science Hall Fountain" value={form.location_name} onChangeText={v => setForm({ ...form, location_name: v })} />
          <Label>Campus</Label><Input icon="business" placeholder="APK" value={form.campus} onChangeText={v => setForm({ ...form, campus: v })} />
          <Label>Latitude</Label><Input icon="navigate" placeholder="-26.1824" value={form.latitude} onChangeText={v => setForm({ ...form, latitude: v })} />
          <Label>Longitude</Label><Input icon="navigate" placeholder="28.0009" value={form.longitude} onChangeText={v => setForm({ ...form, longitude: v })} />
          <Label>Status</Label><Input icon="water" placeholder="SAFE / CAUTION / UNSAFE / OFFLINE" value={form.status} onChangeText={v => setForm({ ...form, status: v })} />
          {message ? <Text style={s.errorMsg}>{message}</Text> : null}
          <Pressable onPress={save} style={[s.primaryBtn, { marginBottom: 10 }]}><Text style={s.primaryText}>{editing ? 'Save Changes' : 'Create Station'}</Text></Pressable>
          <Pressable onPress={() => setOpen(false)}><Text style={[s.centerText, { color: BLUE, fontWeight: '900' }]}>Cancel</Text></Pressable>
        </View></View>
      </Modal>
    </ScrollView>
  );
}
