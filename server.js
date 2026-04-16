const http = require('http');
const fs   = require('fs');
const path = require('path');

const CONFIG_DIR   = '/config';
const VERSION_PATH = path.join(__dirname, 'VERSION');
const STATIC_DIR   = __dirname;
const PORT         = 80;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

http.createServer((req, res) => {

  // ── POST /api/save/:type ────────────────────────────────
  if (req.method === 'POST' && req.url.startsWith('/api/save/')) {
    const type = req.url.split('/').pop();
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        if (!['config', 'history', 'bookmark'].includes(type)) {
          throw new Error('Invalid type');
        }
        const data = JSON.parse(body);
        const filePath = path.join(CONFIG_DIR, `${type}.json`);
        if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── GET /api/version ─────────────────────────────────────
  if (req.method === 'GET' && req.url === '/api/version') {
    const version = fs.existsSync(VERSION_PATH)
      ? fs.readFileSync(VERSION_PATH, 'utf8').trim()
      : 'unknown';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ version }));
    return;
  }

  // ── GET /config/ ──────────────────────────────
  if (req.method === 'GET' && req.url.startsWith('/config/')) {
    const filename = req.url.split('/').pop();
    const filePath = path.join(CONFIG_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (filename === 'history.json' || filename === 'bookmark.json') {
        res.end('[]');
      } else {
        res.end('{}');
      }
    }
    return;
  }

  // ── Static files ─────────────────────────────────────────
  let urlPath = req.url.split('?')[0]; // strip query string
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(STATIC_DIR, urlPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }

}).listen(PORT, () => console.log(`Tracker Tools running on port ${PORT}`));
