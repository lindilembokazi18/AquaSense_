import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') || '';

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) throw new Error('Not authenticated');

    const adminClient = createClient(url, service);
    const { data: caller, error: callerError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single();
    if (callerError || caller?.role !== 'admin') throw new Error('Only admins can create users');

    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const full_name = String(body.full_name || '').trim();
    const campus_preference = String(body.campus_preference || 'APK').trim();
    const role = body.role === 'admin' ? 'admin' : 'student';
    if (!email || password.length < 6) throw new Error('Email and password of at least 6 characters are required');

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, campus_preference },
    });
    if (error) throw error;

    await adminClient.from('users').upsert({
      id: data.user.id,
      email,
      full_name,
      campus_preference,
      role,
      status: 'active',
    });

    return new Response(JSON.stringify({ id: data.user.id, email, role }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
