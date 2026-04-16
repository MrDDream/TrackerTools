# Tracker Tools

<p align="center">
  <img src="img/logo.svg" alt="Tracker Tools" width="80" />
</p>

<p align="center">
  <strong>Tracker Tools</strong> is a web interface for <a href="https://github.com/Prowlarr/Prowlarr">Prowlarr</a> offering two complementary modes: search across multiple indexers simultaneously, or compare two indexers to identify torrents missing on either side.
</p>

<p align="center">
  🇫🇷 <a href="README.md">Version française</a>
</p>

---

## Features

### Search Mode
- Multi-indexer parallel search
- Filter by protocol (Torrents / Usenet)
- Filter by category and sub-category
- Column sorting (title, size, seeds, age…)
- Filter results by source indexer
- CSV export

### Compare Mode
- Side-by-side comparison of two indexers
- **Smart** matching algorithm (Jaccard token similarity + size proximity) or **Standard** (title normalization)
- Statistics: results per indexer, common torrents, missing, similarity percentage
- Tabs: Missing on T1 / Missing on T2 / In common
- CSV export per tab or all tabs at once

### General
- Connect to Prowlarr via URL + API key
- Support for **external Torznab indexers** (Jackett, etc.)
- Light / dark theme
- Bilingual interface **FR / EN**
- Pagination (50 results per page)
- Persistent configuration (localStorage)
- Built-in debug console

---

## Screenshots

### Search Mode
![Search Mode](img/search.png)

### Compare Mode
![Compare Mode](img/compare.png)

---

## Deployment

### 1. Create a `docker-compose.yml` file

```yaml
services:
  tracker-tools:
    image: ghcr.io/mrddream/trackertools:latest
    container_name: TrackerTools
    ports:
      - "8077:80"
    volumes:
      - ./config:/usr/share/nginx/html/config
    restart: unless-stopped
```

### 2. Configure (optional)

To pre-fill the Prowlarr URL and API key on startup, create a `config/config.json` file:

```json
{
  "url": "http://your-prowlarr-ip:9696",
  "apiKey": "YOUR_API_KEY",
  "manualIndexers": []
}
```

> Without this file the app works normally — connection is done manually via ⚙ Settings.

### 3. Run

```bash
docker compose up -d
```

The interface is available at `http://localhost:8077`

---

## Prowlarr CORS configuration

If Prowlarr runs on a different machine, enable CORS in **Prowlarr → Settings → General**:
- **Allowed Hosts**: add the IP/domain where Tracker Tools is hosted.

---

## Tech stack

- HTML / CSS / JavaScript — no dependencies, no build step
- [nginx](https://nginx.org/) to serve static files
- Prowlarr API v1 (`/api/v1/indexer`, `/api/v1/search`)
- Standard Torznab API for manual indexers

---

## License

MIT

---

<p align="center">
  Built with the help of <a href="https://www.anthropic.com/claude">Claude</a> &amp; <a href="https://antigravity.google/">Antigravity</a>
</p>
