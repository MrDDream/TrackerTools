import { state } from './state.js';
import { t } from './i18n.js';
import { log, sanitizeUrl, escapeHtml } from './utils.js';
import { persistConfig } from './persist.js';
import { SUBCATEGORIES } from './constants.js';
import { cb } from './callbacks.js';

export function apiFetch(path) {
  return fetch(`${state.baseUrl}${path}`, {
    headers: { 'X-Api-Key': state.apiKey }
  });
}

export function findIndexer(id) {
  return state.allIndexers.find(i => String(i.id) === String(id));
}

export function indexerName(id, fallback) {
  if (state.indexerCustomizations[id] && state.indexerCustomizations[id].name) {
    return state.indexerCustomizations[id].name;
  }
  const idx = findIndexer(id);
  if (idx?.name) return idx.name;
  const s1 = document.getElementById('select-t1');
  const s2 = document.getElementById('select-t2');
  const sel = s1 && String(s1.value) === String(id) ? s1 : s2;
  if (sel) {
    const opt = Array.from(sel.options).find(o => String(o.value) === String(id));
    if (opt) return opt.textContent.replace(/\s*\[.*?\].*$/, '').trim();
  }
  return fallback;
}

export function getIndexerName(id) { return indexerName(id, t('unknown') || 'Inconnu'); }

function showResult(success, msg) {
  const connectionResult = document.getElementById('connection-result');
  const resultIcon = document.getElementById('result-icon');
  const resultMsg  = document.getElementById('result-msg');
  if (!connectionResult) return;
  connectionResult.style.display = 'flex';
  connectionResult.className = 'connection-result ' + (success ? 'success' : 'error');
  if (resultIcon) resultIcon.textContent = success ? '✓' : '✗';
  if (resultMsg)  resultMsg.textContent = msg;
}

function setHeaderStatus(status, text) {
  const headerDot  = document.getElementById('header-dot');
  const headerText = document.getElementById('header-status-text');
  if (headerDot) {
    headerDot.className = 'status-dot' +
      (status === 'connected' ? ' connected' : status === 'error' ? ' error' : '');
  }
  let newText = text;
  if (newText && newText.startsWith('Connecté')) newText = newText.replace('Connecté', 'Prowlarr');
  if (headerText) headerText.textContent = newText;
}

export async function testConnection() {
  const prowlarrUrl    = document.getElementById('prowlarr-url');
  const prowlarrApiKey = document.getElementById('prowlarr-apikey');
  const btnConnect     = document.getElementById('btn-connect');
  const connectionResult = document.getElementById('connection-result');

  state.baseUrl = sanitizeUrl(prowlarrUrl.value);
  state.apiKey  = prowlarrApiKey.value.trim();

  if (!state.baseUrl) { showResult(false, t('err-no-url')); return; }
  if (!state.apiKey)  { showResult(false, t('err-no-apikey')); return; }

  if (btnConnect) { btnConnect.classList.add('loading'); btnConnect.disabled = true; }
  if (connectionResult) connectionResult.style.display = 'none';
  log(`Connexion à ${state.baseUrl}…`, 'info');

  try {
    const statusRes = await apiFetch('/api/v1/system/status');
    if (!statusRes.ok) throw new Error(`HTTP ${statusRes.status}: ${statusRes.statusText}`);
    const statusData = await statusRes.json();
    log(`Prowlarr v${statusData.version || '?'} — connecté`, 'ok');
    setHeaderStatus('connected', t('status-connected-prefix') + (statusData.version || '?'));
    showResult(true, t('connect-success') + (statusData.version || '?'));
    saveSettings();
    await fetchIndexers();
  } catch (err) {
    log(`Échec: ${err.message}`, 'error');
    setHeaderStatus('error', 'Erreur');
    let msg = err.message;
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) msg = t('err-unreachable');
    else if (msg.includes('401') || msg.includes('403')) msg = t('err-invalid-key');
    showResult(false, msg);
  } finally {
    if (btnConnect) { btnConnect.classList.remove('loading'); btnConnect.disabled = false; }
  }
}

function saveSettings() {
  const prowlarrUrl    = document.getElementById('prowlarr-url');
  const prowlarrApiKey = document.getElementById('prowlarr-apikey');
  const current = JSON.parse(localStorage.getItem('prowlarr_settings') || '{}');
  localStorage.setItem('prowlarr_settings', JSON.stringify({
    ...current,
    url:    prowlarrUrl ? prowlarrUrl.value.trim() : '',
    apiKey: prowlarrApiKey ? prowlarrApiKey.value.trim() : ''
  }));
  persistConfig();
}

