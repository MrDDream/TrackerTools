import { state } from './state.js';

export function persistData(type, payload) {
  fetch('/api/save/' + type, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  }).catch(() => {});
}

export function persistConfig() {
  const urlEl    = document.getElementById('prowlarr-url');
  const apiKeyEl = document.getElementById('prowlarr-apikey');
  const url    = urlEl    ? urlEl.value.trim()    : state.baseUrl;
  const apiKey = apiKeyEl ? apiKeyEl.value.trim() : state.apiKey;
  persistData('config', {
    url,
    apiKey,
    manualIndexers: state.manualIndexers,
    torrentClientSettings: state.torrentClientSettings,
  });
}

export function saveIndexerStats() {
  localStorage.setItem('indexer_stats', JSON.stringify(state.indexerStats));
}

export function saveIndexerCustomizations() {
  localStorage.setItem('indexer_customizations', JSON.stringify(state.indexerCustomizations));
}

export function saveTorrentClientSettings() {
  localStorage.setItem('torrent_client_settings', JSON.stringify(state.torrentClientSettings));
  persistConfig();
}
