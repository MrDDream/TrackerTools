# Tracker Tools

**Tracker Tools** est une interface web pour [Prowlarr](https://github.com/Prowlarr/Prowlarr) qui offre deux modes complémentaires : rechercher simultanément sur plusieurs indexeurs, ou comparer deux indexeurs pour identifier les torrents manquants de part et d'autre.

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

## Déploiement

### 1. Cloner le repo

```bash
git clone https://github.com/mrddream/trackertools.git
cd trackertools
```

### 2. Configurer (optionnel)

Pour pré-remplir automatiquement l'URL et la clé API Prowlarr au démarrage :

```bash
cp config/config.json.example config/config.json
```

Éditez `config/config.json` :

```json
{
  "url": "http://votre-ip-prowlarr:9696",
  "apiKey": "VOTRE_CLE_API",
  "manualIndexers": []
}
```

> Sans ce fichier, l'application fonctionne normalement — la connexion se fait manuellement via ⚙ Paramètres.

### 3. Lancer avec l'image Docker (recommandé)

```bash
docker compose up -d
```

L'image est récupérée automatiquement depuis `ghcr.io/mrddream/trackertools:latest`.

L'interface est accessible sur `http://localhost:8077`

### Build local

Si vous souhaitez construire l'image vous-même à partir des sources :

```bash
docker compose -f docker-compose-dev.yml up -d
```

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