export async function fetchIndexers() {
  log('Récupération des indexeurs…', 'info');
  try {
    const res = await apiFetch('/api/v1/indexer');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const prowlarrIndexers = await res.json();
    state.allIndexers = prowlarrIndexers.concat(state.manualIndexers);
    log(`${state.allIndexers.length} indexeur(s) trouvé(s) (${state.manualIndexers.length} manuel(s))`, 'ok');
    populateSelectors();
    unlockStep2();
    restoreIndexerSelection();
  } catch (err) {
    log(`Erreur indexeurs: ${err.message}`, 'error');
  }
}

export function populateSelectors() {
  const selectT1 = document.getElementById('select-t1');
  const selectT2 = document.getElementById('select-t2');
  if (!selectT1 || !selectT2) return;

  const enabled  = state.allIndexers.filter(i => i.enable);
  const disabled = state.allIndexers.filter(i => !i.enable);

  [selectT1, selectT2].forEach(sel => {
    sel.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = t('choose-indexer');
    sel.appendChild(defaultOpt);

    if (enabled.length > 0) {
      const g = document.createElement('optgroup');
      g.label = `${t('active')} (${enabled.length})`;
      enabled.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      enabled.forEach(idx => {
        const opt = document.createElement('option');
        opt.value = idx.id;
        const proto = (idx.protocol || '').charAt(0).toUpperCase() + (idx.protocol || '').slice(1);
        opt.textContent = `${idx.name} [${proto}]`;
        g.appendChild(opt);
      });
      sel.appendChild(g);
    }

    if (disabled.length > 0) {
      const g = document.createElement('optgroup');
      g.label = `${t('inactive')} (${disabled.length})`;
      disabled.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      disabled.forEach(idx => {
        const opt = document.createElement('option');
        opt.value = idx.id;
        opt.textContent = `${idx.name} ${t('inactive-label')}`;
        opt.disabled = true;
        g.appendChild(opt);
      });
      sel.appendChild(g);
    }

    if (state.manualIndexers.length > 0) {
      const g = document.createElement('optgroup');
      g.label = `${t('manual')} (${state.manualIndexers.length})`;
      state.manualIndexers.forEach(idx => {
        const opt = document.createElement('option');
        opt.value = idx.id;
        opt.textContent = `${idx.name} [Torznab]`;
        g.appendChild(opt);
      });
      sel.appendChild(g);
    }

    sel.disabled = false;
  });

  const multiContainer = document.getElementById('multi-select-container');
  if (multiContainer) {
    multiContainer.innerHTML = '';
    const sortedEnabled = [...enabled, ...state.manualIndexers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    sortedEnabled.forEach(idx => {
      const item = document.createElement('label');
      item.className = 'multi-select-item';
      const cb2 = document.createElement('input');
      cb2.type = 'checkbox';
      cb2.value = idx.id;
      if (state.searchSelectedIds.has(String(idx.id))) cb2.checked = true;
      cb2.addEventListener('change', () => {
        if (cb2.checked) state.searchSelectedIds.add(String(idx.id));
        else state.searchSelectedIds.delete(String(idx.id));
        checkStep3Unlock();
      });
      const text = document.createTextNode(idx.isManual ? ` ${idx.name} [Torznab]` : ` ${idx.name}`);
      item.appendChild(cb2);
      item.appendChild(text);
      multiContainer.appendChild(item);
    });
  }
}

export function updateTrackerBadges(t1Name, t2Name) {
  const short = name => name.length > 12 ? name.slice(0, 11) + '…' : name;
  const b1 = document.getElementById('badge-name-t1');
  const b2 = document.getElementById('badge-name-t2');
  const u1 = document.getElementById('badge-unique-t1');
  const u2 = document.getElementById('badge-unique-t2');
  if (b1) b1.textContent = short(t1Name);
  if (b2) b2.textContent = short(t2Name);
  if (u1) u1.textContent = short(t1Name);
  if (u2) u2.textContent = short(t2Name);
}

export function unlockStep2() {
  const sectionIndexers = document.getElementById('section-indexers');
  if (sectionIndexers) {
    sectionIndexers.classList.add('unlocked');
    sectionIndexers.classList.remove('card-disabled');
  }
}

export function checkStep3Unlock() {
  const sectionFilters = document.getElementById('section-filters');
  const filterQuery    = document.getElementById('filter-query');
  const filterCat      = document.getElementById('filter-cat');
  const filterSubcat   = document.getElementById('filter-subcat');
  const filterLimit    = document.getElementById('filter-limit');
  const filterMatchMode = document.getElementById('filter-match-mode');
  const btnCompare     = document.getElementById('btn-compare');
  if (!sectionFilters) return;

  if (state.appMode === 'compare') {
    const t1Id = document.getElementById('select-t1')?.value;
    const t2Id = document.getElementById('select-t2')?.value;
    if (t1Id && t2Id && t1Id !== t2Id) {
      sectionFilters.classList.add('unlocked');
      sectionFilters.classList.remove('card-disabled');
      if (filterQuery) filterQuery.disabled = false;
      if (filterCat) filterCat.disabled = false;
      if (filterSubcat) filterSubcat.disabled = (SUBCATEGORIES[filterCat?.value] || []).length === 0;
      if (filterLimit) filterLimit.disabled = false;
      if (filterMatchMode) filterMatchMode.disabled = false;
      if (btnCompare) btnCompare.disabled = false;
    } else {
      sectionFilters.classList.remove('unlocked');
      sectionFilters.classList.add('card-disabled');
      if (btnCompare) btnCompare.disabled = true;
    }
  } else {
    if (state.searchSelectedIds.size > 0) {
      sectionFilters.classList.add('unlocked');
      sectionFilters.classList.remove('card-disabled');
      if (filterQuery) filterQuery.disabled = false;
      if (filterCat) filterCat.disabled = false;
      if (filterSubcat) filterSubcat.disabled = (SUBCATEGORIES[filterCat?.value] || []).length === 0;
      if (filterLimit) filterLimit.disabled = false;
      const fmmEl = document.getElementById('filter-match-mode');
      const fssEl = document.getElementById('filter-search-strict');
      if (fmmEl) fmmEl.disabled = true;
      if (fssEl) fssEl.disabled = false;
      if (btnCompare) btnCompare.disabled = false;
    } else {
      sectionFilters.classList.remove('unlocked');
      sectionFilters.classList.add('card-disabled');
      if (btnCompare) btnCompare.disabled = true;
    }
  }
}

export function onIndexerChange() {
  const t1Id = document.getElementById('select-t1')?.value;
  const t2Id = document.getElementById('select-t2')?.value;
  if (t1Id && t2Id && t1Id !== t2Id) {
    checkStep3Unlock();
    saveIndexerSelection();
    updateTrackerBadges(indexerName(t1Id, 'T1'), indexerName(t2Id, 'T2'));
    log(`Indexeurs sélectionnés: "${indexerName(t1Id, 'T1')}" vs "${indexerName(t2Id, 'T2')}"`, 'info');
  } else {
    checkStep3Unlock();
    if (t1Id && t2Id && t1Id === t2Id) {
      log('Veuillez sélectionner deux indexeurs différents.', 'warn');
    }
  }
}

function saveIndexerSelection() {
  const s1 = document.getElementById('select-t1');
  const s2 = document.getElementById('select-t2');
  const current = JSON.parse(localStorage.getItem('prowlarr_settings') || '{}');
  localStorage.setItem('prowlarr_settings', JSON.stringify({
    ...current,
    t1Id: s1 ? s1.value : '',
    t2Id: s2 ? s2.value : ''
  }));
}

function restoreIndexerSelection() {
  const saved = localStorage.getItem('prowlarr_settings');
  if (!saved) return;
  try {
    const s = JSON.parse(saved);
    const s1 = document.getElementById('select-t1');
    const s2 = document.getElementById('select-t2');
    if (s.t1Id && s1) s1.value = s.t1Id;
    if (s.t2Id && s2) s2.value = s.t2Id;
    if (s1?.value && s2?.value && s1.value !== s2.value) onIndexerChange();
  } catch (_) {}
}

export async function performSearch(indexer, prowlarrParams, query, cat, limit) {
  if (indexer.isManual) {
    log(`🔎 Recherche externe Torznab sur: ${indexer.name}`, 'info');
    return await fetchTorznab(indexer, query, cat, limit);
  } else {
    const res = await apiFetch(`/api/v1/search?${prowlarrParams}`);
    if (!res.ok) throw new Error(`Erreur Prowlarr HTTP ${res.status}`);
    return await res.json();
  }
}

export async function fetchTorznab(indexer, query, cat, limit) {
  let url = indexer.url;
  if (!url.endsWith('/')) url += '/';
  url += 'api?t=search';
  if (indexer.apiKey) url += '&apikey=' + indexer.apiKey;
  if (query) url += '&q=' + encodeURIComponent(query);
  if (cat) url += '&cat=' + cat;
  url += '&limit=' + limit;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erreur Torznab HTTP ${res.status}`);
  const text = await res.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  const errorNode = xml.querySelector('error');
  if (errorNode) throw new Error(`API Torznab: ${errorNode.getAttribute('description') || 'Erreur inconnue'}`);

  const items = xml.querySelectorAll('item');
  const results = [];
  items.forEach(item => {
    let size = parseInt(item.querySelector('size')?.textContent || '0');
    let seeders = 0, peers = 0;
    const attrs = item.querySelectorAll('*');
    for (let i = 0; i < attrs.length; i++) {
      const node = attrs[i];
      if (node.tagName.includes('attr')) {
        const name = node.getAttribute('name');
        const val = parseInt(node.getAttribute('value') || '0');
        if (name === 'size' && size === 0) size = val;
        if (name === 'seeders') seeders = val;
        if (name === 'peers') peers = val;
      }
    }
    const leechers = Math.max(0, peers - seeders);
    results.push({
      title: item.querySelector('title')?.textContent || 'Sans titre',
      size, seeders, leechers,
      publishDate: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
      infoUrl: item.querySelector('comments')?.textContent || item.querySelector('guid')?.textContent,
      downloadUrl: item.querySelector('enclosure')?.getAttribute('url') || item.querySelector('link')?.textContent,
      guid: item.querySelector('guid')?.textContent,
      category: item.querySelector('category')?.textContent || '',
      _sourceFile: 'torznab_manual'
    });
  });
  return results;
}

export function saveManualIndexers() {
  localStorage.setItem('manual_indexers', JSON.stringify(state.manualIndexers));
  state.allIndexers = state.allIndexers.filter(i => !i.isManual).concat(state.manualIndexers);
  populateSelectors();
  renderManualIndexersList();
  persistConfig();
}

export function renderManualIndexersList() {
  const manualIndexersList = document.getElementById('manual-indexers-list');
  if (!manualIndexersList) return;
  manualIndexersList.innerHTML = '';
  if (state.manualIndexers.length === 0) {
    manualIndexersList.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:10px;">${t('no-manual-indexers')}</div>`;
    return;
  }
  state.manualIndexers.forEach(idx => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; background:var(--bg-surface); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--bg-card-border);';
    const info = document.createElement('div');
    info.style.cssText = 'display:flex; flex-direction:column; overflow:hidden; margin-right:12px;';
    info.innerHTML = `
      <span style="font-size:0.8rem; font-weight:600; color:var(--text-primary); white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${escapeHtml(idx.name)}</span>
      <span style="font-size:0.65rem; color:var(--text-muted); white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${escapeHtml(idx.url)}</span>
    `;
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; gap:6px;';

    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn-icon btn-icon-sm';
    btnEdit.title = t('btn-edit-title');
    btnEdit.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    btnEdit.onclick = () => {
      const manualEditId = document.getElementById('manual-edit-id');
      const inputName = document.getElementById('manual-name');
      const inputUrl  = document.getElementById('manual-url');
      const inputKey  = document.getElementById('manual-apikey');
      const btnAddManual = document.getElementById('btn-add-manual');
      const overlay   = document.getElementById('modal-manual-overlay');
      if (manualEditId) manualEditId.value = idx.id;
      if (inputName) inputName.value = idx.name;
      if (inputUrl)  inputUrl.value  = idx.url;
      if (inputKey)  inputKey.value  = idx.apiKey;
      if (btnAddManual) btnAddManual.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span id="btn-add-manual-text"> ${t('btn-save-manual')}</span>`;
      if (overlay) overlay.classList.add('open');
    };

    const btnDel = document.createElement('button');
    btnDel.className = 'btn-icon btn-icon-sm btn-icon-danger';
    btnDel.title = t('btn-delete-title');
    btnDel.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>';
    btnDel.onclick = () => {
      if (confirm(`${t('btn-delete-confirm')} "${idx.name}" ?`)) {
        state.manualIndexers = state.manualIndexers.filter(i => i.id !== idx.id);
        saveManualIndexers();
        log(`Tracker retiré : ${idx.name}`, 'info');
      }
    };

    actions.appendChild(btnEdit);
    actions.appendChild(btnDel);
    row.appendChild(info);
    row.appendChild(actions);
    manualIndexersList.appendChild(row);
  });
}
