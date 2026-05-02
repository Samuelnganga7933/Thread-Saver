const MAX_EXPORTS = 20;
const STORAGE_KEY = 'ts_exports';

async function saveExport(entry) {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const list = data[STORAGE_KEY] || [];
  list.unshift({ ...entry, id: Date.now() });
  if (list.length > MAX_EXPORTS) list.splice(MAX_EXPORTS);
  await chrome.storage.local.set({ [STORAGE_KEY]: list });
}

async function getExports() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || [];
}

async function clearExports() {
  await chrome.storage.local.remove(STORAGE_KEY);
}

window.__tsStorage = { saveExport, getExports, clearExports };
