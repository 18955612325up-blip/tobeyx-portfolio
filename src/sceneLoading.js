// Shared with the lightweight page; importing this never starts a download.
let snapshot = { phase: 'idle', loaded: 0, total: 0 };
const listeners = new Set();
export const sceneLoading = {
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  getSnapshot() { return snapshot; },
};
export function updateSceneLoading(update) {
  snapshot = { ...snapshot, ...update };
  listeners.forEach((listener) => listener());
}
