import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
Deno.serve(async (req) => {
  const { record } = await req.json();
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: node } = await supabase.from('nodes').select('campus, location_name').eq('node_id', record.node_id).single();
  const { data: users } = await supabase.from('users').select('push_token').eq('campus_preference', node?.campus).eq('push_enabled', true);
  const messages = (users || []).filter((u:any) => u.push_token).map((u:any) => ({ to: u.push_token, title: '⚠ Water Alert', body: `${node?.location_name}: ${record.parameter} is ${record.value}` }));
  if (messages.length) await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(messages) });
  return new Response('ok');
});
