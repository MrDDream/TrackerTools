import { state } from './state.js';
import { t } from './i18n.js';
import { escapeHtml, log, formatAge } from './utils.js';
import { performSearch } from './api.js';
import { saveIndexerStats, saveIndexerCustomizations } from './persist.js';

export function renderIndexersPanel() {
  const grid    = document.getElementById('indexers-grid');
  const emptyEl = document.getElementById('indexers-empty-state');
  if (!grid) return;
  grid.innerHTML = '';
  if (state.allIndexers.length === 0) {
    grid.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }
  grid.style.display = 'grid';
  if (emptyEl) emptyEl.style.display = 'none';
  const frag = document.createDocumentFragment();
  state.allIndexers.forEach(idx => frag.appendChild(makeIndexerCard(idx)));
  grid.appendChild(frag);
}

export function makeIndexerCard(indexer) {
  const id       = String(indexer.id);
  const stats    = state.indexerStats[id];
  const lastTest = stats?.tests?.[0];
  const okCount  = stats?.tests?.filter(te => te.ok).length ?? 0;
  const total    = stats?.tests?.length ?? 0;
  const proto    = (indexer.protocol || 'torznab').toLowerCase();
  const statusTxt = indexer.enable ? t('indexer-active') : t('indexer-inactive');
  const isUp   = lastTest && lastTest.ok;
  const isDown = lastTest && !lastTest.ok;

  const custom      = state.indexerCustomizations[id] || {};
  const displayName = custom.name || indexer.name;
  let badgeColor = custom.color || (indexer.enable ? 'var(--accent-primary)' : 'var(--text-muted)');
  const textColor  = custom.textColor || '#ffffff';
  const badgeStyle = `background: ${escapeHtml(badgeColor)}; color: ${escapeHtml(textColor)}; border:none; padding:4px 8px; border-radius:4px; font-weight:var(--semibold); font-size:0.85rem; display:inline-block; margin-bottom:4px;`;

  const card = document.createElement('div');
  card.className = 'indexer-card';
  card.dataset.indexerId = id;
  card.innerHTML = `
    <div class="indexer-card-header" style="position:relative;">
      <div class="indexer-title-group" style="padding-right:18px;">
        <span title="${escapeHtml(indexer.name)}" style="${badgeStyle}">${escapeHtml(displayName)}</span>
        <span class="indexer-proto" style="font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:4px;">
          ${escapeHtml(proto.toUpperCase())} — ${statusTxt}
        </span>
      </div>
      <div title="${isUp ? 'UP' : isDown ? 'DOWN' : 'Inconnu'}" style="position:absolute; top:4px; right:4px; font-size:0.6rem; color:${isUp ? 'var(--accent-success)' : isDown ? 'var(--accent-danger)' : 'var(--text-muted)'};">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" style="width:12px; height:12px;"><circle cx="12" cy="12" r="10"/></svg>
      </div>
    </div>
    <div class="indexer-card-stats">
      <div class="idx-stat-box"><span class="idx-stat-label">${t('ith-last-test')}</span><span class="idx-stat-val">${lastTest ? formatAge(lastTest.ts) : '—'}</span></div>
      <div class="idx-stat-box"><span class="idx-stat-label">${t('ith-duration')}</span><span class="idx-stat-val">${lastTest ? lastTest.duration + ' ms' : '—'}</span></div>
      <div class="idx-stat-box"><span class="idx-stat-label">${t('ith-results')}</span><span class="idx-stat-val">${lastTest ? lastTest.count : '—'}</span></div>
      <div class="idx-stat-box"><span class="idx-stat-label">${t('ith-success')}</span><span class="idx-stat-val">${total > 0 ? okCount + '/' + total : '—'}</span></div>
    </div>
    <div class="indexer-card-actions">
      <button class="btn-icon btn-icon-sm btn-test-one" data-id="${escapeHtml(id)}" title="${t('btn-test-indexer-title')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span style="font-size:0.75rem; font-weight:600;">Tester</span>
      </button>
      <button class="btn-icon btn-icon-sm btn-toggle-idx-hist" data-id="${escapeHtml(id)}" data-name="${escapeHtml(displayName)}" title="${t('btn-indexer-history-title')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </button>
      <button class="btn-icon btn-icon-sm btn-edit-indexer" data-id="${escapeHtml(id)}" data-name="${escapeHtml(displayName)}" data-realname="${escapeHtml(indexer.name)}" data-color="${escapeHtml(custom.color || '#3b82f6')}" title="Personnaliser">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      </button>
    </div>
  `;

  card.querySelector('.btn-test-one').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    await testSingleIndexer(indexer);
    btn.disabled = false;
    renderIndexersPanel();
  });

  card.querySelector('.btn-toggle-idx-hist').addEventListener('click', (e) => {
    toggleIndexerHistoryDrawer(e.currentTarget.dataset.id, e.currentTarget.dataset.name);
  });

  card.querySelector('.btn-edit-indexer').addEventListener('click', (e) => {
    const target = e.currentTarget;
    const modal = document.getElementById('modal-edit-indexer-overlay');
    if (!modal) return;
    const idEl    = document.getElementById('edit-indexer-id');
    const nameEl  = document.getElementById('edit-indexer-name');
    const colorEl = document.getElementById('edit-indexer-color');
    if (idEl)    idEl.value    = target.dataset.id;
    if (nameEl)  { nameEl.value = state.indexerCustomizations[target.dataset.id]?.name || ''; nameEl.placeholder = target.dataset.realname; }
    if (colorEl) colorEl.value = target.dataset.color || '#3b82f6';
    modal.classList.add('open');
  });

  return card;
}

