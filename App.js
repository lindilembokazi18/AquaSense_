import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { styles as s } from './src/theme/styles';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MapScreen from './src/screens/MapScreen';
import ReportScreen from './src/screens/ReportScreen';
import HydrateScreen from './src/screens/HydrateScreen';
import ServiceScreen from './src/screens/ServiceScreen';
import ImpactScreen from './src/screens/ImpactScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminUsersScreen from './src/screens/AdminUsersScreen';
import AdminSensorsScreen from './src/screens/AdminSensorsScreen';
import AdminReportsScreen from './src/screens/AdminReportsScreen';
import BottomTabs from './src/navigation/BottomTabs';
import { useAuthSession } from './src/hooks/useAuthSession';
import { BLUE } from './src/theme/colors';

const userScreens = { Dashboard: DashboardScreen, Alerts: AlertsScreen, History: HistoryScreen, Settings: SettingsScreen, Map: MapScreen, Report: ReportScreen, Hydrate: HydrateScreen, Service: ServiceScreen, Impact: ImpactScreen };
const adminScreens = { Admin: AdminDashboardScreen, Users: AdminUsersScreen, Sensors: AdminSensorsScreen, Reports: AdminReportsScreen, Alerts: AlertsScreen, Settings: SettingsScreen, Map: MapScreen };

export default function App() {
  const { session, profile, loading, signIn, signUp, signOut, resetPassword, updatePassword, configError } = useAuthSession();
  const [tab, setTab] = useState('Dashboard');

  useEffect(() => {
    setTab(session?.role === 'admin' ? 'Admin' : 'Dashboard');
  }, [session?.role]);

  if (loading) {
    return <SafeAreaView style={s.safe}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={BLUE} size="large" /></View></SafeAreaView>;
  }

  if (configError && !session) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar style="dark" />
        <LoginScreen onLogin={signIn} onCreateAccount={signUp} onResetPassword={resetPassword} />
      </SafeAreaView>
    );
  }

  if (!session) return <LoginScreen onLogin={signIn} onCreateAccount={signUp} onResetPassword={resetPassword} />;

  const isAdmin = session.role === 'admin';
  const screens = isAdmin ? adminScreens : userScreens;
  const defaultTab = isAdmin ? 'Admin' : 'Dashboard';
  const actualTab = screens[tab] ? tab : defaultTab;
  const ActiveScreen = screens[actualTab] || screens[defaultTab];
  const tabs = isAdmin ? ['Admin', 'Users', 'Sensors', 'Reports', 'Alerts', 'Map', 'Settings'] : ['Dashboard', 'Map', 'Report', 'Hydrate', 'Service', 'Settings'];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <ActiveScreen setTab={setTab} onLogout={signOut} role={session.role} profile={profile} updatePassword={updatePassword} />
      <BottomTabs tabs={tabs} active={actualTab} setTab={setTab} />
    </SafeAreaView>
  );
}
