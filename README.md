# Tracker Tools

<p align="center">
  <img src="img/logo.svg" alt="Tracker Tools" width="80" />
</p>

<p align="center">
  <strong>Tracker Tools</strong> est une interface web pour <a href="https://github.com/Prowlarr/Prowlarr">Prowlarr</a> qui offre deux modes complémentaires : rechercher simultanément sur plusieurs indexeurs, ou comparer deux indexeurs pour identifier les torrents manquants de part et d'autre.
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
- Tri par colonne (titre, taille, seeds, âge…)
- Filtre par indexeur source sur les résultats
- Export CSV

### Mode Comparaison
- Comparaison de deux indexeurs côte à côte
- Algorithme de matching **intelligent** (similarité Jaccard sur les tokens + proximité de taille) ou **standard** (normalisation de titre)
- Statistiques : résultats par indexeur, torrents communs, manquants, pourcentage de similarité
- Onglets : Manquants sur T1 / Manquants sur T2 / En commun
- Export CSV de chaque onglet ou de tous les onglets

### Général
- Connexion à Prowlarr via URL + clé API
- Support des indexeurs **Torznab externes** (Jackett, etc.)
- Thème clair / sombre
- Interface bilingue **FR / EN**
- Pagination (50 résultats par page)
- Configuration persistante (localStorage)
- Console de débogage intégrée

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
      - ./config:/usr/share/nginx/html/config
    restart: unless-stopped
```

### 2. Configurer (optionnel)

Pour pré-remplir automatiquement l'URL et la clé API Prowlarr au démarrage, créez un fichier `config/config.json` :

```json
{
  "url": "http://votre-ip-prowlarr:9696",
  "apiKey": "VOTRE_CLE_API",
  "manualIndexers": []
}
```

> Sans ce fichier, l'application fonctionne normalement — la connexion se fait manuellement via ⚙ Paramètres.

### 3. Lancer

```bash
docker compose up -d
```

L'interface est accessible sur `http://localhost:8077`

---

## Configuration CORS Prowlarr

Si Prowlarr tourne sur une machine différente, activez le CORS dans **Prowlarr → Paramètres → Général** :
- **Allowed Hosts** : ajoutez l'IP/domaine où Tracker Tools est hébergé.

---

## Stack technique

- HTML / CSS / JavaScript — aucune dépendance, aucun build
- [nginx](https://nginx.org/) pour le service des fichiers statiques
- API Prowlarr v1 (`/api/v1/indexer`, `/api/v1/search`)
- API Torznab standard pour les indexeurs manuels

---

## Licence

MIT
