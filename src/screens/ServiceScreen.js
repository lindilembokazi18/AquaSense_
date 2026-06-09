import React from 'react';
import { ScrollView, Text } from 'react-native';
import { styles as s } from '../theme/styles';
import { StitchBar, Timeline } from '../components/Core';

export default function ServiceScreen() {
  return (
    <ScrollView style={s.page} contentContainerStyle={s.bottomPad}>
      <StitchBar />
      <Text style={s.bigTitle}>Service Timeline</Text>
      <Timeline status="IN PROGRESS" title="West Hall Filter Swap" date="Oct 28" time="09:00 AM - 12:00 PM" text="Routine replacement of nano-carbon filtration units for Floors 1-4. Water service may be intermittent during this window." />
      <Timeline status="SCHEDULED" title="North Tower System Flush" date="Oct 30" time="Full Day Event" text="Quarterly system-wide sanitation flush. This is a preventative measure to ensure zero-bacterial growth." />
      <Timeline status="COMPLETED" title="East Wing Sensor Calib" date="Oct 24" time="Finished at 4:12 PM" text="Calibration Certificate Issued" done />
    </ScrollView>
  );
}
