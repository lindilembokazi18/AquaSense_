import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { styles as s } from '../theme/styles';
import { BLUE, RED, shadow } from '../theme/colors';
import { ListRow, TopHeader } from '../components/Core';
import { updateUserProfile, uploadUserAvatar } from '../services/api';
import { registerForPushNotificationsAsync } from '../utils/messaging';

export default function SettingsScreen({ onLogout, role, profile, updatePassword }) {
  const [localProfile, setLocalProfile] = useState(profile || {});
  const [push, setPush] = useState(Boolean(profile?.push_enabled ?? true));
  const [emailReports, setEmailReports] = useState(Boolean(profile?.email_reports ?? false));
  const [privateMode, setPrivateMode] = useState(false);
  const [message, setMessage] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [campus, setCampus] = useState(profile?.campus_preference || 'APK');
  const [newPassword, setNewPassword] = useState('');

  const sync = async (key, value, setter) => {
    setter(value);
    setMessage('');
    const updates = { [key]: value };
    if (key === 'push_enabled' && value) {
      const token = await registerForPushNotificationsAsync();
      if (token) updates.push_token = token;
    }
    const { error } = await updateUserProfile(profile?.id, updates);
    if (error) setMessage(error.message);
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage('');
    const updates = { full_name: fullName, campus_preference: campus };
    const { data, error } = await updateUserProfile(profile?.id, updates);
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setLocalProfile({ ...localProfile, ...(data || updates) });
    setEditOpen(false);
    Alert.alert('Profile updated', 'Your profile changes were saved.');
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access so you can upload a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.base64) return Alert.alert('Upload failed', 'Could not read the selected image.');
    setSaving(true);
    const { data, error } = await uploadUserAvatar(profile?.id, asset.base64, asset.mimeType || 'image/jpeg');
    setSaving(false);
    if (error) {
      setMessage(error.message || 'Profile picture could not be uploaded. Make sure the avatars storage bucket exists.');
      return;
    }
    setLocalProfile({ ...localProfile, ...(data || {}) });
    Alert.alert('Profile picture updated', 'Your profile picture was uploaded successfully.');
  };

  const changePassword = async () => {
    if (!newPassword) return Alert.alert('New password', 'Enter your new password first.');
    setSaving(true);
    const { error } = await updatePassword(newPassword);
    setSaving(false);
    if (error) setMessage(error.message || 'Password could not be updated.');
    else {
      setNewPassword('');
      Alert.alert('Password updated', 'Your password was changed successfully.');
    }
  };

  const displayName = role === 'admin' ? (localProfile?.full_name || 'Admin Console') : (localProfile?.full_name || 'AquaSense User');
  const avatarUrl = localProfile?.avatar_url;

  return (
    <ScrollView style={s.page} contentContainerStyle={s.bottomPad}>
      <TopHeader admin={role === 'admin'} onLogout={onLogout} />
      <Text style={s.screenTitle}>Settings</Text>
      {message ? <Text style={s.errorMsg}>{message}</Text> : null}
      <Text style={s.micro}>ACCOUNT</Text>
      <Pressable onPress={() => setEditOpen(true)} style={[s.profileCard, shadow]}>
        <View style={s.avatar}>
          {avatarUrl ? <Image source={{ uri: avatarUrl }} style={s.avatarImage} /> : <Text style={{ fontSize: 42 }}>{role === 'admin' ? 'A' : 'U'}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.profileName}>{displayName}</Text>
          <Text style={s.body}>{role === 'admin' ? 'System Administrator' : `${localProfile?.campus_preference || 'APK'} Campus`}</Text>
        </View>
        <Ionicons name="pencil" size={24} color={BLUE} />
      </Pressable>

      <Text style={s.micro}>PREFERENCES</Text>
      <ListRow icon="notifications" title="Push Notifications" sub="Critical water quality alerts" toggle={push} toggleOff={!push} onPress={() => sync('push_enabled', !push, setPush)} />
      <ListRow icon="mail" title="Email Reports" sub="Weekly summary of consumption" toggle={emailReports} toggleOff={!emailReports} onPress={() => sync('email_reports', !emailReports, setEmailReports)} />
      <ListRow icon="lock-closed" title="Private Mode" sub="Hide personal hydration info on this device" toggle={privateMode} toggleOff={!privateMode} onPress={() => setPrivateMode(!privateMode)} />
      <Text style={s.micro}>SUPPORT & INFO</Text>
      <ListRow
        icon="help-circle"
        title="Help Center"
        sub="How to use AquaSense features"
        chevron
        onPress={() => Alert.alert(
          'Help Center',
          'AquaSense helps students view live water station readings, report water issues, track hydration, and check campus water status. Admins can review reports, manage stations, and update report progress.'
        )}
      />
      <ListRow
        icon="shield-checkmark"
        title="Privacy & Safety"
        sub="How your account and reports are handled"
        chevron
        onPress={() => Alert.alert(
          'Privacy & Safety',
          'Your account is protected using Supabase authentication. Reports are stored securely in Supabase and are used to help monitor water quality issues on campus. AquaSense detects and reports issues; UJ facilities or maintenance teams handle physical investigation and repair.'
        )}
      />
      <Pressable onPress={onLogout} style={[s.logoutBtn, shadow]}><Ionicons name="log-out-outline" size={22} color={RED} /><Text style={s.logoutText}>Logout</Text></Pressable>

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={s.modalShade}>
          <View style={s.modalCard}>
            <Text style={s.sectionTitle}>Edit Profile</Text>
            <Pressable onPress={pickAvatar} style={s.avatarEditWrap}>
              <View style={s.avatarLarge}>
                {avatarUrl ? <Image source={{ uri: avatarUrl }} style={s.avatarLargeImage} /> : <Ionicons name="person" size={42} color={BLUE} />}
              </View>
              <Text style={s.link}>{saving ? 'Please wait...' : 'Upload profile picture'}</Text>
            </Pressable>
            <TextInput style={s.adminInput} placeholder="Full name" value={fullName} onChangeText={setFullName} />
            <TextInput style={s.adminInput} placeholder="Campus" value={campus} onChangeText={setCampus} />
            <Text style={[s.micro, { marginTop: 18 }]}>CHANGE PASSWORD</Text>
            <TextInput style={s.adminInput} placeholder="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <View style={s.mapActions}>
              <Pressable onPress={saveProfile} disabled={saving} style={[s.actionBtnActive, { opacity: saving ? 0.5 : 1 }]}><Text style={s.actionTextActive}>Save Profile</Text></Pressable>
              <Pressable onPress={changePassword} disabled={saving} style={s.actionBtn}><Text style={s.actionText}>Change Password</Text></Pressable>
              <Pressable onPress={() => setEditOpen(false)} style={s.actionBtn}><Text style={s.actionText}>Close</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
