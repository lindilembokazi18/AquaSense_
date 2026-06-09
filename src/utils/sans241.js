export const THRESHOLDS = { ph: { min: 5.0, max: 9.7 }, tds: 1200, turbidity: 5 };

export function evaluateReading(r = {}) {
  const issues = [];
  const ph = Number(r.ph ?? 0);
  const tds = Number(r.tds ?? 0);
  const turbidity = Number(r.turbidity ?? 0);
  if (ph < THRESHOLDS.ph.min || ph > THRESHOLDS.ph.max) issues.push('pH');
  if (tds > THRESHOLDS.tds) issues.push('TDS');
  if (turbidity > THRESHOLDS.turbidity) issues.push('Turbidity');
  if (issues.length === 0) return { status: 'SAFE', issues: [] };
  const severe = ph < 4 || ph > 11 || tds > 2400 || turbidity > 10;
  return { status: severe ? 'UNSAFE' : 'CAUTION', issues };
}

export function statusColor(status) {
  if (status === 'UNSAFE') return '#E21C28';
  if (status === 'CAUTION') return '#F6A500';
  return '#0874DE';
}
