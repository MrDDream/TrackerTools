import { state } from './state.js';
import { t } from './i18n.js';
import { getCategoryName, csvField, downloadFile, log } from './utils.js';
import { getFilteredSorted } from './render.js';
import { indexerName } from './api.js';

export function exportCurrentTab(format) {
  const t1Name = indexerName(document.getElementById('select-t1')?.value, 'T1');
  const t2Name = indexerName(document.getElementById('select-t2')?.value, 'T2');
  let rows = [], header = [];
  const exportMenu = document.getElementById('export-menu');

  if (state.currentTab === 'search') {
    header = ['source', 'title', 'category', 'size', 'seeders', 'leechers', 'age', 'link'];
    rows = getFilteredSorted().map(r => ({
      source: r.sourceTracker || '', title: r.title, category: getCategoryName(r),
      size: r.size || 0, seeders: r.seeders || 0, leechers: r.leechers || 0,
      age: r.publishDate || '', link: r.downloadUrl || r.magnetUrl || ''
    }));
  } else if (state.currentTab === 'common') {
    header = ['source_t1', 'title_t1', 'size_t1', 'seeders_t1', 'source_t2', 'title_t2', 'size_t2', 'seeders_t2'];
    rows = state.commonResults.map(p => ({
      source_t1: t1Name, title_t1: p.t1.title, size_t1: p.t1.size || 0, seeders_t1: p.t1.seeders || 0,
      source_t2: t2Name, title_t2: p.t2.title, size_t2: p.t2.size || 0, seeders_t2: p.t2.seeders || 0,
    }));
  } else {
    const data = state.currentTab === 'unique-t2' ? state.uniqueT2Results : state.uniqueT1Results;
    header = ['source', 'title', 'category', 'size', 'seeders', 'age', 'link'];
    rows = data.map(r => ({
      source: r._source === 't1' ? t1Name : t2Name, title: r.title,
      category: getCategoryName(r), size: r.size || 0, seeders: r.seeders || 0,
      age: r.publishDate || '', link: r.downloadUrl || r.magnetUrl || ''
    }));
  }

  const date = new Date().toISOString().slice(0, 10);
  if (format === 'csv') {
    const csv = [header.join(';'), ...rows.map(r => header.map(k => csvField(String(r[k] ?? ''))).join(';'))].join('\n');
    downloadFile('\uFEFF' + csv, `export_${state.currentTab}_${date}.csv`, 'text/csv;charset=utf-8;');
  } else {
    downloadFile(JSON.stringify(rows, null, 2), `export_${state.currentTab}_${date}.json`, 'application/json');
  }
  log(`Export ${format.toUpperCase()} (${state.currentTab}): ${rows.length} lignes`, 'ok');
  if (exportMenu) exportMenu.classList.remove('open');
}

export function exportAll(format) {
  const t1Name = indexerName(document.getElementById('select-t1')?.value, 'T1');
  const t2Name = indexerName(document.getElementById('select-t2')?.value, 'T2');
  const exportMenu = document.getElementById('export-menu');
  const rows = [];
  state.uniqueT2Results.forEach(r => rows.push({ type: 'missing_t1', source: t2Name, title: r.title, category: getCategoryName(r), size: r.size || 0, seeders: r.seeders || 0, age: r.publishDate || '', link: r.downloadUrl || r.magnetUrl || '' }));
  state.uniqueT1Results.forEach(r => rows.push({ type: 'missing_t2', source: t1Name, title: r.title, category: getCategoryName(r), size: r.size || 0, seeders: r.seeders || 0, age: r.publishDate || '', link: r.downloadUrl || r.magnetUrl || '' }));
  state.commonResults.forEach(p => {
    rows.push({ type: 'common', source: t1Name, title: p.t1.title, category: getCategoryName(p.t1), size: p.t1.size || 0, seeders: p.t1.seeders || 0, age: p.t1.publishDate || '', link: p.t1.downloadUrl || '' });
    rows.push({ type: 'common', source: t2Name, title: p.t2.title, category: getCategoryName(p.t2), size: p.t2.size || 0, seeders: p.t2.seeders || 0, age: p.t2.publishDate || '', link: p.t2.downloadUrl || '' });
  });
  if (!rows.length) return;
  const date = new Date().toISOString().slice(0, 10);
  const header = ['type', 'source', 'title', 'category', 'size', 'seeders', 'age', 'link'];
  if (format === 'csv') {
    const csv = [header.join(';'), ...rows.map(r => header.map(k => csvField(String(r[k] ?? ''))).join(';'))].join('\n');
    downloadFile('\uFEFF' + csv, `export_complet_${date}.csv`, 'text/csv;charset=utf-8;');
  } else {
    downloadFile(JSON.stringify(rows, null, 2), `export_complet_${date}.json`, 'application/json');
  }
  log(`Export ${format.toUpperCase()} complet: ${rows.length} lignes`, 'ok');
  if (exportMenu) exportMenu.classList.remove('open');
}

export function exportData(data, format, prefix) {
  if (!data.length) { log('Rien à exporter.', 'warn'); return; }
  const date = new Date().toISOString().slice(0, 10);
  if (format === 'csv') {
    const header = ['source', 'title', 'category', 'size', 'seeders', 'age', 'link'];
    const rows = data.map(r => ({
      source: r.sourceTracker || r.source || '', title: r.title, category: getCategoryName(r),
      size: r.size || 0, seeders: r.seeders || 0, age: r.publishDate || '', link: r.downloadUrl || r.magnetUrl || ''
    }));
    const csv = [header.join(';'), ...rows.map(r => header.map(k => csvField(String(r[k] ?? ''))).join(';'))].join('\n');
    downloadFile('\uFEFF' + csv, `export_${prefix}_${date}.csv`, 'text/csv;charset=utf-8;');
  } else {
    const items = data.map(r => ({
      source: r.sourceTracker || r.source || '', title: r.title, category: getCategoryName(r),
      size: r.size || 0, seeders: r.seeders || 0, age: r.publishDate || '', link: r.downloadUrl || r.magnetUrl || ''
    }));
    downloadFile(JSON.stringify(items, null, 2), `export_${prefix}_${date}.json`, 'application/json');
  }
  log(`Export ${format.toUpperCase()} (${prefix}): ${data.length} lignes`, 'ok');
}
