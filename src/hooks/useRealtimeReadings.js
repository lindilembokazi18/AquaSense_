import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getLatestReadings } from '../services/api';

export function useRealtimeReadings() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getLatestReadings().then(({ data, error }) => {
      if (!mounted) return;
      if (error) setError(error.message);
      setReadings(data || []);
    }).catch(err => mounted && setError(err.message)).finally(() => mounted && setLoading(false));

    if (!isSupabaseConfigured) return () => { mounted = false; };
    const channel = supabase.channel('readings-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'readings' }, (payload) => {
        setReadings(prev => [payload.new, ...prev].slice(0, 20));
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return { readings, latest: readings[0], loading, error };
}
