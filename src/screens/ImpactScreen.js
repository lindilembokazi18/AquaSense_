import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles as s } from '../theme/styles';
import { BLUE } from '../theme/colors';
import { SmallPill, StitchBar } from '../components/Core';

export default function ImpactScreen() {
  return (
    <ScrollView style={s.page} contentContainerStyle={s.bottomPad}>
      <StitchBar />
      <View style={s.impactHero}>
        <Text style={s.micro}>PERSONAL IMPACT</Text>
        <Text style={s.sectionTitle}>Plastic Bottles Saved</Text>
        <Text style={s.massive}>1,284</Text>
        <Text style={s.units}>units</Text>
        <SmallPill icon="trending-up" text="+12% vs last month" gray />
      </View>
      <View style={s.grayCard}>
        <Text style={s.tagBlue}>CARBON OFFSET</Text>
        <Text style={s.sectionTitle}>Carbon Footprint Reduction</Text>
        <Text style={s.kg}>42.5 kg</Text>
        <Text style={s.note}>Equivalent to planting 2 trees this month.</Text>
      </View>
      <View style={s.blueCard}>
        <Ionicons name="leaf" size={34} color="white" />
        <Text style={s.whiteTitle}>Campus Rank</Text>
        <Text style={s.whiteText}>Top 8% Hydration Impact</Text>
        <Text style={s.tagWhite}>VANGUARD</Text>
      </View>
      <View style={s.trendBlank}>
        <Text style={s.sectionTitle}>Monthly Goal</Text>
        <Text style={s.goal}>84%</Text>
        <Text style={s.months}>JAN     FEB     MAR     APR     MAY     JUN</Text>
      </View>
    </ScrollView>
  );
}
