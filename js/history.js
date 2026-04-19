import { state } from './state.js';
import { t } from './i18n.js';
import { escapeHtml, log } from './utils.js';
import { persistData } from './persist.js';
import { cb } from './callbacks.js';

export function saveHistory(entry) {
  state.searchHistory.unshift(entry);
  if (state.searchHistory.length > 50) state.searchHistory = state.searchHistory.slice(0, 50);
  localStorage.setItem('search_history', JSON.stringify(state.searchHistory));
  persistData('history', state.searchHistory);
}

export function renderHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;

  let filteredHistory = state.searchHistory;
  const currentFilter = state._historyFilter || 'all';
  if (currentFilter !== 'all') {
    filteredHistory = state.searchHistory.filter(h => h.mode === currentFilter);
  }

  if (filteredHistory.length === 0) {
    list.innerHTML = `<div class="empty-panel">${t('history-empty')}</div>`;
    return;
  }

  const textFilter = document.getElementById('history-search')?.value.toLowerCase() || '';
  if (textFilter) {
    filteredHistory = filteredHistory.filter(h => (h.query || '').toLowerCase().includes(textFilter));
  }

  list.innerHTML = '';
  if (filteredHistory.length === 0) {
    list.innerHTML = `<div class="empty-panel">Aucun résultat ne correspond à la recherche.</div>`;
    return;
  }

  filteredHistory.forEach((entry, idx) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    const isCompare = entry.mode === 'compare';
    const modeStr = isCompare ? t('history-mode-compare') : t('history-mode-search');
    let indexersStr = '';
    if (isCompare && entry.t1 && entry.t2) {
      indexersStr = `· ${escapeHtml(entry.t1)} vs ${escapeHtml(entry.t2)}`;
    }
    const catLabel = entry.cat ? `· ${escapeHtml(entry.cat)}` : '';
    const modeColorBg = isCompare ? 'var(--accent-t2-glow)' : 'var(--accent-primary)';
    const modeColorText = isCompare ? 'var(--accent-t2)' : '#111';
    const modeBadge = `<span class="source-badge" style="background:${modeColorBg}; color:${modeColorText}; width:94px; padding:2px 0; text-align:center; flex-shrink:0; border-radius:4px;">${modeStr}</span>`;

    item.innerHTML = `
      <div class="history-item-info">
        <div class="history-item-query" style="display:flex; align-items:center; gap:10px;">
          ${modeBadge}
          <span>${escapeHtml(entry.query || 'Toutes catégories')}</span>
        </div>
        <div class="history-item-meta">
          ${entry.date} · <span class="seeders-badge mid" style="margin-right:2px">${entry.count} résultats</span> ${catLabel} ${indexersStr}
        </div>
      </div>
      <div class="history-item-actions">
        <button class="btn-icon btn-icon-sm" data-idx="${idx}" data-action="rerun" title="${t('history-rerun')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button class="btn-icon btn-icon-sm btn-icon-danger" data-idx="${idx}" data-action="delete" title="${t('history-delete')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll('[data-action="rerun"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const entry = state.searchHistory[+btn.dataset.idx];
      if (!entry) return;
      const modeBtn = document.querySelector(`.mode-btn[data-mode="${entry.mode}"]`);
      if (modeBtn) modeBtn.click();
      const filterQuery = document.getElementById('filter-query');
      const filterCat   = document.getElementById('filter-cat');
      const filterLimit = document.getElementById('filter-limit');
      if (filterQuery) filterQuery.value = entry.query || '';
      if (entry.cat && filterCat) { filterCat.value = entry.cat; filterCat.dispatchEvent(new Event('change')); }
      if (entry.limit && filterLimit) filterLimit.value = entry.limit;
      if (entry.mode === 'compare' && entry.t1Id && entry.t2Id) {
        setTimeout(() => {
          const s1 = document.getElementById('select-t1');
          const s2 = document.getElementById('select-t2');
          if (s1) s1.value = String(entry.t1Id);
          if (s2) s2.value = String(entry.t2Id);
          if (cb.onIndexerChange) cb.onIndexerChange();
        }, 50);
      }
      setTimeout(() => { if (cb.handleMainAction) cb.handleMainAction(); }, 100);
    });
  });

  list.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.searchHistory.splice(+btn.dataset.idx, 1);
      localStorage.setItem('search_history', JSON.stringify(state.searchHistory));
      persistData('history', state.searchHistory);
      renderHistory();
    });
  });
}
