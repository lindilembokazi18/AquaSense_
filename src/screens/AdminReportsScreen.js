import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles as s } from '../theme/styles';
import { BLUE, GREEN, RED, shadow } from '../theme/colors';
import { TopHeader } from '../components/Core';
import { useReports } from '../hooks/useReports';

export default function AdminReportsScreen({ onLogout }) {
  const { reports, error, setStatus, removeReport } = useReports();
  const confirmDelete = (report) => {
    Alert.alert('Delete report', 'Delete this report permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeReport(report.id) },
    ]);
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.bottomPad}>
      <TopHeader admin onLogout={onLogout} />
      <Text style={s.screenTitle}>Reports</Text>
      <Text style={s.subTitle}>Crowdsourced water reports submitted by students.</Text>
      {error ? <Text style={s.errorMsg}>{error}</Text> : null}
      {reports.map((r) => (
        <View key={r.id} style={[s.feedCard, shadow]}>
          <View style={s.reportTop}><View style={s.locationCircle}><Ionicons name="document-text" size={20} color={BLUE} /></View><View style={{ flex: 1 }}><Text style={s.reportTitle}>{r.nodes?.location_name || 'Campus Station'}</Text><Text style={s.reportBy}>{r.issue_type} • {r.status || 'open'} • {r.users?.email || 'student'}</Text></View><Text style={[s.statusBadge, { color: r.status === 'resolved' ? GREEN : RED }]}>{r.status || 'open'}</Text></View>
          <Text style={s.reportDesc}>{r.description}</Text>
          <View style={s.mapActions}>
            <Pressable onPress={() => setStatus(r.id, 'in_progress')} style={s.actionBtn}><Text style={s.actionText}>In Progress</Text></Pressable>
            <Pressable onPress={() => setStatus(r.id, 'resolved')} style={[s.actionBtn, s.actionBtnActive]}><Text style={s.actionTextActive}>Resolve</Text></Pressable>
            <Pressable onPress={() => confirmDelete(r)} style={s.actionBtn}><Text style={[s.actionText, { color: RED }]}>Delete</Text></Pressable>
          </View>
        </View>
      ))}
      {!reports.length ? <Text style={s.body}>No reports found.</Text> : null}
    </ScrollView>
  );
}
