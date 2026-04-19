import { state } from './state.js';
import { t } from './i18n.js';
import { escapeHtml, formatSize, formatAge, stringToColorStyle, log } from './utils.js';
import { TORRENT_STATE_MAP } from './constants.js';
import { saveTorrentClientSettings } from './persist.js';
import { cb } from './callbacks.js';

export async function torrentProxy(targetUrl, method, headers, body, contentType) {
  const res = await fetch('/api/torrent-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: targetUrl, method: method || 'GET', headers: headers || {}, body: body || '', contentType: contentType || 'application/json' })
  });
  if (!res.ok) throw new Error(`Proxy error: HTTP ${res.status}`);
  return await res.json();
}

export async function qbtLogin(baseClientUrl, username, password) {
  const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  const result = await torrentProxy(baseClientUrl + '/api/v2/auth/login', 'POST',
    { 'Content-Type': 'application/x-www-form-urlencoded' }, body, 'application/x-www-form-urlencoded');
  if (result.status !== 200) throw new Error(`qBittorrent login failed: HTTP ${result.status}`);
  if (result.body === 'Fails.') throw new Error('qBittorrent: identifiants incorrects');
  const cookies = JSON.parse(result.headers?.['x-proxy-set-cookie'] || '[]');
  const sidCookie = cookies.find(c => c.startsWith('SID='));
  if (sidCookie) state.qbtSessionCookie = sidCookie.split(';')[0];
}

export async function qbtGetTorrents(baseClientUrl) {
  const result = await torrentProxy(baseClientUrl + '/api/v2/torrents/info', 'GET',
    { 'Cookie': state.qbtSessionCookie }, '', 'application/json');
  if (result.status === 403) {
    await qbtLogin(baseClientUrl, state.torrentClientSettings.username, state.torrentClientSettings.password);
    return qbtGetTorrents(baseClientUrl);
  }
  const torrents = JSON.parse(result.body);
  return torrents.map(to => ({
    name: to.name, size: to.size, status: to.state,
    progress: Math.round(to.progress * 100),
    seeds: to.num_seeds, peers: to.num_leechs,
    category: to.category || '—',
    tags: to.tags || '',
    ratio: to.ratio || 0,
    tracker: to.tracker || '',
    uploaded: to.uploaded || 0,
    added: to.added_on ? new Date(to.added_on * 1000).toISOString() : null
  }));
}

async function delugeGetTorrents(baseClientUrl, password) {
  const loginRes = await torrentProxy(baseClientUrl + '/json', 'POST', {},
    JSON.stringify({ method: 'auth.login', params: [password], id: 1 }));
  const loginData = JSON.parse(loginRes.body);
  if (!loginData.result) throw new Error('Deluge: authentification échouée');
  const torrentRes = await torrentProxy(baseClientUrl + '/json', 'POST', {},
    JSON.stringify({ method: 'core.get_torrents_status', params: [{}, ['name','total_size','state','progress','num_seeds','num_peers','label','time_added']], id: 2 }));
  const torrentData = JSON.parse(torrentRes.body);
  const result = torrentData.result || {};
  return Object.entries(result).map(([, to]) => ({
    name: to.name, size: to.total_size, status: to.state,
    progress: Math.round(to.progress),
    seeds: to.num_seeds, peers: to.num_peers,
    category: to.label || '—',
    added: to.time_added ? new Date(to.time_added * 1000).toISOString() : null
  }));
}

