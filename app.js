/* ============================================================
   TRACKER COMPARATOR — app.js
   Connect to Prowlarr, pick 2 indexers, search & compare
   ============================================================ */

(function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────
  const PAGE_SIZE = 50;

  const SUBCATEGORIES = {
    '2000': [
      { value: '2080', label: 'Films/WEB-DL' },
      { value: '2040', label: 'Films/HD' },
      { value: '2045', label: 'Films/UHD' },
      { value: '2050', label: 'Films/Blu-Ray' },
      { value: '2030', label: 'Films/SD' },
      { value: '2070', label: 'Films/DVD' },
      { value: '2060', label: 'Films/3D' },
      { value: '2010', label: 'Films/Étranger' },
      { value: '2020', label: 'Films/Autre' },
    ],
    '5000': [
      { value: '5010', label: 'TV/WEB-DL' },
      { value: '5040', label: 'TV/HD' },
      { value: '5045', label: 'TV/UHD' },
      { value: '5030', label: 'TV/SD' },
      { value: '5070', label: 'TV/Anime' },
      { value: '5060', label: 'TV/Sport' },
      { value: '5080', label: 'TV/Documentaire' },
      { value: '5020', label: 'TV/Étranger' },
      { value: '5050', label: 'TV/Autre' },
    ],
    '3000': [
      { value: '3040', label: 'Musique/Lossless' },
      { value: '3010', label: 'Musique/MP3' },
      { value: '3030', label: 'Musique/Audiobook' },
      { value: '3020', label: 'Musique/Vidéo' },
      { value: '3060', label: 'Musique/Étranger' },
      { value: '3050', label: 'Musique/Autre' },
    ],
    '7000': [
      { value: '7020', label: 'Livres/EBook' },
      { value: '7030', label: 'Livres/Comics' },
      { value: '7010', label: 'Livres/Magazines' },
      { value: '7040', label: 'Livres/Technique' },
      { value: '7060', label: 'Livres/Étranger' },
      { value: '7050', label: 'Livres/Autre' },
    ],
    '4000': [
      { value: '4050', label: 'PC/Jeux' },
      { value: '4010', label: 'PC/0day' },
      { value: '4020', label: 'PC/ISO' },
      { value: '4030', label: 'PC/Mac' },
      { value: '4060', label: 'PC/Phone-iOS' },
      { value: '4070', label: 'PC/Phone-Android' },
      { value: '4040', label: 'PC/Phone-Autre' },
    ],
    '1000': [
      { value: '1080', label: 'Console/PS3' },
      { value: '1180', label: 'Console/PS4' },
      { value: '1040', label: 'Console/Xbox' },
      { value: '1050', label: 'Console/Xbox 360' },
      { value: '1140', label: 'Console/Xbox One' },
      { value: '1030', label: 'Console/Wii' },
      { value: '1130', label: 'Console/Wii U' },
      { value: '1010', label: 'Console/NDS' },
      { value: '1110', label: 'Console/3DS' },
      { value: '1120', label: 'Console/PS Vita' },
      { value: '1090', label: 'Console/Autre' },
    ],
  };

  // ─── i18n ─────────────────────────────────────────────────
  const TRANSLATIONS = {
    fr: {
      'app-subtitle': "Comparateur &amp; explorateur d'indexeurs Prowlarr",
      'status-disconnected': 'Non connecté',
      'btn-theme-title': 'Basculer le thème clair/sombre',
      'btn-settings-title': 'Paramètres de connexion',
      'btn-lang-title': 'English / Français',
      'mode-search': 'Rechercher', 'mode-compare': 'Comparer',
      'card-title-indexers': 'Sélection des indexeurs', 'badge-step1': 'Étape 1',
      'protocol-filter-label': 'Filtrer les protocoles',
      'btn-torrent': 'Torrents', 'btn-usenet': 'Usenet',
      'label-t1': 'Indexeur 1', 'label-t1-ref': '(référence)',
      'label-t2': 'Indexeur 2', 'label-t2-ref': '(comparé)',
      'connect-first': "— Connectez-vous d'abord —",
      'choose-indexer': '— Choisir un indexeur —',
      'active': 'Actifs', 'inactive': 'Inactifs', 'manual': 'Manuels',
      'inactive-label': '(inactif)',
      'card-title-filters': 'Recherche & Filtres', 'badge-step2': 'Étape 2',
      'label-search': 'Recherche (nom / titre)', 'search-placeholder': 'ex: Breaking Bad',
      'label-cat': 'Catégorie',
      'cat-all': 'Toutes', 'cat-movies': 'Films', 'cat-tv': 'TV',
      'cat-music': 'Musique', 'cat-books': 'Livres', 'cat-pc': 'PC / Jeux', 'cat-console': 'Console',
      'label-subcat': 'Sous-catégorie', 'label-limit': 'Résultats max',
      'label-method': 'Méthode', 'method-fuzzy': 'Intelligent', 'method-norm': 'Standard',
      'label-filter-mode': 'Filtrage', 'filter-strict': 'Strict', 'filter-off': 'Désactivé',
      'btn-run-compare': 'Lancer la comparaison', 'btn-run-search': 'Rechercher',
      'stat-results': 'Résultats', 'stat-common': 'En commun',
      'stat-unique': 'Unique', 'stat-similarity': 'Similarité',
      'tab-missing-on': 'Manquants sur', 'tab-common': 'En commun',
      'filter-title-placeholder': 'Filtrer par titre…',
      'all-indexers': 'Tous les indexeurs',
      'btn-export-csv': 'CSV', 'btn-export-all': 'Tout exporter', 'btn-reset': 'Réinitialiser',
      'btn-export-csv-title': "Exporter l'onglet actif en CSV",
      'btn-export-all-title': 'Exporter tous les onglets en CSV',
      'btn-reset-title': 'Réinitialiser les résultats',
      'empty-title': 'Aucune recherche effectuée',
      'empty-desc': 'Connectez-vous à Prowlarr via <strong>⚙ Paramètres</strong>, sélectionnez vos indexeurs et validez.',
      'th-source': 'Source', 'th-title': 'Titre', 'th-category': 'Catégorie',
      'th-size': 'Taille', 'th-age': 'Âge', 'th-link': 'Lien', 'th-torrent': 'Torrent',
      'btn-prev': 'Précédent', 'btn-next': 'Suivant',
      'page-label': 'Page', 'page-sep': '/', 'page-of': 'sur',
      'page-mode-search': 'Mode Recherche',
      'log-summary': 'Console de débogage', 'btn-clear-log': 'Vider',
      'modal-settings-title': 'Connexion Prowlarr',
      'settings-section1': '1. Serveur Prowlarr',
      'label-prowlarr-url': "URL de l'instance", 'label-prowlarr-apikey': 'Clé API',
      'btn-connect': 'Tester la connexion',
      'settings-section2': '2. Indexeurs manuels API', 'btn-add-header': 'Ajouter',
      'manual-desc': 'Ajoutez directement vos indexeurs Torznab externes ou Jackett.',
      'no-manual-indexers': 'Aucun indexeur externe ajouté.',
      'modal-manual-title': 'Ajouter un indexeur Torznab',
      'label-manual-name': 'Nom du tracker', 'manual-name-placeholder': 'Ex: YggTorrent (externe)',
      'label-manual-url': 'URL Torznab (API)',
      'manual-url-placeholder': 'http://jackett:9117/api/v2.0/indexers/ygg/results/torznab/',
      'label-manual-apikey': 'Clé API Torznab', 'manual-apikey-placeholder': 'Clé API',
      'btn-add-manual': 'Ajouter', 'btn-save-manual': 'Sauvegarder',
      'btn-edit-title': 'Modifier', 'btn-delete-title': 'Supprimer',
      'btn-delete-confirm': 'Voulez-vous vraiment supprimer',
      'age-today': "Aujourd'hui", 'age-1day': '1 jour', 'age-days': 'jours',
      'age-months': 'mois', 'age-year': 'an', 'age-years': 'ans',
      'size-b': 'o', 'size-kb': 'Ko', 'size-mb': 'Mo', 'size-gb': 'Go', 'size-tb': 'To',
      'link-text': 'Lien', 'unknown-tracker': 'Inconnu',
      'searching-on': 'Recherche sur', 'trackers-label': 'trackers',
      'parallel-search': 'Recherche en parallèle sur', 'and': 'et',
      'comparing': 'Comparaison en cours…', 'compare-done': 'Comparaison terminée !',
      'compare-error': 'Erreur lors de la comparaison',
      'no-filter-result': 'Aucun résultat pour ce filtre.',
      'searching-btn': 'Recherche...',
      'err-no-url': "Veuillez renseigner l'URL Prowlarr.",
      'err-no-apikey': 'Veuillez renseigner la clé API.',
      'status-connected-prefix': 'Connecté – v',
      'connect-success': 'Connexion réussie ! Prowlarr v',
      'err-unreachable': "Serveur injoignable. Vérifiez l'URL, le démarrage de Prowlarr et la config CORS.",
      'err-invalid-key': 'Clé API invalide.',
      // History
      'mode-history': 'Historique', 'mode-watchlist': 'Favoris',
      'history-title': 'Historique des recherches', 'btn-clear-history': 'Vider',
      'watchlist-title': 'Favoris', 'btn-clear-watchlist': 'Vider',
      'history-empty': 'Aucune recherche dans l\'historique.', 'watchlist-empty': 'Aucun favori enregistré.',
      'history-rerun': 'Relancer', 'history-delete': 'Supprimer',
      'watchlist-remove': 'Retirer',
      'history-mode-search': 'Recherche', 'history-mode-compare': 'Comparaison',
      'copy-magnet': 'Copier le lien magnet', 'copy-success': 'Copié !',
      // Export
      'btn-export': 'Exporter',
      'export-csv-all': 'Format CSV', 'export-json-all': 'Format JSON',
      // Sort
      'sort-primary': 'Tri principal', 'sort-secondary': 'Tri secondaire',
    },
    en: {
      'app-subtitle': 'Prowlarr indexer comparator &amp; explorer',
      'status-disconnected': 'Not connected',
      'btn-theme-title': 'Toggle light/dark theme',
      'btn-settings-title': 'Connection settings',
      'btn-lang-title': 'English / Français',
      'mode-search': 'Search', 'mode-compare': 'Compare',
      'card-title-indexers': 'Indexer selection', 'badge-step1': 'Step 1',
      'protocol-filter-label': 'Filter protocols',
      'btn-torrent': 'Torrents', 'btn-usenet': 'Usenet',
      'label-t1': 'Indexer 1', 'label-t1-ref': '(reference)',
      'label-t2': 'Indexer 2', 'label-t2-ref': '(compared)',
      'connect-first': '— Connect first —',
      'choose-indexer': '— Choose an indexer —',
      'active': 'Active', 'inactive': 'Inactive', 'manual': 'Manual',
      'inactive-label': '(inactive)',
      'card-title-filters': 'Search & Filters', 'badge-step2': 'Step 2',
      'label-search': 'Search (name / title)', 'search-placeholder': 'e.g. Breaking Bad',
      'label-cat': 'Category',
      'cat-all': 'All', 'cat-movies': 'Movies', 'cat-tv': 'TV',
      'cat-music': 'Music', 'cat-books': 'Books', 'cat-pc': 'PC / Games', 'cat-console': 'Console',
      'label-subcat': 'Sub-category', 'label-limit': 'Max results',
      'label-method': 'Method', 'method-fuzzy': 'Smart', 'method-norm': 'Standard',
      'label-filter-mode': 'Filtering', 'filter-strict': 'Strict', 'filter-off': 'Disabled',
      'btn-run-compare': 'Run comparison', 'btn-run-search': 'Search',
      'stat-results': 'Results', 'stat-common': 'In common',
      'stat-unique': 'Unique', 'stat-similarity': 'Similarity',
      'tab-missing-on': 'Missing on', 'tab-common': 'In common',
      'filter-title-placeholder': 'Filter by title…',
      'all-indexers': 'All indexers',
      'btn-export-csv': 'CSV', 'btn-export-all': 'Export all', 'btn-reset': 'Reset',
      'btn-export-csv-title': 'Export current tab as CSV',
      'btn-export-all-title': 'Export all tabs as CSV',
      'btn-reset-title': 'Reset results',
      'empty-title': 'No search performed',
      'empty-desc': 'Connect to Prowlarr via <strong>⚙ Settings</strong>, select your indexers and confirm.',
      'th-source': 'Source', 'th-title': 'Title', 'th-category': 'Category',
      'th-size': 'Size', 'th-age': 'Age', 'th-link': 'Link', 'th-torrent': 'Torrent',
      'btn-prev': 'Previous', 'btn-next': 'Next',
      'page-label': 'Page', 'page-sep': '/', 'page-of': 'of',
      'page-mode-search': 'Search Mode',
      'log-summary': 'Debug console', 'btn-clear-log': 'Clear',
      'modal-settings-title': 'Prowlarr Connection',
      'settings-section1': '1. Prowlarr Server',
      'label-prowlarr-url': 'Instance URL', 'label-prowlarr-apikey': 'API Key',
      'btn-connect': 'Test connection',
      'settings-section2': '2. Manual API indexers', 'btn-add-header': 'Add',
      'manual-desc': 'Directly add your external Torznab indexers or Jackett.',
      'no-manual-indexers': 'No external indexer added.',
      'modal-manual-title': 'Add a Torznab indexer',
      'label-manual-name': 'Tracker name', 'manual-name-placeholder': 'e.g. YggTorrent (external)',
      'label-manual-url': 'Torznab URL (API)',
      'manual-url-placeholder': 'http://jackett:9117/api/v2.0/indexers/ygg/results/torznab/',
      'label-manual-apikey': 'Torznab API Key', 'manual-apikey-placeholder': 'API Key',
      'btn-add-manual': 'Add', 'btn-save-manual': 'Save',
      'btn-edit-title': 'Edit', 'btn-delete-title': 'Delete',
      'btn-delete-confirm': 'Do you really want to delete',
      'age-today': 'Today', 'age-1day': '1 day', 'age-days': 'days',
      'age-months': 'months', 'age-year': 'year', 'age-years': 'years',
      'size-b': 'B', 'size-kb': 'KB', 'size-mb': 'MB', 'size-gb': 'GB', 'size-tb': 'TB',
      'link-text': 'Link', 'unknown-tracker': 'Unknown',
      'searching-on': 'Searching on', 'trackers-label': 'trackers',
      'parallel-search': 'Searching in parallel on', 'and': 'and',
      'comparing': 'Comparing…', 'compare-done': 'Comparison complete!',
      'compare-error': 'Error during comparison',
      'no-filter-result': 'No results for this filter.',
      'searching-btn': 'Searching...',
      'err-no-url': 'Please enter the Prowlarr URL.',
      'err-no-apikey': 'Please enter the API key.',
      'status-connected-prefix': 'Connected – v',
      'connect-success': 'Connection successful! Prowlarr v',
      'err-unreachable': 'Server unreachable. Check the URL, Prowlarr startup and CORS config.',
      'err-invalid-key': 'Invalid API key.',
      // History
      'mode-history': 'History', 'mode-watchlist': 'Watchlist',
      'history-title': 'Search history', 'btn-clear-history': 'Clear',
      'watchlist-title': 'Watchlist', 'btn-clear-watchlist': 'Clear',
      'history-empty': 'No searches in history.', 'watchlist-empty': 'No saved items.',
      'history-rerun': 'Rerun', 'history-delete': 'Delete',
      'watchlist-remove': 'Remove',
      'history-mode-search': 'Search', 'history-mode-compare': 'Compare',
      'copy-magnet': 'Copy magnet link', 'copy-success': 'Copied!',
      // Export
      'btn-export': 'Export',
      'export-csv-all': 'CSV format', 'export-json-all': 'JSON format',
      // Sort
      'sort-primary': 'Primary sort', 'sort-secondary': 'Secondary sort',
    }
  };

  function t(key) {
    return (TRANSLATIONS[currentLang] || TRANSLATIONS['fr'])[key]
        || TRANSLATIONS['fr'][key]
        || key;
  }

  // ─── DOM refs ─────────────────────────────────────────────
  const prowlarrUrl       = document.getElementById('prowlarr-url');
  const prowlarrApiKey    = document.getElementById('prowlarr-apikey');
  const btnEye            = document.getElementById('btn-eye-apikey');
  const btnConnect        = document.getElementById('btn-connect');
  const connectionResult  = document.getElementById('connection-result');
  const resultIcon        = document.getElementById('result-icon');
  const resultMsg         = document.getElementById('result-msg');
  const headerDot         = document.getElementById('header-dot');
  const headerStatusText  = document.getElementById('header-status-text');

  const sectionIndexers   = document.getElementById('section-indexers');
  const selectT1          = document.getElementById('select-t1');
  const selectT2          = document.getElementById('select-t2');

  const sectionFilters    = document.getElementById('section-filters');
  const filterQuery       = document.getElementById('filter-query');
  const filterCat         = document.getElementById('filter-cat');
  const filterSubcat      = document.getElementById('filter-subcat');
  const filterLimit       = document.getElementById('filter-limit');
  const filterMatchMode   = document.getElementById('filter-match-mode');
  const btnCompare        = document.getElementById('btn-compare');

  const statT1            = document.getElementById('stat-t1');
  const statT2            = document.getElementById('stat-t2');
  const statCommon        = document.getElementById('stat-common');
  const statUniqueT1      = document.getElementById('stat-unique-t1');
  const statUniqueT2      = document.getElementById('stat-unique-t2');
  const statOverlap       = document.getElementById('stat-overlap');
  const badgeNameT1       = document.getElementById('badge-name-t1');
  const badgeNameT2       = document.getElementById('badge-name-t2');
  const badgeUniqueT1     = document.getElementById('badge-unique-t1');
  const badgeUniqueT2     = document.getElementById('badge-unique-t2');

  const progressContainer = document.getElementById('progress-container');
  const progressBar       = document.getElementById('progress-bar');
  const progressLabel     = document.getElementById('progress-label');

  const tabBtns           = document.querySelectorAll('.tab-btn');
  const resultsSearch     = document.getElementById('results-search');
  const exportTrigger     = document.getElementById('btn-export-trigger');
  const btnReset          = document.getElementById('btn-reset');
  const btnClearLog       = document.getElementById('btn-clear-log');

  const emptyState        = document.getElementById('empty-state');
  const resultsTable      = document.getElementById('results-table');
  const resultsBody       = document.getElementById('results-body');
  const logBody           = document.getElementById('log-body');
  const paginationBar     = document.getElementById('pagination-bar');
  const modalOverlay      = document.getElementById('modal-overlay');
  const btnOpenSettings   = document.getElementById('btn-open-settings');
  const btnModalClose     = document.getElementById('btn-modal-close');
  const pageInfo          = document.getElementById('page-info');
  const btnPagePrev       = document.getElementById('btn-page-prev');
  const btnPageNext       = document.getElementById('btn-page-next');
  const btnThemeToggle    = document.getElementById('btn-theme-toggle');
  const langSelect        = document.getElementById('lang-select');

  // ─── State ────────────────────────────────────────────────
  let currentLang = 'fr';
  let appMode = 'search'; // 'compare' or 'search'
  let baseUrl = '';
  let apiKey  = '';
  let allIndexers     = [];
  let manualIndexers  = JSON.parse(localStorage.getItem('manual_indexers') || '[]');
  let searchSelectedIds = new Set();
  let resultsT1       = [];
  let resultsT2       = [];
  let commonResults   = [];   // array of { t1, t2 } pairs
  let uniqueT1Results = [];
  let uniqueT2Results = [];
  let multiSearchResults = [];
  let currentTab  = 'search';
  let sortCol     = null; // kept for compat — mirrors sortPrimary.col
  let sortDir     = 'asc';
  let currentPage = 0;
  let sortPrimary   = { col: null, dir: 'asc' };
  let sortSecondary = { col: null, dir: 'asc' };
  let searchHistory = JSON.parse(localStorage.getItem('search_history') || '[]');
  let watchlist     = JSON.parse(localStorage.getItem('watchlist') || '[]');

  // ─── Indexer lookup (robust ID comparison) ───────────────
  function findIndexer(id) {
    return allIndexers.find(i => String(i.id) === String(id));
  }

  function indexerName(id, fallback) {
    const idx = findIndexer(id);
    if (idx?.name) return idx.name;
    // Fallback: read label directly from the select option
    const sel = String(selectT1.value) === String(id) ? selectT1 : selectT2;
    const opt = Array.from(sel.options).find(o => String(o.value) === String(id));
    return opt ? opt.textContent.replace(/\s*\[.*?\].*$/, '').trim() : fallback;
  }

  // ─── API helper (header auth instead of query param) ──────
  function apiFetch(path) {
    return fetch(`${baseUrl}${path}`, {
      headers: { 'X-Api-Key': apiKey }
    });
  }

  // ─── Logging ──────────────────────────────────────────────
  function log(msg, type = 'info') {
    const p = document.createElement('p');
    p.className = `log-${type}`;
    const now = new Date().toLocaleTimeString(currentLang === 'fr' ? 'fr-FR' : 'en-US');
    p.textContent = `[${now}] ${msg}`;
    logBody.appendChild(p);
    logBody.scrollTop = logBody.scrollHeight;
  }

  // ─── Helpers ──────────────────────────────────────────────
  function sanitizeUrl(url) {
    let u = url.trim();
    if (u.endsWith('/')) u = u.slice(0, -1);
    return u;
  }

  function showResult(success, msg) {
    connectionResult.style.display = 'flex';
    connectionResult.className = 'connection-result ' + (success ? 'success' : 'error');
    resultIcon.textContent = success ? '✓' : '✗';
    resultMsg.textContent = msg;
  }

  function setHeaderStatus(state, text) {
    headerDot.className = 'status-dot' +
      (state === 'connected' ? ' connected' : state === 'error' ? ' error' : '');
    headerStatusText.textContent = text;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatSize(bytes) {
    if (!bytes || bytes <= 0) return '–';
    const units = [t('size-b'), t('size-kb'), t('size-mb'), t('size-gb'), t('size-tb')];
    let i = 0, size = bytes;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return size.toFixed(size >= 100 ? 0 : 1) + '\u00a0' + units[i];
  }

  function formatAge(dateStr) {
    if (!dateStr) return '–';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
    if (diff < 1)  return t('age-today');
    if (diff === 1) return t('age-1day');
    if (diff < 30)  return diff + ' ' + t('age-days');
    if (diff < 365) return Math.floor(diff / 30) + ' ' + t('age-months');
    const y = Math.floor(diff / 365);
    return y + ' ' + (y > 1 ? t('age-years') : t('age-year'));
  }

  // ─── Utility: Text normalization for fuzzy match / strict mode ──
  function normalizeString(str) {
    if (str == null) return '';
    return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  }

  function normalizeTitle(title) {
    return (title || '')
      .toLowerCase()
      .replace(/[\[\]\(\)\{\}]/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Splits a title into a set of meaningful tokens (length >= 2)
  // Also splits on letter↔digit boundaries so "Digital1417" → ["digital", "1417"]
  function tokenSet(title) {
    return new Set(
      (title || '')
        .toLowerCase()
        .replace(/([a-z])(\d)/g, '$1 $2')  // digital1417 → digital 1417
        .replace(/(\d)([a-z])/g, '$1 $2')  // 1417digital → 1417 digital
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 2)
        .map(w => w.replace(/^0+(\d+)$/, '$1'))  // "01" → "1", "007" → "7"
    );
  }

  // Jaccard similarity between two token sets: |A∩B| / |A∪B|
  function jaccard(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 1;
    let intersection = 0;
    setA.forEach(w => { if (setB.has(w)) intersection++; });
    const union = setA.size + setB.size - intersection;
    return intersection / union;
  }

  function animateValue(el, target) {
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

  function csvField(val) {
    return `"${(val || '').replace(/"/g, '""')}"`;
  }

  function downloadCsv(csv, filename) {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function getCategoryName(release) {
    if (release.categories?.length > 0) {
      const cat = release.categories[0];
      return cat.name || `Cat ${cat.id || '?'}`;
    }
    return release.category || '–';
  }

  function getTrackerUrl(release) {
    let url = release.detailsUrl || release.infoUrl || release.guid || '#';
    if (url.startsWith('http')) {
      try {
        const u = new URL(url);
        // Remove "api." from hostname if present (e.g. api.torr9.net -> torr9.net)
        if (u.hostname.startsWith('api.')) {
          u.hostname = u.hostname.substring(4);
          url = u.toString();
        }
      } catch (e) {}
    }
    return url;
  }

  // ─── Modal ────────────────────────────────────────────────
  function openSettings() { modalOverlay.classList.add('open'); }
  function closeSettings() { modalOverlay.classList.remove('open'); }

  btnOpenSettings.addEventListener('click', openSettings);
  btnModalClose.addEventListener('click', closeSettings);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeSettings(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSettings(); });

  // ─── Eye toggle ───────────────────────────────────────────
  btnEye.addEventListener('click', () => {
    prowlarrApiKey.type = prowlarrApiKey.type === 'password' ? 'text' : 'password';
  });

  // ─── Subcategories ────────────────────────────────────────
  filterCat.addEventListener('change', () => {
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

  // ─── Log clear ────────────────────────────────────────────
  btnClearLog.addEventListener('click', () => {
    logBody.innerHTML = '';
    log('Console vidée.', 'info');
  });

  // ─── Settings ─────────────────────────────────────────────
  function loadSettings() {
    const saved = localStorage.getItem('prowlarr_settings');
    const savedTheme = localStorage.getItem('theme_preference');
    const savedLang  = localStorage.getItem('lang_preference');

    if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    if (savedLang === 'en') {
      applyLang('en');
    } else {
      langSelect.value = 'fr';
    }

    if (!saved) return;
    try {
      const s = JSON.parse(saved);
      if (s.url)    prowlarrUrl.value    = s.url;
      if (s.apiKey) prowlarrApiKey.value = s.apiKey;
      log('Paramètres restaurés depuis le cache.', 'info');
    } catch (_) {}
  }

  function saveSettings() {
    const current = JSON.parse(localStorage.getItem('prowlarr_settings') || '{}');
    localStorage.setItem('prowlarr_settings', JSON.stringify({
      ...current,
      url:    prowlarrUrl.value.trim(),
      apiKey: prowlarrApiKey.value.trim()
    }));
    persistConfig();
  }

  function persistData(type, payload) {
    fetch('/api/save/' + type, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    }).catch(() => {}); // silencieux si hors Docker
  }

  function persistConfig() {
    const url    = prowlarrUrl.value.trim();
    const apiKey = prowlarrApiKey.value.trim();
    persistData('config', { url, apiKey, manualIndexers });
  }

  function saveIndexerSelection() {
    const current = JSON.parse(localStorage.getItem('prowlarr_settings') || '{}');
    localStorage.setItem('prowlarr_settings', JSON.stringify({
      ...current,
      t1Id: selectT1.value,
      t2Id: selectT2.value
    }));
  }

  function restoreIndexerSelection() {
    const saved = localStorage.getItem('prowlarr_settings');
    if (!saved) return;
    try {
      const s = JSON.parse(saved);
      if (s.t1Id) selectT1.value = s.t1Id;
      if (s.t2Id) selectT2.value = s.t2Id;
      if (selectT1.value && selectT2.value && selectT1.value !== selectT2.value) {
        onIndexerChange();
      }
    } catch (_) {}
  }

  // ─── Step 1: Connect ─────────────────────────────────────
  async function testConnection() {
    baseUrl = sanitizeUrl(prowlarrUrl.value);
    apiKey  = prowlarrApiKey.value.trim();

    if (!baseUrl) { showResult(false, t('err-no-url')); return; }
    if (!apiKey)  { showResult(false, t('err-no-apikey')); return; }

    btnConnect.classList.add('loading');
    btnConnect.disabled = true;
    connectionResult.style.display = 'none';
    log(`Connexion à ${baseUrl}…`, 'info');

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
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        msg = t('err-unreachable');
      } else if (msg.includes('401') || msg.includes('403')) {
        msg = t('err-invalid-key');
      }
      showResult(false, msg);
    } finally {
      btnConnect.classList.remove('loading');
      btnConnect.disabled = false;
    }
  }

  // ─── Fetch indexers ───────────────────────────────────────
  async function fetchIndexers() {
    log('Récupération des indexeurs…', 'info');
    try {
      const res = await apiFetch('/api/v1/indexer');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let prowlarrIndexers = await res.json();
      allIndexers = prowlarrIndexers.concat(manualIndexers);
      log(`${allIndexers.length} indexeur(s) trouvé(s) (${manualIndexers.length} manuel(s))`, 'ok');

      populateSelectors();
      unlockStep2();
      restoreIndexerSelection();

    } catch (err) {
      log(`Erreur indexeurs: ${err.message}`, 'error');
    }
  }

  function populateSelectors() {
    const enabled  = allIndexers.filter(i => i.enable);
    const disabled = allIndexers.filter(i => !i.enable);

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

      if (manualIndexers.length > 0) {
        const g = document.createElement('optgroup');
        g.label = `${t('manual')} (${manualIndexers.length})`;
        manualIndexers.forEach(idx => {
          const opt = document.createElement('option');
          opt.value = idx.id;
          opt.textContent = `${idx.name} [Torznab]`;
          g.appendChild(opt);
        });
        sel.appendChild(g);
      }

      sel.disabled = false;
    });
    
    // Populate the multi-selector for Search Mode
    const multiContainer = document.getElementById('multi-select-container');
    multiContainer.innerHTML = '';
    const sortedEnabled = [...enabled, ...manualIndexers].sort((a,b) => (a.name||'').localeCompare(b.name||''));
    sortedEnabled.forEach(idx => {
      const item = document.createElement('label');
      item.className = 'multi-select-item';
      
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = idx.id;
      if (searchSelectedIds.has(String(idx.id))) cb.checked = true;
      cb.addEventListener('change', () => {
        if (cb.checked) searchSelectedIds.add(String(idx.id));
        else searchSelectedIds.delete(String(idx.id));
        checkStep3Unlock();
      });
      
      const text = document.createTextNode(idx.isManual ? ` ${idx.name} [Torznab]` : ` ${idx.name}`);
      item.appendChild(cb);
      item.appendChild(text);
      multiContainer.appendChild(item);
    });
  }

  function updateTrackerBadges(t1Name, t2Name) {
    const short = name => name.length > 12 ? name.slice(0, 11) + '…' : name;
    badgeNameT1.textContent   = short(t1Name);
    badgeNameT2.textContent   = short(t2Name);
    badgeUniqueT1.textContent = short(t1Name);
    badgeUniqueT2.textContent = short(t2Name);
  }

  function unlockStep2() {
    sectionIndexers.classList.add('unlocked');
    sectionIndexers.classList.remove('card-disabled');
  }

  function checkStep3Unlock() {
    if (appMode === 'compare') {
      const t1Id = selectT1.value;
      const t2Id = selectT2.value;
      if (t1Id && t2Id && t1Id !== t2Id) {
        sectionFilters.classList.add('unlocked');
        sectionFilters.classList.remove('card-disabled');
        filterQuery.disabled     = false;
        filterCat.disabled       = false;
        filterSubcat.disabled    = (SUBCATEGORIES[filterCat.value] || []).length === 0;
        filterLimit.disabled     = false;
        filterMatchMode.disabled = false;
        btnCompare.disabled      = false;
      } else {
        sectionFilters.classList.remove('unlocked');
        sectionFilters.classList.add('card-disabled');
        btnCompare.disabled = true;
      }
    } else {
      if (searchSelectedIds.size > 0) {
        sectionFilters.classList.add('unlocked');
        sectionFilters.classList.remove('card-disabled');
        filterQuery.disabled     = false;
        filterCat.disabled       = false;
        filterSubcat.disabled    = (SUBCATEGORIES[filterCat.value] || []).length === 0;
        filterLimit.disabled     = false;
        
        const fmmEl = document.getElementById('filter-match-mode');
        const fssEl = document.getElementById('filter-search-strict');
        if (fmmEl) fmmEl.disabled = true;
        if (fssEl) fssEl.disabled = false;
        
        btnCompare.disabled      = false;
      } else {
        sectionFilters.classList.remove('unlocked');
        sectionFilters.classList.add('card-disabled');
        btnCompare.disabled = true;
      }
    }
  }

  // ─── Indexer selection ────────────────────────────────────
  function onIndexerChange() {
    const t1Id = selectT1.value;
    const t2Id = selectT2.value;

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

  selectT1.addEventListener('change', onIndexerChange);
  selectT2.addEventListener('change', onIndexerChange);

  // ─── Step 3: Compare ─────────────────────────────────────
  async function runComparison() {
    const t1Id = selectT1.value;
    const t2Id = selectT2.value;

    if (!t1Id || !t2Id || t1Id === t2Id) {
      log('Sélectionnez deux indexeurs différents.', 'warn');
      return;
    }

    const query     = filterQuery.value.trim();
    const cat       = filterCat.value;
    const limit     = parseInt(filterLimit.value) || 100;
    const matchMode = filterMatchMode.value;
    const t1Name    = indexerName(t1Id, 'T1');
    const t2Name    = indexerName(t2Id, 'T2');
    updateTrackerBadges(t1Name, t2Name);

    // UI — loading state
    btnCompare.classList.add('loading');
    btnCompare.disabled = true;
    progressContainer.style.display = 'block';
    progressBar.style.width      = '0%';
    progressBar.style.background = '';
    progressLabel.textContent    = `${t('parallel-search')} ${t1Name} ${t('and')} ${t2Name}…`;
    emptyState.style.display     = 'none';
    resultsTable.style.display   = 'none';
    resultsBody.innerHTML        = '';
    paginationBar.style.display  = 'none';

    log(`Lancement: "${t1Name}" vs "${t2Name}"`, 'info');
    if (query) log(`Recherche: "${query}"`, 'info');

    try {
      const subcat     = filterSubcat.value;
      const baseParams = new URLSearchParams();
      if (query)  baseParams.set('query', query);
      // Subcategory takes priority over main category when selected
      if (subcat) baseParams.set('categories', subcat);
      else if (cat) baseParams.set('categories', cat);
      baseParams.set('limit', limit);
      baseParams.set('type', 'search');

      const paramsT1 = new URLSearchParams(baseParams);
      paramsT1.set('indexerIds', t1Id);
      const paramsT2 = new URLSearchParams(baseParams);
      paramsT2.set('indexerIds', t2Id);

      progressBar.style.width = '20%';

      const indexer1 = findIndexer(t1Id);
      const indexer2 = findIndexer(t2Id);

      // Parallel search — both indexers at the same time
      const [resT1, resT2] = await Promise.all([
        performSearch(indexer1, paramsT1, query, cat, limit),
        performSearch(indexer2, paramsT2, query, cat, limit)
      ]);

      resultsT1 = resT1 || [];
      resultsT2 = resT2 || [];
      log(`${resultsT1.length} résultat(s) sur ${t1Name}`, 'ok');
      log(`${resultsT2.length} résultat(s) sur ${t2Name}`, 'ok');

      progressBar.style.width   = '80%';
      progressLabel.textContent = t('comparing');

      compareResults(matchMode);

      progressBar.style.width   = '100%';
      progressLabel.textContent = t('compare-done');

      saveHistory({
        query: query,
        cat: cat ? (subcat || cat) : '',
        mode: 'compare',
        count: resultsT1.length + resultsT2.length,
        t1: t1Name,
        t2: t2Name,
        date: new Date().toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US') + ' ' + new Date().toLocaleTimeString(currentLang === 'fr' ? 'fr-FR' : 'en-US', {hour: '2-digit', minute: '2-digit'})
      });

      // Overlap percentage (relative to the union of unique keys)
      const totalUnionKeys = (new Set([
        ...resultsT1.map(r => normalizeTitle(r.title)),
        ...resultsT2.map(r => normalizeTitle(r.title))
      ])).size;
      const overlapPct = totalUnionKeys > 0
        ? Math.round((commonResults.length / totalUnionKeys) * 100)
        : 0;

      // Animate stats
      animateValue(statT1,        resultsT1.length);
      animateValue(statT2,        resultsT2.length);
      animateValue(statCommon,    commonResults.length);
      animateValue(statUniqueT1,  uniqueT1Results.length);
      animateValue(statUniqueT2,  uniqueT2Results.length);
      statOverlap.textContent = overlapPct + '%';

      // Tab labels with counts
      document.getElementById('tab-unique-t2').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        ${t('tab-missing-on')} ${escapeHtml(t1Name)} <span class="tab-count">${uniqueT2Results.length}</span>
      `;
      document.getElementById('tab-unique-t1').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        ${t('tab-missing-on')} ${escapeHtml(t2Name)} <span class="tab-count">${uniqueT1Results.length}</span>
      `;
      document.getElementById('tab-common').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        ${t('tab-common')} <span class="tab-count">${commonResults.length}</span>
      `;

      if (exportTrigger) exportTrigger.disabled = false;
      btnReset.disabled     = false;
      currentPage = 0;
      renderResults();

      log(
        `Terminé — ${uniqueT2Results.length} manquant(s) sur ${t1Name}, ` +
        `${uniqueT1Results.length} manquant(s) sur ${t2Name}, ` +
        `${commonResults.length} en commun (${overlapPct}% overlap)`,
        'ok'
      );

      setTimeout(() => { progressContainer.style.display = 'none'; }, 2000);

    } catch (err) {
      log(`Erreur: ${err.message}`, 'error');
      progressLabel.textContent    = t('compare-error');
      progressBar.style.width      = '100%';
      progressBar.style.background = 'var(--accent-danger)';
    } finally {
      btnCompare.classList.remove('loading');
      btnCompare.disabled = false;
    }
  }

  // ─── Step 3: Multi-Search ────────────────────────────────
  async function runMultiSearch() {
    if (searchSelectedIds.size === 0) {
      log('Veuillez sélectionner au moins un indexeur.', 'warn');
      return;
    }

    const query     = filterQuery.value.trim();
    const cat       = filterCat.value;
    const subcat    = filterSubcat.value;
    const limit     = parseInt(filterLimit.value) || 100;

    // Convert to query string for prowlarr requests
    const baseParams = new URLSearchParams();
    if (query) baseParams.set('query', query);
    if (subcat) baseParams.set('categories', subcat);
    else if (cat) baseParams.set('categories', cat);
    baseParams.set('limit', limit);
    baseParams.set('type', 'search');
    
    // UI Loading state
    resultsTable.style.display  = 'none';
    paginationBar.style.display = 'none';
    emptyState.style.display    = 'none';
    progressContainer.style.display = 'block';
    progressBar.style.width   = '0%';
    progressLabel.textContent = `${t('searching-on')} ${searchSelectedIds.size} ${t('trackers-label')}...`;

    btnCompare.disabled = true;
    btnCompare.innerHTML = `<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg><span id="btn-run-text">${t('searching-btn')}</span>`;

    try {
      const selectedIndexers = allIndexers.filter(i => searchSelectedIds.has(String(i.id)));
      let done = 0;
      const total = selectedIndexers.length;
      multiSearchResults = [];
      
      const promises = selectedIndexers.map(async (idx) => {
        try {
          const params = new URLSearchParams(baseParams);
          if (!idx.isManual) params.set('indexerIds', idx.id);
          const results = await performSearch(idx, params.toString(), query, (subcat || cat), limit);
          done++;
          progressBar.style.width = Math.round((done / total) * 100) + '%';
          
          log(`Indexeur ${idx.name} : ${results.length} résultats obtenus`, 'info');
          
          // Inject standard properties
          return results.map(r => ({
            ...r,
            sourceTracker: idx.name
          }));
        } catch (err) {
          done++;
          progressBar.style.width = Math.round((done / total) * 100) + '%';
          log(`Erreur avec l'indexeur ${idx.name} : ${err.message}`, 'error');
          return [];
        }
      });

      const allResults = await Promise.allSettled(promises);
      
      allResults.forEach(res => {
        if (res.status === 'fulfilled') {
          multiSearchResults.push(...res.value);
        }
      });
      
      // Strict post-filtering to remove vague indexer matches (e.g., stemming "Wardi" to "Warrior")
      if (query) {
        const normQ = normalizeString(query);
        multiSearchResults = multiSearchResults.filter(r => normalizeString(r.title).includes(normQ));
      }
      
      log(`Recherche globale terminée : ${multiSearchResults.length} résultats pertinents extraits.`, 'ok');

      saveHistory({
        query: query,
        cat: cat ? (subcat || cat) : '',
        mode: 'search',
        count: multiSearchResults.length,
        date: new Date().toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US') + ' ' + new Date().toLocaleTimeString(currentLang === 'fr' ? 'fr-FR' : 'en-US', {hour: '2-digit', minute: '2-digit'})
      });

      // Sort globally by seeders descending
      multiSearchResults.sort((a,b) => (b.seeders||0) - (a.seeders||0));
      
      const filterEl = document.getElementById('results-indexer-filter');
      if (filterEl) {
        filterEl.innerHTML = '<option value="">Tous les indexeurs</option>';
        selectedIndexers.forEach(idx => {
          filterEl.innerHTML += `<option value="${idx.name}">${idx.name}</option>`;
        });
      }

      currentPage = 0;
      sortCol = 'seeders';
      sortDir = 'desc';
      
      setTimeout(() => { progressContainer.style.display = 'none'; }, 2000);
      renderResults();

    } catch (err) {
      log('Erreur fatale de recherche', 'error');
      console.error(err);
      progressContainer.style.display = 'none';
    } finally {
      btnCompare.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span id="btn-run-text">${t('btn-run-search')}</span>`;
      btnCompare.disabled = false;
    }
  }

  // ─── Dispatcher ──────────────────────────────────────────
  function handleMainAction() {
    if (appMode === 'compare') {
      runComparison();
    } else {
      runMultiSearch();
    }
  }

  // ─── Search API Dispatcher ────────────────────────────────
  async function performSearch(indexer, prowlarrParams, query, cat, limit) {
    if (indexer.isManual) {
      log(`🔎 Recherche externe Torznab sur: ${indexer.name}`, 'info');
      return await fetchTorznab(indexer, query, cat, limit);
    } else {
      const res = await apiFetch(`/api/v1/search?${prowlarrParams}`);
      if (!res.ok) throw new Error(`Erreur Prowlarr HTTP ${res.status}`);
      return await res.json();
    }
  }

  async function fetchTorznab(indexer, query, cat, limit) {
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
    
    // Check for torznab API error
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
        size: size,
        seeders: seeders,
        leechers: leechers,
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

  // ─── Comparison logic ─────────────────────────────────────
  function compareResults(matchMode) {
    resultsT1.forEach(r => r._source = 't1');
    resultsT2.forEach(r => r._source = 't2');

    commonResults   = [];
    uniqueT1Results = [];
    uniqueT2Results = [];

    if (matchMode === 'fuzzy') {
      // Fuzzy mode: name Jaccard similarity, reinforced by size proximity
      // Match if:  nameSim >= 0.6  (name alone sufficient)
      //        OR  nameSim >= 0.35 AND size difference <= 2% (name + size)
      const NAME_THRESHOLD      = 0.6;
      const NAME_SIZE_THRESHOLD = 0.35;
      const SIZE_TOLERANCE      = 0.02;  // 2 %

      const t2Pool = resultsT2.map(r => ({
        release: r,
        tokens:  tokenSet(r.title),
        matched: false
      }));

      let matchedByName = 0, matchedBySize = 0;

      resultsT1.forEach(r1 => {
        const tokensA  = tokenSet(r1.title);
        let bestScore  = -1;
        let bestEntry  = null;
        let bestMethod = null;

        t2Pool.forEach(entry => {
          if (entry.matched) return;
          const nameSim = jaccard(tokensA, entry.tokens);

          // Name-only match
          if (nameSim >= NAME_THRESHOLD && nameSim > bestScore) {
            bestScore = nameSim; bestEntry = entry; bestMethod = 'nom';
            return;
          }
          // Name + size match
          if (nameSim >= NAME_SIZE_THRESHOLD && r1.size && entry.release.size) {
            const larger = Math.max(r1.size, entry.release.size);
            const diff   = Math.abs(r1.size - entry.release.size) / larger;
            if (diff <= SIZE_TOLERANCE && nameSim > bestScore) {
              bestScore = nameSim; bestEntry = entry; bestMethod = 'nom+taille';
            }
          }
        });

        if (bestEntry) {
          commonResults.push({ t1: r1, t2: bestEntry.release, score: bestScore, method: bestMethod });
          bestEntry.matched = true;
          if (bestMethod === 'nom') matchedByName++; else matchedBySize++;
        } else {
          uniqueT1Results.push(r1);
        }
      });

      t2Pool.forEach(entry => {
        if (!entry.matched) uniqueT2Results.push(entry.release);
      });

      log(
        `Mode fuzzy — ${commonResults.length} paires ` +
        `(${matchedByName} par nom, ${matchedBySize} par nom+taille)`,
        'info'
      );

    } else {
      function getKey(release) {
        return normalizeTitle(release.title);
      }

      const t1Keys = new Map();
      resultsT1.forEach(r => { const k = getKey(r); if (!t1Keys.has(k)) t1Keys.set(k, r); });

      const t2Keys = new Map();
      resultsT2.forEach(r => { const k = getKey(r); if (!t2Keys.has(k)) t2Keys.set(k, r); });

      t1Keys.forEach((release, key) => {
        if (t2Keys.has(key)) {
          commonResults.push({ t1: release, t2: t2Keys.get(key) });
        } else {
          uniqueT1Results.push(release);
        }
      });

      t2Keys.forEach((release, key) => {
        if (!t1Keys.has(key)) uniqueT2Results.push(release);
      });

      log(`Clés uniques: T1=${t1Keys.size}, T2=${t2Keys.size}`, 'info');
    }
  }

  // ─── Render results ───────────────────────────────────────
  function getFilteredSorted() {
    const query = (resultsSearch.value || '').toLowerCase().trim();
    let data;

    if (currentTab === 'search') {
      data = multiSearchResults;
      pageInfo.textContent = `${t('page-mode-search')} (${data.length})`;
      
      const filterIndexer = document.getElementById('results-indexer-filter')?.value;
      if (filterIndexer) {
        data = data.filter(r => r.sourceTracker === filterIndexer);
      }

      if (query) {
        const normQ = normalizeString(query);
        data = data.filter(r => normalizeString(r.title || '').includes(normQ));
      }
      if (sortCol) {
        data = [...data].sort((a, b) => {
          let va, vb;
          switch (sortCol) {
            case 'title':    va = a.title || '';      vb = b.title || '';      break;
            case 'category': va = getCategoryName(a); vb = getCategoryName(b); break;
            case 'size':     va = a.size     || 0;    vb = b.size     || 0;    break;
            case 'seeders':  va = a.seeders  || 0;    vb = b.seeders  || 0;    break;
            case 'leechers': va = a.leechers || 0;    vb = b.leechers || 0;    break;
            case 'age':      va = a.publishDate || ''; vb = b.publishDate || ''; break;
            default: va = ''; vb = '';
          }
          if (typeof va === 'string')
            return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
          return sortDir === 'asc' ? va - vb : vb - va;
        });
      }
    } else if (currentTab === 'common') {
      data = commonResults;
      if (query) {
        const normQ = normalizeString(query);
        data = data.filter(p =>
          normalizeString(p.t1.title || '').includes(normQ) ||
          normalizeString(p.t2.title || '').includes(normQ)
        );
      }
      if (sortCol) {
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
          const va1 = getVal(a, sortCol), vb1 = getVal(b, sortCol);
          let cmp1 = typeof va1 === 'string' ? va1.localeCompare(vb1) : va1 - vb1;
          if (sortDir === 'desc') cmp1 = -cmp1;
          
          if (cmp1 !== 0) return cmp1;
          
          if (sortSecondary.col) {
            const va2 = getVal(a, sortSecondary.col), vb2 = getVal(b, sortSecondary.col);
            let cmp2 = typeof va2 === 'string' ? va2.localeCompare(vb2) : va2 - vb2;
            return sortSecondary.dir === 'desc' ? -cmp2 : cmp2;
          }
          return 0;
        });
      }
    } else {
      data = currentTab === 'unique-t2' ? uniqueT2Results : uniqueT1Results;
      if (query) {
        const normQ = normalizeString(query);
        data = data.filter(r => normalizeString(r.title || '').includes(normQ));
      }
      if (sortCol) {
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
          const va1 = getVal(a, sortCol), vb1 = getVal(b, sortCol);
          let cmp1 = typeof va1 === 'string' ? va1.localeCompare(vb1) : va1 - vb1;
          if (sortDir === 'desc') cmp1 = -cmp1;
          
          if (cmp1 !== 0) return cmp1;
          
          if (sortSecondary.col) {
            const va2 = getVal(a, sortSecondary.col), vb2 = getVal(b, sortSecondary.col);
            let cmp2 = typeof va2 === 'string' ? va2.localeCompare(vb2) : va2 - vb2;
            return sortSecondary.dir === 'desc' ? -cmp2 : cmp2;
          }
          return 0;
        });
      }
    }

    return data;
  }

  function renderResults() {
    const data          = getFilteredSorted();
    const hasAnyResults = resultsT1.length > 0 || resultsT2.length > 0;

    resultsBody.innerHTML      = '';
    paginationBar.style.display = 'none';

    if (data.length === 0 && hasAnyResults) {
      emptyState.style.display   = 'none';
      resultsTable.style.display = 'table';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">${t('no-filter-result')}</td>`;
      resultsBody.appendChild(tr);
      return;
    }

    if (data.length === 0) {
      emptyState.style.display   = 'flex';
      resultsTable.style.display = 'none';
      return;
    }

    emptyState.style.display   = 'none';
    resultsTable.style.display = 'table';

    const t1Name    = indexerName(selectT1.value, 'T1');
    const t2Name    = indexerName(selectT2.value, 'T2');
    const pageStart = currentPage * PAGE_SIZE;
    const pageEnd   = Math.min(pageStart + PAGE_SIZE, data.length);
    const pageData  = data.slice(pageStart, pageEnd);

    const frag = document.createDocumentFragment();

    if (currentTab === 'search') {
      // Single mixed list for global search
      pageData.forEach((release, idx) => {
        frag.appendChild(makeRow(
          release,
          release.sourceTracker || 'Inconnu',
          'dynamic',
          idx
        ));
      });
    } else if (currentTab === 'common') {
      // Side-by-side: one row per indexer, visually grouped by pair
      pageData.forEach((pair, idx) => {
        frag.appendChild(makeCommonRow(pair.t1, t1Name, 't1', idx, pair));
        frag.appendChild(makeCommonRow(pair.t2, t2Name, 't2', idx, pair));
      });
    } else {
      pageData.forEach((release, idx) => {
        const isT1 = release._source === 't1';
        frag.appendChild(makeRow(
          release,
          isT1 ? t1Name : t2Name,
          isT1 ? 'source-t1' : 'source-t2',
          idx
        ));
      });
    }

    resultsBody.appendChild(frag);

    // Pagination controls
    const totalPages = Math.ceil(data.length / PAGE_SIZE);
    if (totalPages > 1) {
      paginationBar.style.display = 'flex';
      pageInfo.textContent =
        `${t('page-label')} ${currentPage + 1} ${t('page-sep')} ${totalPages} — ${pageStart + 1}–${pageEnd} ${t('page-of')} ${data.length}`;
      btnPagePrev.disabled = currentPage === 0;
      btnPageNext.disabled = currentPage >= totalPages - 1;
    }
  }

  // ─── Utility: String to HSL Color ───────────────────────
  function stringToColorStyle(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `background: hsl(${h}, 60%, 15%); color: hsl(${h}, 90%, 80%); border: 1px solid hsl(${h}, 60%, 30%);`;
  }

