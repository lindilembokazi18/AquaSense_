import React from 'react';
import { ScrollView, Text } from 'react-native';
import { styles as s } from '../theme/styles';
import { ListRow, TrendCard } from '../components/Core';

export default function HistoryScreen() {
  return (
    <ScrollView style={s.page} contentContainerStyle={s.bottomPad}>
      <Text style={s.screenTitle}>History</Text>
      <TrendCard />
      <ListRow icon="water" title="PH Level" sub="7.2 • Optimal" right="Today" />
      <ListRow icon="thermometer" title="Temperature" sub="18.5° • Nominal" right="Today" />
      <ListRow icon="analytics" title="Weekly Average" sub="All readings stable" right="+12%" />
    </ScrollView>
  );
}
