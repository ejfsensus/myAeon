const state = (globalThis[Symbol.for("myAeon.reading-artifacts.v1")] ||=
  new Map());
const LIMIT = 64 * 1024 * 1024;
export function saveArtifact(owner, reading, context) {
  if (!owner || !reading.id || !reading.version) return;
  const value = structuredClone({ reading, context });
  const size = Buffer.byteLength(JSON.stringify(value));
  if (size > 4 * 1024 * 1024) return;
  let bytes = [...state.values()].reduce((sum, item) => sum + item.size, 0);
  for (const [key, item] of state)
    if (item.expires < Date.now() || bytes + size > LIMIT || state.size >= 64) {
      state.delete(key);
      bytes -= item.size;
    }
  state.set(`${owner}:${reading.id}:${reading.version}`, {
    value,
    size,
    expires: Date.now() + 86400000,
  });
}
export function getArtifact(owner, id, version) {
  const key = `${owner}:${id}:${version}`,
    item = state.get(key);
  if (!item || item.expires < Date.now()) {
    state.delete(key);
    return null;
  }
  return structuredClone(item.value);
}
