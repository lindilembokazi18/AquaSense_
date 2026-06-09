import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles as s } from '../theme/styles';
import { BLUE, RED, GREEN, shadow } from '../theme/colors';
import { Legend } from '../components/Core';
import { useNodes } from '../hooks/useNodes';

function colorFor(status) {
  if (status === 'UNSAFE' || status === 'Service') return RED;
  if (status === 'CAUTION') return '#F6A500';
  return status === 'GOOD' ? GREEN : BLUE;
}

export default function MapScreen() {
  const { nodes } = useNodes();
  const stations = nodes.length ? nodes : [];
  const [selectedId, setSelectedId] = useState(null);
  const [routeOn, setRouteOn] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      if (mounted) setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    }
    loadLocation().catch(() => {});
    return () => { mounted = false; };
  }, []);
  const selected = stations.find(n => n.node_id === selectedId) || stations[0] || { location_name: 'MAIN QUAD', status: 'SAFE', latitude: -26.1824, longitude: 28.0009 };
  const region = { latitude: Number(selected.latitude || -26.1824), longitude: Number(selected.longitude || 28.0009), latitudeDelta: 0.009, longitudeDelta: 0.009 };

  return (
    <ScrollView style={s.mapScreen} contentContainerStyle={s.bottomPad}>
      <View style={s.fakeMapHeader}>
        <Text style={s.fakeMapTitle}>Campus Water Map</Text>
        <Text style={s.fakeMapSub}>Live station quality overview</Text>
      </View>

      <View style={s.mapCanvasNew}>
        <MapView style={{ flex: 1 }} initialRegion={region} region={region} mapType="standard" showsUserLocation={Boolean(userLocation)} showsMyLocationButton>
          {stations.map((station) => {
            const color = colorFor(station.status);
            return (
              <Marker key={station.node_id} coordinate={{ latitude: Number(station.latitude), longitude: Number(station.longitude) }} title={station.location_name} description={`${station.campus} • ${station.status}`} onPress={() => setSelectedId(station.node_id)}>
                <View style={[s.stationPin, { position: 'relative', left: 0, top: 0, marginLeft: 0, marginTop: 0, borderColor: color }, selected.node_id === station.node_id && s.stationPinActive]}>
                  <Ionicons name={station.status === 'CAUTION' || station.status === 'UNSAFE' ? 'alert-circle' : 'water'} size={22} color={color} />
                </View>
              </Marker>
            );
          })}
          {userLocation ? (
            <Marker coordinate={userLocation} title="You are here">
              <View style={[s.stationPin, { position: 'relative', left: 0, top: 0, marginLeft: 0, marginTop: 0, borderColor: BLUE }]}>
                <Ionicons name="person" size={20} color={BLUE} />
              </View>
            </Marker>
          ) : null}
          {routeOn && selected.latitude && userLocation ? (
            <Polyline coordinates={[userLocation, { latitude: Number(selected.latitude), longitude: Number(selected.longitude) }]} strokeColor={BLUE} strokeWidth={5} />
          ) : null}
        </MapView>
      </View>

      <View style={[s.nearestCard, shadow]}>
        <View style={s.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={s.micro}>SELECTED STATION</Text>
            <Text style={s.nearestCardTitle}>{selected.location_name || selected.label}</Text>
            <Text style={s.body}>{selected.status || 'SAFE'} quality • {selected.campus || 'APK'} campus</Text>
          </View>
          <View style={[s.qualityBubble, { backgroundColor: colorFor(selected.status) }]}>
            <Text style={s.qualityBubbleText}>{selected.status === 'SAFE' ? '98%' : '!'}</Text>
          </View>
        </View>
        <View style={s.mapActions}>
          <Pressable onPress={() => setRouteOn(!routeOn)} style={[s.actionBtn, routeOn && s.actionBtnActive]}>
            <Ionicons name="navigate" size={18} color={routeOn ? 'white' : BLUE} />
            <Text style={[s.actionText, routeOn && s.actionTextActive]}>{routeOn ? 'Route On' : 'Show Route'}</Text>
          </Pressable>
          <Pressable onPress={() => stations[1] && setSelectedId(stations[1].node_id)} style={s.actionBtn}>
            <MaterialCommunityIcons name="tools" size={18} color={BLUE} />
            <Text style={s.actionText}>Service Pin</Text>
          </Pressable>
        </View>
      </View>

      <View style={[s.legendCardNew, shadow]}>
        <Text style={s.sectionTitle}>Station Legend</Text>
        <Legend color={BLUE} label="Optimal Quality" count={String(stations.filter(n => n.status === 'SAFE').length)} />
        <Legend color={GREEN} label="Good Quality" count={String(stations.filter(n => n.status === 'GOOD').length)} />
        <Legend color={RED} label="Service Required" count={String(stations.filter(n => n.status !== 'SAFE').length)} />
        <View style={s.liveBox}>
          <Text style={s.micro}>LIVE UPDATE</Text>
          <Text style={s.italic}>“Station markers are loaded from the live Supabase nodes table.”</Text>
        </View>
      </View>
    </ScrollView>
  );
}
