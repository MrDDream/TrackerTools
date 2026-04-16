const http = require('http');
const fs   = require('fs');
const path = require('path');

const CONFIG_PATH = '/config/config.json';
const STATIC_DIR  = __dirname;
const PORT        = 80;

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

  // ── POST /api/save-config ────────────────────────────────
  if (req.method === 'POST' && req.url === '/api/save-config') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const dir  = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── GET /config/config.json ──────────────────────────────
  if (req.method === 'GET' && req.url.startsWith('/config/config.json')) {
    if (fs.existsSync(CONFIG_PATH)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(fs.readFileSync(CONFIG_PATH));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
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
