import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const LIMITS = { ph: [5.0, 9.7], tds: 1200, turbidity: 5 };
function evaluate(record: any) {
  if (record.ph < LIMITS.ph[0] || record.ph > LIMITS.ph[1]) return { parameter: 'pH', value: record.ph, threshold: record.ph < LIMITS.ph[0] ? LIMITS.ph[0] : LIMITS.ph[1] };
  if (record.tds > LIMITS.tds) return { parameter: 'TDS', value: record.tds, threshold: LIMITS.tds };
  if (record.turbidity > LIMITS.turbidity) return { parameter: 'Turbidity', value: record.turbidity, threshold: LIMITS.turbidity };
  return null;
}
Deno.serve(async (req) => {
  const { record } = await req.json();
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const issue = evaluate(record);
  if (issue) await supabase.from('alerts').insert({ node_id: record.node_id, reading_id: record.id, ...issue });
  return new Response('ok');
});
