import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles as s } from '../theme/styles';
import { BLUE, GREEN, RED, shadow } from '../theme/colors';
import { deleteAlert, getAlerts, resolveAlert } from '../services/api';

export default function AlertsScreen({ role }) {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  const refresh = async () => {
    const { data, error } = await getAlerts().catch(e => ({ data: [], error: e }));
    if (error) setError(error.message);
    setAlerts(data || []);
  };

  useEffect(() => { refresh(); }, []);

  const markResolved = async (id) => {
    const { error } = await resolveAlert(id).catch(e => ({ error: e }));
    if (error) setError(error.message);
    await refresh();
  };

  const remove = (id) => Alert.alert('Delete alert', 'Delete this alert permanently?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await deleteAlert(id); refresh(); } },
  ]);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.bottomPad}>
      <Text style={s.screenTitle}>Alerts</Text>
      <Text style={s.copy}>Automatic water-quality alerts generated from unsafe sensor readings.</Text>
      {error ? <Text style={s.errorMsg}>{error}</Text> : null}
      {alerts.map((a) => {
        const resolved = !!a.resolved_at;
        return (
          <View key={a.id} style={[s.feedCard, shadow]}>
            <View style={s.reportTop}>
              <View style={s.locationCircle}><Ionicons name={resolved ? 'checkmark-circle' : 'warning'} size={22} color={resolved ? GREEN : RED} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.reportTitle}>{a.nodes?.location_name || 'Campus node'}</Text>
                <Text style={s.reportBy}>{a.parameter} value {a.value} exceeded threshold {a.threshold}</Text>
              </View>
              <Text style={[s.statusBadge, { color: resolved ? GREEN : RED }]}>{resolved ? 'resolved' : 'active'}</Text>
            </View>
            <Text style={s.reportDesc}>Created {new Date(a.created_at).toLocaleString()}</Text>
            {role === 'admin' ? (
              <View style={s.mapActions}>
                {!resolved ? <Pressable onPress={() => markResolved(a.id)} style={s.actionBtnActive}><Text style={s.actionTextActive}>Resolve</Text></Pressable> : null}
                <Pressable onPress={() => remove(a.id)} style={s.actionBtn}><Text style={[s.actionText, { color: RED }]}>Delete</Text></Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
      {!alerts.length ? <Text style={s.body}>No alerts yet. Alerts will appear automatically when a reading is unsafe.</Text> : null}
    </ScrollView>
  );
}
