import { state } from './state.js';
import { t } from './i18n.js';
import { escapeHtml, formatSize, formatAge, getCategoryName, getTrackerUrl, stringToColorStyle, normalizeString, log } from './utils.js';
import { PAGE_SIZE } from './constants.js';
import { persistData } from './persist.js';
import { indexerName, getIndexerName } from './api.js';

export function isInWatchlist(release) {
  const key = String(release.guid || release.title);
  return state.watchlist.some(w => String(w.guid) === key);
}

export function toggleWatchlist(release) {
  const key = String(release.guid || release.title);
  const idx = state.watchlist.findIndex(w => String(w.guid) === key);
  if (idx >= 0) {
    state.watchlist.splice(idx, 1);
  } else {
    state.watchlist.push({
      ...release,
      guid: key,
      savedAt: new Date().toLocaleDateString(state.currentLang === 'fr' ? 'fr-FR' : 'en-US')
    });
  }
  state.watchlist = state.watchlist.slice(0, 200);
  localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
  persistData('bookmark', state.watchlist);
  renderWatchlist();
}

export function updateSortIcons() {
  document.querySelectorAll('.results-table thead th').forEach(h => {
    h.classList.remove('sorted-asc', 'sorted-desc');
    const icon = h.querySelector('.sort-icon');
    if (icon) { icon.textContent = '↕'; icon.className = 'sort-icon'; }
  });
  if (state.sortPrimary.col) {
    const th = document.querySelector(`.results-table thead th[data-sort="${state.sortPrimary.col}"]`);
    if (th) {
      th.classList.add(state.sortPrimary.dir === 'asc' ? 'sorted-asc' : 'sorted-desc');
      const icon = th.querySelector('.sort-icon');
      if (icon) { icon.textContent = state.sortPrimary.dir === 'asc' ? '↑' : '↓'; icon.classList.add('sort-primary'); }
    }
  }
  if (state.sortSecondary.col) {
    const th = document.querySelector(`.results-table thead th[data-sort="${state.sortSecondary.col}"]`);
    if (th) {
      const icon = th.querySelector('.sort-icon');
      if (icon) { icon.textContent = state.sortSecondary.dir === 'asc' ? '↑²' : '↓²'; icon.classList.add('sort-secondary'); }
    }
  }
}

