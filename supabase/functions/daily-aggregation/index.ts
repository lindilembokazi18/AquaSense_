import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
Deno.serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const d = new Date(); d.setDate(d.getDate() - 1);
  const dateStr = d.toISOString().split('T')[0];
  const { error } = await supabase.rpc('aggregate_daily_readings', { target_date: dateStr });
  return new Response(JSON.stringify({ ok: !error, error }));
});