function makeRow(release, sourceName, sourceClass, idx) {
    const tr        = document.createElement('tr');
    tr.style.animationDelay = `${Math.min(idx * 0.015, 0.4)}s`;
    const seeders    = release.seeders || 0;
    const leechers   = release.leechers ?? release.peers ?? 0;
    const seedClass  = seeders >= 10 ? 'high' : seeders >= 3 ? 'mid' : 'low';
    const trackerUrl  = getTrackerUrl(release);
    const downloadUrl = release.downloadUrl || '#';
    const magnetUrl   = release.magnetUrl || '#';
    
    const inlineStyle = stringToColorStyle(sourceName);
    const badgeClass = 'source-badge';

    const favActive = isInWatchlist(release);
    const starColor = favActive ? 'currentColor' : 'none';
    const starClass = favActive ? 'fav-btn active' : 'fav-btn';
    
    tr.innerHTML = `
      <td><span class="${badgeClass}" style="${inlineStyle}" title="${escapeHtml(sourceName)}">${escapeHtml(sourceName)}</span></td>
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
          ? `<button type="button" class="link-btn link-btn-magnet" title="${t('copy-magnet')}" data-magnet="${escapeHtml(magnetUrl)}">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 15A6 6 0 1 0 18 15V5h-4v10a2 2 0 0 1-4 0V5H6v10z"/></svg>
               Magnet</button>`
          : '–'}</td>
      <td><button class="btn-icon btn-icon-sm ${starClass}"><svg viewBox="0 0 24 24" fill="${starColor}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button></td>
    `;
    
    const favBtn = tr.querySelector('.fav-btn');
    if (favBtn) {
      favBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWatchlist(release); // will re-render list and buttons
        renderResults(); // re-renders current table
      });
    }

    return tr;
  }

  function makeCommonRow(release, sourceName, side, groupIdx, pair) {
    const tr        = document.createElement('tr');
    tr.className    = `common-row common-${side}` + (groupIdx % 2 === 0 ? ' common-even' : ' common-odd');
    const seeders   = release.seeders || 0;
    const seedClass = seeders >= 10 ? 'high' : seeders >= 3 ? 'mid' : 'low';
    const inlineStyle = stringToColorStyle(sourceName);
    const badgeClass = 'source-badge';
    const trackerUrl = getTrackerUrl(release);

    const leechers    = release.leechers ?? release.peers ?? 0;
    const downloadUrl = release.downloadUrl || '#';
    const magnetUrl   = release.magnetUrl || '#';
    const favActive = isInWatchlist(release);
    const starColor = favActive ? 'currentColor' : 'none';
    const starClass = favActive ? 'fav-btn active' : 'fav-btn';

    tr.innerHTML = `
      <td><span class="${badgeClass}" style="${inlineStyle}" title="${escapeHtml(sourceName)}">${escapeHtml(sourceName)}</span></td>
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
          ? `<button type="button" class="link-btn link-btn-magnet" title="${t('copy-magnet')}" data-magnet="${escapeHtml(magnetUrl)}">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 15A6 6 0 1 0 18 15V5h-4v10a2 2 0 0 1-4 0V5H6v10z"/></svg>
               Magnet</button>`
          : '–'}</td>
      <td><button class="btn-icon btn-icon-sm ${starClass}" data-fav-title="${escapeHtml(release.title || '')}"><svg viewBox="0 0 24 24" fill="${starColor}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button></td>
    `;

    const favBtn = tr.querySelector('.fav-btn');
    if (favBtn) {
      favBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWatchlist(release); // will re-render list and buttons
        renderResults(); // re-renders current table
      });
    }

    return tr;
  }

  // ─── Tabs ─────────────────────────────────────────────────
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('tab-active'));
      btn.classList.add('tab-active');
      currentTab  = btn.dataset.tab;
      currentPage = 0;
      renderResults();
    });
  });

  // ─── Column sorting ───────────────────────────────────────
  document.querySelectorAll('.results-table thead th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (sortCol === col) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortCol = col;
        sortDir = 'asc';
      }
      document.querySelectorAll('.results-table thead th').forEach(h => {
        h.classList.remove('sorted-asc', 'sorted-desc');
        const icon = h.querySelector('.sort-icon');
        if (icon) icon.textContent = '↕';
      });
      th.classList.add(sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
      const icon = th.querySelector('.sort-icon');
      if (icon) icon.textContent = sortDir === 'asc' ? '↑' : '↓';
      currentPage = 0;
      renderResults();
    });
  });

  // ─── Search filter ────────────────────────────────────────
  let searchTimeout;
  resultsSearch.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { currentPage = 0; renderResults(); }, 200);
  });
  
  const filterIndexerEl = document.getElementById('results-indexer-filter');
  if (filterIndexerEl) {
    filterIndexerEl.addEventListener('change', () => {
      currentPage = 0;
      renderResults();
    });
  }

  // ─── Pagination ───────────────────────────────────────────
  btnPagePrev.addEventListener('click', () => {
    if (currentPage > 0) { currentPage--; renderResults(); window.scrollTo(0, 0); }
  });
  btnPageNext.addEventListener('click', () => {
    currentPage++; renderResults(); window.scrollTo(0, 0);
  });

  // ─── Reset ────────────────────────────────────────────────
  btnReset.addEventListener('click', () => {
    resultsT1 = []; resultsT2 = [];
    commonResults = []; uniqueT1Results = []; uniqueT2Results = [];
    multiSearchResults = [];
    currentPage = 0; sortCol = null; sortDir = 'asc';
    resultsSearch.value = '';

    [statT1, statT2, statCommon, statUniqueT1, statUniqueT2].forEach(el => el.textContent = '–');
    statOverlap.textContent = '–';

    emptyState.style.display    = 'flex';
    resultsTable.style.display  = 'none';
    paginationBar.style.display = 'none';

    if (exportTrigger) exportTrigger.disabled = true;
    btnReset.disabled     = true;

    // Reset tab labels
    document.getElementById('tab-unique-t2').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      ${t('tab-missing-on')} T1
    `;
    document.getElementById('tab-unique-t1').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      ${t('tab-missing-on')} T2
    `;
    document.getElementById('tab-common').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      ${t('tab-common')}
    `;

    // Reset sort icons
    document.querySelectorAll('.results-table thead th').forEach(h => {
      h.classList.remove('sorted-asc', 'sorted-desc');
      const icon = h.querySelector('.sort-icon');
      if (icon) icon.textContent = '↕';
    });

    log('Résultats réinitialisés.', 'info');
  });
  
  // ─── Mode Switcher ─────────────────────────────────────────
  const modeBtns = document.querySelectorAll('.mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('mode-btn-active'));
      btn.classList.add('mode-btn-active');
      appMode = btn.dataset.mode;
      
      const compareSelectors = document.getElementById('compare-selectors');
      const searchSelectors = document.getElementById('search-selectors');
      const btnRunText = document.getElementById('btn-run-text');
      const statsBar = document.getElementById('stats-bar');
      const tabsBar = document.getElementById('tabs-bar');
      const filterMatchMode = document.getElementById('filter-match-mode');
      const filterSearchStrict = document.getElementById('filter-search-strict');
      const resultsIdxFilter = document.getElementById('results-indexer-filter');
      const historyPanel = document.getElementById('history-panel');
      const watchlistPanel = document.getElementById('watchlist-panel');
      const tableContainer = document.getElementById('table-container');
      const resultsToolbar = document.querySelector('.results-toolbar');
      const paginationBar = document.getElementById('pagination-bar');
      
      if (appMode === 'compare') {
        compareSelectors.style.display = 'block';
        searchSelectors.style.display = 'none';
        btnRunText.textContent = t('btn-run-compare');
        statsBar.style.display = 'flex';
        tabsBar.style.display = 'flex';
        if (filterMatchMode) filterMatchMode.closest('.form-group').style.display = 'block';
        if (filterSearchStrict) filterSearchStrict.closest('.form-group').style.display = 'none';
        if (resultsIdxFilter) resultsIdxFilter.style.display = 'none';
        currentTab = 'unique-t2';
      } else if (appMode === 'search') {
        compareSelectors.style.display = 'none';
        searchSelectors.style.display = 'block';
        btnRunText.textContent = t('btn-run-search');
        statsBar.style.display = 'none';
        tabsBar.style.display = 'none';
        if (filterMatchMode) filterMatchMode.closest('.form-group').style.display = 'none';
        if (filterSearchStrict) filterSearchStrict.closest('.form-group').style.display = 'block';
        if (resultsIdxFilter) resultsIdxFilter.style.display = 'block';
        currentTab = 'search';
      } else if (appMode === 'history' || appMode === 'watchlist') {
        // Keep the left panel on its last visual state (either search or compare form), 
        // just update the right panel viewing modes.
        statsBar.style.display = 'none';
        tabsBar.style.display = 'none';
      }
      
      // Right panel visibility mapping
      if (historyPanel) historyPanel.style.display = (appMode === 'history') ? 'block' : 'none';
      if (watchlistPanel) watchlistPanel.style.display = (appMode === 'watchlist') ? 'block' : 'none';
      
      if (appMode === 'search' || appMode === 'compare') {
        if (tableContainer) tableContainer.style.display = 'block';
        if (resultsToolbar) resultsToolbar.style.display = 'flex';
        checkStep3Unlock();
        renderResults();
      } else {
        if (tableContainer) tableContainer.style.display = 'none';
        if (resultsToolbar) resultsToolbar.style.display = 'none';
        if (paginationBar) paginationBar.style.display = 'none';
        if (appMode === 'history') renderHistory();
        if (appMode === 'watchlist') renderWatchlist();
      }
    });
  });
  
  document.getElementById('btn-search-select-all')?.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.multi-select-container input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => {
      cb.checked = !allChecked;
      if (!allChecked) searchSelectedIds.add(cb.value);
      else searchSelectedIds.delete(cb.value);
    });
    checkStep3Unlock();
  });

  function selectByProtocol(targetProtocol) {
    const checkboxes = document.querySelectorAll('.multi-select-container input[type="checkbox"]');
    
    // Check if ALL matching protocols are currently checked
    let allMatchingChecked = true;
    checkboxes.forEach(cb => {
      const idx = allIndexers.find(i => i.id == cb.value);
      if (!idx) return;
      let proto = idx.protocol ? idx.protocol.toLowerCase() : '';
      if (idx.isManual) proto = 'torrent';
      if (proto === targetProtocol && !cb.checked) {
        allMatchingChecked = false;
      }
    });

    checkboxes.forEach(cb => {
      const idx = allIndexers.find(i => i.id == cb.value);
      if (!idx) return;
      let proto = idx.protocol ? idx.protocol.toLowerCase() : '';
      if (idx.isManual) proto = 'torrent';

      if (proto === targetProtocol) {
        // Toggle them
        cb.checked = !allMatchingChecked;
        if (cb.checked) searchSelectedIds.add(cb.value);
        else searchSelectedIds.delete(cb.value);
      } else {
        // Always uncheck non-matching protocols when we use a quick-filter
        cb.checked = false;
        searchSelectedIds.delete(cb.value);
      }
    });
    checkStep3Unlock();
  }

  document.getElementById('btn-search-select-torrent')?.addEventListener('click', () => {
    selectByProtocol('torrent');
  });
  document.getElementById('btn-search-select-usenet')?.addEventListener('click', () => {
    selectByProtocol('usenet');
  });



  // ─── Event bindings ───────────────────────────────────────
  btnConnect.addEventListener('click', testConnection);
  btnCompare.addEventListener('click', handleMainAction);
  prowlarrUrl.addEventListener('keydown',  e => { if (e.key === 'Enter') testConnection(); });
  prowlarrApiKey.addEventListener('keydown', e => { if (e.key === 'Enter') testConnection(); });
  filterQuery.addEventListener('keydown',  e => { if (e.key === 'Enter') handleMainAction(); });
  
  btnThemeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme_preference', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme_preference', 'dark');
    }
  });

  // ─── Language select ──────────────────────────────────────
  langSelect.addEventListener('change', () => {
    applyLang(langSelect.value);
  });

  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang_preference', lang);
    document.documentElement.lang = lang;

    // Sync the select value
    langSelect.value = lang;

    // Header
    document.getElementById('app-subtitle').innerHTML = t('app-subtitle');
    document.getElementById('mode-btn-search-text').textContent = t('mode-search');
    document.getElementById('mode-btn-compare-text').textContent = t('mode-compare');
    document.getElementById('btn-theme-toggle').title = t('btn-theme-title');
    document.getElementById('btn-open-settings').title = t('btn-settings-title');

    // Status — only update if still showing the "disconnected" state
    const stEl = document.getElementById('header-status-text');
    if (stEl && (stEl.textContent === 'Non connecté' || stEl.textContent === 'Not connected')) {
      stEl.textContent = t('status-disconnected');
    }

    // Step 1
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

    // Step 2
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
    document.getElementById('label-limit').textContent         = t('label-limit');
    document.getElementById('label-method').textContent        = t('label-method');
    document.getElementById('method-fuzzy').textContent        = t('method-fuzzy');
    document.getElementById('method-norm').textContent         = t('method-norm');
    document.getElementById('label-filter-mode').textContent   = t('label-filter-mode');
    document.getElementById('filter-strict').textContent       = t('filter-strict');
    document.getElementById('filter-off').textContent          = t('filter-off');
    const btnRunTextEl = document.getElementById('btn-run-text');
    if (btnRunTextEl) {
      btnRunTextEl.textContent = appMode === 'compare' ? t('btn-run-compare') : t('btn-run-search');
    }

    // Stats
    _updateStatLabels();

    // Results tabs (reset state)
    document.getElementById('tab-unique-t2').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      ${t('tab-missing-on')} T1
    `;
    document.getElementById('tab-unique-t1').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      ${t('tab-missing-on')} T2
    `;
    document.getElementById('tab-common').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      ${t('tab-common')}
    `;

    // Toolbar
    document.getElementById('results-search').placeholder      = t('filter-title-placeholder');
    const allIdxOpt = document.getElementById('all-indexers-option');
    if (allIdxOpt) allIdxOpt.textContent = t('all-indexers');
    const exportCsvAllEl = document.getElementById('export-csv-all-text');
    if (exportCsvAllEl) exportCsvAllEl.textContent = t('export-csv-all');
    const exportJsonAllEl = document.getElementById('export-json-all-text');
    if (exportJsonAllEl) exportJsonAllEl.textContent = t('export-json-all');
    document.getElementById('btn-reset-text').textContent      = t('btn-reset');
    document.getElementById('btn-reset').title                 = t('btn-reset-title');

    // Empty state
    document.getElementById('empty-title').textContent         = t('empty-title');
    document.getElementById('empty-desc').innerHTML            = t('empty-desc');

    // Table headers (preserve sort icons)
    document.getElementById('th-source').textContent = t('th-source');
    document.getElementById('th-title').innerHTML    = t('th-title') + ' <span class="sort-icon">↕</span>';
    document.getElementById('th-category').innerHTML = t('th-category') + ' <span class="sort-icon">↕</span>';
    document.getElementById('th-size').innerHTML     = t('th-size') + ' <span class="sort-icon">↕</span>';
    document.getElementById('th-age').innerHTML      = t('th-age') + ' <span class="sort-icon">↕</span>';
    document.getElementById('th-link').textContent   = t('th-link');
    document.getElementById('th-torrent').textContent = t('th-torrent');

    // Pagination
    document.getElementById('btn-prev-text').textContent = t('btn-prev');
    document.getElementById('btn-next-text').textContent = t('btn-next');

    // Log
    document.getElementById('log-summary').textContent       = t('log-summary');
    document.getElementById('btn-clear-log-text').textContent = t('btn-clear-log');

    // Settings modal
    document.getElementById('modal-title').textContent          = t('modal-settings-title');
    document.getElementById('settings-section1').textContent    = t('settings-section1');
    document.getElementById('label-prowlarr-url').textContent   = t('label-prowlarr-url');
    document.getElementById('label-prowlarr-apikey').textContent = t('label-prowlarr-apikey');
    document.getElementById('btn-connect-text').textContent     = t('btn-connect');
    document.getElementById('settings-section2-text').textContent = t('settings-section2');
    document.getElementById('btn-add-manual-header-text').textContent = t('btn-add-header');
    document.getElementById('manual-desc').textContent          = t('manual-desc');

    // Manual indexer modal
    document.getElementById('modal-manual-title').textContent  = t('modal-manual-title');
    document.getElementById('label-manual-name').textContent   = t('label-manual-name');
    document.getElementById('manual-name').placeholder         = t('manual-name-placeholder');
    document.getElementById('label-manual-url').textContent    = t('label-manual-url');
    document.getElementById('manual-url').placeholder          = t('manual-url-placeholder');
    document.getElementById('label-manual-apikey').textContent = t('label-manual-apikey');
    document.getElementById('manual-apikey').placeholder       = t('manual-apikey-placeholder');

    // Re-render to apply translated size/age/labels
    renderManualIndexersList();
    if (resultsT1.length > 0 || resultsT2.length > 0 || multiSearchResults.length > 0) {
      renderResults();
    }
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


  // ─── Manual Indexer Modal Logic ─────────────────────────────────
  const btnOpenManual     = document.getElementById('btn-open-manual');
  const modalManualOverlay= document.getElementById('modal-manual-overlay');
  const btnManualClose    = document.getElementById('btn-manual-close');
  const btnAddManual      = document.getElementById('btn-add-manual');
  const inputManualName   = document.getElementById('manual-name');
  const inputManualUrl    = document.getElementById('manual-url');
  const inputManualApiKey = document.getElementById('manual-apikey');
  const manualEditId      = document.getElementById('manual-edit-id');
  const manualIndexersList= document.getElementById('manual-indexers-list');

  function saveManualIndexers() {
    localStorage.setItem('manual_indexers', JSON.stringify(manualIndexers));
    allIndexers = allIndexers.filter(i => !i.isManual).concat(manualIndexers);
    populateSelectors();
    renderManualIndexersList();
    persistConfig();
  }

  function renderManualIndexersList() {
    manualIndexersList.innerHTML = '';
    if (manualIndexers.length === 0) {
      manualIndexersList.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:10px;">${t('no-manual-indexers')}</div>`;
      return;
    }
    manualIndexers.forEach(idx => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.background = 'var(--bg-surface)';
      row.style.padding = '8px 12px';
      row.style.borderRadius = 'var(--radius-sm)';
      row.style.border = '1px solid var(--bg-card-border)';
      
      const info = document.createElement('div');
      info.style.display = 'flex';
      info.style.flexDirection = 'column';
      info.style.overflow = 'hidden';
      info.style.marginRight = '12px';
      info.innerHTML = `
        <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${escapeHtml(idx.name)}</span>
        <span style="font-size: 0.65rem; color: var(--text-muted); white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${escapeHtml(idx.url)}</span>
      `;
      
      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '6px';
      
      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn-icon btn-icon-sm';
      btnEdit.title = t('btn-edit-title');
      btnEdit.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      btnEdit.onclick = () => {
        manualEditId.value = idx.id;
        inputManualName.value = idx.name;
        inputManualUrl.value = idx.url;
        inputManualApiKey.value = idx.apiKey;
        btnAddManual.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span id="btn-add-manual-text"> ${t('btn-save-manual')}</span>`;
        modalManualOverlay.classList.add('open');
      };
      
      const btnDel = document.createElement('button');
      btnDel.className = 'btn-icon btn-icon-sm btn-icon-danger';
      btnDel.title = t('btn-delete-title');
      btnDel.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>';
      btnDel.onclick = () => {
        if (confirm(`${t('btn-delete-confirm')} "${idx.name}" ?`)) {
          manualIndexers = manualIndexers.filter(i => i.id !== idx.id);
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

  btnOpenManual.addEventListener('click', () => {
    manualEditId.value = '';
    inputManualName.value = '';
    inputManualUrl.value = '';
    inputManualApiKey.value = '';
    btnAddManual.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg><span id="btn-add-manual-text"> ${t('btn-add-manual')}</span>`;
    modalManualOverlay.classList.add('open');
  });
  
  btnManualClose.addEventListener('click', () => modalManualOverlay.classList.remove('open'));
  
  btnAddManual.addEventListener('click', () => {
    const name = inputManualName.value.trim();
    const url = inputManualUrl.value.trim();
    const apiKey = inputManualApiKey.value.trim();
    const editId = manualEditId.value;
    
    if (!name || !url) { log('Nom et URL requis pour le tracker manuel', 'warn'); return; }
    
    if (editId) {
      const idx = manualIndexers.find(i => i.id === editId);
      if (idx) {
        idx.name = name;
        idx.url = url;
        idx.apiKey = apiKey;
        log(`Tracker modifié : ${name}`, 'ok');
      }
    } else {
      const newManual = {
        id: 'manual_' + Date.now(),
        name: name,
        url: url,
        apiKey: apiKey,
        protocol: 'torznab',
        enable: true,
        isManual: true
      };
      manualIndexers.push(newManual);
      log(`Tracker ajouté : ${name}`, 'ok');
    }
    
    saveManualIndexers();
    modalManualOverlay.classList.remove('open');
  });


  let currentHistoryFilter = 'all';
  document.querySelectorAll('.btn-history-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-history-filter').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentHistoryFilter = e.target.dataset.filter;
      renderHistory();
    });
  });

  function saveHistory(entry) {
    searchHistory.unshift(entry);
    if (searchHistory.length > 50) searchHistory = searchHistory.slice(0, 50);
    localStorage.setItem('search_history', JSON.stringify(searchHistory));
    persistData('history', searchHistory);
  }

  function renderHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    
    let filteredHistory = searchHistory;
    if (currentHistoryFilter !== 'all') {
      filteredHistory = searchHistory.filter(h => h.mode === currentHistoryFilter);
    }
    
    if (filteredHistory.length === 0) {
      list.innerHTML = `<div class="empty-panel">${t('history-empty')}</div>`;
      return;
    }
    
    // Check if we have a history search text filter
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
        const entry = searchHistory[+btn.dataset.idx];
        if (!entry) return;
        // Switch to the right mode
        const modeBtn = document.querySelector(`.mode-btn[data-mode="${entry.mode}"]`);
        if (modeBtn) modeBtn.click();
        // Fill in the query
        if (filterQuery) { filterQuery.value = entry.query || ''; }
        if (entry.cat && filterCat) { filterCat.value = entry.cat; filterCat.dispatchEvent(new Event('change')); }
        if (entry.limit && filterLimit) filterLimit.value = entry.limit;
        // Switch back to results view
        const resultsBtn = document.querySelector('.mode-btn[data-mode="search"], .mode-btn[data-mode="compare"]');
        setTimeout(() => handleMainAction(), 100);
      });
    });
    list.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        searchHistory.splice(+btn.dataset.idx, 1);
        localStorage.setItem('search_history', JSON.stringify(searchHistory));
        persistData('history', searchHistory);
        renderHistory();
      });
    });
  }

  document.getElementById('btn-clear-history')?.addEventListener('click', () => {
    if (confirm(t('btn-delete-confirm') || "Êtes-vous sûr de vouloir vider l'historique ?")) {
      if (currentHistoryFilter === 'all') {
        searchHistory = [];
      } else {
        searchHistory = searchHistory.filter(h => h.mode !== currentHistoryFilter);
      }
      localStorage.setItem('search_history', JSON.stringify(searchHistory));
      persistData('history', searchHistory);
      renderHistory();
    }
  });

  // ─── Watchlist ────────────────────────────────────────────
  function isInWatchlist(release) {
    return watchlist.some(w => w.guid === (release.guid || release.title));
  }

  function toggleWatchlist(release) {
    const key = release.guid || release.title;
    const idx = watchlist.findIndex(w => w.guid === key);
    if (idx >= 0) {
      watchlist.splice(idx, 1);
    } else {
      watchlist.push({
        ...release,
        guid: key,
        savedAt: new Date().toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US')
      });
    }
    watchlist = watchlist.slice(0, 200);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    persistData('bookmark', watchlist);
    renderWatchlist();
  }

  document.getElementById('watchlist-indexer-filter')?.addEventListener('change', () => renderWatchlist());
  document.getElementById('watchlist-search')?.addEventListener('input', () => renderWatchlist());
  document.getElementById('history-search')?.addEventListener('input', () => renderHistory());

  function renderWatchlist() {
    const tbody = document.getElementById('watchlist-body');
    const table = document.getElementById('watchlist-table');
    const emptyState = document.getElementById('watchlist-empty-state');
    const filterEl = document.getElementById('watchlist-indexer-filter');
    if (!tbody || !table || !emptyState) return;
    
    if (watchlist.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'flex';
      emptyState.innerHTML = t('watchlist-empty');
      if (filterEl) filterEl.innerHTML = '<option value="">Tous les indexeurs</option>';
      return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    tbody.innerHTML = '';

    // Manage filter dropdown dynamically based on available sources in watchlist
    if (filterEl) {
      const currentVal = filterEl.value;
      const uniqueSources = new Set(watchlist.map(r => r.sourceTracker || r.source || 'Inconnu'));
      filterEl.innerHTML = '<option value="">Tous les indexeurs</option>';
      uniqueSources.forEach(src => {
        filterEl.innerHTML += `<option value="${escapeHtml(src)}" ${src === currentVal ? 'selected' : ''}>${escapeHtml(src)}</option>`;
      });
    }

    const filterVal = filterEl?.value || '';
    const textFilter = document.getElementById('watchlist-search')?.value.toLowerCase() || '';

    // Watchlist data rendering
    const dataToRender = watchlist.filter(r => {
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
      const tr = makeRow(item, srcName, 'dynamic', idx);
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
  }

  document.getElementById('btn-clear-watchlist')?.addEventListener('click', () => {
    if (confirm(t('btn-delete-confirm') || "Êtes-vous sûr de vouloir vider vos favoris ?")) {
      watchlist = [];
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
      persistData('bookmark', watchlist);
      renderWatchlist();
      renderResults();
    }
  });

  // ─── Copy magnet ──────────────────────────────────────────
  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      btn.classList.add('copied');
      const orig = btn.innerHTML;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`;
      setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 1500);
    }).catch(() => {});
  }

  resultsBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.link-btn-magnet');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const magnet = btn.dataset.magnet;
      if (magnet) copyToClipboard(magnet, btn);
    }
  });

  const watchlistList = document.getElementById('watchlist-list');
  if (watchlistList) {
    watchlistList.addEventListener('click', (e) => {
      const btn = e.target.closest('.link-btn-magnet');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const magnet = btn.dataset.magnet;
        if (magnet) copyToClipboard(magnet, btn);
      }
    });
  }

  // ─── Multi-sort ───────────────────────────────────────────
  document.querySelectorAll('.results-table thead th.sortable').forEach(th => {
    th.addEventListener('click', (e) => {
      const col = th.dataset.sort;
      if (e.shiftKey) {
        // Secondary sort
        if (sortSecondary.col === col) {
          sortSecondary.dir = sortSecondary.dir === 'asc' ? 'desc' : 'asc';
        } else {
          sortSecondary = { col, dir: 'asc' };
        }
      } else {
        // Primary sort
        if (sortPrimary.col === col) {
          sortPrimary.dir = sortPrimary.dir === 'asc' ? 'desc' : 'asc';
        } else {
          sortPrimary = { col, dir: 'asc' };
          sortSecondary = { col: null, dir: 'asc' };
        }
        // keep legacy vars in sync
        sortCol = sortPrimary.col;
        sortDir = sortPrimary.dir;
      }
      updateSortIcons();
      currentPage = 0;
      renderResults();
    });
  });

  function updateSortIcons() {
    document.querySelectorAll('.results-table thead th').forEach(h => {
      h.classList.remove('sorted-asc', 'sorted-desc');
      const icon = h.querySelector('.sort-icon');
      if (icon) icon.textContent = '↕';
      if (icon) icon.className = 'sort-icon';
    });
    if (sortPrimary.col) {
      const th = document.querySelector(`.results-table thead th[data-sort="${sortPrimary.col}"]`);
      if (th) {
        th.classList.add(sortPrimary.dir === 'asc' ? 'sorted-asc' : 'sorted-desc');
        const icon = th.querySelector('.sort-icon');
        if (icon) { icon.textContent = sortPrimary.dir === 'asc' ? '↑' : '↓'; icon.classList.add('sort-primary'); }
      }
    }
    if (sortSecondary.col) {
      const th = document.querySelector(`.results-table thead th[data-sort="${sortSecondary.col}"]`);
      if (th) {
        const icon = th.querySelector('.sort-icon');
        if (icon) { icon.textContent = sortSecondary.dir === 'asc' ? '↑²' : '↓²'; icon.classList.add('sort-secondary'); }
      }
    }
  }

  // ─── Export dropdown ──────────────────────────────────────
  const exportMenu    = document.getElementById('export-menu');

  exportTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('open');
  });
  document.addEventListener('click', () => exportMenu?.classList.remove('open'));

  function buildExportData() {
    const t1Name = indexerName(selectT1.value, 'T1');
    const t2Name = indexerName(selectT2.value, 'T2');
    return { t1Name, t2Name };
  }

  function exportCurrentTab(format) {
    const { t1Name, t2Name } = buildExportData();
    let rows = [], header = [];

    if (currentTab === 'search') {
      header = ['source', 'title', 'category', 'size', 'seeders', 'leechers', 'age', 'link'];
      rows = getFilteredSorted().map(r => ({
        source: r.sourceTracker || '', title: r.title, category: getCategoryName(r),
        size: r.size || 0, seeders: r.seeders || 0, leechers: r.leechers || 0,
        age: r.publishDate || '', link: r.downloadUrl || r.magnetUrl || ''
      }));
    } else if (currentTab === 'common') {
      header = ['source_t1', 'title_t1', 'size_t1', 'seeders_t1', 'source_t2', 'title_t2', 'size_t2', 'seeders_t2'];
      rows = commonResults.map(p => ({
        source_t1: t1Name, title_t1: p.t1.title, size_t1: p.t1.size || 0, seeders_t1: p.t1.seeders || 0,
        source_t2: t2Name, title_t2: p.t2.title, size_t2: p.t2.size || 0, seeders_t2: p.t2.seeders || 0,
      }));
    } else {
      const data = currentTab === 'unique-t2' ? uniqueT2Results : uniqueT1Results;
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
      downloadFile('\uFEFF' + csv, `export_${currentTab}_${date}.csv`, 'text/csv;charset=utf-8;');
    } else {
      downloadFile(JSON.stringify(rows, null, 2), `export_${currentTab}_${date}.json`, 'application/json');
    }
    log(`Export ${format.toUpperCase()} (${currentTab}): ${rows.length} lignes`, 'ok');
    exportMenu.classList.remove('open');
  }

  function exportAll(format) {
    const { t1Name, t2Name } = buildExportData();
    const rows = [];
    uniqueT2Results.forEach(r => rows.push({ type: 'missing_t1', source: t2Name, title: r.title, category: getCategoryName(r), size: r.size || 0, seeders: r.seeders || 0, age: r.publishDate || '', link: r.downloadUrl || r.magnetUrl || '' }));
    uniqueT1Results.forEach(r => rows.push({ type: 'missing_t2', source: t1Name, title: r.title, category: getCategoryName(r), size: r.size || 0, seeders: r.seeders || 0, age: r.publishDate || '', link: r.downloadUrl || r.magnetUrl || '' }));
    commonResults.forEach(p => {
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
    exportMenu.classList.remove('open');
  }

  function downloadFile(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function exportData(data, format, prefix) {
    if (!data.length) {
       log('Rien à exporter.', 'warn');
       return;
    }
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
      const exportItems = data.map(r => ({
        source: r.sourceTracker || r.source || '', title: r.title, category: getCategoryName(r),
        size: r.size || 0, seeders: r.seeders || 0, age: r.publishDate || '', link: r.downloadUrl || r.magnetUrl || ''
      }));
      downloadFile(JSON.stringify(exportItems, null, 2), `export_${prefix}_${date}.json`, 'application/json');
    }
    log(`Export ${format.toUpperCase()} (${prefix}): ${data.length} lignes`, 'ok');
  }

  document.getElementById('btn-export-csv-all')?.addEventListener('click',  () => {
    if (appMode === 'search') exportCurrentTab('csv');
    else exportAll('csv');
  });
  document.getElementById('btn-export-json-all')?.addEventListener('click', () => {
    if (appMode === 'search') exportCurrentTab('json');
    else exportAll('json');
  });

  // Watchlist export
  const btnExportWatchlistTrigger = document.getElementById('btn-export-watchlist-trigger');
  const exportWatchlistDropdown = document.getElementById('export-watchlist-dropdown');
  if (btnExportWatchlistTrigger && exportWatchlistDropdown) {
    btnExportWatchlistTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      exportWatchlistDropdown.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!btnExportWatchlistTrigger.contains(e.target) && !exportWatchlistDropdown.contains(e.target)) {
        exportWatchlistDropdown.classList.remove('open');
      }
    });
    document.getElementById('btn-export-watchlist-csv')?.addEventListener('click', () => {
      exportWatchlistDropdown.classList.remove('open');
      exportData(watchlist, 'csv', 'favoris');
    });
    document.getElementById('btn-export-watchlist-json')?.addEventListener('click', () => {
      exportWatchlistDropdown.classList.remove('open');
      exportData(watchlist, 'json', 'favoris');
    });
  }

  // ─── Version & update check ───────────────────────────────
  async function checkVersion() {
    const badge = document.getElementById('version-badge');
    if (!badge) return;

    let current = null;
    try {
      const res = await fetch('/api/version');
      const data = await res.json();
      current = data.version;
    } catch (_) {
      return; // hors Docker, on ne montre rien
    }

    if (!current || current === 'unknown') return;
    badge.textContent = `v${current}`;
    badge.title = `Version installée : ${current}`;

    // Vérification de mise à jour via GitHub Releases
    try {
      const res = await fetch('https://api.github.com/repos/mrddream/trackertools/releases/latest');
      if (!res.ok) return;
      const release = await res.json();
      const latest = (release.tag_name || '').replace(/^v/, '');
      if (latest && latest !== current) {
        badge.textContent = `v${current} → v${latest} ↑`;
        badge.title = `Mise à jour disponible : v${latest}\nCliquer pour voir la release`;
        badge.classList.add('update-available');
        badge.addEventListener('click', () => {
          window.open(release.html_url, '_blank', 'noopener');
        });
      }
    } catch (_) {} // silencieux si GitHub injoignable
  }

  // ─── Init ─────────────────────────────────────────────────
  loadSettings();
  renderManualIndexersList();
  checkVersion();
  log("Application prête.", 'info');

  // Try to fetch external data from Docker volume
  Promise.all([
    fetch('/config/config.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
    fetch('/config/history.json').then(r => r.ok ? r.json() : []).catch(() => []),
    fetch('/config/bookmark.json').then(r => r.ok ? r.json() : []).catch(() => [])
  ]).then(([config, remoteHistory, remoteBookmark]) => {
    let hasExternal = false;
    if (config.url) { prowlarrUrl.value = config.url; hasExternal = true; }
    if (config.apiKey) { prowlarrApiKey.value = config.apiKey; hasExternal = true; }
    if (config.manualIndexers) {
      manualIndexers = config.manualIndexers;
      localStorage.setItem('manual_indexers', JSON.stringify(manualIndexers));
      renderManualIndexersList();
    }
    
    // Remote files override local if present and not empty
    if (Array.isArray(remoteHistory) && remoteHistory.length > 0) {
      searchHistory = remoteHistory;
      localStorage.setItem('search_history', JSON.stringify(searchHistory));
    }
    if (Array.isArray(remoteBookmark) && remoteBookmark.length > 0) {
      watchlist = remoteBookmark;
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
      if (appMode === 'watchlist') renderWatchlist();
    }

    if (hasExternal) {
      log('Configuration chargée depuis le volume (/config)', 'ok');
      saveSettings(); // Save them locally as well
    }
    
    // Auto-connect if credentials are present
    if (prowlarrUrl.value && prowlarrApiKey.value) {
      log('Identifiants détectés, connexion automatique…', 'info');
      testConnection();
    } else {
      openSettings();
    }
  }).catch(() => {
      // Auto-connect if credentials are already saved locally
      if (prowlarrUrl.value && prowlarrApiKey.value) {
        log('Identifiants détectés, connexion automatique…', 'info');
        testConnection();
      } else {
        openSettings();
      }
    });

})();
