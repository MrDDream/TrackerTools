# Tracker Tools

<p align="center">
  <img src="img/logo.svg" alt="Tracker Tools" width="80" />
</p>

<p align="center">
  <strong>Tracker Tools</strong> est une interface web pour <a href="https://github.com/Prowlarr/Prowlarr">Prowlarr</a> qui offre plusieurs modes complémentaires : rechercher simultanément sur plusieurs indexeurs, comparer deux indexeurs pour identifier les torrents manquants, ou gérer votre client BitTorrent depuis une interface unifiée.
</p>

<p align="center">
  🇬🇧 <a href="README.en.md">English version</a>
</p>

---

## Fonctionnalités

### Mode Recherche
- Recherche multi-indexeurs en parallèle
- Filtre par protocole (Torrents / Usenet)
- Filtrage par catégorie et sous-catégorie
- Tri par colonne (titre, taille, seeds, âge…) avec **tri multi-colonnes** (Shift+clic)
- Filtre par indexeur source sur les résultats
- Filtre de recherche **strict** (correspondance exacte) ou **raw** (résultats bruts)
- Export CSV / JSON
- Liens `.torrent` (téléchargement direct) et Magnet (ouverture dans le client OS)
- **Ajout direct** au client BitTorrent depuis les résultats

### Mode Comparaison
- Comparaison de deux indexeurs côte à côte
- Algorithme de matching **intelligent** (similarité Jaccard sur les tokens + proximité de taille) ou **standard** (normalisation de titre)
- Statistiques : résultats par indexeur, torrents communs, manquants, pourcentage de similarité
- Onglets : Manquants sur T1 / Manquants sur T2 / En commun
- Export CSV / JSON de chaque onglet ou de tous les onglets

### Mes Torrents
- Affichage de tous les torrents du client BitTorrent connecté
- Statut, progression, ratio, taille, données uploadées, étiquettes, catégorie, ancienneté
- Source/indexeur deviné automatiquement depuis l'URL du tracker
- Filtre par catégorie, par tag et par texte libre
- Tri par colonne (nom, taille, progression, ratio, catégorie, date…)
- **Pagination** intégrée (20 torrents par page)
- **Recherche rapide** : lancez une recherche sur n'importe quel torrent en un clic
- **Ajout** de torrent par URL Magnet avec choix du chemin, catégorie et tags
- Actualisation à la demande

### État des indexeurs
- Vue d'ensemble de tous les indexeurs Prowlarr
- Test de connectivité individuel ou groupé ("Tout tester")
- Historique des derniers tests par indexeur

### Favoris & Historique
- **Favoris (Watchlist)** : sauvegardez d'un clic vos torrents préférés, avec filtre et export dédiés (JSON/CSV)
- **Historique complet** : retrouvez toutes vos requêtes précédentes (recherche ou comparaison) et relancez-les en un clic

### Interface & UX
- **PWA** : installable sur mobile et desktop (icône, mode standalone, cache offline)
- **Responsive** : optimisé pour tous les écrans (mobile, tablette, PC 13", grand écran)
- Panneau latéral **rétractable** (bouton de bascule)
- Sections Indexeurs et Filtres **rétractables**
- Scroll horizontal sur les tableaux sans coupure de colonnes
- Thème clair / sombre
- Bilinguisme natif **FR / EN**
- Pagination fluide des résultats
- Console de débogage intégrée
- **Badge de version** avec notification automatique de mise à jour disponible

### Architecture
- Connexion à Prowlarr via URL + clé API
- Support des indexeurs **Torznab externes** (Jackett, etc.)
- **Clients BitTorrent supportés** : qBittorrent, Deluge, Transmission (proxy serveur)
- **Persistance totale** assurée par un backend Node.js ultra-léger communiquant avec le volume Docker (URL, clé API, indexeurs manuels, paramètres client torrent, Historique et Favoris)
- Codebase JavaScript **entièrement modulaire** (ES Modules)

---

## Captures d'écran

### Mode Recherche
![Mode Recherche](img/search.png)

### Mode Comparaison
![Mode Comparaison](img/compare.png)

---

## Déploiement

### 1. Créer le fichier `docker-compose.yml`

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

### 2. Lancer

```bash
docker compose up -d
```

L'interface est accessible sur `http://localhost:8077`

### 3. Configuration

Ouvrez **⚙ Paramètres** et renseignez :
- L'URL et la clé API de votre instance Prowlarr
- Optionnel : votre client BitTorrent (qBittorrent, Deluge ou Transmission) avec URL, utilisateur et mot de passe

La configuration est automatiquement sauvegardée dans le volume `./config` et restaurée au redémarrage du container.

---

## Configuration CORS Prowlarr

Si Prowlarr tourne sur une machine différente, activez le CORS dans **Prowlarr → Paramètres → Général** :
- **Allowed Hosts** : ajoutez l'IP/domaine où Tracker Tools est hébergé.

---

## Stack technique

- HTML / CSS / JavaScript — aucune dépendance, aucun build
- [Node.js](https://nodejs.org/) pour le serveur de fichiers statiques, le proxy torrent et la persistance de configuration
- API Prowlarr v1 (`/api/v1/indexer`, `/api/v1/search`)
- API Torznab standard pour les indexeurs manuels
- API qBittorrent Web v2 (`/api/v2/torrents/…`) / Deluge JSON-RPC / Transmission RPC
- Service Worker (PWA, cache offline)

---

## Licence

MIT

---

<p align="center">
  Conçu avec l'aide de <a href="https://www.anthropic.com/claude">Claude</a> &amp; <a href="https://github.com/mrddream">Antigravity</a>
</p>
