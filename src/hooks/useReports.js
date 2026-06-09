import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createReport, deleteReport, getReports, updateReportStatus } from '../services/api';

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    const { data, error } = await getReports().catch(err => ({ data: [], error: err }));
    if (error) setError(error.message);
    setReports(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    if (!isSupabaseConfigured) return;
    const channel = supabase.channel('reports-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, refresh)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [refresh]);

  const submitReport = async (payload) => {
    const result = await createReport(payload);
    if (!result.error) await refresh();
    return result;
  };

  const setStatus = async (id, status) => {
    const result = await updateReportStatus(id, status);
    await refresh();
    return result;
  };

  const removeReport = async (id) => {
    const result = await deleteReport(id);
    await refresh();
    return result;
  };

  return { reports, loading, error, submitReport, setStatus, removeReport, refresh };
}
