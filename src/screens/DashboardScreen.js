import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { styles as s } from '../theme/styles';
import { shadow } from '../theme/colors';
import { MetricsGrid, Ring, SmallPill, TopHeader, TrendCard } from '../components/Core';
import { useRealtimeReadings } from '../hooks/useRealtimeReadings';

export default function DashboardScreen({ onLogout }) {
  const { readings, latest } = useRealtimeReadings();
  const status = latest?.sans_status || 'SAFE';
  const ringValue = status === 'SAFE' ? 'Safe' : status === 'CAUTION' ? 'Check' : 'Unsafe';
  const updated = latest?.created_at ? new Date(latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'live';
  return (
    <ScrollView style={s.page} contentContainerStyle={s.bottomPad}>
      <TopHeader onLogout={onLogout} />
      <Text style={s.screenTitle}>Water Status</Text>
      <View style={s.rowBetween}>
        <Text style={s.subTitle}>University Laboratory Main Line</Text>
        <Text style={s.lastUpdated}>LAST UPDATED{`
`}{updated}</Text>
      </View>
      <View style={[s.statusCard, shadow]}>
        <Ring value={ringValue} label={status === 'SAFE' ? 'CONDITION' : 'ACTION NEEDED'} />
        <Text style={s.sectionTitle}>System Performance</Text>
        <Text style={s.body}>{status === 'SAFE' ? 'All sensors reporting within optimal parameters. Dashboard updates through Supabase Realtime as new sensor readings arrive.' : 'One or more readings is outside the configured SANS 241 threshold. Check the map and reports.'}</Text>
        <View style={s.pillRow}>
          <SmallPill icon="checkmark-circle" text={status === 'SAFE' ? 'BIOSAFE CERTIFIED' : 'ALERT GENERATED'} />
          <SmallPill icon="flash" text="REALTIME DATA" gray />
        </View>
      </View>
      <MetricsGrid reading={latest} />
      <TrendCard readings={readings} />
    </ScrollView>
  );
}