export function getFilteredSorted() {
  const resultsSearch = document.getElementById('results-search');
  const query = (resultsSearch?.value || '').toLowerCase().trim();
  let data;

  if (state.currentTab === 'search') {
    data = state.multiSearchResults;
    const pageInfo = document.getElementById('page-info');
    if (pageInfo) pageInfo.textContent = `${t('page-mode-search')} (${data.length})`;

    const filterIndexer = document.getElementById('results-indexer-filter')?.value;
    if (filterIndexer) data = data.filter(r => r.sourceTracker === filterIndexer);

    const filterType = document.getElementById('search-filter-type')?.value;
    if (filterType && filterType !== 'all') data = data.filter(r => (r.protocol || 'torznab').toLowerCase() === filterType);

    if (query) {
      const normQ = normalizeString(query);
      data = data.filter(r => normalizeString(r.title || '').includes(normQ));
    }
    if (state.sortCol) {
      data = [...data].sort((a, b) => {
        let va, vb;
        switch (state.sortCol) {
          case 'title':    va = a.title || '';      vb = b.title || '';      break;
          case 'category': va = getCategoryName(a); vb = getCategoryName(b); break;
          case 'size':     va = a.size     || 0;    vb = b.size     || 0;    break;
          case 'seeders':  va = a.seeders  || 0;    vb = b.seeders  || 0;    break;
          case 'leechers': va = a.leechers || 0;    vb = b.leechers || 0;    break;
          case 'age':      va = a.publishDate || ''; vb = b.publishDate || ''; break;
          default: va = ''; vb = '';
        }
        if (typeof va === 'string') return state.sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        return state.sortDir === 'asc' ? va - vb : vb - va;
      });
    }
  } else if (state.currentTab === 'common') {
    data = state.commonResults;
    if (query) {
      const normQ = normalizeString(query);
      data = data.filter(p =>
        normalizeString(p.t1.title || '').includes(normQ) ||
        normalizeString(p.t2.title || '').includes(normQ)
      );
    }
    if (state.sortCol) {
      data = [...data].sort((a, b) => {
        function getVal(item, col) {
          switch (col) {
            case 'title':    return item.t1.title || '';
            case 'category': return getCategoryName(item.t1);
            case 'size':     return item.t1.size || 0;
            case 'seeders':  return item.t1.seeders || 0;
            case 'leechers': return item.t1.leechers || 0;
            case 'age':      return item.t1.publishDate || '';
            default: return '';
          }
        }
        const va1 = getVal(a, state.sortCol), vb1 = getVal(b, state.sortCol);
        let cmp1 = typeof va1 === 'string' ? va1.localeCompare(vb1) : va1 - vb1;
        if (state.sortDir === 'desc') cmp1 = -cmp1;
        if (cmp1 !== 0) return cmp1;
        if (state.sortSecondary.col) {
          const va2 = getVal(a, state.sortSecondary.col), vb2 = getVal(b, state.sortSecondary.col);
          let cmp2 = typeof va2 === 'string' ? va2.localeCompare(vb2) : va2 - vb2;
          return state.sortSecondary.dir === 'desc' ? -cmp2 : cmp2;
        }
        return 0;
      });
    }
  } else {
    data = state.currentTab === 'unique-t2' ? state.uniqueT2Results : state.uniqueT1Results;
    if (query) {
      const normQ = normalizeString(query);
      data = data.filter(r => normalizeString(r.title || '').includes(normQ));
    }
    if (state.sortCol) {
      data = [...data].sort((a, b) => {
        function getVal(item, col) {
          switch (col) {
            case 'title':    return item.title || '';
            case 'category': return getCategoryName(item);
            case 'size':     return item.size || 0;
            case 'seeders':  return item.seeders || 0;
            case 'leechers': return item.leechers || 0;
            case 'age':      return item.publishDate || '';
            default: return '';
          }
        }
        const va1 = getVal(a, state.sortCol), vb1 = getVal(b, state.sortCol);
        let cmp1 = typeof va1 === 'string' ? va1.localeCompare(vb1) : va1 - vb1;
        if (state.sortDir === 'desc') cmp1 = -cmp1;
        if (cmp1 !== 0) return cmp1;
        if (state.sortSecondary.col) {
          const va2 = getVal(a, state.sortSecondary.col), vb2 = getVal(b, state.sortSecondary.col);
          let cmp2 = typeof va2 === 'string' ? va2.localeCompare(vb2) : va2 - vb2;
          return state.sortSecondary.dir === 'desc' ? -cmp2 : cmp2;
        }
        return 0;
      });
    }
  }
  return data;
}

