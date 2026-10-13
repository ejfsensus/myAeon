import { createHash } from "node:crypto";
// Symbol-backed state is shared with Next's bundled route modules in the custom server.
const symbol = Symbol.for("myAeon.audio-masters.v2");
const state = (globalThis[symbol] ||= {
  cache: new Map(),
  pending: new Map(),
  bytes: 0,
});
const MAX = 64 * 1024 * 1024;
export function masterKey(script, model, credential) {
  return createHash("sha256")
    .update(`${credential}\n${model}\n${script}`)
    .digest("hex");
}
export function getMaster(key) {
  const entry = state.cache.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    state.cache.delete(key);
    state.bytes -= entry.pcm.length;
    return null;
  }
  return entry.pcm;
}
export function putMaster(key, pcm) {
  if (!pcm.length || pcm.length % 2 || pcm.length > 600 * 24000 * 2)
    throw new Error("Narration exceeds the ten-minute recording limit.");
  const previous = state.cache.get(key);
  if (previous) {
    state.cache.delete(key);
    state.bytes -= previous.pcm.length;
  }
  for (const [id, entry] of state.cache)
    if (entry.expires < Date.now() || state.bytes + pcm.length > MAX) {
      state.cache.delete(id);
      state.bytes -= entry.pcm.length;
    }
  state.cache.set(key, { pcm, expires: Date.now() + 3600000 });
  state.bytes += pcm.length;
}
export function pendingMaster(key) {
  return state.pending.get(key)?.promise;
}
export function beginMaster(key) {
  if (state.pending.has(key)) return false;
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  promise.catch(() => {});
  state.pending.set(key, { promise, resolve, reject });
  return true;
}
export function finishMaster(key, pcm, error) {
  const job = state.pending.get(key);
  try {
    if (error) throw error;
    putMaster(key, pcm);
    job?.resolve(pcm);
  } catch (failure) {
    job?.reject(failure);
  } finally {
    state.pending.delete(key);
  }
}