async function transmissionGetTorrents(baseClientUrl, username, password) {
  const rpcUrl = baseClientUrl.replace(/\/$/, '') + '/transmission/rpc';
  const auth   = btoa(username + ':' + password);
  if (!state.transmissionSessionId) {
    const initRes = await torrentProxy(rpcUrl, 'POST', { 'Authorization': 'Basic ' + auth }, '{}');
    if (initRes.status === 409) {
      state.transmissionSessionId = initRes.headers?.['x-transmission-session-id'] || '';
    } else if (initRes.status !== 200) {
      throw new Error(`Transmission: HTTP ${initRes.status}`);
    }
  }
  const fields = ['name','totalSize','status','percentDone','peersGettingFromUs','peersSendingToUs','downloadDir','addedDate'];
  const reqBody = JSON.stringify({ method: 'torrent-get', arguments: { fields } });
  const res = await torrentProxy(rpcUrl, 'POST', {
    'Authorization': 'Basic ' + auth,
    'X-Transmission-Session-Id': state.transmissionSessionId
  }, reqBody);
  if (res.status === 409) {
    state.transmissionSessionId = res.headers?.['x-transmission-session-id'] || '';
    return transmissionGetTorrents(baseClientUrl, username, password);
  }
  const data = JSON.parse(res.body);
  const statLabels = ['Stopped','Check queue','Checking','DL queue','Downloading','Seed queue','Seeding'];
  return (data?.arguments?.torrents || []).map(to => ({
    name: to.name, size: to.totalSize,
    status: statLabels[to.status] || 'Unknown',
    progress: Math.round(to.percentDone * 100),
    seeds: to.peersGettingFromUs || 0, peers: to.peersSendingToUs || 0,
    category: to.downloadDir || '—',
    added: to.addedDate ? new Date(to.addedDate * 1000).toISOString() : null
  }));
}

export async function fetchTorrents() {
  const { type, url, username, password } = state.torrentClientSettings;
  const base = (url || '').replace(/\/$/, '');
  if (!type || type === 'none' || !base) return [];
  if (type === 'qbittorrent') {
    if (!state.qbtSessionCookie) await qbtLogin(base, username, password);
    return await qbtGetTorrents(base);
  }
  if (type === 'deluge') return await delugeGetTorrents(base, password);
  if (type === 'transmission') return await transmissionGetTorrents(base, username, password);
  return [];
}

export function torrentStateLabel(rawState) {
  if (!rawState) return { label: '—', cls: 'low' };
  const map = TORRENT_STATE_MAP[rawState] || TORRENT_STATE_MAP[rawState.replace(/([A-Z])/g, ' $1').trim()];
  if (map) return { label: map[state.currentLang] || map.fr, cls: map.cls };
  const lower = rawState.toLowerCase();
  const cls = lower.includes('seed') || lower.includes('upload') ? 'high'
    : lower.includes('down') || lower.includes('check') ? 'mid' : 'low';
  return { label: rawState, cls };
}

export function guessIndexerFromTracker(trackerUrl, category, tags) {
  if (!trackerUrl && !category && !tags) return null;
  const urlLower  = (trackerUrl || '').toLowerCase();
  const urlSearch = urlLower.replace(/[^a-z0-9]/g, '');
  const catLower  = (category || '').toLowerCase();
  const tagsLower = String(tags || '').toLowerCase();
  for (const idx of state.allIndexers) {
    const custom  = state.indexerCustomizations[idx.id] || {};
    const rawName = (custom.name || idx.name || '').toLowerCase();
    const dbName  = rawName.replace(/\s*\(.*?\)\s*/g, '');
    const dbSearch = dbName.replace(/[^a-z0-9]/g, '');
    if (dbName && dbSearch.length > 2 && (urlSearch.includes(dbSearch) || catLower.includes(dbName) || tagsLower.includes(dbName))) return idx;
  }
  if (trackerUrl) {
    try { return { id: 'custom_host', name: new URL(trackerUrl).hostname }; } catch (e) { return null; }
  }
  return null;
}