export function renderResults() {
  const resultsBody    = document.getElementById('results-body');
  const paginationBar  = document.getElementById('pagination-bar');
  const emptyState     = document.getElementById('empty-state');
  const resultsTable   = document.getElementById('results-table');
  const btnPagePrev    = document.getElementById('btn-page-prev');
  const btnPageNext    = document.getElementById('btn-page-next');
  const pageInfo       = document.getElementById('page-info');
  if (!resultsBody) return;

  const data = getFilteredSorted();
  const hasAnyResults = state.resultsT1.length > 0 || state.resultsT2.length > 0 || state.multiSearchResults.length > 0;

  resultsBody.innerHTML = '';
  if (paginationBar) paginationBar.style.display = 'none';

  if (data.length === 0 && hasAnyResults) {
    if (emptyState) emptyState.style.display = 'none';
    if (resultsTable) resultsTable.style.display = 'table';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">${t('no-filter-result')}</td>`;
    resultsBody.appendChild(tr);
    return;
  }

  if (data.length === 0) {
    if (emptyState) emptyState.style.display = 'flex';
    if (resultsTable) resultsTable.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (resultsTable) resultsTable.style.display = 'table';

  const t1Name    = indexerName(document.getElementById('select-t1')?.value, 'T1');
  const t2Name    = indexerName(document.getElementById('select-t2')?.value, 'T2');
  const pageStart = state.currentPage * PAGE_SIZE;
  const pageEnd   = Math.min(pageStart + PAGE_SIZE, data.length);
  const pageData  = data.slice(pageStart, pageEnd);

  const frag = document.createDocumentFragment();

  if (state.currentTab === 'search') {
    pageData.forEach((release, idx) => frag.appendChild(makeRow(release, release.sourceTracker || 'Inconnu', 'dynamic', idx)));
  } else if (state.currentTab === 'common') {
    pageData.forEach((pair, idx) => {
      frag.appendChild(makeCommonRow(pair.t1, t1Name, 't1', idx, pair));
      frag.appendChild(makeCommonRow(pair.t2, t2Name, 't2', idx, pair));
    });
  } else {
    pageData.forEach((release, idx) => {
      const isT1 = release._source === 't1';
      frag.appendChild(makeRow(release, isT1 ? t1Name : t2Name, isT1 ? 'source-t1' : 'source-t2', idx));
    });
  }

  resultsBody.appendChild(frag);

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  if (totalPages > 1 && paginationBar) {
    paginationBar.style.display = 'flex';
    if (pageInfo) pageInfo.textContent =
      `${t('page-label')} ${state.currentPage + 1} ${t('page-sep')} ${totalPages} — ${pageStart + 1}–${pageEnd} ${t('page-of')} ${data.length}`;
    if (btnPagePrev) btnPagePrev.disabled = state.currentPage === 0;
    if (btnPageNext) btnPageNext.disabled = state.currentPage >= totalPages - 1;
  }
}

export function makeRow(release, sourceName, sourceClass, idx) {
  const tr = document.createElement('tr');
  tr.style.animationDelay = `${Math.min(idx * 0.015, 0.4)}s`;
  const seeders   = release.seeders || 0;
  const leechers  = release.leechers ?? release.peers ?? 0;
  const seedClass = seeders >= 10 ? 'high' : seeders >= 3 ? 'mid' : 'low';
  const trackerUrl  = getTrackerUrl(release);
  const downloadUrl = release.downloadUrl || '#';
  const magnetUrl   = release.magnetUrl || '#';

  let finalSourceName = sourceName;
  let inlineStyle = stringToColorStyle(sourceName);
  if (release.indexerId) {
    const custom = state.indexerCustomizations[release.indexerId] || {};
    if (custom.name) finalSourceName = custom.name;
    if (custom.color) inlineStyle = `background: ${escapeHtml(custom.color)}; color: #fff; border:none;`;
  }

  const favActive = isInWatchlist(release);
  const starColor = favActive ? 'currentColor' : 'none';
  const starClass = favActive ? 'fav-btn active' : 'fav-btn';

  tr.innerHTML = `
    <td><span class="source-badge" style="${inlineStyle}" title="${escapeHtml(finalSourceName)}">${escapeHtml(finalSourceName)}</span></td>
    <td><span class="torrent-title" title="${escapeHtml(release.title || '')}">${escapeHtml(release.title || 'Sans titre')}</span></td>
    <td><span class="torrent-cat">${escapeHtml(getCategoryName(release))}</span></td>
    <td><span class="torrent-size">${formatSize(release.size)}</span></td>
    <td><span class="seeders-badge ${seedClass}">${seeders}</span></td>
    <td><span class="leechers-badge">${leechers}</span></td>
    <td><span class="torrent-age">${formatAge(release.publishDate)}</span></td>
    <td>${trackerUrl !== '#'
      ? `<a href="${escapeHtml(trackerUrl)}" target="_blank" rel="noopener" class="link-btn">${t('link-text')}</a>`
      : '–'}</td>
    <td>${downloadUrl !== '#'
      ? `<a href="${escapeHtml(downloadUrl)}" target="_blank" rel="noopener" class="link-btn link-btn-torrent" title="Télécharger le .torrent">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
           .torrent</a>`
      : magnetUrl !== '#'
        ? `<a href="${escapeHtml(magnetUrl)}" target="_blank" rel="noopener" class="link-btn link-btn-magnet" title="Ouvrir le lien Magnet">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 15A6 6 0 1 0 18 15V5h-4v10a2 2 0 0 1-4 0V5H6v10z"/></svg>
             Magnet</a>`
        : '–'}</td>
    <td><button class="btn-icon btn-icon-sm ${starClass}"><svg viewBox="0 0 24 24" fill="${starColor}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button></td>
  `;

  const favBtn = tr.querySelector('.fav-btn');
  if (favBtn) {
    favBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      toggleWatchlist(release);
      renderResults();
    });
  }
  return tr;
}

