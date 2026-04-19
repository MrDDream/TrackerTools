import { state } from './state.js';
import { TRANSLATIONS, t } from './i18n.js';
import { SUBCATEGORIES } from './constants.js';
import { cb } from './callbacks.js';
import { escapeHtml, log } from './utils.js';
import { persistConfig, persistData } from './persist.js';
import {
  testConnection, fetchIndexers, populateSelectors, checkStep3Unlock,
  onIndexerChange, saveManualIndexers, renderManualIndexersList,
  unlockStep2, updateTrackerBadges, indexerName
} from './api.js';
import { handleMainAction, runMultiSearch } from './compare.js';
import { renderResults, updateSortIcons, toggleWatchlist, renderWatchlist } from './render.js';
import { renderHistory, saveHistory } from './history.js';
import { renderIndexersPanel, testAllIndexers, refreshIndexerList, setupIndexerEditModal } from './indexers.js';
import { renderTorrentsPanel, loadTorrentSettingsIntoModal, openAddTorrentModal, addTorrentDirectly, setupTorrentEventListeners } from './torrents.js';
import { exportCurrentTab, exportAll, exportData } from './export.js';

// ─── Register cross-module callbacks ───────────────────────
cb.handleMainAction        = handleMainAction;
cb.onIndexerChange         = onIndexerChange;
cb.renderResults           = renderResults;
cb.renderManualIndexersList = renderManualIndexersList;
cb.renderIndexersPanel     = renderIndexersPanel;
cb.renderTorrentsPanel     = renderTorrentsPanel;
cb.renderWatchlist         = renderWatchlist;
cb.openAddTorrentModal     = openAddTorrentModal;
cb.addTorrentDirectly      = addTorrentDirectly;

// ─── Settings load/save ────────────────────────────────────
function loadSettings() {
  const saved      = localStorage.getItem('prowlarr_settings');
  const savedTheme = localStorage.getItem('theme_preference');
  const savedLang  = localStorage.getItem('lang_preference');
  if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  if (savedLang === 'en') applyLang('en');
  else document.getElementById('lang-select').value = 'fr';
  if (!saved) return;
  try {
    const s = JSON.parse(saved);
    const urlEl    = document.getElementById('prowlarr-url');
    const apiKeyEl = document.getElementById('prowlarr-apikey');
    if (s.url    && urlEl)    urlEl.value    = s.url;
    if (s.apiKey && apiKeyEl) apiKeyEl.value = s.apiKey;
    log('Paramètres restaurés depuis le cache.', 'info');
  } catch (_) {}
}

// ─── Version check ─────────────────────────────────────────
async function checkVersion() {
  const badge = document.getElementById('version-badge');
  if (!badge) return;
  let current = null;
  try {
    const res = await fetch('/api/version');
    const data = await res.json();
    current = data.version;
  } catch (_) { return; }
  if (!current || current === 'unknown') return;
  badge.textContent = `v${current}`;
  badge.title = `Version installée : ${current}`;
  try {
    const res = await fetch('https://api.github.com/repos/mrddream/trackertools/releases/latest');
    if (!res.ok) return;
    const release = await res.json();
    const latest = (release.tag_name || '').replace(/^v/, '');
    const cmpVersions = (a, b) => {
      const pa = a.split('.'), pb = b.split('.');
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const na = Number(pa[i]) || 0, nb = Number(pb[i]) || 0;
        if (na > nb) return 1; if (nb > na) return -1;
      }
      return 0;
    };
    if (latest && cmpVersions(latest, current) > 0) {
      badge.textContent = `v${current} → v${latest} ↑`;
      badge.title = `Mise à jour disponible : v${latest}\nCliquer pour voir la release`;
      badge.classList.add('update-available');
      badge.addEventListener('click', () => window.open(release.html_url, '_blank', 'noopener'));
    }
  } catch (_) {}
}

