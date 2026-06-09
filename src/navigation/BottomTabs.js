import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BLUE } from '../theme/colors';
import { styles as s } from '../theme/styles';

const icons = {
  Dashboard: ['grid', 'ion'], Alerts: ['notifications', 'ion'], History: ['time', 'ion'], Settings: ['settings', 'ion'],
  Map: ['map', 'ion'], Report: ['chatbubble-ellipses', 'ion'], Hydrate: ['water', 'ion'], Service: ['tools', 'mci'], Impact: ['leaf', 'ion'],
  Admin: ['speedometer', 'ion'], Users: ['people', 'ion'], Sensors: ['hardware-chip', 'ion'], Reports: ['document-text', 'ion'],
};

export default function BottomTabs({ tabs, active, setTab }) {
  return (
    <View style={s.tabBar}>
      {tabs.map((tab) => {
        const selected = tab === active;
        const [icon, type] = icons[tab] || ['ellipse', 'ion'];
        const color = selected ? BLUE : '#747B89';
        return (
          <Pressable key={tab} onPress={() => setTab(tab)} style={[s.tab, selected && s.tabActive]}>
            {type === 'mci' ? <MaterialCommunityIcons name={icon} size={23} color={color} /> : <Ionicons name={icon} size={23} color={color} />}
            <Text style={[s.tabText, selected && s.tabTextActive]}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