export function makeCommonRow(release, sourceName, side, groupIdx, pair) {
  const tr = document.createElement('tr');
  tr.className = `common-row common-${side}` + (groupIdx % 2 === 0 ? ' common-even' : ' common-odd');
  const seeders   = release.seeders || 0;
  const seedClass = seeders >= 10 ? 'high' : seeders >= 3 ? 'mid' : 'low';

  let finalSourceName = sourceName;
  let inlineStyle = stringToColorStyle(sourceName);
  const idxId = release.indexerId || pair?.indexerId;
  if (idxId) {
    const custom = state.indexerCustomizations[idxId] || {};
    if (custom.name) finalSourceName = custom.name;
    const bg = custom.color || stringToColorStyle(finalSourceName).match(/background:\s*([^;]+)/)?.[1];
    const tc = custom.textColor || '#ffffff';
    if (custom.color || custom.textColor) inlineStyle = `background: ${escapeHtml(bg)}; color: ${escapeHtml(tc)}; border:none;`;
  }

  const trackerUrl  = getTrackerUrl(release);
  const leechers    = release.leechers ?? release.peers ?? 0;
  const downloadUrl = release.downloadUrl || '#';
  const magnetUrl   = release.magnetUrl || '#';
  const favActive = isInWatchlist(release);
  const starColor = favActive ? 'currentColor' : 'none';
  const starClass = favActive ? 'fav-btn active' : 'fav-btn';

  tr.innerHTML = `
    <td><span class="source-badge" style="${inlineStyle}" title="${escapeHtml(sourceName)}">${escapeHtml(sourceName)}</span></td>
    <td><span class="torrent-title" title="${escapeHtml(release.title || '')}">${escapeHtml(release.title || 'Sans titre')}</span></td>
    <td><span class="torrent-cat">${escapeHtml(getCategoryName(release))}</span></td>
    <td><span class="torrent-size">${formatSize(release.size)}</span></td>
    <td><span class="seeders-badge ${seedClass}">${seeders}</span></td>
    <td><span class="leechers-badge">${leechers}</span></td>
    <td><span class="torrent-age">${formatAge(release.publishDate)}</span></td>
    <td>${trackerUrl !== '#'
      ? `<a href="${escapeHtml(trackerUrl)}" target="_blank" rel="noopener" class="link-btn">${t('link-text')}</a>`
      : '–'}</td>
    <td>${downloadUrl !== '#'
      ? `<a href="${escapeHtml(downloadUrl)}" target="_blank" rel="noopener" class="link-btn link-btn-torrent" title="Télécharger le .torrent">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
           .torrent</a>`
      : magnetUrl !== '#'
        ? `<a href="${escapeHtml(magnetUrl)}" target="_blank" rel="noopener" class="link-btn link-btn-magnet" title="Ouvrir le lien Magnet">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 15A6 6 0 1 0 18 15V5h-4v10a2 2 0 0 1-4 0V5H6v10z"/></svg>
             Magnet</a>`
        : '–'}</td>
    <td><button class="btn-icon btn-icon-sm ${starClass}" data-fav-title="${escapeHtml(release.title || '')}"><svg viewBox="0 0 24 24" fill="${starColor}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button></td>
  `;

  const favBtn = tr.querySelector('.fav-btn');
  if (favBtn) {
    favBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      toggleWatchlist(release);
      renderResults();
    });
  }
  return tr;
}

export function renderWatchlist() {
  const tbody      = document.getElementById('watchlist-body');
  const table      = document.getElementById('watchlist-table');
  const emptyState = document.getElementById('watchlist-empty-state');
  const filterEl   = document.getElementById('watchlist-indexer-filter');
  if (!tbody || !table || !emptyState) return;

  if (state.watchlist.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'flex';
    emptyState.innerHTML = t('watchlist-empty');
    if (filterEl) filterEl.innerHTML = '<option value="">Tous les indexeurs</option>';
    return;
  }

  table.style.display = 'table';
  emptyState.style.display = 'none';
  tbody.innerHTML = '';

  if (filterEl) {
    const currentVal = filterEl.value;
    const uniqueSources = new Set(state.watchlist.map(r => r.sourceTracker || r.source || 'Inconnu'));
    filterEl.innerHTML = '<option value="">Tous les indexeurs</option>';
    uniqueSources.forEach(src => {
      filterEl.innerHTML += `<option value="${escapeHtml(src)}" ${src === currentVal ? 'selected' : ''}>${escapeHtml(src)}</option>`;
    });
  }

  const filterVal  = filterEl?.value || '';
  const textFilter = document.getElementById('watchlist-search')?.value.toLowerCase() || '';

  const dataToRender = state.watchlist.filter(r => {
    const src = r.sourceName || r.indexer || getIndexerName(r._source) || 'Inconnu';
    if (filterVal && src !== filterVal) return false;
    if (textFilter && !(r.title || '').toLowerCase().includes(textFilter)) return false;
    return true;
  });

  if (dataToRender.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'flex';
    emptyState.innerHTML = 'Aucun résultat ne correspond à la recherche.';
    return;
  }

  const frag = document.createDocumentFragment();
  dataToRender.forEach((item, idx) => {
    const srcName = item.sourceName || item.indexer || getIndexerName(item._source) || 'Inconnu';
    frag.appendChild(makeRow(item, srcName, 'dynamic', idx));
  });
  tbody.appendChild(frag);
}