// ─── applyLang — full DOM translation + re-render ──────────
export function applyLang(lang) {
  state.currentLang = lang;
  localStorage.setItem('lang_preference', lang);
  document.documentElement.lang = lang;
  const langSelect = document.getElementById('lang-select');
  if (langSelect) langSelect.value = lang;

  document.getElementById('app-subtitle').innerHTML = t('app-subtitle');
  document.getElementById('mode-btn-search-text').textContent  = t('mode-search');
  document.getElementById('mode-btn-compare-text').textContent = t('mode-compare');
  document.getElementById('btn-theme-toggle').title  = t('btn-theme-title');
  document.getElementById('btn-open-settings').title = t('btn-settings-title');

  const stEl = document.getElementById('header-status-text');
  if (stEl && (stEl.textContent === 'Non connecté' || stEl.textContent === 'Not connected')) {
    stEl.textContent = t('status-disconnected');
  }

  document.getElementById('card-title-indexers').textContent = t('card-title-indexers');
  document.getElementById('badge-step1').textContent         = t('badge-step1');
  document.getElementById('protocol-filter-label').textContent = t('protocol-filter-label');
  document.getElementById('btn-torrent-text').textContent    = t('btn-torrent');
  document.getElementById('btn-usenet-text').textContent     = t('btn-usenet');
  document.getElementById('label-t1-text').textContent       = t('label-t1');
  document.getElementById('label-t1-ref').textContent        = t('label-t1-ref');
  document.getElementById('label-t2-text').textContent       = t('label-t2');
  document.getElementById('label-t2-ref').textContent        = t('label-t2-ref');
  const t1Def = document.getElementById('select-t1-default');
  if (t1Def) t1Def.textContent = t('connect-first');
  const t2Def = document.getElementById('select-t2-default');
  if (t2Def) t2Def.textContent = t('connect-first');
  const msPlaceholder = document.getElementById('multi-select-placeholder');
  if (msPlaceholder) msPlaceholder.textContent = t('connect-first');

  document.getElementById('card-title-filters').textContent  = t('card-title-filters');
  document.getElementById('badge-step2').textContent         = t('badge-step2');
  document.getElementById('label-search').textContent        = t('label-search');
  document.getElementById('filter-query').placeholder        = t('search-placeholder');
  document.getElementById('label-cat').textContent           = t('label-cat');
  document.getElementById('cat-all').textContent             = t('cat-all');
  document.getElementById('cat-movies').textContent          = t('cat-movies');
  document.getElementById('cat-tv').textContent              = t('cat-tv');
  document.getElementById('cat-music').textContent           = t('cat-music');
  document.getElementById('cat-books').textContent           = t('cat-books');
  document.getElementById('cat-pc').textContent              = t('cat-pc');
  document.getElementById('cat-console').textContent         = t('cat-console');
  document.getElementById('label-subcat').textContent        = t('label-subcat');
  const subcatAll = document.getElementById('subcat-all');
  if (subcatAll) subcatAll.textContent = t('cat-all');
  document.getElementById('label-limit').textContent    = t('label-limit');
  document.getElementById('label-method').textContent   = t('label-method');
  document.getElementById('method-fuzzy').textContent   = t('method-fuzzy');
  document.getElementById('method-norm').textContent    = t('method-norm');
  document.getElementById('label-filter-mode').textContent = t('label-filter-mode');
  document.getElementById('filter-strict').textContent  = t('filter-strict');
  document.getElementById('filter-off').textContent     = t('filter-off');
  const btnRunTextEl = document.getElementById('btn-run-text');
  if (btnRunTextEl) btnRunTextEl.textContent = state.appMode === 'compare' ? t('btn-run-compare') : t('btn-run-search');

  _updateStatLabels();

  const tabU2 = document.getElementById('tab-unique-t2');
  const tabU1 = document.getElementById('tab-unique-t1');
  const tabC  = document.getElementById('tab-common');
  if (tabU2) tabU2.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${t('tab-missing-on')} T1`;
  if (tabU1) tabU1.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${t('tab-missing-on')} T2`;
  if (tabC)  tabC.innerHTML  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>${t('tab-common')}`;

  const rSearch = document.getElementById('results-search');
  if (rSearch) rSearch.placeholder = t('filter-title-placeholder');
  const allIdxOpt = document.getElementById('all-indexers-option');
  if (allIdxOpt) allIdxOpt.textContent = t('all-indexers');
  const exportCsvAllEl = document.getElementById('export-csv-all-text');
  if (exportCsvAllEl) exportCsvAllEl.textContent = t('export-csv-all');
  const exportJsonAllEl = document.getElementById('export-json-all-text');
  if (exportJsonAllEl) exportJsonAllEl.textContent = t('export-json-all');
  document.getElementById('btn-reset-text').textContent = t('btn-reset');
  document.getElementById('btn-reset').title            = t('btn-reset-title');

  document.getElementById('empty-title').textContent = t('empty-title');
  document.getElementById('empty-desc').innerHTML    = t('empty-desc');

  document.getElementById('th-source').textContent    = t('th-source');
  document.getElementById('th-title').innerHTML       = t('th-title')    + ' <span class="sort-icon">↕</span>';
  document.getElementById('th-category').innerHTML    = t('th-category') + ' <span class="sort-icon">↕</span>';
  document.getElementById('th-size').innerHTML        = t('th-size')     + ' <span class="sort-icon">↕</span>';
  document.getElementById('th-age').innerHTML         = t('th-age')      + ' <span class="sort-icon">↕</span>';
  document.getElementById('th-link').textContent      = t('th-link');
  document.getElementById('th-torrent').textContent   = t('th-torrent');

  document.getElementById('btn-prev-text').textContent = t('btn-prev');
  document.getElementById('btn-next-text').textContent = t('btn-next');
  document.getElementById('log-summary').textContent   = t('log-summary');
  document.getElementById('btn-clear-log-text').textContent = t('btn-clear-log');

  document.getElementById('modal-title').textContent           = t('modal-settings-title');
  document.getElementById('settings-section1').textContent     = t('settings-section1');
  document.getElementById('label-prowlarr-url').textContent    = t('label-prowlarr-url');
  document.getElementById('label-prowlarr-apikey').textContent = t('label-prowlarr-apikey');
  document.getElementById('btn-connect-text').textContent      = t('btn-connect');
  document.getElementById('settings-section2-text').textContent = t('settings-section2');
  document.getElementById('btn-add-manual-header-text').textContent = t('btn-add-header');
  document.getElementById('manual-desc').textContent           = t('manual-desc');

  document.getElementById('modal-manual-title').textContent  = t('modal-manual-title');
  document.getElementById('label-manual-name').textContent   = t('label-manual-name');
  document.getElementById('manual-name').placeholder         = t('manual-name-placeholder');
  document.getElementById('label-manual-url').textContent    = t('label-manual-url');
  document.getElementById('manual-url').placeholder          = t('manual-url-placeholder');
  document.getElementById('label-manual-apikey').textContent = t('label-manual-apikey');
  document.getElementById('manual-apikey').placeholder       = t('manual-apikey-placeholder');

  const modeIndexersText = document.getElementById('mode-btn-indexers-text');
  if (modeIndexersText) modeIndexersText.textContent = t('mode-indexers');
  const modeTorrentsText = document.getElementById('mode-btn-torrents-text');
  if (modeTorrentsText) modeTorrentsText.textContent = t('mode-torrents');

  const idxPanelTitle = document.getElementById('indexers-panel-title');
  if (idxPanelTitle) idxPanelTitle.textContent = t('indexers-panel-title');
  const btnTestAllText = document.getElementById('btn-test-all-text');
  if (btnTestAllText) btnTestAllText.textContent = t('btn-test-all');
  const btnRefreshIdxText = document.getElementById('btn-refresh-indexers-text');
  if (btnRefreshIdxText) btnRefreshIdxText.textContent = t('btn-refresh-indexers');
  ['ith-name','ith-proto','ith-status','ith-last-test','ith-duration','ith-results','ith-success','ith-actions'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = t(id);
  });

  const torPanelTitle = document.getElementById('torrents-panel-title');
  if (torPanelTitle) torPanelTitle.textContent = t('torrents-panel-title');
  const btnRefreshTorText = document.getElementById('btn-refresh-torrents-text');
  if (btnRefreshTorText) btnRefreshTorText.textContent = t('btn-refresh-torrents');
  ['tth-name','tth-size','tth-status','tth-progress','tth-seeds','tth-peers','tth-category','tth-added'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = t(id);
  });

  const sec3 = document.getElementById('settings-section3-text');
  if (sec3) sec3.textContent = t('settings-section3');
  const lblClient = document.getElementById('label-torrent-client');
  if (lblClient) lblClient.textContent = t('label-torrent-client');
  const lblUrl = document.getElementById('label-torrent-url');
  if (lblUrl) lblUrl.textContent = t('label-torrent-url');
  const lblUser = document.getElementById('label-torrent-user');
  if (lblUser) lblUser.textContent = t('label-torrent-user');
  const lblPass = document.getElementById('label-torrent-pass');
  if (lblPass) lblPass.textContent = t('label-torrent-pass');
  const btnTestTorText = document.getElementById('btn-test-torrent-text');
  if (btnTestTorText) btnTestTorText.textContent = t('btn-test-torrent');
  const btnSaveTorText = document.getElementById('btn-save-torrent-text');
  if (btnSaveTorText) btnSaveTorText.textContent = t('btn-save-torrent');
  const optNone = document.getElementById('opt-torrent-none');
  if (optNone) optNone.textContent = t('opt-torrent-none');

  renderManualIndexersList();
  if (state.resultsT1.length > 0 || state.resultsT2.length > 0 || state.multiSearchResults.length > 0) {
    renderResults();
  }
  if (state.appMode === 'indexers') renderIndexersPanel();
  if (state.appMode === 'torrents') renderTorrentsPanel();
}

function _updateStatLabels() {
  const statLabelT1 = document.getElementById('stat-label-t1');
  if (statLabelT1) {
    const badge = document.getElementById('badge-name-t1');
    statLabelT1.innerHTML = t('stat-results') + ' ';
    if (badge) statLabelT1.appendChild(badge);
  }
  const statLabelT2 = document.getElementById('stat-label-t2');
  if (statLabelT2) {
    const badge = document.getElementById('badge-name-t2');
    statLabelT2.innerHTML = t('stat-results') + ' ';
    if (badge) statLabelT2.appendChild(badge);
  }
  const slCommon = document.getElementById('stat-label-common');
  if (slCommon) slCommon.textContent = t('stat-common');
  const statLabelU1 = document.getElementById('stat-label-unique-t1');
  if (statLabelU1) {
    const badge = document.getElementById('badge-unique-t1');
    statLabelU1.innerHTML = t('stat-unique') + ' ';
    if (badge) statLabelU1.appendChild(badge);
  }
  const statLabelU2 = document.getElementById('stat-label-unique-t2');
  if (statLabelU2) {
    const badge = document.getElementById('badge-unique-t2');
    statLabelU2.innerHTML = t('stat-unique') + ' ';
    if (badge) statLabelU2.appendChild(badge);
  }
  const slSim = document.getElementById('stat-label-similarity');
  if (slSim) slSim.textContent = t('stat-similarity');
}

// ─── Mode Switcher ─────────────────────────────────────────
function setupModeSwitcher() {
  const modeBtns = document.querySelectorAll('.mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('mode-btn-active'));
      btn.classList.add('mode-btn-active');
      state.appMode = btn.dataset.mode;

      const compareSelectors  = document.getElementById('compare-selectors');
      const searchSelectors   = document.getElementById('search-selectors');
      const btnRunText        = document.getElementById('btn-run-text');
      const statsBar          = document.getElementById('stats-bar');
      const tabsBar           = document.getElementById('tabs-bar');
      const filterMatchMode   = document.getElementById('filter-match-mode');
      const filterSearchStrict = document.getElementById('filter-search-strict');
      const resultsIdxFilter  = document.getElementById('results-indexer-filter');
      const historyPanel      = document.getElementById('history-panel');
      const watchlistPanel    = document.getElementById('watchlist-panel');
      const tableContainer    = document.getElementById('table-container');
      const resultsToolbar    = document.querySelector('.results-toolbar');
      const paginationBar     = document.getElementById('pagination-bar');

      if (state.appMode === 'compare') {
        state.sortPrimary = { col: null, dir: 'asc' };
        state.sortSecondary = { col: null, dir: 'asc' };
        state.sortCol = null;
        updateSortIcons();
        if (compareSelectors) compareSelectors.style.display = 'block';
        if (searchSelectors) searchSelectors.style.display = 'none';
        if (btnRunText) btnRunText.textContent = t('btn-run-compare');
        if (statsBar) statsBar.style.display = 'flex';
        if (tabsBar)  tabsBar.style.display  = 'flex';
        if (filterMatchMode) filterMatchMode.closest('.form-group').style.display = 'block';
        if (filterSearchStrict) filterSearchStrict.closest('.form-group').style.display = 'none';
        if (resultsIdxFilter) resultsIdxFilter.style.display = 'none';
        state.currentTab = 'unique-t2';
      } else if (state.appMode === 'search') {
        state.sortPrimary = { col: null, dir: 'asc' };
        state.sortSecondary = { col: null, dir: 'asc' };
        state.sortCol = null;
        updateSortIcons();
        if (compareSelectors) compareSelectors.style.display = 'none';
        if (searchSelectors) searchSelectors.style.display = 'block';
        if (btnRunText) btnRunText.textContent = t('btn-run-search');
        if (statsBar) statsBar.style.display = 'none';
        if (tabsBar)  tabsBar.style.display  = 'none';
        if (filterMatchMode) filterMatchMode.closest('.form-group').style.display = 'none';
        if (filterSearchStrict) filterSearchStrict.closest('.form-group').style.display = 'block';
        if (resultsIdxFilter) resultsIdxFilter.style.display = 'block';
        state.currentTab = 'search';
      } else if (['history','watchlist','indexers','torrents'].includes(state.appMode)) {
        if (statsBar) statsBar.style.display = 'none';
        if (tabsBar)  tabsBar.style.display  = 'none';
      }

      const mainGrid = document.querySelector('.main-grid');
      const isContentMode = ['history','watchlist','indexers','torrents'].includes(state.appMode);
      if (mainGrid) mainGrid.classList.toggle('no-sidebar', isContentMode);

      if (historyPanel)  historyPanel.style.display  = state.appMode === 'history'   ? 'block' : 'none';
      if (watchlistPanel) watchlistPanel.style.display = state.appMode === 'watchlist' ? 'block' : 'none';
      const indexersPanel = document.getElementById('indexers-panel');
      const torrentsPanel = document.getElementById('torrents-panel');
      if (indexersPanel) indexersPanel.style.display = state.appMode === 'indexers' ? 'block' : 'none';
      if (torrentsPanel) torrentsPanel.style.display  = state.appMode === 'torrents' ? 'block' : 'none';

      if (state.appMode === 'search' || state.appMode === 'compare') {
        if (tableContainer) tableContainer.style.display = 'block';
        if (resultsToolbar) resultsToolbar.style.display = 'flex';
        checkStep3Unlock();
        renderResults();
      } else {
        if (tableContainer) tableContainer.style.display = 'none';
        if (resultsToolbar) resultsToolbar.style.display = 'none';
        if (paginationBar)  paginationBar.style.display  = 'none';
        if (state.appMode === 'history')  renderHistory();
        if (state.appMode === 'watchlist') renderWatchlist();
        if (state.appMode === 'indexers') renderIndexersPanel();
        if (state.appMode === 'torrents') renderTorrentsPanel();
      }
    });
  });
}

// ─── Protocol selector buttons ─────────────────────────────
function selectByProtocol(targetProtocol) {
  const checkboxes = document.querySelectorAll('.multi-select-container input[type="checkbox"]');
  let allMatchingChecked = true;
  checkboxes.forEach(cb2 => {
    const idx = state.allIndexers.find(i => i.id == cb2.value);
    if (!idx) return;
    let proto = idx.protocol ? idx.protocol.toLowerCase() : '';
    if (idx.isManual) proto = 'torrent';
    if (proto === targetProtocol && !cb2.checked) allMatchingChecked = false;
  });
  checkboxes.forEach(cb2 => {
    const idx = state.allIndexers.find(i => i.id == cb2.value);
    if (!idx) return;
    let proto = idx.protocol ? idx.protocol.toLowerCase() : '';
    if (idx.isManual) proto = 'torrent';
    if (proto === targetProtocol) {
      cb2.checked = !allMatchingChecked;
      if (cb2.checked) state.searchSelectedIds.add(cb2.value);
      else state.searchSelectedIds.delete(cb2.value);
    } else {
      cb2.checked = false;
      state.searchSelectedIds.delete(cb2.value);
    }
  });
  checkStep3Unlock();
}

// ─── Main event listeners ──────────────────────────────────
function setupEventListeners() {
  const prowlarrUrl    = document.getElementById('prowlarr-url');
  const prowlarrApiKey = document.getElementById('prowlarr-apikey');
  const btnConnect     = document.getElementById('btn-connect');
  const btnEye         = document.getElementById('btn-eye-apikey');
  const filterQuery    = document.getElementById('filter-query');
  const filterCat      = document.getElementById('filter-cat');
  const filterSubcat   = document.getElementById('filter-subcat');
  const btnCompare     = document.getElementById('btn-compare');
  const btnReset       = document.getElementById('btn-reset');
  const btnClearLog    = document.getElementById('btn-clear-log');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const langSelect     = document.getElementById('lang-select');
  const modalOverlay   = document.getElementById('modal-overlay');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnModalClose  = document.getElementById('btn-modal-close');
  const exportTrigger  = document.getElementById('btn-export-trigger');
  const exportMenu     = document.getElementById('export-menu');
  const tabBtns        = document.querySelectorAll('.tab-btn');
  const resultsSearch  = document.getElementById('results-search');
  const btnPagePrev    = document.getElementById('btn-page-prev');
  const btnPageNext    = document.getElementById('btn-page-next');

  // Settings modal
  btnOpenSettings?.addEventListener('click', () => { loadTorrentSettingsIntoModal(); modalOverlay.classList.add('open'); });
  btnModalClose?.addEventListener('click',   () => modalOverlay.classList.remove('open'));
  modalOverlay?.addEventListener('click', e => { if (e.target === modalOverlay) modalOverlay.classList.remove('open'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') modalOverlay?.classList.remove('open'); });

  // API key eye toggle
  btnEye?.addEventListener('click', () => {
    prowlarrApiKey.type = prowlarrApiKey.type === 'password' ? 'text' : 'password';
  });

  // Subcategory filter
  filterCat?.addEventListener('change', () => {
    const subs = SUBCATEGORIES[filterCat.value] || [];
    filterSubcat.innerHTML = `<option value="" id="subcat-all">${t('cat-all')}</option>`;
    subs.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.value;
      opt.textContent = s.label;
      filterSubcat.appendChild(opt);
    });
    filterSubcat.disabled = subs.length === 0;
  });

  // Connect
  btnConnect?.addEventListener('click', testConnection);
  prowlarrUrl?.addEventListener('keydown',    e => { if (e.key === 'Enter') testConnection(); });
  prowlarrApiKey?.addEventListener('keydown', e => { if (e.key === 'Enter') testConnection(); });
  filterQuery?.addEventListener('keydown',    e => { if (e.key === 'Enter') handleMainAction(); });

  // Compare/search
  btnCompare?.addEventListener('click', handleMainAction);

  // Indexer selects
  document.getElementById('select-t1')?.addEventListener('change', onIndexerChange);
  document.getElementById('select-t2')?.addEventListener('change', onIndexerChange);

  // Log clear
  btnClearLog?.addEventListener('click', () => { document.getElementById('log-body').innerHTML = ''; log('Console vidée.', 'info'); });

  // Theme
  btnThemeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    if (next === 'light') { document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('theme_preference', 'light'); }
    else { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme_preference', 'dark'); }
  });

  // Language
  langSelect?.addEventListener('change', () => applyLang(langSelect.value));

  // Tabs
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('tab-active'));
      btn.classList.add('tab-active');
      state.currentTab  = btn.dataset.tab;
      state.currentPage = 0;
      renderResults();
    });
  });

  // Column sorting (multi-sort with Shift)
  document.querySelectorAll('.results-table thead th.sortable').forEach(th => {
    th.addEventListener('click', (e) => {
      const col = th.dataset.sort;
      if (e.shiftKey) {
        if (state.sortSecondary.col === col) state.sortSecondary.dir = state.sortSecondary.dir === 'asc' ? 'desc' : 'asc';
        else state.sortSecondary = { col, dir: 'asc' };
      } else {
        if (state.sortPrimary.col === col) state.sortPrimary.dir = state.sortPrimary.dir === 'asc' ? 'desc' : 'asc';
        else { state.sortPrimary = { col, dir: 'asc' }; state.sortSecondary = { col: null, dir: 'asc' }; }
        state.sortCol = state.sortPrimary.col;
        state.sortDir = state.sortPrimary.dir;
      }
      updateSortIcons();
      state.currentPage = 0;
      renderResults();
    });
  });

  // Results search filter
  let searchTimeout;
  resultsSearch?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { state.currentPage = 0; renderResults(); }, 200);
  });

  const filterIndexerEl = document.getElementById('results-indexer-filter');
  filterIndexerEl?.addEventListener('change', () => { state.currentPage = 0; renderResults(); });

  // Pagination
  btnPagePrev?.addEventListener('click', () => { if (state.currentPage > 0) { state.currentPage--; renderResults(); window.scrollTo(0, 0); } });
  btnPageNext?.addEventListener('click', () => { state.currentPage++; renderResults(); window.scrollTo(0, 0); });

  // Reset
  btnReset?.addEventListener('click', () => {
    state.resultsT1 = []; state.resultsT2 = [];
    state.commonResults = []; state.uniqueT1Results = []; state.uniqueT2Results = [];
    state.multiSearchResults = [];
    state.currentPage = 0; state.sortCol = null; state.sortDir = 'asc';
    if (resultsSearch) resultsSearch.value = '';

    ['stat-t1','stat-t2','stat-common','stat-unique-t1','stat-unique-t2'].forEach(id => {
      const el = document.getElementById(id); if (el) el.textContent = '–';
    });
    const statOverlap = document.getElementById('stat-overlap');
    if (statOverlap) statOverlap.textContent = '–';

    const emptyState   = document.getElementById('empty-state');
    const resultsTable = document.getElementById('results-table');
    const paginationBar = document.getElementById('pagination-bar');
    if (emptyState)   emptyState.style.display   = 'flex';
    if (resultsTable) resultsTable.style.display  = 'none';
    if (paginationBar) paginationBar.style.display = 'none';
    if (exportTrigger) exportTrigger.disabled = true;
    if (btnReset) btnReset.disabled = true;

    const tabU2 = document.getElementById('tab-unique-t2');
    const tabU1 = document.getElementById('tab-unique-t1');
    const tabC  = document.getElementById('tab-common');
    if (tabU2) tabU2.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${t('tab-missing-on')} T1`;
    if (tabU1) tabU1.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${t('tab-missing-on')} T2`;
    if (tabC)  tabC.innerHTML  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>${t('tab-common')}`;

    document.querySelectorAll('.results-table thead th').forEach(h => {
      h.classList.remove('sorted-asc', 'sorted-desc');
      const icon = h.querySelector('.sort-icon');
      if (icon) icon.textContent = '↕';
    });
    log('Résultats réinitialisés.', 'info');
  });

  // Export dropdown
  exportTrigger?.addEventListener('click', (e) => { e.stopPropagation(); exportMenu?.classList.toggle('open'); });
  document.addEventListener('click', (e) => {
    if (!exportTrigger?.contains(e.target) && !exportMenu?.contains(e.target)) exportMenu?.classList.remove('open');
  });
  document.getElementById('btn-export-csv-all')?.addEventListener('click', () => {
    if (state.appMode === 'search') exportCurrentTab('csv'); else exportAll('csv');
  });
  document.getElementById('btn-export-json-all')?.addEventListener('click', () => {
    if (state.appMode === 'search') exportCurrentTab('json'); else exportAll('json');
  });

  // Watchlist export dropdown
  const btnExportWatchlistTrigger = document.getElementById('btn-export-watchlist-trigger');
  const exportWatchlistDropdown   = document.getElementById('export-watchlist-dropdown');
  if (btnExportWatchlistTrigger && exportWatchlistDropdown) {
    btnExportWatchlistTrigger.addEventListener('click', (e) => { e.stopPropagation(); exportWatchlistDropdown.classList.toggle('open'); });
    document.addEventListener('click', (e) => {
      if (!btnExportWatchlistTrigger.contains(e.target) && !exportWatchlistDropdown.contains(e.target)) exportWatchlistDropdown.classList.remove('open');
    });
    document.getElementById('btn-export-watchlist-csv')?.addEventListener('click',  () => { exportWatchlistDropdown.classList.remove('open'); exportData(state.watchlist, 'csv',  'favoris'); });
    document.getElementById('btn-export-watchlist-json')?.addEventListener('click', () => { exportWatchlistDropdown.classList.remove('open'); exportData(state.watchlist, 'json', 'favoris'); });
  }

  // History filter buttons
  document.querySelectorAll('.btn-history-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-history-filter').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state._historyFilter = e.target.dataset.filter;
      renderHistory();
    });
  });

  // History clear
  document.getElementById('btn-clear-history')?.addEventListener('click', () => {
    if (confirm(t('btn-delete-confirm') || "Êtes-vous sûr de vouloir vider l'historique ?")) {
      const filter = state._historyFilter || 'all';
      if (filter === 'all') state.searchHistory = [];
      else state.searchHistory = state.searchHistory.filter(h => h.mode !== filter);
      localStorage.setItem('search_history', JSON.stringify(state.searchHistory));
      persistData('history', state.searchHistory);
      renderHistory();
    }
  });

  // Watchlist clear
  document.getElementById('btn-clear-watchlist')?.addEventListener('click', () => {
    if (confirm(t('btn-delete-confirm') || "Êtes-vous sûr de vouloir vider vos favoris ?")) {
      state.watchlist = [];
      localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
      persistData('bookmark', state.watchlist);
      renderWatchlist();
      renderResults();
    }
  });

  // Watchlist / history search
  document.getElementById('watchlist-indexer-filter')?.addEventListener('change', renderWatchlist);
  document.getElementById('watchlist-search')?.addEventListener('input', renderWatchlist);
  document.getElementById('history-search')?.addEventListener('input', renderHistory);

  // Search multi-select buttons
  document.getElementById('btn-search-select-all')?.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.multi-select-container input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb2 => cb2.checked);
    checkboxes.forEach(cb2 => {
      cb2.checked = !allChecked;
      if (!allChecked) state.searchSelectedIds.add(cb2.value);
      else state.searchSelectedIds.delete(cb2.value);
    });
    checkStep3Unlock();
  });
  document.getElementById('btn-search-select-torrent')?.addEventListener('click', () => selectByProtocol('torrent'));
  document.getElementById('btn-search-select-usenet')?.addEventListener('click',  () => selectByProtocol('usenet'));

  // Indexers panel buttons
  document.getElementById('btn-test-all-indexers')?.addEventListener('click', testAllIndexers);
  document.getElementById('btn-refresh-indexers')?.addEventListener('click',  refreshIndexerList);

  // Manual indexers modal
  const btnOpenManual      = document.getElementById('btn-open-manual');
  const modalManualOverlay = document.getElementById('modal-manual-overlay');
  const btnManualClose     = document.getElementById('btn-manual-close');
  const btnAddManual       = document.getElementById('btn-add-manual');

  btnOpenManual?.addEventListener('click', () => {
    const manualEditId = document.getElementById('manual-edit-id');
    if (manualEditId) manualEditId.value = '';
    document.getElementById('manual-name').value = '';
    document.getElementById('manual-url').value  = '';
    document.getElementById('manual-apikey').value = '';
    if (btnAddManual) btnAddManual.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg><span id="btn-add-manual-text"> ${t('btn-add-manual')}</span>`;
    modalManualOverlay?.classList.add('open');
  });
  btnManualClose?.addEventListener('click', () => modalManualOverlay?.classList.remove('open'));

  btnAddManual?.addEventListener('click', () => {
    const name   = document.getElementById('manual-name').value.trim();
    const url    = document.getElementById('manual-url').value.trim();
    const apiKey = document.getElementById('manual-apikey').value.trim();
    const editId = document.getElementById('manual-edit-id')?.value;
    if (!name || !url) { log('Nom et URL requis pour le tracker manuel', 'warn'); return; }
    if (editId) {
      const idx = state.manualIndexers.find(i => i.id === editId);
      if (idx) { idx.name = name; idx.url = url; idx.apiKey = apiKey; log(`Tracker modifié : ${name}`, 'ok'); }
    } else {
      state.manualIndexers.push({ id: 'manual_' + Date.now(), name, url, apiKey, protocol: 'torznab', enable: true, isManual: true });
      log(`Tracker ajouté : ${name}`, 'ok');
    }
    saveManualIndexers();
    modalManualOverlay?.classList.remove('open');
  });

  // Indexer collapse toggle
  document.getElementById('indexer-header-collapse')?.addEventListener('click', () => {
    const body = document.getElementById('indexer-collapse-body');
    const icon = document.getElementById('indexer-collapse-icon');
    if (body && icon) {
      if (body.style.display === 'none') { body.style.display = 'block'; icon.style.transform = 'rotate(180deg)'; }
      else { body.style.display = 'none'; icon.style.transform = 'rotate(0deg)'; }
    }
  });

  // Sidebar toggle
  document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
    const grid = document.querySelector('.main-grid');
    const btn  = document.getElementById('btn-toggle-sidebar');
    if (!grid) return;
    const collapsed = grid.classList.toggle('sidebar-collapsed');
    if (btn) btn.title = collapsed ? 'Afficher le panneau gauche' : 'Masquer le panneau gauche';
  });

  // Filters collapse toggle
  document.getElementById('filters-header-collapse')?.addEventListener('click', () => {
    const body = document.getElementById('filters-collapse-body');
    const icon = document.getElementById('filters-collapse-icon');
    if (body && icon) {
      if (body.style.display === 'none') { body.style.display = 'block'; icon.style.transform = 'rotate(180deg)'; }
      else { body.style.display = 'none'; icon.style.transform = 'rotate(0deg)'; }
    }
  });

  // Search filter type
  document.getElementById('search-filter-type')?.addEventListener('change', renderResults);
}

// ─── Init ──────────────────────────────────────────────────
loadSettings();
renderManualIndexersList();
checkVersion();
log('Application prête.', 'info');
setupModeSwitcher();
setupEventListeners();
setupTorrentEventListeners();
setupIndexerEditModal();

Promise.all([
  fetch('/config/config.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
  fetch('/config/history.json').then(r => r.ok ? r.json() : []).catch(() => []),
  fetch('/config/bookmark.json').then(r => r.ok ? r.json() : []).catch(() => [])
]).then(([config, remoteHistory, remoteBookmark]) => {
  let hasExternal = false;
  const urlEl    = document.getElementById('prowlarr-url');
  const apiKeyEl = document.getElementById('prowlarr-apikey');
  if (config.url)    { if (urlEl)    urlEl.value    = config.url;    hasExternal = true; }
  if (config.apiKey) { if (apiKeyEl) apiKeyEl.value = config.apiKey; hasExternal = true; }
  if (config.manualIndexers) {
    state.manualIndexers = config.manualIndexers;
    localStorage.setItem('manual_indexers', JSON.stringify(state.manualIndexers));
    renderManualIndexersList();
  }
  if (config.torrentClientSettings) {
    state.torrentClientSettings = config.torrentClientSettings;
    localStorage.setItem('torrent_client_settings', JSON.stringify(state.torrentClientSettings));
  }

  if (Array.isArray(remoteHistory) && remoteHistory.length > 0) {
    state.searchHistory = remoteHistory;
    localStorage.setItem('search_history', JSON.stringify(state.searchHistory));
  }
  if (Array.isArray(remoteBookmark) && remoteBookmark.length > 0) {
    state.watchlist = remoteBookmark;
    localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
    if (state.appMode === 'watchlist') renderWatchlist();
  }

  if (hasExternal) {
    log('Configuration chargée depuis le volume (/config)', 'ok');
    const current = JSON.parse(localStorage.getItem('prowlarr_settings') || '{}');
    localStorage.setItem('prowlarr_settings', JSON.stringify({ ...current, url: urlEl?.value.trim(), apiKey: apiKeyEl?.value.trim() }));
    persistConfig();
  }

  if (urlEl?.value && apiKeyEl?.value) {
    log('Identifiants détectés, connexion automatique…', 'info');
    testConnection();
  } else {
    loadTorrentSettingsIntoModal();
    document.getElementById('modal-overlay')?.classList.add('open');
  }
}).catch(() => {
  const urlEl    = document.getElementById('prowlarr-url');
  const apiKeyEl = document.getElementById('prowlarr-apikey');
  if (urlEl?.value && apiKeyEl?.value) {
    log('Identifiants détectés, connexion automatique…', 'info');
    testConnection();
  } else {
    loadTorrentSettingsIntoModal();
    document.getElementById('modal-overlay')?.classList.add('open');
  }
});
