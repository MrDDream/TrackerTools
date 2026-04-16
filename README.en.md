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

### General & Utilities
- **Watchlist (Bookmarks)**: save your favorite torrents in one click to easily retrieve them later, with dedicated filters and exports (JSON/CSV)
- **Full History**: keep track of all your previous queries (search or comparison) and rerun them instantly
- "Quick filter" text bar acting locally on search results, history, and watchlist panels

### Architecture
- Connect to Prowlarr via URL + API key
- Support for **external Torznab indexers** (Jackett, etc.)
- **Total Persistence** driven by a lightweight built-in Node.js backend syncing with the Docker volume (Prowlarr URL, API key, manual indexers, as well as History and Watchlist)
- "Glassmorphism" light / dark theme interface
- Bilingual interface **FR / EN**
- Fluid pagination of results
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
      - ./config:/config
    restart: unless-stopped
```

### 2. Run

```bash
docker compose up -d
```

The interface is available at `http://localhost:8077`

### 3. Configuration

Connect to Prowlarr and add your indexers directly from the interface via **⚙ Settings**. The configuration is automatically saved to the `./config` volume and restored on container restart.

---

## Prowlarr CORS configuration

If Prowlarr runs on a different machine, enable CORS in **Prowlarr → Settings → General**:
- **Allowed Hosts**: add the IP/domain where Tracker Tools is hosted.

---

## Tech stack

- HTML / CSS / JavaScript — no dependencies, no build step
- [Node.js](https://nodejs.org/) for static file serving and configuration persistence
- Prowlarr API v1 (`/api/v1/indexer`, `/api/v1/search`)
- Standard Torznab API for manual indexers

---

## License

MIT

---

<p align="center">
  Built with the help of <a href="https://www.anthropic.com/claude">Claude</a> &amp; <a href="https://github.com/mrddream">Antigravity</a>
</p>
