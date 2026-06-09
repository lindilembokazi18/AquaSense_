import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { styles as s } from '../theme/styles';
import { BLUE, shadow } from '../theme/colors';
import { Chip, FloatingAddButton, Input, Label, ReportCard, StatBox, StitchBar } from '../components/Core';
import { useReports } from '../hooks/useReports';
import { useNodes } from '../hooks/useNodes';

export default function ReportScreen({ profile }) {
  const { reports, submitReport } = useReports();
  const { nodes } = useNodes();
  const [filter, setFilter] = useState('All Reports');
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState('Taste Issues');
  const [description, setDescription] = useState('');

  const visible = filter === 'All Reports' ? reports : reports.filter(r => (r.issue_type || '').toLowerCase().includes(filter.split(' ')[0].toLowerCase()));
  const save = async () => {
    const node = nodes[0];
    await submitReport({ node_id: node?.node_id, user_id: profile?.id, issue_type: issue.toUpperCase(), description, status: 'open' });
    setDescription(''); setOpen(false);
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.bottomPad}>
      <StitchBar />
      <Text style={s.bigTitle}>Community Feed</Text>
      <Text style={s.copy}>Real-time water quality insights from fellow students across campus.</Text>
      <View style={s.statsRow}>
        <StatBox title="ACTIVE ALERTS" value={String(reports.filter(r => r.status !== 'resolved').length)} />
        <StatBox title="VERIFIED TODAY" value="156" active />
      </View>
      <View style={s.chips}>
        {['All Reports', 'Low Pressure', 'Taste Issues'].map(c => <Pressable key={c} onPress={() => setFilter(c)}><Chip text={c} active={filter === c} /></Pressable>)}
      </View>
      {visible.map((r) => (
        <ReportCard key={r.id} title={r.nodes?.location_name || 'Campus Station'} tag={r.issue_type || 'REPORT'} desc={r.description || 'No description supplied.'} count="24" />
      ))}
      <FloatingAddButton onPress={() => setOpen(true)} />

      <Modal transparent visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={s.modalShade}><View style={[s.modalCard, shadow]}>
          <Text style={s.h1}>Submit Report</Text>
          <Text style={s.copy}>This report is saved to the Supabase reports table.</Text>
          <Label>Issue Type</Label><Input icon="warning" placeholder="Taste Issues" value={issue} onChangeText={setIssue} />
          <Label>Description</Label><Input icon="document-text" placeholder="Describe the water problem" value={description} onChangeText={setDescription} />
          <Pressable onPress={save} style={[s.primaryBtn, { marginBottom: 10 }]}><Text style={s.primaryText}>Submit Report</Text></Pressable>
          <Pressable onPress={() => setOpen(false)}><Text style={[s.centerText, { color: BLUE, fontWeight: '900' }]}>Cancel</Text></Pressable>
        </View></View>
      </Modal>
    </ScrollView>
  );
}
