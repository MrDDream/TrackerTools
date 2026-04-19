import { state } from './state.js';
import { t } from './i18n.js';

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '–';
  const units = [t('size-b'), t('size-kb'), t('size-mb'), t('size-gb'), t('size-tb')];
  let i = 0, size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return size.toFixed(size >= 100 ? 0 : 1) + '\u00a0' + units[i];
}

export function formatAge(dateStr) {
  if (!dateStr) return '–';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff < 1)  return t('age-today');
  if (diff === 1) return t('age-1day');
  if (diff < 30)  return diff + ' ' + t('age-days');
  if (diff < 365) return Math.floor(diff / 30) + ' ' + t('age-months');
  const y = Math.floor(diff / 365);
  return y + ' ' + (y > 1 ? t('age-years') : t('age-year'));
}

export function normalizeString(str) {
  if (str == null) return '';
  return String(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

export function normalizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[\[\]\(\)\{\}]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenSet(title) {
  return new Set(
    (title || '')
      .toLowerCase()
      .replace(/([a-z])(\d)/g, '$1 $2')
      .replace(/(\d)([a-z])/g, '$1 $2')
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2)
      .map(w => w.replace(/^0+(\d+)$/, '$1'))
  );
}

export function jaccard(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1;
  let intersection = 0;
  setA.forEach(w => { if (setB.has(w)) intersection++; });
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

export function animateValue(el, target) {
  const duration = 500;
  const start = parseInt(el.textContent) || 0;
  if (start === target) { el.textContent = target; return; }
  const t0 = performance.now();
  function tick(now) {
    const p = Math.min((now - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function csvField(val) {
  return `"${(val || '').replace(/"/g, '""')}"`;
}

export function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function getCategoryName(release) {
  if (release.categories?.length > 0) {
    const cat = release.categories[0];
    return cat.name || `Cat ${cat.id || '?'}`;
  }
  return release.category || '–';
}

export function getTrackerUrl(release) {
  let url = release.detailsUrl || release.infoUrl || release.guid || '#';
  if (url.startsWith('http')) {
    try {
      const u = new URL(url);
      if (u.hostname.startsWith('api.')) {
        u.hostname = u.hostname.substring(4);
        url = u.toString();
      }
    } catch (e) {}
  }
  return url;
}

export function stringToColorStyle(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `background: hsl(${h}, 60%, 15%); color: hsl(${h}, 90%, 80%); border: 1px solid hsl(${h}, 60%, 30%);`;
}

export function log(msg, type = 'info') {
  const logBody = document.getElementById('log-body');
  if (!logBody) return;
  const p = document.createElement('p');
  p.className = `log-${type}`;
  const now = new Date().toLocaleTimeString(state.currentLang === 'fr' ? 'fr-FR' : 'en-US');
  p.textContent = `[${now}] ${msg}`;
  logBody.appendChild(p);
  logBody.scrollTop = logBody.scrollHeight;
}

export function sanitizeUrl(url) {
  let u = url.trim();
  if (u.endsWith('/')) u = u.slice(0, -1);
  return u;
}
