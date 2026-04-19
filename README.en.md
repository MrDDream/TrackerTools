# Tracker Tools

<p align="center">
  <img src="img/logo.svg" alt="Tracker Tools" width="80" />
</p>

<p align="center">
  <strong>Tracker Tools</strong> is a web interface for <a href="https://github.com/Prowlarr/Prowlarr">Prowlarr</a> offering several complementary modes: search across multiple indexers simultaneously, compare two indexers to identify missing torrents, or manage your BitTorrent client from a unified interface.
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
- Column sorting (title, size, seeds, age…) with **multi-column sort** (Shift+click)
- Filter results by source indexer
- **Strict** (exact match) or **raw** (unfiltered results) search filter toggle
- CSV / JSON export
- `.torrent` links (direct download) and Magnet links (opens OS handler)
- **Direct add** to your BitTorrent client from results

### Compare Mode
- Side-by-side comparison of two indexers
- **Smart** matching algorithm (Jaccard token similarity + size proximity) or **Standard** (title normalization)
- Statistics: results per indexer, common torrents, missing, similarity percentage
- Tabs: Missing on T1 / Missing on T2 / In common
- CSV / JSON export per tab or all tabs at once

### My Torrents
- Full list of torrents from the connected BitTorrent client
- Status, progress, ratio, size, uploaded data, tags, category, age
- Source/indexer automatically guessed from tracker URL
- Filter by category, tag, or free text
- Column sorting (name, size, progress, ratio, category, date…)
- Built-in **pagination** (20 torrents per page)
- **Quick search**: launch a search from any torrent in one click
- **Add** a torrent by Magnet URL with save path, category and tag selection
- On-demand refresh

### Indexers Status
- Overview of all Prowlarr indexers
- Individual or batch connectivity test ("Test all")
- Test history per indexer

### Watchlist & History
- **Watchlist (Bookmarks)**: save your favorite torrents in one click, with dedicated filters and exports (JSON/CSV)
- **Full History**: keep track of all your previous queries (search or comparison) and rerun them instantly

### Interface & UX
- **PWA**: installable on mobile and desktop (icon, standalone mode, offline cache)
- **Responsive**: optimized for all screen sizes (mobile, tablet, 13" laptop, widescreen)
- **Collapsible sidebar** with a toggle button
- Collapsible Indexers and Filters sections
- Horizontal table scrolling without clipping columns
- Light / dark theme
- Bilingual interface **FR / EN**
- Fluid pagination of results
- Built-in debug console
- **Version badge** with automatic update notification

### Architecture
- Connect to Prowlarr via URL + API key
- Support for **external Torznab indexers** (Jackett, etc.)
- **Supported BitTorrent clients**: qBittorrent, Deluge, Transmission (server-side proxied)
- **Total persistence** driven by a lightweight built-in Node.js backend syncing with the Docker volume (Prowlarr URL, API key, manual indexers, torrent client settings, History and Watchlist)
- Fully **modular JavaScript** codebase (ES Modules)

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

Open **⚙ Settings** and fill in:
- The URL and API key of your Prowlarr instance
- Optional: your BitTorrent client (qBittorrent, Deluge or Transmission) with URL, username and password

The configuration is automatically saved to the `./config` volume and restored on container restart.

---

## Prowlarr CORS configuration

If Prowlarr runs on a different machine, enable CORS in **Prowlarr → Settings → General**:
- **Allowed Hosts**: add the IP/domain where Tracker Tools is hosted.

---

## Tech stack

- HTML / CSS / JavaScript — no dependencies, no build step
- [Node.js](https://nodejs.org/) for static file serving, torrent proxy and configuration persistence
- Prowlarr API v1 (`/api/v1/indexer`, `/api/v1/search`)
- Standard Torznab API for manual indexers
- qBittorrent Web API v2 (`/api/v2/torrents/…`) / Deluge JSON-RPC / Transmission RPC
- Service Worker (PWA, offline cache)

---

## License

MIT

---

<p align="center">
  Built with the help of <a href="https://www.anthropic.com/claude">Claude</a> &amp; <a href="https://github.com/mrddream">Antigravity</a>
</p>
