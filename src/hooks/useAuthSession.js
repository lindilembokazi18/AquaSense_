import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getCurrentUserProfile, upsertUserProfile } from '../services/api';

export function useAuthSession() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(!isSupabaseConfigured);

  const loadProfile = async (authSession) => {
    if (!authSession?.user) return null;
    let { data, error } = await getCurrentUserProfile(authSession.user.id);
    if (!data && !error) {
      const created = await upsertUserProfile({
        id: authSession.user.id,
        email: authSession.user.email,
        full_name: authSession.user.user_metadata?.full_name || '',
        campus_preference: authSession.user.user_metadata?.campus_preference || 'APK',
        role: 'student',
      });
      data = created.data;
      error = created.error;
    }
    if (error) throw error;
    if (data?.status === 'suspended') {
      await supabase.auth.signOut();
      throw new Error('This account has been suspended. Please contact the AquaSense admin.');
    }
    const role = data?.role || 'student';
    const full = { ...data, id: authSession.user.id, email: authSession.user.email, role };
    setProfile(full);
    setSession({ auth: authSession, user: authSession.user, role });
    return full;
  };

  useEffect(() => {
    let mounted = true;
    async function init() {
      if (!isSupabaseConfigured) {
        setConfigError(true);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (error) console.log(error.message);
      if (mounted && data.session) await loadProfile(data.session).catch(console.log);
      if (mounted) setLoading(false);
    }
    init();
    if (!isSupabaseConfigured) return () => { mounted = false; };
    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (authSession) loadProfile(authSession).catch(console.log);
      else { setSession(null); setProfile(null); }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) return { data: null, error: { message: 'Supabase is not configured. Add your .env values first.' } };
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return { data: null, error: { message: 'Email and password are required.' } };
    const result = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (result.error) return result;
    const p = await loadProfile(result.data.session);
    return { data: p, error: null };
  };

  const signUp = async ({ name, email, password, campus }) => {
    if (!isSupabaseConfigured) return { data: null, error: { message: 'Supabase is not configured. Add your .env values first.' } };
    const cleanEmail = email.trim().toLowerCase();
    if (!name || !cleanEmail || !password) return { data: null, error: { message: 'Name, email and password are required.' } };
    if (password.length < 6) return { data: null, error: { message: 'Password must be at least 6 characters.' } };
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: name, campus_preference: campus || 'APK' } },
    });
    if (error) return { data, error };
    const userId = data.user?.id;
    if (userId) await upsertUserProfile({ id: userId, email: cleanEmail, full_name: name, campus_preference: campus || 'APK', role: 'student' });
    return { data, error: null };
  };


  const resetPassword = async (email) => {
    if (!isSupabaseConfigured) return { data: null, error: { message: 'Supabase is not configured. Add your .env values first.' } };
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return { data: null, error: { message: 'Enter your email address first.' } };
    return supabase.auth.resetPasswordForEmail(cleanEmail);
  };

  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured) return { data: null, error: { message: 'Supabase is not configured.' } };
    if (!newPassword || newPassword.length < 6) return { data: null, error: { message: 'Password must be at least 6 characters.' } };
    return supabase.auth.updateUser({ password: newPassword });
  };

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return { session, profile, loading, signIn, signUp, signOut, resetPassword, updatePassword, configError };
}