export async function testSingleIndexer(indexer) {
  const id    = String(indexer.id);
  const start = Date.now();
  let count = 0, ok = false, error = null;
  try {
    const lastSearch = state.searchHistory.find(h => h.mode === 'search') || { q: 'linux' };
    const q = lastSearch.q || 'linux';
    const params = new URLSearchParams({ type: 'search', limit: '5', query: q });
    if (!indexer.isManual) params.set('indexerIds', id);
    const results = await performSearch(indexer, params.toString(), q, '', 5);
    count = Array.isArray(results) ? results.length : 0;
    ok = true;
    log(`Test ${indexer.name}: ${count} résultat(s) en ${Date.now() - start} ms`, 'ok');
  } catch (err) {
    error = err.message;
    log(`Test ${indexer.name}: erreur — ${err.message}`, 'error');
  }
  const entry = { ts: new Date().toISOString(), duration: Date.now() - start, count, ok, error };
  if (!state.indexerStats[id]) state.indexerStats[id] = { name: indexer.name, tests: [] };
  state.indexerStats[id].tests.unshift(entry);
  if (state.indexerStats[id].tests.length > 20) state.indexerStats[id].tests = state.indexerStats[id].tests.slice(0, 20);
  saveIndexerStats();
  return entry;
}

export async function testAllIndexers() {
  const btn          = document.getElementById('btn-test-all-indexers');
  const progressWrap = document.getElementById('indexers-test-progress-wrap');
  const progressBar  = document.getElementById('indexers-test-progress-bar');
  if (btn) btn.disabled = true;
  if (progressWrap) progressWrap.style.display = 'block';
  const total = state.allIndexers.length;
  for (let i = 0; i < total; i++) {
    if (progressBar) progressBar.style.width = Math.round((i / total) * 100) + '%';
    await testSingleIndexer(state.allIndexers[i]);
    renderIndexersPanel();
  }
  if (progressBar) progressBar.style.width = '100%';
  setTimeout(() => { if (progressWrap) progressWrap.style.display = 'none'; }, 2000);
  if (btn) btn.disabled = false;
}

export function toggleIndexerHistoryDrawer(id, name) {
  const drawer = document.getElementById('indexer-history-drawer');
  if (!drawer) return;
  if (drawer.dataset.openFor === id && drawer.style.display !== 'none') {
    drawer.style.display = 'none';
    drawer.dataset.openFor = '';
    return;
  }
  const stats = state.indexerStats[id];
  if (!stats?.tests?.length) {
    drawer.innerHTML = `<div style="padding:16px; color:var(--text-muted); font-size:0.8rem;">${t('indexer-no-history')}</div>`;
  } else {
    const locale = state.currentLang === 'fr' ? 'fr-FR' : 'en-US';
    drawer.innerHTML = `
      <div class="panel-header" style="font-size:0.78rem; padding:10px 16px;">
        <span>${t('indexer-history-for')} <strong>${escapeHtml(name)}</strong></span>
        <span style="color:var(--text-muted); font-size:0.7rem;">${stats.tests.length} ${t('indexer-tests')}</span>
      </div>
      <div style="overflow-x:auto;">
      <table class="results-table" style="font-size:0.75rem;">
        <thead><tr>
          <th>${t('ith-date')}</th><th>${t('ith-duration')}</th>
          <th>${t('ith-results')}</th><th>${t('ith-status')}</th>
        </tr></thead>
        <tbody>
          ${stats.tests.map(te => `
            <tr>
              <td>${new Date(te.ts).toLocaleString(locale)}</td>
              <td>${te.duration} ms</td>
              <td>${te.count}</td>
              <td>
                <span class="seeders-badge ${te.ok ? 'high' : 'low'}">${te.ok ? t('test-ok') : t('test-fail')}</span>
                ${te.error ? `<span style="color:var(--accent-danger); font-size:0.65rem; margin-left:4px;">${escapeHtml(te.error)}</span>` : ''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
      </div>
    `;
  }
  drawer.dataset.openFor = id;
  drawer.style.display = 'block';
}

export async function refreshIndexerList() {
  const btn = document.getElementById('btn-refresh-indexers');
  if (btn) btn.disabled = true;
  const { fetchIndexers } = await import('./api.js');
  await fetchIndexers();
  renderIndexersPanel();
  if (btn) btn.disabled = false;
}

export function setupIndexerEditModal() {
  document.getElementById('btn-edit-indexer-close')?.addEventListener('click', () => {
    document.getElementById('modal-edit-indexer-overlay')?.classList.remove('open');
  });
  document.getElementById('modal-edit-indexer-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-edit-indexer-overlay') e.target.classList.remove('open');
  });
  document.getElementById('btn-confirm-edit-indexer')?.addEventListener('click', () => {
    const id       = document.getElementById('edit-indexer-id')?.value;
    const name     = document.getElementById('edit-indexer-name')?.value.trim();
    const color    = document.getElementById('edit-indexer-color')?.value;
    const textColor = document.getElementById('edit-indexer-text-color')?.value;
    if (id) {
      state.indexerCustomizations[id] = { name: name || '', color, textColor };
      saveIndexerCustomizations();
      renderIndexersPanel();
      const { populateSelectors } = require('./api.js');
      import('./api.js').then(m => m.populateSelectors());
      document.getElementById('modal-edit-indexer-overlay')?.classList.remove('open');
      log(`Indexeur ${name || id} personnalisé avec succès`, 'ok');
    }
  });
}
