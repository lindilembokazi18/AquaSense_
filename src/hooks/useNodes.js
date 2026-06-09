import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createNode, deleteNode, getNodes, updateNode } from '../services/api';

export function useNodes() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    const { data, error } = await getNodes().catch(err => ({ data: [], error: err }));
    if (error) setError(error.message);
    setNodes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    if (!isSupabaseConfigured) return;
    const channel = supabase.channel('nodes-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nodes' }, refresh)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [refresh]);

  const addNode = async (payload) => {
    const result = await createNode(payload);
    await refresh();
    return result;
  };

  const editNode = async (id, updates) => {
    const result = await updateNode(id, updates);
    await refresh();
    return result;
  };

  const removeNode = async (id) => {
    const result = await deleteNode(id);
    await refresh();
    return result;
  };

  return { nodes, loading, error, refresh, addNode, editNode, removeNode };
}
