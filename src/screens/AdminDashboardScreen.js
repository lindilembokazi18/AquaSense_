import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles as s } from '../theme/styles';
import { BLUE, GREEN, RED, shadow } from '../theme/colors';
import { TopHeader } from '../components/Core';
import { getAdminSummary } from '../services/api';

function AdminMetric({ icon, value, label, color = BLUE }) {
  return <View style={[s.adminMetric, shadow]}><View style={[s.adminIcon, { backgroundColor: color + '22' }]}><Ionicons name={icon} size={24} color={color} /></View><Text style={s.metricNum}>{value}</Text><Text style={s.metricLabel}>{label}</Text></View>;
}

export default function AdminDashboardScreen({ setTab, onLogout }) {
  const [systemLive, setSystemLive] = useState(true);
  const [summary, setSummary] = useState({ users: 0, nodes: 0, openReports: 0, compliance: 0 });
  useEffect(() => { getAdminSummary().then(({ data }) => setSummary(data)); }, []);
  return (
    <ScrollView style={s.page} contentContainerStyle={s.bottomPad}>
      <TopHeader admin onLogout={onLogout} />
      <Text style={s.screenTitle}>Admin Dashboard</Text>
      <Text style={s.subTitle}>Manage users, stations, reports and service alerts.</Text>
      <View style={[s.adminHero, shadow]}>
        <View style={s.rowBetween}><View><Text style={s.micro}>SYSTEM HEALTH</Text><Text style={s.adminHeroTitle}>Campus Network</Text><Text style={s.body}>{summary.nodes} stations online • {summary.openReports} reports need attention</Text></View><Pressable onPress={() => setSystemLive(!systemLive)} style={systemLive ? s.switchOn : s.switchOff}><View style={systemLive ? s.knobOn : s.knobOff} /></Pressable></View>
        <View style={s.adminProgress}><View style={[s.adminProgressFill, { width: systemLive ? `${summary.compliance || 86}%` : '42%' }]} /></View>
        <Text style={s.link}>{systemLive ? 'Live monitoring enabled' : 'Monitoring paused'}</Text>
      </View>
      <View style={s.adminGrid}>
        <AdminMetric icon="people" value={String(summary.users)} label="ACTIVE USERS" />
        <AdminMetric icon="water" value={String(summary.nodes)} label="STATIONS" color={GREEN} />
        <AdminMetric icon="warning" value={String(summary.openReports)} label="OPEN REPORTS" color={RED} />
        <AdminMetric icon="shield-checkmark" value={`${summary.compliance}%`} label="COMPLIANCE" />
      </View>
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.quickRow}>
        <Pressable onPress={() => setTab('Users')} style={[s.quickCard, shadow]}><Ionicons name="people" size={26} color={BLUE} /><Text style={s.quickTitle}>Manage Users</Text></Pressable>
        <Pressable onPress={() => setTab('Sensors')} style={[s.quickCard, shadow]}><Ionicons name="hardware-chip" size={26} color={BLUE} /><Text style={s.quickTitle}>Sensors</Text></Pressable>
        <Pressable onPress={() => setTab('Reports')} style={[s.quickCard, shadow]}><Ionicons name="document-text" size={26} color={BLUE} /><Text style={s.quickTitle}>Reports</Text></Pressable>
      </View>
      <View style={[s.feedCard, shadow]}><Text style={s.sectionTitle}>Recent Admin Activity</Text><Text style={s.body}>• Supabase Realtime listening to readings and reports</Text><Text style={s.body}>• Role-based auth enabled through users.role</Text><Text style={s.body}>• Map markers loaded from nodes table</Text></View>
    </ScrollView>
  );
}
