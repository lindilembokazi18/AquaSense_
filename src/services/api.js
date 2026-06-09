import { requireSupabase } from '../lib/supabase';

function handleError(error) {
  if (error) return { data: null, error };
  return null;
}

export async function getCurrentUserProfile(userId) {
  const sb = requireSupabase();
  const result = await sb.from('users').select('*').eq('id', userId).single();
  if (result.error && result.error.code === 'PGRST116') return { data: null, error: null };
  return result;
}

export async function upsertUserProfile(profile) {
  const sb = requireSupabase();
  return sb.from('users').upsert(profile, { onConflict: 'id' }).select().single();
}

export async function updateUserProfile(userId, updates) {
  const sb = requireSupabase();
  return sb.from('users').update(updates).eq('id', userId).select().single();
}

export async function getUsers() {
  const sb = requireSupabase();
  return sb.from('users').select('*').order('created_at', { ascending: false });
}

export async function updateUserRole(id, role) {
  const sb = requireSupabase();
  return sb.from('users').update({ role }).eq('id', id).select().single();
}

export async function getNodes() {
  const sb = requireSupabase();
  return sb.from('nodes').select('*').order('location_name');
}

export async function createNode(payload) {
  const sb = requireSupabase();
  return sb.from('nodes').insert(payload).select().single();
}

export async function updateNode(nodeId, updates) {
  const sb = requireSupabase();
  return sb.from('nodes').update(updates).eq('node_id', nodeId).select().single();
}

export async function deleteNode(nodeId) {
  const sb = requireSupabase();
  return sb.from('nodes').delete().eq('node_id', nodeId);
}

export async function getLatestReadings(limit = 20) {
  const sb = requireSupabase();
  return sb.from('readings').select('*, nodes(*)').order('created_at', { ascending: false }).limit(limit);
}

export async function getReadingsForNode(nodeId, limit = 30) {
  const sb = requireSupabase();
  return sb.from('readings').select('*').eq('node_id', nodeId).order('created_at', { ascending: false }).limit(limit);
}

export async function createReading(payload) {
  const sb = requireSupabase();
  return sb.from('readings').insert(payload).select().single();
}

export async function getReports() {
  const sb = requireSupabase();
  return sb.from('reports').select('*, nodes(location_name,campus,status), users(full_name,email)').order('created_at', { ascending: false });
}

export async function createReport(report) {
  const sb = requireSupabase();
  return sb.from('reports').insert(report).select('*, nodes(location_name,campus,status), users(full_name,email)').single();
}

export async function updateReportStatus(id, status) {
  const sb = requireSupabase();
  return sb.from('reports').update({ status }).eq('id', id).select('*, nodes(location_name,campus,status), users(full_name,email)').single();
}

export async function deleteReport(id) {
  const sb = requireSupabase();
  return sb.from('reports').delete().eq('id', id);
}

export async function getAlerts() {
  const sb = requireSupabase();
  return sb.from('alerts').select('*, nodes(location_name,campus)').order('created_at', { ascending: false }).limit(50);
}

export async function resolveAlert(id) {
  const sb = requireSupabase();
  return sb.from('alerts').update({ resolved_at: new Date().toISOString() }).eq('id', id).select().single();
}

export async function getHydrationLogs(userId) {
  const sb = requireSupabase();
  return sb.from('hydration_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
}

export async function createHydrationLog(user_id, amount_ml, drink_type = 'Water') {
  const sb = requireSupabase();
  return sb.from('hydration_logs').insert({ user_id, amount_ml, drink_type }).select().single();
}

export async function deleteHydrationLog(id) {
  const sb = requireSupabase();
  return sb.from('hydration_logs').delete().eq('id', id);
}

export async function getAdminSummary() {
  const sb = requireSupabase();
  const [users, nodes, reports, alerts, readings] = await Promise.all([
    sb.from('users').select('id', { count: 'exact', head: true }),
    sb.from('nodes').select('node_id,status'),
    sb.from('reports').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
    sb.from('alerts').select('id', { count: 'exact', head: true }).is('resolved_at', null),
    sb.from('readings').select('sans_status').order('created_at', { ascending: false }).limit(50),
  ]);

  const failed = [users, nodes, reports, alerts, readings].find(r => r.error);
  if (failed?.error) return { data: null, error: failed.error };

  const latest = readings.data || [];
  const safeCount = latest.filter(r => r.sans_status === 'SAFE').length;
  return {
    data: {
      users: users.count || 0,
      nodes: (nodes.data || []).length,
      openReports: reports.count || 0,
      alerts: alerts.count || 0,
      compliance: latest.length ? Math.round((safeCount / latest.length) * 100) : 0,
    },
    error: null,
  };
}

export async function createUserByAdmin(payload) {
  const sb = requireSupabase();
  return sb.functions.invoke('admin-create-user', { body: payload });
}

export async function updateUserByAdmin(id, updates) {
  const sb = requireSupabase();
  return sb.from('users').update(updates).eq('id', id).select().single();
}

export async function deleteUserByAdmin(id) {
  const sb = requireSupabase();
  return sb.functions.invoke('admin-delete-user', { body: { id } });
}

export async function updateHydrationLog(id, updates) {
  const sb = requireSupabase();
  return sb.from('hydration_logs').update(updates).eq('id', id).select().single();
}

export async function deleteAlert(id) {
  const sb = requireSupabase();
  return sb.from('alerts').delete().eq('id', id);
}

export async function uploadUserAvatar(userId, base64Data, contentType = 'image/jpeg') {
  const sb = requireSupabase();
  const { decode } = await import('base64-arraybuffer');
  const filePath = `${userId}/avatar.jpg`;
  const upload = await sb.storage.from('avatars').upload(filePath, decode(base64Data), {
    contentType,
    upsert: true,
  });
  if (upload.error) return { data: null, error: upload.error };
  const publicUrl = sb.storage.from('avatars').getPublicUrl(filePath).data.publicUrl;
  return updateUserProfile(userId, { avatar_url: `${publicUrl}?t=${Date.now()}` });
}
