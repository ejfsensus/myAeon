// Anonymous, process-local reports. No birth data is written to disk.
const state = (globalThis[Symbol.for('myAeon.natal-profiles.v1')] ||= { reports: new Map(), pending: new Set() });
const TTL = 24 * 60 * 60 * 1000;
const MAX_BYTES = 32 * 1024 * 1024;
function prune() {
  for (const [id, item] of state.reports) if (item.expires <= Date.now()) state.reports.delete(id);
}
export function cachedNatalProfile(owner, key) {
  prune();
  for (const item of state.reports.values()) if (item.owner === owner && item.key === key) return structuredClone(item.value.report);
  return null;
}
export function beginNatalProfile(owner, key) {
  const id = `${owner}:${key}`;
  if (state.pending.has(id) || state.pending.size >= 16) return null;
  state.pending.add(id);
  return () => state.pending.delete(id);
}
export function saveNatalProfile(owner, key, report, context) {
  prune();
  // Only retain the natal SVG/facts needed for this report, never transit snapshots.
  const value = structuredClone({ report, natalSvg: context.confidence === 'known' ? context.charts?.natal?.light : null });
  const bytes = Buffer.byteLength(JSON.stringify(value));
  if (bytes > 2 * 1024 * 1024) throw new Error('Natal report too large');
  let total = [...state.reports.values()].reduce((sum, item) => sum + item.bytes, 0);
  while (state.reports.size && (state.reports.size >= 64 || total + bytes > MAX_BYTES)) {
    const id = state.reports.keys().next().value;
    total -= state.reports.get(id).bytes;
    state.reports.delete(id);
  }
  state.reports.set(report.id, { owner, key, value, bytes, expires: Date.now() + TTL });
}
export function getNatalProfile(owner, id) {
  prune();
  const item = state.reports.get(id);
  return item?.owner === owner ? structuredClone(item.value) : null;
}
