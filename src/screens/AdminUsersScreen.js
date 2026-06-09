import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles as s } from '../theme/styles';
import { BLUE, GREEN, RED, shadow } from '../theme/colors';
import { TopHeader } from '../components/Core';
import { createUserByAdmin, deleteUserByAdmin, getUsers, updateUserByAdmin } from '../services/api';

const emptyForm = { full_name: '', email: '', password: '', campus_preference: 'APK', role: 'student' };

export default function AdminUsersScreen({ onLogout, profile }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const refresh = async () => {
    const { data, error } = await getUsers().catch(e => ({ data: [], error: e }));
    if (error) setError(error.message);
    else setError('');
    setUsers(data || []);
  };

  useEffect(() => { refresh(); }, []);

  const activeCount = useMemo(() => users.filter(u => u.status !== 'suspended').length, [users]);

  const createUser = async () => {
    setSaving(true);
    setError('');
    const { data, error } = await createUserByAdmin(form).catch(e => ({ data: null, error: e }));
    setSaving(false);
    if (error) {
      setError(error.message || 'Could not create user. Make sure the admin-create-user Edge Function is deployed.');
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    await refresh();
    Alert.alert('User created', `${data?.email || form.email} can now sign in.`);
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditForm({
      full_name: u.full_name || '',
      campus_preference: u.campus_preference || 'APK',
      role: u.role || 'student',
      status: u.status || 'active',
    });
  };

  const saveEdit = async (id) => {
    const { error } = await updateUserByAdmin(id, editForm).catch(e => ({ error: e }));
    if (error) setError(error.message);
    else {
      setEditingId(null);
      setEditForm({});
      await refresh();
    }
  };

  const suspendToggle = async (u) => {
    if (u.id === profile?.id) return Alert.alert('Not allowed', 'You cannot suspend your own admin account.');
    const next = u.status === 'suspended' ? 'active' : 'suspended';
    const { error } = await updateUserByAdmin(u.id, { status: next }).catch(e => ({ error: e }));
    if (error) setError(error.message);
    await refresh();
  };

  const removeUser = (u) => {
    if (u.id === profile?.id) return Alert.alert('Not allowed', 'You cannot delete your own admin account.');
    Alert.alert('Delete user', `Delete ${u.email} permanently? This removes the Auth account and profile.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await deleteUserByAdmin(u.id).catch(e => ({ error: e }));
        if (error) setError(error.message || 'Could not delete user. Make sure the admin-delete-user Edge Function is deployed.');
        await refresh();
      } },
    ]);
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.bottomPad}>
      <TopHeader admin onLogout={onLogout} />
      <Text style={s.screenTitle}>Users</Text>
      <Text style={s.subTitle}>Create, view, update, suspend, and delete AquaSense accounts.</Text>

      <View style={[s.alertCard, shadow]}>
        <View style={s.rowBetween}>
          <View>
            <Text style={s.micro}>USER MANAGEMENT</Text>
            <Text style={s.sectionTitle}>{users.length} total • {activeCount} active</Text>
          </View>
          <Pressable onPress={() => setShowForm(!showForm)} style={s.actionBtnActive}>
            <Text style={s.actionTextActive}>{showForm ? 'Close' : 'Add User'}</Text>
          </Pressable>
        </View>
        {showForm ? (
          <View style={{ marginTop: 14 }}>
            <TextInput style={s.adminInput} placeholder="Full name" value={form.full_name} onChangeText={v => setForm({ ...form, full_name: v })} />
            <TextInput style={s.adminInput} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={v => setForm({ ...form, email: v })} />
            <TextInput style={s.adminInput} placeholder="Temporary password" secureTextEntry value={form.password} onChangeText={v => setForm({ ...form, password: v })} />
            <TextInput style={s.adminInput} placeholder="Campus" value={form.campus_preference} onChangeText={v => setForm({ ...form, campus_preference: v })} />
            <View style={s.mapActions}>
              <Pressable onPress={() => setForm({ ...form, role: 'student' })} style={[s.actionBtn, form.role === 'student' && s.actionBtnActive]}><Text style={form.role === 'student' ? s.actionTextActive : s.actionText}>Student</Text></Pressable>
              <Pressable onPress={() => setForm({ ...form, role: 'admin' })} style={[s.actionBtn, form.role === 'admin' && s.actionBtnActive]}><Text style={form.role === 'admin' ? s.actionTextActive : s.actionText}>Admin</Text></Pressable>
              <Pressable disabled={saving} onPress={createUser} style={[s.actionBtnActive, { opacity: saving ? 0.5 : 1 }]}><Text style={s.actionTextActive}>{saving ? 'Saving...' : 'Create'}</Text></Pressable>
            </View>
          </View>
        ) : null}
      </View>

      {error ? <Text style={s.errorMsg}>{error}</Text> : null}

      {users.map(u => {
        const editing = editingId === u.id;
        return (
          <View key={u.id || u.email} style={[s.userCard, shadow]}>
            <View style={s.userAvatar}><Ionicons name={u.role === 'admin' ? 'shield-checkmark' : 'person'} size={24} color={BLUE} /></View>
            <View style={{ flex: 1 }}>
              {editing ? (
                <>
                  <TextInput style={s.adminInput} placeholder="Full name" value={editForm.full_name} onChangeText={v => setEditForm({ ...editForm, full_name: v })} />
                  <TextInput style={s.adminInput} placeholder="Campus" value={editForm.campus_preference} onChangeText={v => setEditForm({ ...editForm, campus_preference: v })} />
                  <View style={s.mapActions}>
                    <Pressable onPress={() => setEditForm({ ...editForm, role: 'student' })} style={[s.actionBtn, editForm.role === 'student' && s.actionBtnActive]}><Text style={editForm.role === 'student' ? s.actionTextActive : s.actionText}>Student</Text></Pressable>
                    <Pressable onPress={() => setEditForm({ ...editForm, role: 'admin' })} style={[s.actionBtn, editForm.role === 'admin' && s.actionBtnActive]}><Text style={editForm.role === 'admin' ? s.actionTextActive : s.actionText}>Admin</Text></Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={s.reportTitle}>{u.full_name || u.email}</Text>
                  <Text style={s.body}>{u.email} • {u.campus_preference || 'APK'}</Text>
                  <Text style={[s.micro, { color: u.status === 'suspended' ? RED : GREEN }]}>{u.role || 'student'} • {u.status || 'active'}</Text>
                </>
              )}
              <View style={s.mapActions}>
                {editing ? <Pressable onPress={() => saveEdit(u.id)} style={s.actionBtnActive}><Text style={s.actionTextActive}>Save</Text></Pressable> : <Pressable onPress={() => startEdit(u)} style={s.actionBtn}><Text style={s.actionText}>Edit</Text></Pressable>}
                {editing ? <Pressable onPress={() => setEditingId(null)} style={s.actionBtn}><Text style={s.actionText}>Cancel</Text></Pressable> : <Pressable onPress={() => suspendToggle(u)} style={s.actionBtn}><Text style={s.actionText}>{u.status === 'suspended' ? 'Activate' : 'Suspend'}</Text></Pressable>}
                <Pressable onPress={() => removeUser(u)} style={s.actionBtn}><Text style={[s.actionText, { color: RED }]}>Delete</Text></Pressable>
              </View>
            </View>
          </View>
        );
      })}
      {!users.length ? <Text style={s.body}>No users found.</Text> : null}
    </ScrollView>
  );
}
