import { state } from './state.js';
import { t } from './i18n.js';
import { log, normalizeTitle, tokenSet, jaccard, animateValue, escapeHtml, normalizeString } from './utils.js';
import { performSearch, indexerName, updateTrackerBadges, findIndexer } from './api.js';
import { SUBCATEGORIES } from './constants.js';
import { saveHistory } from './history.js';
import { cb } from './callbacks.js';

export async function runComparison() {
  const s1 = document.getElementById('select-t1');
  const s2 = document.getElementById('select-t2');
  const t1Id = s1?.value;
  const t2Id = s2?.value;

  if (!t1Id || !t2Id || t1Id === t2Id) {
    log('Sélectionnez deux indexeurs différents.', 'warn');
    return;
  }

  const filterQuery     = document.getElementById('filter-query');
  const filterCat       = document.getElementById('filter-cat');
  const filterSubcat    = document.getElementById('filter-subcat');
  const filterLimit     = document.getElementById('filter-limit');
  const filterMatchMode = document.getElementById('filter-match-mode');
  const btnCompare      = document.getElementById('btn-compare');
  const progressContainer = document.getElementById('progress-container');
  const progressBar     = document.getElementById('progress-bar');
  const progressLabel   = document.getElementById('progress-label');
  const emptyStateEl    = document.getElementById('empty-state');
  const resultsTable    = document.getElementById('results-table');
  const resultsBody     = document.getElementById('results-body');
  const paginationBar   = document.getElementById('pagination-bar');
  const exportTrigger   = document.getElementById('btn-export-trigger');
  const btnReset        = document.getElementById('btn-reset');

  const query     = filterQuery?.value.trim() || '';
  const cat       = filterCat?.value || '';
  const limit     = parseInt(filterLimit?.value) || 100;
  const matchMode = filterMatchMode?.value || 'norm';
  const t1Name    = indexerName(t1Id, 'T1');
  const t2Name    = indexerName(t2Id, 'T2');
  updateTrackerBadges(t1Name, t2Name);

  if (btnCompare) { btnCompare.classList.add('loading'); btnCompare.disabled = true; }
  if (progressContainer) progressContainer.style.display = 'block';
  if (progressBar) { progressBar.style.width = '0%'; progressBar.style.background = ''; }
  if (progressLabel) progressLabel.textContent = `${t('parallel-search')} ${t1Name} ${t('and')} ${t2Name}…`;
  if (emptyStateEl) emptyStateEl.style.display = 'none';
  if (resultsTable) resultsTable.style.display = 'none';
  if (resultsBody) resultsBody.innerHTML = '';
  if (paginationBar) paginationBar.style.display = 'none';

  log(`Lancement: "${t1Name}" vs "${t2Name}"`, 'info');
  if (query) log(`Recherche: "${query}"`, 'info');

  try {
    const subcat = filterSubcat?.value || '';
    const baseParams = new URLSearchParams();
    if (query)  baseParams.set('query', query);
    if (subcat) baseParams.set('categories', subcat);
    else if (cat) baseParams.set('categories', cat);
    baseParams.set('limit', limit);
    baseParams.set('type', 'search');

    const paramsT1 = new URLSearchParams(baseParams);
    paramsT1.set('indexerIds', t1Id);
    const paramsT2 = new URLSearchParams(baseParams);
    paramsT2.set('indexerIds', t2Id);

    if (progressBar) progressBar.style.width = '20%';

    const indexer1 = findIndexer(t1Id);
    const indexer2 = findIndexer(t2Id);

    const [resT1, resT2] = await Promise.all([
      performSearch(indexer1, paramsT1, query, cat, limit),
      performSearch(indexer2, paramsT2, query, cat, limit)
    ]);

    state.resultsT1 = resT1 || [];
    state.resultsT2 = resT2 || [];
    log(`${state.resultsT1.length} résultat(s) sur ${t1Name}`, 'ok');
    log(`${state.resultsT2.length} résultat(s) sur ${t2Name}`, 'ok');

    if (progressBar) progressBar.style.width = '80%';
    if (progressLabel) progressLabel.textContent = t('comparing');

    compareResults(matchMode);

    if (progressBar) progressBar.style.width = '100%';
    if (progressLabel) progressLabel.textContent = t('compare-done');

    saveHistory({
      query, cat: cat ? (subcat || cat) : '', mode: 'compare',
      count: state.resultsT1.length + state.resultsT2.length,
      t1: t1Name, t2: t2Name, t1Id, t2Id,
      date: new Date().toLocaleDateString(state.currentLang === 'fr' ? 'fr-FR' : 'en-US') + ' ' +
            new Date().toLocaleTimeString(state.currentLang === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    });

    const totalUnionKeys = (new Set([
      ...state.resultsT1.map(r => normalizeTitle(r.title)),
      ...state.resultsT2.map(r => normalizeTitle(r.title))
    ])).size;
    const overlapPct = totalUnionKeys > 0 ? Math.round((state.commonResults.length / totalUnionKeys) * 100) : 0;

    const statT1       = document.getElementById('stat-t1');
    const statT2       = document.getElementById('stat-t2');
    const statCommon   = document.getElementById('stat-common');
    const statUniqueT1 = document.getElementById('stat-unique-t1');
    const statUniqueT2 = document.getElementById('stat-unique-t2');
    const statOverlap  = document.getElementById('stat-overlap');
    if (statT1)       animateValue(statT1,       state.resultsT1.length);
    if (statT2)       animateValue(statT2,       state.resultsT2.length);
    if (statCommon)   animateValue(statCommon,   state.commonResults.length);
    if (statUniqueT1) animateValue(statUniqueT1, state.uniqueT1Results.length);
    if (statUniqueT2) animateValue(statUniqueT2, state.uniqueT2Results.length);
    if (statOverlap)  statOverlap.textContent = overlapPct + '%';

    const tabU2 = document.getElementById('tab-unique-t2');
    const tabU1 = document.getElementById('tab-unique-t1');
    const tabC  = document.getElementById('tab-common');
    if (tabU2) tabU2.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${t('tab-missing-on')} ${escapeHtml(t1Name)} <span class="tab-count">${state.uniqueT2Results.length}</span>`;
    if (tabU1) tabU1.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${t('tab-missing-on')} ${escapeHtml(t2Name)} <span class="tab-count">${state.uniqueT1Results.length}</span>`;
    if (tabC)  tabC.innerHTML  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>${t('tab-common')} <span class="tab-count">${state.commonResults.length}</span>`;

    if (exportTrigger) exportTrigger.disabled = false;
    if (btnReset) btnReset.disabled = false;
    state.currentPage = 0;
    if (cb.renderResults) cb.renderResults();

    log(`Terminé — ${state.uniqueT2Results.length} manquant(s) sur ${t1Name}, ${state.uniqueT1Results.length} manquant(s) sur ${t2Name}, ${state.commonResults.length} en commun (${overlapPct}% overlap)`, 'ok');
    setTimeout(() => { if (progressContainer) progressContainer.style.display = 'none'; }, 2000);

  } catch (err) {
    log(`Erreur: ${err.message}`, 'error');
    if (progressLabel) progressLabel.textContent = t('compare-error');
    if (progressBar) { progressBar.style.width = '100%'; progressBar.style.background = 'var(--accent-danger)'; }
  } finally {
    if (btnCompare) { btnCompare.classList.remove('loading'); btnCompare.disabled = false; }
  }
}

export async function runMultiSearch() {
  if (state.searchSelectedIds.size === 0) {
    log('Veuillez sélectionner au moins un indexeur.', 'warn');
    return;
  }

  const filterQuery  = document.getElementById('filter-query');
  const filterCat    = document.getElementById('filter-cat');
  const filterSubcat = document.getElementById('filter-subcat');
  const filterLimit  = document.getElementById('filter-limit');
  const btnCompare   = document.getElementById('btn-compare');
  const progressContainer = document.getElementById('progress-container');
  const progressBar  = document.getElementById('progress-bar');
  const progressLabel = document.getElementById('progress-label');
  const resultsTable = document.getElementById('results-table');
  const paginationBar = document.getElementById('pagination-bar');
  const emptyStateEl = document.getElementById('empty-state');

  const query  = filterQuery?.value.trim() || '';
  const cat    = filterCat?.value || '';
  const subcat = filterSubcat?.value || '';
  const limit  = parseInt(filterLimit?.value) || 100;

  const baseParams = new URLSearchParams();
  if (query) baseParams.set('query', query);
  if (subcat) baseParams.set('categories', subcat);
  else if (cat) baseParams.set('categories', cat);
  baseParams.set('limit', limit);
  baseParams.set('type', 'search');

  if (resultsTable) resultsTable.style.display = 'none';
  if (paginationBar) paginationBar.style.display = 'none';
  if (emptyStateEl) emptyStateEl.style.display = 'none';
  if (progressContainer) progressContainer.style.display = 'block';
  if (progressBar) progressBar.style.width = '0%';
  if (progressLabel) progressLabel.textContent = `${t('searching-on')} ${state.searchSelectedIds.size} ${t('trackers-label')}...`;
  if (btnCompare) {
    btnCompare.disabled = true;
    btnCompare.innerHTML = `<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg><span id="btn-run-text">${t('searching-btn')}</span>`;
  }

  try {
    const selectedIndexers = state.allIndexers.filter(i => state.searchSelectedIds.has(String(i.id)));
    let done = 0;
    const total = selectedIndexers.length;
    state.multiSearchResults = [];

    const promises = selectedIndexers.map(async (idx) => {
      try {
        const params = new URLSearchParams(baseParams);
        if (!idx.isManual) params.set('indexerIds', idx.id);
        const results = await performSearch(idx, params.toString(), query, (subcat || cat), limit);
        done++;
        if (progressBar) progressBar.style.width = Math.round((done / total) * 100) + '%';
        log(`Indexeur ${idx.name} : ${results.length} résultats obtenus`, 'info');
        return results.map(r => ({ ...r, sourceTracker: idx.name }));
      } catch (err) {
        done++;
        if (progressBar) progressBar.style.width = Math.round((done / total) * 100) + '%';
        log(`Erreur avec l'indexeur ${idx.name} : ${err.message}`, 'error');
        return [];
      }
    });

    const allResults = await Promise.allSettled(promises);
    allResults.forEach(res => { if (res.status === 'fulfilled') state.multiSearchResults.push(...res.value); });

    if (query) {
      const filterType = document.getElementById('filter-search-strict')?.value || 'strict';
      if (filterType !== 'raw') {
        const normQ = normalizeString(query);
        state.multiSearchResults = state.multiSearchResults.filter(r => normalizeString(r.title || '').includes(normQ));
      } else if (window.lastTorrentsSearchSize) {
        state.multiSearchResults = state.multiSearchResults.filter(r => {
          if (!r.size) return true;
          const ratio = r.size / window.lastTorrentsSearchSize;
          return ratio > 0.85 && ratio < 1.15;
        });
      }
    }

    log(`Recherche globale terminée : ${state.multiSearchResults.length} résultats pertinents extraits.`, 'ok');

    saveHistory({
      query, cat: cat ? (subcat || cat) : '', mode: 'search',
      count: state.multiSearchResults.length,
      date: new Date().toLocaleDateString(state.currentLang === 'fr' ? 'fr-FR' : 'en-US') + ' ' +
            new Date().toLocaleTimeString(state.currentLang === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    });

    state.multiSearchResults.sort((a, b) => (b.seeders || 0) - (a.seeders || 0));

    const filterEl = document.getElementById('results-indexer-filter');
    if (filterEl) {
      filterEl.innerHTML = '<option value="">Tous les indexeurs</option>';
      selectedIndexers.forEach(idx => {
        filterEl.innerHTML += `<option value="${idx.name}">${idx.name}</option>`;
      });
    }

    state.currentPage = 0;
    state.sortCol = 'seeders';
    state.sortDir = 'desc';

    setTimeout(() => { if (progressContainer) progressContainer.style.display = 'none'; }, 2000);
    if (cb.renderResults) cb.renderResults();

  } catch (err) {
    log('Erreur fatale de recherche', 'error');
    console.error(err);
    if (progressContainer) progressContainer.style.display = 'none';
  } finally {
    if (btnCompare) {
      btnCompare.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span id="btn-run-text">${t('btn-run-search')}</span>`;
      btnCompare.disabled = false;
    }
  }
}

export function handleMainAction() {
  if (state.appMode === 'compare') runComparison();
  else runMultiSearch();
}

export function compareResults(matchMode) {
  state.resultsT1.forEach(r => r._source = 't1');
  state.resultsT2.forEach(r => r._source = 't2');
  state.commonResults   = [];
  state.uniqueT1Results = [];
  state.uniqueT2Results = [];

  if (matchMode === 'fuzzy') {
    const NAME_THRESHOLD      = 0.6;
    const NAME_SIZE_THRESHOLD = 0.35;
    const SIZE_TOLERANCE      = 0.02;

    const t2Pool = state.resultsT2.map(r => ({ release: r, tokens: tokenSet(r.title), matched: false }));
    let matchedByName = 0, matchedBySize = 0;

    state.resultsT1.forEach(r1 => {
      const tokensA = tokenSet(r1.title);
      let bestScore = -1, bestEntry = null, bestMethod = null;
      t2Pool.forEach(entry => {
        if (entry.matched) return;
        const nameSim = jaccard(tokensA, entry.tokens);
        if (nameSim >= NAME_THRESHOLD && nameSim > bestScore) {
          bestScore = nameSim; bestEntry = entry; bestMethod = 'nom';
        } else if (nameSim >= NAME_SIZE_THRESHOLD && r1.size && entry.release.size) {
          const larger = Math.max(r1.size, entry.release.size);
          const diff = Math.abs(r1.size - entry.release.size) / larger;
          if (diff <= SIZE_TOLERANCE && nameSim > bestScore) {
            bestScore = nameSim; bestEntry = entry; bestMethod = 'nom+taille';
          }
        }
      });
      if (bestEntry) {
        state.commonResults.push({ t1: r1, t2: bestEntry.release, score: bestScore, method: bestMethod });
        bestEntry.matched = true;
        if (bestMethod === 'nom') matchedByName++; else matchedBySize++;
      } else {
        state.uniqueT1Results.push(r1);
      }
    });

    t2Pool.forEach(entry => { if (!entry.matched) state.uniqueT2Results.push(entry.release); });
    log(`Mode fuzzy — ${state.commonResults.length} paires (${matchedByName} par nom, ${matchedBySize} par nom+taille)`, 'info');

  } else {
    function getKey(release) { return normalizeTitle(release.title); }
    const t1Keys = new Map();
    state.resultsT1.forEach(r => { const k = getKey(r); if (!t1Keys.has(k)) t1Keys.set(k, r); });
    const t2Keys = new Map();
    state.resultsT2.forEach(r => { const k = getKey(r); if (!t2Keys.has(k)) t2Keys.set(k, r); });
    t1Keys.forEach((release, key) => {
      if (t2Keys.has(key)) state.commonResults.push({ t1: release, t2: t2Keys.get(key) });
      else state.uniqueT1Results.push(release);
    });
    t2Keys.forEach((release, key) => { if (!t1Keys.has(key)) state.uniqueT2Results.push(release); });
    log(`Clés uniques: T1=${t1Keys.size}, T2=${t2Keys.size}`, 'info');
  }
}