export function makeTorrentRow(torrent) {
  const progress  = torrent.progress || 0;
  const { label: statusLabel, cls: statusCls } = torrentStateLabel(torrent.rawStatus || torrent.status);
  const clientType = (state.torrentClientSettings.type || 'client').toUpperCase();
  const seeders  = torrent.seeds ?? torrent.num_seeds ?? torrent.seeders ?? 0;
  const leechers = torrent.peers ?? torrent.num_leechs ?? torrent.leechers ?? 0;
  const seedCls  = seeders >= 10 ? 'high' : seeders >= 3 ? 'mid' : 'low';
  const ratio    = torrent.ratio !== undefined ? parseFloat(torrent.ratio).toFixed(2) : '0.00';
  const tagsStr  = torrent.tags ? String(torrent.tags).split(',').map(tg => tg.trim()).join(', ') : '—';

  const trackerUrl = torrent.tracker || '';
  const guessedIdx = guessIndexerFromTracker(trackerUrl, torrent.category, torrent.tags);
  let dsName = clientType, bColor = '', tColor = '#ffffff', custom = {};
  if (guessedIdx) {
    custom = state.indexerCustomizations[guessedIdx.id] || {};
    dsName = custom.name || guessedIdx.name;
    bColor = custom.color || '';
    tColor = custom.textColor || '#ffffff';
  }
  const bg = bColor || stringToColorStyle(dsName).match(/background:\s*([^;]+)/)?.[1];
  const inlineStyle = (bColor || custom.textColor) ? `background: ${escapeHtml(bg)}; color: ${escapeHtml(tColor)}; border:none;` : stringToColorStyle(dsName);

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><span class="source-badge" style="${inlineStyle}" title="${escapeHtml(dsName)}">${escapeHtml(dsName)}</span></td>
    <td><span class="torrent-title" title="${escapeHtml(torrent.name)}">${escapeHtml(torrent.name)}</span></td>
    <td><span class="seeders-badge ${statusCls}">${escapeHtml(statusLabel)}</span></td>
    <td>
      <div class="torrent-progress-wrap">
        <div class="torrent-progress-bar" style="width:${progress}%"></div>
        <span class="torrent-progress-label">${progress}%</span>
      </div>
    </td>
    <td><span class="torrent-size">${formatSize(torrent.size)}</span></td>
    <td><span class="torrent-uploaded" style="color:var(--accent-success);">${formatSize(torrent.uploaded)}</span></td>
    <td><span class="ratio-badge" style="font-weight:bold;">${ratio}</span></td>
    <td><span class="torrent-cat">${escapeHtml(torrent.category || '—')}</span></td>
    <td><span class="torrent-cat" style="max-width:150px; display:inline-block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(tagsStr)}">${escapeHtml(tagsStr)}</span></td>
    <td><span class="torrent-age">${torrent.added ? formatAge(torrent.added) : '—'}</span></td>
    <td><button class="btn-icon btn-icon-sm btn-search-torrent" title="Chercher ce torrent"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></button></td>
  `;

  const btnSearch = tr.querySelector('.btn-search-torrent');
  if (btnSearch) {
    btnSearch.addEventListener('click', () => {
      const searchBtn = document.querySelector('.mode-btn[data-mode="search"]');
      if (searchBtn) searchBtn.click();
      setTimeout(() => {
        const filterQuery = document.getElementById('filter-query');
        if (filterQuery) {
          window.lastTorrentsSearchSize = torrent.size;
          let q = torrent.name || '';
          q = q.replace(/\./g, ' ').replace(/_/g, ' ');
          q = q.replace(/\b(1080p|720p|4k|hdlight|x264|x265|hevc|h264|xvid|divx|multi|vff|vfi|vfq|truefrench|french|bdrip|webrip|web-dl|hdr|10bit|dtv|hdtv|repack|proper|-tag|-notag)\b/gi, '');
          q = q.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');
          q = q.replace(/\s+/g, ' ').trim() || torrent.name;
          filterQuery.value = q;
          filterQuery.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const filterCat = document.getElementById('filter-cat');
        if (filterCat) filterCat.value = '';
        const filterSearchStrict = document.getElementById('filter-search-strict');
        if (filterSearchStrict) {
          filterSearchStrict.value = 'raw';
          filterSearchStrict.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (cb.handleMainAction) cb.handleMainAction();
      }, 50);
    });
  }
  return tr;
}

export async function renderTorrentsPanel() {
  const tbody      = document.getElementById('torrents-table-body');
  const table      = document.getElementById('torrents-table');
  const emptyEl    = document.getElementById('torrents-empty-state');
  const emptyTitle = document.getElementById('torrents-empty-title');
  const emptyDesc  = document.getElementById('torrents-empty-desc');
  const refreshBtn = document.getElementById('btn-refresh-torrents');
  const catSelect  = document.getElementById('torrents-category-filter');
  const tagsSelect = document.getElementById('torrents-tags-filter');
  if (!tbody) return;
  if (refreshBtn) refreshBtn.disabled = true;

  const { type } = state.torrentClientSettings;
  if (!type || type === 'none') {
    if (table)   table.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'flex';
    if (emptyTitle) emptyTitle.textContent = t('torrents-no-client');
    if (emptyDesc)  emptyDesc.innerHTML   = t('torrents-no-client-desc');
    if (refreshBtn) refreshBtn.disabled = false;
    return;
  }

  try {
    state.torrentList = await fetchTorrents();

    if (catSelect) {
      const currentVal = catSelect.value;
      const cats = new Set(state.torrentList.map(tl => tl.category).filter(Boolean));
      catSelect.innerHTML = '<option value="all">Toutes</option>';
      [...cats].sort().forEach(c => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = c;
        catSelect.appendChild(opt);
      });
      if (cats.has(currentVal)) catSelect.value = currentVal;
    }

    if (tagsSelect) {
      const currentVal = tagsSelect.value;
      const allTags = new Set();
      state.torrentList.forEach(tl => { if (tl.tags) String(tl.tags).split(',').forEach(x => allTags.add(x.trim())); });
      tagsSelect.innerHTML = '<option value="all">Tags (Tous)</option>';
      [...allTags].filter(Boolean).sort().forEach(c => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = c;
        tagsSelect.appendChild(opt);
      });
      if (allTags.has(currentVal)) tagsSelect.value = currentVal;
    }

    let filtered = state.torrentList;
    if (catSelect && catSelect.value !== 'all') filtered = filtered.filter(to => to.category === catSelect.value);
    if (tagsSelect && tagsSelect.value !== 'all') filtered = filtered.filter(to => to.tags && String(to.tags).includes(tagsSelect.value));
    const textFilter = (document.getElementById('torrents-search')?.value || '').toLowerCase();
    if (textFilter) filtered = filtered.filter(to => to.name.toLowerCase().includes(textFilter));

    if (state.torrentsSortCol) {
      filtered = [...filtered].sort((a, b) => {
        let va, vb;
        switch (state.torrentsSortCol) {
          case 'name':     va = a.name || ''; vb = b.name || ''; break;
          case 'size':     va = a.size || 0; vb = b.size || 0; break;
          case 'progress': va = a.progress || 0; vb = b.progress || 0; break;
          case 'ratio':    va = parseFloat(a.ratio || 0); vb = parseFloat(b.ratio || 0); break;
          case 'category': va = a.category || ''; vb = b.category || ''; break;
          case 'tags':     va = a.tags || ''; vb = b.tags || ''; break;
          case 'added':    va = a.added || 0; vb = b.added || 0; break;
          default: va = ''; vb = '';
        }
        if (typeof va === 'string') return state.torrentsSortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        return state.torrentsSortDir === 'asc' ? va - vb : vb - va;
      });
    }

    if (filtered.length === 0) {
      if (table)   table.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'flex';
      if (emptyTitle) emptyTitle.textContent = t('torrents-empty');
      if (emptyDesc)  emptyDesc.textContent = '';
      const pag = document.getElementById('torrents-pagination');
      if (pag) pag.style.display = 'none';
    } else {
      if (table)   table.style.display = 'table';
      if (emptyEl) emptyEl.style.display = 'none';

      const totalPages = Math.ceil(filtered.length / 20);
      if (!window.torrentsCurrentPage || window.torrentsCurrentPage > totalPages) window.torrentsCurrentPage = 1;
      const startIdx = (window.torrentsCurrentPage - 1) * 20;
      const pageData = filtered.slice(startIdx, startIdx + 20);

      tbody.innerHTML = '';
      const frag = document.createDocumentFragment();
      pageData.forEach(to => frag.appendChild(makeTorrentRow(to)));
      tbody.appendChild(frag);

      let pag = document.getElementById('torrents-pagination');
      if (!pag) {
        pag = document.createElement('div');
        pag.id = 'torrents-pagination';
        pag.style.cssText = 'display:flex; justify-content:center; align-items:center; gap:10px; margin-top:16px;';
        table.parentNode.insertBefore(pag, table.nextSibling);
      }
      pag.style.display = totalPages > 1 ? 'flex' : 'none';
      pag.innerHTML = `
        <button class="btn-icon" id="btn-prev-page" ${window.torrentsCurrentPage === 1 ? 'disabled' : ''}>Précédent</button>
        <span style="font-size:0.85rem; color:var(--text-secondary);">Page ${window.torrentsCurrentPage} / ${totalPages}</span>
        <button class="btn-icon" id="btn-next-page" ${window.torrentsCurrentPage === totalPages ? 'disabled' : ''}>Suivant</button>
      `;
      document.getElementById('btn-prev-page')?.addEventListener('click', () => { window.torrentsCurrentPage--; renderTorrentsPanel(); });
      document.getElementById('btn-next-page')?.addEventListener('click', () => { window.torrentsCurrentPage++; renderTorrentsPanel(); });
    }
    log(`Torrents: ${filtered.length} torrent(s) chargé(s)`, 'ok');
  } catch (err) {
    if (table)   table.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'flex';
    if (emptyTitle) emptyTitle.textContent = t('torrents-error');
    if (emptyDesc)  emptyDesc.textContent  = err.message;
    log(`Erreur torrents: ${err.message}`, 'error');
  } finally {
    if (refreshBtn) refreshBtn.disabled = false;
  }
}

export function loadTorrentSettingsIntoModal() {
  const { type, url, username, password } = state.torrentClientSettings;
  const typeEl   = document.getElementById('torrent-client-type');
  const urlEl    = document.getElementById('torrent-client-url');
  const userEl   = document.getElementById('torrent-client-user');
  const passEl   = document.getElementById('torrent-client-pass');
  const fieldsEl = document.getElementById('torrent-client-fields');
  const urlGroup = document.getElementById('torrent-url-group');
  if (typeEl) typeEl.value = type || 'none';
  if (urlEl)  urlEl.value  = url || '';
  if (userEl) userEl.value = username || '';
  if (passEl) passEl.value = password || '';
  if (fieldsEl) fieldsEl.style.display = (!type || type === 'none') ? 'none' : 'block';
  if (urlGroup) urlGroup.style.display  = (!type || type === 'none') ? 'none' : 'flex';
}

export async function openAddTorrentModal(urlOrMagnet = '') {
  const overlay = document.getElementById('modal-add-torrent-overlay');
  if (overlay) overlay.classList.add('open');
  const urlEl  = document.getElementById('add-torrent-url');
  const pathEl = document.getElementById('add-torrent-path');
  const catEl  = document.getElementById('add-torrent-cat');
  const tagEl  = document.getElementById('add-torrent-tags');
  const resEl  = document.getElementById('add-torrent-result');
  if (urlEl)  urlEl.value  = urlOrMagnet;
  if (pathEl) pathEl.value = '';
  if (catEl)  catEl.value  = '';
  if (tagEl)  tagEl.value  = '';
  if (resEl)  resEl.style.display = 'none';

  const { type, url: clientHost, username, password } = state.torrentClientSettings;
  const clientBase = (clientHost || '').replace(/\/$/, '');
  if (type === 'qbittorrent' && clientBase) {
    try {
      if (!state.qbtSessionCookie) await qbtLogin(clientBase, username, password);
      const payload = { url: clientBase, method: 'GET', headers: { 'Cookie': state.qbtSessionCookie } };
      const hdrs = { 'Content-Type': 'application/json' };

      fetch('/api/torrent-proxy', { method: 'POST', headers: hdrs, body: JSON.stringify({ ...payload, url: clientBase + '/api/v2/app/preferences' }) })
        .then(r => r.json()).then(p => { if (p && p.body) { try { const d = JSON.parse(p.body); if (d.save_path && pathEl) pathEl.value = d.save_path; } catch(e){} } }).catch(() => {});

      fetch('/api/torrent-proxy', { method: 'POST', headers: hdrs, body: JSON.stringify({ ...payload, url: clientBase + '/api/v2/torrents/categories' }) })
        .then(r => r.json()).then(p => {
          if (!catEl) return;
          try { const c = JSON.parse(p.body); if (c && typeof c === 'object') { catEl.innerHTML = '<option value="">Sélectionnez...</option>'; Object.keys(c).forEach(k => { const opt = document.createElement('option'); opt.value = k; opt.textContent = k || '(Défaut)'; catEl.appendChild(opt); }); } } catch(e) {}
        }).catch(() => {});

      fetch('/api/torrent-proxy', { method: 'POST', headers: hdrs, body: JSON.stringify({ ...payload, url: clientBase + '/api/v2/torrents/tags' }) })
        .then(r => r.json()).then(p => {
          if (!tagEl) return;
          try { const tList = JSON.parse(p.body); if (Array.isArray(tList)) { tagEl.innerHTML = ''; tList.forEach(tg => { const opt = document.createElement('option'); opt.value = tg; opt.textContent = tg; tagEl.appendChild(opt); }); } } catch(e) {}
        }).catch(() => {});
    } catch (err) {}
  }
}

export async function addTorrentDirectly(url) {
  const { type, url: clientUrl, username, password } = state.torrentClientSettings;
  if (!type || type === 'none' || !clientUrl) throw new Error('no-client');
  const base = clientUrl.replace(/\/$/, '');
  if (type === 'qbittorrent') {
    if (!state.qbtSessionCookie) await qbtLogin(base, username, password);
    const body = `urls=${encodeURIComponent(url)}`;
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': state.qbtSessionCookie };
    const result = await torrentProxy(base + '/api/v2/torrents/add', 'POST', headers, body, 'application/x-www-form-urlencoded');
    if (result.status < 200 || result.status >= 300) throw new Error('HTTP ' + result.status);
    log(`Torrent envoyé à QBT : ${url.slice(0, 80)}`, 'ok');
  } else {
    throw new Error('client-unsupported');
  }
}

export function setupTorrentEventListeners() {
  document.getElementById('torrent-client-type')?.addEventListener('change', (e) => {
    const fields  = document.getElementById('torrent-client-fields');
    const urlGroup = document.getElementById('torrent-url-group');
    if (fields)   fields.style.display   = e.target.value === 'none' ? 'none' : 'block';
    if (urlGroup) urlGroup.style.display = e.target.value === 'none' ? 'none' : 'flex';
  });

  document.getElementById('btn-eye-torrent')?.addEventListener('click', () => {
    const inp = document.getElementById('torrent-client-pass');
    if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('btn-save-torrent-settings')?.addEventListener('click', async () => {
    const btn     = document.getElementById('btn-save-torrent-settings');
    const resultEl = document.getElementById('torrent-connection-result');
    if (btn) btn.disabled = true;
    if (resultEl) resultEl.style.display = 'none';

    state.torrentClientSettings = {
      type:     document.getElementById('torrent-client-type')?.value || 'none',
      url:      (document.getElementById('torrent-client-url')?.value || '').trim(),
      username: (document.getElementById('torrent-client-user')?.value || '').trim(),
      password: (document.getElementById('torrent-client-pass')?.value || '').trim()
    };
    state.qbtSessionCookie = '';
    state.transmissionSessionId = '';

    try {
      let clientVersion = '';
      if (state.torrentClientSettings.type === 'qbittorrent') {
        const base = (state.torrentClientSettings.url || '').replace(/\/$/, '');
        if (!state.qbtSessionCookie) await qbtLogin(base, state.torrentClientSettings.username, state.torrentClientSettings.password);
        const verRes = await torrentProxy(base + '/api/v2/app/version', 'GET', { 'Cookie': state.qbtSessionCookie });
        if (verRes.status === 200) clientVersion = verRes.body;
      }

      const list = await fetchTorrents();
      saveTorrentClientSettings();
      log('Paramètres client torrent sauvegardés.', 'ok');

      const cv = clientVersion ? clientVersion.replace(/^v/i, '') : '';
      if (resultEl) {
        resultEl.style.display = 'flex';
        resultEl.className = 'connection-result success';
        const vText = cv ? `v${cv} - ` : '';
        resultEl.innerHTML = `<span class="result-icon">✓</span><span>${vText}Connecté (${list.length} ${t('torrents-found')})</span>`;
      }

      const tStatus = document.getElementById('torrent-header-status');
      const tDot    = document.getElementById('torrent-header-dot');
      const tText   = document.getElementById('torrent-header-text');
      if (tStatus && tDot && tText) {
        tStatus.style.display = 'flex';
        tDot.style.background = 'var(--accent-success)';
        tText.textContent = state.torrentClientSettings.type === 'qbittorrent' ? 'QBT' + (cv ? ' - v' + cv : ' - Connecté') : 'Torrents - Connecté';
      }
    } catch (err) {
      if (resultEl) {
        resultEl.style.display = 'flex';
        resultEl.className = 'connection-result error';
        resultEl.innerHTML = `<span class="result-icon">✗</span><span>${escapeHtml(err.message)}</span>`;
      }
      const tStatus = document.getElementById('torrent-header-status');
      const tDot    = document.getElementById('torrent-header-dot');
      const tText   = document.getElementById('torrent-header-text');
      if (tStatus && tDot && tText) {
        tStatus.style.display = 'flex';
        tDot.style.background = 'var(--accent-danger)';
        tText.textContent = state.torrentClientSettings.type === 'qbittorrent' ? 'QBT - Erreur' : 'Torrents - Erreur';
      }
      log(`Erreur torrent: ${err.message}`, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  document.getElementById('btn-refresh-torrents')?.addEventListener('click', renderTorrentsPanel);

  document.getElementById('add-torrent-file')?.addEventListener('change', (e) => {
    const fileEl = e.target;
    const nameEl = document.getElementById('add-torrent-file-name');
    if (nameEl) nameEl.textContent = fileEl.files && fileEl.files.length > 0 ? fileEl.files[0].name : 'Aucun fichier sélectionné';
  });

  document.getElementById('btn-add-torrent-close')?.addEventListener('click', () => {
    document.getElementById('modal-add-torrent-overlay')?.classList.remove('open');
  });
  document.getElementById('modal-add-torrent-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-add-torrent-overlay') e.target.classList.remove('open');
  });

  document.getElementById('btn-confirm-add-torrent')?.addEventListener('click', async () => {
    const urlVal = document.getElementById('add-torrent-url')?.value.trim();
    const fileInput = document.getElementById('add-torrent-file');
    if (!urlVal) {
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        alert("L'upload de fichier .torrent n'est pas encore actif. Veuillez utiliser une URL Magnet !");
      }
      return;
    }
    const savepath  = document.getElementById('add-torrent-path')?.value.trim() || '';
    const category  = document.getElementById('add-torrent-cat')?.value.trim() || '';
    const tagsSelect = document.getElementById('add-torrent-tags');
    const tags = tagsSelect?.selectedOptions ? Array.from(tagsSelect.selectedOptions).map(o => o.value).join(',') : '';
    const btn  = document.getElementById('btn-confirm-add-torrent');
    const resEl = document.getElementById('add-torrent-result');
    if (btn) btn.disabled = true;
    if (resEl) resEl.style.display = 'none';

    try {
      const { type, url: clientUrl, username, password } = state.torrentClientSettings;
      const base = (clientUrl || '').replace(/\/$/, '');
      if (type === 'qbittorrent') {
        if (!state.qbtSessionCookie) await qbtLogin(base, username, password);
        let body = `urls=${encodeURIComponent(urlVal)}`;
        if (savepath) body += `&savepath=${encodeURIComponent(savepath)}`;
        if (category) body += `&category=${encodeURIComponent(category)}`;
        if (tags) body += `&tags=${encodeURIComponent(tags)}`;
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': state.qbtSessionCookie };
        const result = await torrentProxy(base + '/api/v2/torrents/add', 'POST', headers, body, 'application/x-www-form-urlencoded');
        if (result.status >= 200 && result.status < 300) {
          if (resEl) { resEl.className = 'connection-result success'; resEl.innerHTML = '<span class="result-icon">✓</span> Torrent ajouté !'; resEl.style.display = 'flex'; }
          setTimeout(() => { document.getElementById('modal-add-torrent-overlay')?.classList.remove('open'); }, 1500);
          renderTorrentsPanel();
        } else { throw new Error('Erreur HTTP ' + result.status); }
      } else {
        throw new Error('Support ajout uniquement QBitTorrent pour le moment');
      }
    } catch (e) {
      if (resEl) { resEl.className = 'connection-result error'; resEl.innerHTML = `<span class="result-icon">✗</span> ${escapeHtml(e.message)}`; resEl.style.display = 'flex'; }
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  let torrentsSearchTimeout;
  document.getElementById('torrents-search')?.addEventListener('input', () => {
    clearTimeout(torrentsSearchTimeout);
    torrentsSearchTimeout = setTimeout(() => renderTorrentsPanel(), 300);
  });

  document.querySelectorAll('#torrents-table th').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.id.replace('tth-', '');
      if (col === 'source' || col === 'status' || col === 'peers') return;
      if (state.torrentsSortCol === col) {
        state.torrentsSortDir = state.torrentsSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.torrentsSortCol = col;
        state.torrentsSortDir = 'asc';
      }
      renderTorrentsPanel();
    });
  });

  document.getElementById('torrents-category-filter')?.addEventListener('change', renderTorrentsPanel);
  document.getElementById('torrents-tags-filter')?.addEventListener('change', renderTorrentsPanel);
}
