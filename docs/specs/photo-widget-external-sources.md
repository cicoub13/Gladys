# Widget Photo — sources issues d'intégrations (Immich)

> **Demande de fonctionnalité / spécification vivante.** Ce document spécifie comment le widget Photo du dashboard s'alimente auprès d'un **fournisseur de photos** (« photo provider ») plutôt qu'auprès d'une liste d'URLs saisies à la main, et définit le contrat que tout fournisseur — service interne comme intégration externe — doit implémenter. Immich est le premier fournisseur.
>
> Statut : **proposée, non implémentée**. Règle du dépôt (`AGENTS.md`) : toute PR qui change un comportement ou un contrat décrit ici met ce fichier à jour dans le même diff — spec d'abord, code ensuite.
>
> Ce document est rédigé en français à la demande du mainteneur ; les identifiants, clés i18n, noms de champs et de routes restent en anglais, comme partout dans le code.

## Contexte

Le widget Photo (`box.type = 'photo'`) existe déjà :

- rendu : `front/src/components/boxs/photo/PhotoBox.jsx` (diaporama, navigation avant/arrière, indicateurs, cache mémoire des images, préchargement de l'image suivante) et `EditPhotoBox.jsx` (liste d'URLs + légendes, cadrage, intervalle, affichage des légendes) ;
- modèle : `DASHBOARD_BOX_TYPE.PHOTO = 'photo'` (`server/utils/constants.js`), configuration validée par le schéma Joi de `server/models/dashboard.js` (`photos` : tableau de `{ url, caption }`, **max 100**, `photo_fit`, `photo_slideshow_interval` 0–3600, `photo_show_caption`) ;
- récupération des images : `GET /api/v1/dashboard/photo/proxy?url=` → `server/lib/dashboard/dashboard.getPhoto.js`. Le serveur télécharge l'image (donc un NAS local reste visible à distance via Gladys Plus), la ré-encode en JPEG **800×400, qualité 80** via `resizeImageBuffer`, et renvoie la chaîne `"image/jpeg;base64,…"` que le front consomme en `src={`data:${image}`}`.

**Ce qui bloque aujourd'hui.** Alimenter le widget depuis un serveur Immich est impossible sans code serveur dédié, pour trois raisons cumulées :

1. **Authentification.** Immich exige un en-tête `x-api-key` sur chaque requête. Le proxy actuel fait un `GET` nu, sans en-tête : il ne peut structurellement pas parler à Immich.
2. **Réseau.** Le proxy actuel bloque volontairement la boucle locale et le link-local (protection SSRF, l'URL venant d'un champ libre). Or un Immich auto-hébergé est très souvent joignable en `http://localhost:2283`, `http://immich-server:2283` (réseau Docker) ou sur une IP privée : le chemin « URL manuelle » est le mauvais outil pour une adresse configurée **une fois** par un administrateur.
3. **Dynamisme.** Une liste d'URLs est figée. Un album Immich s'enrichit, et les souvenirs « ce jour-là » changent **tous les jours** : il faut résoudre la source en liste de photos à l'exécution, pas à la configuration.

**Correction de deux affirmations de la demande initiale**, vérifiées dans le code :
- le plafond du proxy est `MAX_SOURCE_IMAGE_BYTES = 25 Mo` en entrée (pas 5 Mo), et la sortie est de toute façon ré-encodée en 800×400 JPEG. Le rendu Immich `size=preview` (~1440 px) est donc le bon choix de source — `size=thumbnail` serait trop petit pour le cadrage `cover` — mais il ne « passe » pas sous une limite de 5 Mo : il est **redimensionné** par Gladys comme toute autre photo ;
- le proxy ne « manque » pas seulement d'un en-tête : il refuserait aussi l'hôte le plus courant d'un Immich auto-hébergé (point 2 ci-dessus).

## Principe directeur : le cœur ne connaît aucun fournisseur par son nom

Le précédent est le widget météo (`docs/specs/external-integrations.md` §B.18) : `weather.get` **énumère le stateManager** et retient tout service exposant `weather.get(options)`, le widget épingle éventuellement un fournisseur (`GET /api/v1/weather/provider`, puis `?service=`), et un **format pivot** normalisé par le cœur isole l'UI des payloads de chaque fournisseur. Aucun `getService('openweather')` en dur.

Cette spécification transpose exactement ce modèle aux photos :

- le cœur expose une capacité **`photo.*`** (`gladys.photo`) qui énumère les services exposant `photo.getSources(...)` / `photo.getPhotos(...)` / `photo.getImage(...)` ;
- **Immich est un fournisseur parmi d'autres**, implémenté en v1 comme service interne (`server/services/immich`), exactement comme `openweather` l'est pour la météo ;
- une intégration externe de `type: "photo"` (Google Photos, PhotoPrism, Synology Photos, Nextcloud Photos…) pourra implémenter le même contrat **sans toucher au cœur ni au widget** (phase 2, §F).

Le coût est le même que pour la météo : une lib cœur générique + un service. Le bénéfice est que la 2ᵉ, 3ᵉ, 10ᵉ source de photos ne coûtera plus rien au cœur.

### Divergence assumée avec la météo : pas de mode automatique

La météo a une réponse « juste » unique (le temps qu'il fait ici) : le cœur peut donc essayer les fournisseurs dans l'ordre et prendre le premier qui répond. **Les photos n'ont pas cette propriété** : « l'album *Vacances 2019* de mon Immich » n'a aucun équivalent chez un autre fournisseur. Par conséquent :

- le widget en mode fournisseur **épingle toujours** un service (`photo_provider`) et une source (`photo_source_type` + `photo_source_id`) ;
- il n'y a **ni mode automatique, ni repli silencieux** : si le fournisseur épinglé est absent, arrêté ou non configuré, le widget affiche un état explicite (§C.4) plutôt que les photos de quelqu'un d'autre.

## Périmètre

### Dans le périmètre (v1)

- Contrat générique « fournisseur de photos » + lib cœur `gladys.photo` + routes REST (§B).
- Service interne **Immich** : page de configuration (URL + clé d'API + test de connexion), listage des albums, résolution album / souvenirs, proxy image authentifié (§D).
- Widget Photo : choix du mode de source, sélection du fournisseur et de la source, ordre, plafond, légendes automatiques (§C).
- Compatibilité ascendante **totale** du mode « URLs manuelles » : aucun widget existant n'est modifié, aucune migration.

### Hors périmètre (v1), explicitement

- **Vidéos** (assets Immich `type: 'VIDEO'`) : filtrées (§E.1).
- **Rendu `original`** : le proxy ré-encode déjà en 800×400, l'original n'apporterait que du poids.
- **Personnes / lieux / recherche / favoris Immich** comme sources : le contrat de source (§B.2) est conçu pour les accueillir sans changement de forme, mais la v1 se limite à `album` et `memories`.
- **Intégrations externes de `type: "photo"`** : conçues ici (§F), implémentées en phase 2 — elles nécessiteront une mise à jour de `docs/specs/external-integrations.md` dans le même diff.
- **Écriture** vers le fournisseur (upload, favori, suppression) : le contrat est en lecture seule.
- **Multi-comptes** : un seul serveur Immich par instance en v1 (§E.5).

## A. Configuration du widget (modèle de données)

La configuration d'un widget vit dans le JSON des boîtes de `t_dashboard` : **aucune migration de base de données**. Seul le schéma Joi de `server/models/dashboard.js` est étendu.

| Champ | Type | Défaut | Rôle |
|---|---|---|---|
| `photo_source_mode` | `'manual' \| 'provider'` | `'manual'` | Mode de source. **Absent ⇒ `'manual'`** : c'est ce qui garantit la compatibilité ascendante des widgets déjà enregistrés. |
| `photo_provider` | string (nom de service) | — | Fournisseur épinglé, ex. `immich`. Requis si `photo_source_mode === 'provider'`. |
| `photo_source_type` | `'album' \| 'memories'` | — | Type de source chez ce fournisseur. Valeur libre côté contrat (§B.2), validée par le fournisseur, pas par le cœur. |
| `photo_source_id` | string ≤ 128 | `''` | Identifiant de la source (UUID d'album Immich). Vide pour une source sans identifiant (`memories`). |
| `photo_order` | `'recent_first' \| 'oldest_first' \| 'random'` | `'recent_first'` | Ordre d'affichage (§E.2). |
| `photo_max` | entier 1–100 | `50` | Plafond de photos chargées depuis la source (§E.3). Aligné sur le `.max(100)` déjà appliqué à `photos`. |
| `photo_caption_mode` | `'auto' \| 'none'` | `'auto'` | En mode fournisseur, légende générée depuis les métadonnées (§E.4) ou aucune légende. |
| `photos`, `photo_fit`, `photo_slideshow_interval`, `photo_show_caption`, `name` | inchangés | — | `photos` n'est lu qu'en mode `manual` ; les autres s'appliquent **aux deux modes**. |

Ajouts au schéma Joi (`server/models/dashboard.js`) :

```js
photo_source_mode: Joi.string().valid('manual', 'provider'),
photo_provider: Joi.string().allow('').max(64),
photo_source_type: Joi.string().allow('').max(32),
photo_source_id: Joi.string().allow('').max(128),
photo_order: Joi.string().valid('recent_first', 'oldest_first', 'random'),
photo_max: Joi.number().integer().min(1).max(100),
photo_caption_mode: Joi.string().valid('auto', 'none'),
```

Le schéma reste **permissif sur `photo_source_type`** (chaîne bornée, pas un `valid()`) : ajouter une source `favorites` chez un fournisseur ne doit pas exiger une modification du cœur, exactement comme le `type` du manifeste d'intégration externe n'est pas énuméré par le widget.

## B. Contrat « fournisseur de photos » (cœur)

Nouvelle lib `server/lib/photo/`, montée dans `server/lib/index.js` sous `gladys.photo`, sur le modèle de `server/lib/weather/`.

```
server/lib/photo/
  index.js                 // Photo(service) + prototypes
  photo.getProviders.js    // énumération duck-typée
  photo.getSources.js      // sources sélectionnables d'un fournisseur
  photo.getPhotos.js       // résolution source -> liste normalisée
  photo.getImage.js        // octets d'une photo -> data URI, avec cache
  photo.normalize.js       // normalizeSources / normalizePhotos
  constants.js             // regex d'identifiants, plafonds, TTL de cache
```

### B.1 Énumération (duck typing, comme `weather.getProviders`)

```js
function getProviders() {
  const serviceNames = this.service.stateManager.getAllKeys('service');
  return serviceNames
    .filter((serviceName) => {
      const service = this.service.getService(serviceName);
      return service && service.photo && typeof service.photo.getSources === 'function';
    })
    .sort();
}
```

Un service est un fournisseur **s'il expose les trois fonctions** `photo.getSources`, `photo.getPhotos`, `photo.getImage`. `getSources` sert de sonde (un fournisseur incomplet est un bug de fournisseur, pas un cas à gérer au cas par cas dans le cœur) ; le cœur vérifie les deux autres au moment de l'appel et lève `NotFoundError` si elles manquent.

### B.2 Format pivot d'une **source**

```json
{
  "type": "album",
  "id": "0d5f4c2e-…-uuid",
  "label": "Vacances 2019",
  "count": 248
}
```

| Champ | Requis | Normalisation appliquée par le cœur |
|---|---|---|
| `type` | oui | `^[a-z][a-z0-9-]{0,31}$`, sinon la source est **écartée** |
| `id` | oui (peut être `""`) | `^[A-Za-z0-9._:-]{0,128}$`, sinon écartée. `""` = source unique de son type (les souvenirs) |
| `label` | oui | chaîne bornée à 100 caractères, tronquée |
| `count` | non | entier fini ≥ 0, sinon supprimé |

Liste bornée à **200 sources** ; au-delà, tronquée (un utilisateur ne choisit pas dans un menu de 2000 albums — §E.5 traite la recherche).

### B.3 Format pivot d'une **photo**

```json
{
  "id": "3f0a…-uuid",
  "caption": "Rome — 12 août 2019",
  "taken_at": "2019-08-12T14:03:11.000Z"
}
```

| Champ | Requis | Normalisation |
|---|---|---|
| `id` | oui | `^[A-Za-z0-9._:-]{1,128}$`, sinon la photo est **écartée**. C'est le jeton opaque que le widget renverra à `photo.getImage` — le cœur ne l'interprète jamais |
| `caption` | non | chaîne bornée à 200 caractères, tronquée ; vide ⇒ supprimée |
| `taken_at` | non | date ISO valide, sinon supprimée |

Aucune URL ne figure dans le pivot, **par construction** : le navigateur ne doit jamais joindre le fournisseur directement (ni fuite d'IP, ni clé d'API exposée, ni rupture de l'accès distant Gladys Plus). Le tri et le plafond sont appliqués **par le cœur** après normalisation (§E.2, §E.3), pour que tous les fournisseurs se comportent pareil.

### B.4 Format d'une **image**

`photo.getImage` renvoie la chaîne **`"image/jpeg;base64,…"`** — exactement le format déjà produit par `dashboard.getPhoto` et consommé par `PhotoBox`/`EditPhotoBox` en `data:${image}`. Le fournisseur, lui, renvoie un `Buffer` : c'est le cœur qui valide et ré-encode (§B.6), pour que la validation ne dépende jamais du fournisseur.

### B.5 Routes REST

Ajoutées dans `server/api/routes.js` via un `photo.controller.js` (le modèle est `weather.controller.js`), toutes `authenticated: true` sans `admin` : n'importe quel utilisateur configure **son** dashboard, comme pour `GET /api/v1/weather/provider`. La charge utile ne contient rien d'opérationnel (pas d'URL de serveur, pas de clé).

| Route | Paramètres | Réponse |
|---|---|---|
| `GET /api/v1/photo/provider` | — | `[{ "service_name": "immich", "label": "Immich" }]` — même forme que les fournisseurs météo (`label` = nom d'affichage du manifeste pour une intégration externe, `null` pour un service interne, l'i18n du front prenant le relais) |
| `GET /api/v1/photo/source` | `service` (requis) | `[{ type, id, label, count }]` — §B.2 |
| `GET /api/v1/photo/list` | `service`, `source_type`, `source_id`, `order`, `limit` | `{ "photos": [{ id, caption, taken_at }] }` — §B.3 |
| `GET /api/v1/photo/image` | `service`, `photo_id` | `"image/jpeg;base64,…"` (`text/plain`, comme le proxy existant) |

`GET /api/v1/dashboard/photo/proxy` **reste inchangé** : c'est le chemin du mode manuel, avec sa protection SSRF, et il n'est pas concerné par ces routes.

Erreurs : format standard Gladys (`errorMiddleware`). `service` inconnu ou non fournisseur → `404 NOT_FOUND`. Fournisseur non configuré → `ServiceNotConfiguredError` (le front affiche l'appel à l'action « configurez Immich »). Échec du tiers → `400` avec `ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED`, le même code que le widget météo sait déjà présenter.

### B.6 Ce que le cœur ne fait jamais confiance

Comme `normalizeWeather` pour la météo, tout ce qui revient d'un fournisseur est **normalisé et borné avant d'entrer dans le cœur** :

- listes bornées (200 sources, 100 photos), champs en liste blanche (tout champ inconnu est supprimé), chaînes tronquées, dates validées, identifiants filtrés par regex ;
- **image validée sur les octets décodés** : nombres magiques JPEG / PNG / WebP / AVIF / GIF uniquement (pas de confiance au `Content-Type` du tiers), taille ≤ 25 Mo (aligné sur `MAX_SOURCE_IMAGE_BYTES`), puis ré-encodage systématique par `resizeImageBuffer` en 800×400 JPEG q80. Un fournisseur ne peut donc pas faire servir un SVG, un HTML ou un fichier de 200 Mo par l'origine de Gladys ;
- `photo_id` re-vérifié par le cœur avant tout appel fournisseur : un identifiant hors regex renvoie `404` **sans qu'un seul octet ne parte** vers le fournisseur.

### B.7 Caches (bornés, en mémoire)

| Cache | Clé | TTL | Taille max |
|---|---|---|---|
| Sources | `service` | 5 min | 1 entrée par fournisseur |
| Liste de photos | `service` + `source_type` + `source_id` + `order` + `limit` | 5 min | 20 entrées (LRU) |
| Image | `service` + `photo_id` | 10 min | 60 entrées (LRU) — même ordre de grandeur que le cache d'images météo (10 min) |

Après ré-encodage, une image pèse ~30–60 Ko : 60 entrées ≈ 3 Mo, acceptable sur un Raspberry Pi. Le cache d'images du **front** (`imageCache` de `PhotoBox`) est lui aussi borné à 60 entrées LRU dans le cadre de ce travail : aujourd'hui il croît sans limite, ce qui passait avec 100 URLs manuelles mais mérite une borne dès lors qu'un album se rafraîchit périodiquement.

Le mode `random` est exclu du cache de liste ou, plus simplement, **tiré côté serveur avec une graine dérivée de la fenêtre de cache** : deux chargements consécutifs à moins de 5 min renvoient donc le même ordre — c'est voulu, sinon la navigation avant/arrière du diaporama sauterait d'une photo à l'autre sans cohérence.

## C. Front

### C.1 Édition du widget (`EditPhotoBox.jsx`)

Un premier select **Source des photos** : *URLs manuelles* (défaut) / *Depuis une intégration*.

- **URLs manuelles** : l'écran actuel, à l'identique.
- **Depuis une intégration** :
  1. select **Fournisseur** ← `GET /api/v1/photo/provider`. Si la liste est vide : bloc d'aide « Aucune intégration photo n'est installée » avec un lien vers le catalogue d'intégrations.
  2. select **Source** ← `GET /api/v1/photo/source?service=…`, groupé par `type` (`<optgroup>` : *Albums*, *Souvenirs*), libellé `label` + `count` quand il est présent. Écrit `photo_source_type` **et** `photo_source_id` en une seule action.
  3. select **Ordre** (récentes d'abord / anciennes d'abord / aléatoire), champ **Nombre maximum de photos** (1–100, défaut 50), switch **Légendes automatiques**.
  4. **Aperçu** : les 3 premières photos résolues, chargées par `GET /api/v1/photo/image` — même rôle que le `PhotoPreview` du mode manuel (vérifier avant d'enregistrer), sans dupliquer sa logique de debounce puisqu'il n'y a plus de saisie caractère par caractère.

Les options communes (cadrage, intervalle, affichage des légendes, nom du widget) restent affichées dans les deux modes.

### C.2 Exécution (`PhotoBox.jsx`)

`PhotoBox` gagne une étape de **résolution** en amont de son diaporama ; tout ce qui suit (index courant, transitions, boutons, indicateurs, préchargement, cache) est **réutilisé tel quel**.

- Mode `manual` : `photos` vient de la configuration, images via `/api/v1/dashboard/photo/proxy?url=` — inchangé.
- Mode `provider` : au montage, `GET /api/v1/photo/list` → liste de `{ id, caption, taken_at }` en state ; chaque image via `GET /api/v1/photo/image?service=…&photo_id=…`, la clé de cache étant l'URL de la requête. Le préchargement de l'image suivante fonctionne à l'identique.

Le composant travaille donc sur une **liste résolue** commune aux deux modes ; c'est la seule vraie refonte interne, et elle simplifie `getDerivedStateFromProps` (qui borne aujourd'hui l'index à partir des props uniquement).

### C.3 Rafraîchissement

- **Au montage** du widget, et à chaque changement de configuration de la source.
- **Périodiquement**, toutes les **60 minutes** (`PROVIDER_LIST_REFRESH_MS`) : suffisant pour un album qui s'enrichit, et cela rattrape le passage de minuit des souvenirs en moins d'une heure.
- **Au retour à l'index 0** du diaporama si la liste a plus de 60 min : un dashboard laissé allumé sur un mur reste à jour sans horloge supplémentaire.
- Un rafraîchissement qui renvoie une liste **plus courte** que l'index courant ramène l'index dans les bornes (règle existante) ; une liste identique ne déclenche aucun rechargement d'image, le cache faisant son office.

### C.4 États d'affichage

| Situation | Rendu |
|---|---|
| Source vide (album vide, aucun souvenir aujourd'hui) | État vide explicite, **pas une erreur** : « Aucune photo dans cette source aujourd'hui. » (clé i18n dédiée, distincte de `emptyPhotos`) |
| Fournisseur non configuré | Message + lien vers la page de configuration de l'intégration |
| Fournisseur absent / arrêté / injoignable | Message d'erreur avec le nom du fournisseur épinglé — **jamais** de repli sur un autre fournisseur |
| Échec d'une image isolée | Comportement actuel : icône d'erreur sur cette photo, le diaporama continue |

## D. Le fournisseur Immich (service interne)

```
server/services/immich/
  index.js                       // start/stop, expose photo.* et controllers
  package.json
  lib/
    index.js                     // ImmichHandler
    immich.connect.js            // charge URL + clé, valide, marque le service configuré
    immich.request.js            // client HTTP: base URL + x-api-key, timeouts, garde-fous
    immich.getConfiguration.js   // { url, api_key_configured } — la clé ne ressort jamais
    immich.saveConfiguration.js
    immich.testConnection.js     // GET /api/albums, erreurs typées
    photo/
      photo.getSources.js        // albums + souvenirs
      photo.getPhotos.js         // album -> assets, memories -> assets
      photo.getImage.js          // GET /api/assets/{id}/thumbnail?size=preview -> Buffer
      photo.buildCaption.js      // légende auto (§E.4)
  controllers/
    immich.controller.js         // routes de la page de configuration
```

### D.1 Configuration

Deux variables de service (`gladys.variable.setValue(key, value, serviceId)`, sans `userId` : la configuration est **au niveau de l'instance**, comme MELCloud ou OpenWeather — voir §E.5) :

| Variable | Contenu |
|---|---|
| `IMMICH_URL` | URL de base du serveur, ex. `http://192.168.1.20:2283` (sans `/api`, ajouté par le client) |
| `IMMICH_API_KEY` | Clé d'API Immich (*Account Settings → API Keys*). Permissions minimales : `album.read`, `asset.read`, `memory.read` |

Routes du service (fusionnées automatiquement dans le routeur : `server/api/routes.js` itère sur les services et fait un `Object.assign` de leur objet `controllers`) :

| Route | `admin` | Rôle |
|---|---|---|
| `GET /api/v1/service/immich/config` | oui | `{ "url": "http://…", "api_key_configured": true }` |
| `POST /api/v1/service/immich/config` | oui | Enregistre URL + clé, puis relance `connect()` |
| `POST /api/v1/service/immich/test-connection` | oui | Appelle `GET /api/albums` et renvoie `{ "success": true, "album_count": 12 }` ou une erreur typée |

**La clé d'API ne repart jamais vers le navigateur** — seul un booléen « configurée » le fait. C'est plus strict que les intégrations existantes qui relisent leur secret via `GET /api/v1/service/:service_name/variable/:variable_key` ; c'est le comportement retenu ici parce qu'il ne coûte rien à l'ergonomie (on ressaisit une clé, on ne la relit pas) et qu'il évite une clé en clair dans une réponse HTTP à chaque ouverture de la page.

Erreurs de test de connexion, distinguées explicitement pour que le message soit actionnable :

| Cas | Code | Message affiché |
|---|---|---|
| URL invalide / schéma non http(s) | `BAD_REQUEST` | « L'adresse doit commencer par `http://` ou `https://` » |
| Hôte injoignable, DNS, timeout | `REQUEST_TO_THIRD_PARTY_FAILED` | « Serveur Immich injoignable à cette adresse » |
| `401` / `403` | `UNAUTHORIZED` | « Clé d'API refusée par Immich » |
| `2xx` mais payload inattendu | `REQUEST_TO_THIRD_PARTY_FAILED` | « Réponse inattendue : cette adresse est-elle bien un serveur Immich ? » |

### D.2 Endpoints Immich consommés

Toutes les requêtes portent `x-api-key: <clé>`, sur `<IMMICH_URL>/api`.

| Besoin | Endpoint Immich | Champs utilisés |
|---|---|---|
| Lister les albums | `GET /api/albums` | `id`, `albumName`, `assetCount` |
| Contenu d'un album | `GET /api/albums/{id}` | `assets[] : { id, type, originalFileName, fileCreatedAt, localDateTime, exifInfo }` |
| Souvenirs « ce jour-là » | `GET /api/memories` | `[{ type: 'on_this_day', data: { year }, assets: [...] }]` |
| Octets d'une photo | `GET /api/assets/{id}/thumbnail?size=preview` | flux binaire `image/*` (~1440 px) |

Correspondance avec le pivot :

- **`getSources`** → une entrée `{ type: 'album', id, label: albumName, count: assetCount }` par album, plus **une seule** entrée `{ type: 'memories', id: '', label: 'Souvenirs — ce jour-là' }` (libellé traduit côté front à partir du `type`, le `label` du fournisseur servant de repli).
- **`getPhotos({ source_type: 'album', source_id })`** → `GET /api/albums/{source_id}`, assets `type === 'IMAGE'` uniquement (§E.1), mappés en `{ id, caption, taken_at: fileCreatedAt }`.
- **`getPhotos({ source_type: 'memories' })`** → `GET /api/memories`, groupes `type === 'on_this_day'`, assets concaténés ; `caption` préfixée de « Il y a N ans » (§E.4).
- **`getImage(photo_id)`** → thumbnail `size=preview`, renvoyé en `Buffer` au cœur qui valide et ré-encode.

`source_id` est validé comme **UUID v4** avant toute requête : c'est ce qui empêche un identifiant fabriqué de sortir du chemin `/api/albums/{id}` ou `/api/assets/{id}/thumbnail` pour atteindre un autre endpoint Immich.

### D.3 Réseau et sécurité, côté Immich

L'URL Immich est saisie **une fois, par un administrateur**, et n'est pas un champ libre soumis à chaque requête : le compromis n'est pas celui du proxy du mode manuel.

- **La boucle locale et les plages privées sont autorisées** : `http://localhost:2283`, `http://immich-server:2283`, `http://192.168.1.20:2283` sont les déploiements normaux. Les interdire rendrait la fonctionnalité inutilisable dans le cas le plus courant.
- **`169.254.0.0/16` reste bloqué** (endpoint de métadonnées cloud `169.254.169.254`) : aucun Immich n'y vit, et c'est la cible qui transforme une erreur de configuration en fuite de credentials cloud.
- **Redirections désactivées** (`maxRedirects: 0`) et **proxy HTTP désactivé** (`proxy: false`), comme dans `dashboard.getPhoto.js`.
- **Timeouts** : 10 s pour les appels JSON, 15 s pour les images. **Taille** : 25 Mo max sur la réponse image, 5 Mo sur les réponses JSON.
- La clé d'API n'apparaît **jamais** dans un log, ni dans un message d'erreur : le client HTTP journalise la méthode, le chemin et le code de statut, jamais les en-têtes.
- Un utilisateur non-administrateur peut lister les albums via `/api/v1/photo/source` (il configure son propre dashboard). C'est assumé et cohérent avec `GET /api/v1/weather/provider` : les libellés d'albums sont exposés à tout compte de l'instance, pas les photos elles-mêmes hors des sources qu'il choisit d'afficher. Une instance qui ne le souhaite pas ne connecte pas son Immich.

### D.4 Catalogue d'intégrations

- Entrée `{ "key": "immich", "img": "/assets/integrations/cover/immich.jpg", "local": true, "categories": ["multimedia"] }`.
- **Nouveau `type` technique `photo`** dans `front/src/config/integrations/index.js` (nouveau fichier `photos.json` + `pushAllWithType(photos, 'photo')`), ajouté à `HIDDEN_TYPES_FOR_NON_ADMIN_USERS` (`front/src/routes/integration/index.js`) : la configuration est une opération d'administration. URL de la page : `/dashboard/integration/photo/immich`, déclarée dans `front/src/components/app.jsx`.
- **Catégorie de navigation `multimedia`** : `docs/specs/integration-catalog-categories.md` exige ≥ 3 intégrations candidates pour créer une clé de catégorie ; une seule intégration photo ne la justifie pas encore. `multimedia` (« Speakers, TVs, streaming, casting, media remotes ») est le rayon le moins mauvais aujourd'hui. Quand PhotoPrism / Synology Photos / Google Photos rejoindront le catalogue, une catégorie `photos` sera créée selon la procédure de gouvernance de cette spec — c'est un ajout additif, sans rupture.
- **Alternative écartée** : réutiliser le `type` `device` pour éviter un nouveau type. Rejetée — Immich ne publie aucun device, et la page « Appareils » n'aurait aucun sens. Le coût du nouveau type est de trois lignes (fichier JSON, `pushAllWithType`, tableau des types masqués).

### D.5 i18n

Trois fichiers (`en.json`, `fr.json`, `de.json`), vérifiés en CI par `npm run compare-translations` :

- `integration.immich.*` : titre, description, onglet de configuration, libellés de champs, messages de test de connexion, documentation ;
- `dashboard.boxes.photo.*` : mode de source, fournisseur, source, ordre, plafond, légendes automatiques, état vide de la source, erreur de fournisseur ;
- `integration.<type>.title` pour le nouveau type `photo` dans le menu du catalogue.

## E. Décisions (les points « à trancher » de la demande)

### E.1 Vidéos : ignorées

Seuls les assets `type === 'IMAGE'` entrent dans le pivot. Afficher le poster d'une vidéo produirait une image figée indiscernable d'une photo dans un diaporama, sans jamais lire la vidéo — un widget photo qui affiche des demi-vidéos rend le service moins lisible. **Conséquence à assumer** : un album majoritairement vidéo paraîtra « plus petit » que dans Immich ; le `count` affiché dans le sélecteur vient d'`assetCount` (vidéos comprises), l'écart est donc visible à la configuration. Si le besoin remonte, une option « inclure les posters de vidéos » est un ajout additif.

### E.2 Ordre : plus récentes d'abord par défaut, configurable

`recent_first` (tri décroissant sur `taken_at`) est le défaut : c'est ce qu'attend un dashboard familial (« les dernières photos »). `oldest_first` sert aux albums narratifs (un voyage se raconte dans l'ordre), `random` aux grandes bibliothèques. Le tri est appliqué **par le cœur** après normalisation, donc identique chez tous les fournisseurs ; une photo sans `taken_at` est repoussée en fin de liste (et laissée dans son ordre d'origine entre elles), jamais écartée.

### E.3 Plafond : 100 photos maximum, 50 par défaut

Le plafond dur de 100 aligne le mode fournisseur sur le `.max(100)` déjà appliqué à `photos` par le schéma Joi : deux limites différentes pour le même widget seraient un piège. Le plafond est appliqué **après le tri**, ce qui donne des sémantiques utiles : « les 50 plus récentes », « les 50 plus anciennes », « 50 au hasard » — et non « 50 photos arbitraires puis triées ». Défaut à 50 : à 10 s par photo, c'est déjà plus de 8 minutes de diaporama.

### E.4 Légendes : automatiques par défaut, désactivables

`photo_caption_mode: 'auto'` construit la légende à partir des métadonnées, dans cet ordre de préférence :

1. `exifInfo.description` si elle est renseignée (c'est une légende écrite par un humain, rien ne la bat) ;
2. sinon `exifInfo.city` + date (`« Rome — 12 août 2019 »`) ;
3. sinon la date seule (`« 12 août 2019 »`), formatée dans la langue de l'utilisateur ;
4. pour une source `memories`, préfixe `« Il y a 6 ans — … »` calculé depuis `data.year`.

`originalFileName` n'est **jamais** utilisé : `IMG_20190812_140311.jpg` n'est pas une légende. Le switch existant « Afficher les légendes » (`photo_show_caption`) reste maître de l'affichage ; `photo_caption_mode: 'none'` sert à garder les légendes actives pour d'autres widgets tout en n'affichant rien sur celui-ci.

### E.5 Un seul serveur Immich par instance

La configuration est stockée au niveau du service (pas par utilisateur), comme MELCloud, OpenWeather ou Netatmo. **Conséquence** : tous les comptes de l'instance voient les mêmes albums dans le sélecteur, et un dashboard partagé fonctionne pour tous. Le multi-comptes Immich (chaque membre du foyer branche le sien) est un besoin plausible mais différent — il relève d'une configuration par utilisateur (`gladys.variable.setValue(key, value, serviceId, userId)`, le modèle de Nextcloud Talk), et le contrat de fournisseur défini ici n'a pas besoin de changer pour l'accueillir : seul le service Immich choisirait ses variables selon l'utilisateur appelant.

## F. Phase 2 — intégrations externes de `type: "photo"` (conception, non implémentée)

Transposition directe de `docs/specs/external-integrations.md` §B.18 (météo) et §B.15 (communication). Rien de ce qui est spécifié en §A–E ne change ; l'implémentation de cette phase mettra à jour `external-integrations.md` dans le même diff, comme sa règle l'exige.

- **Manifeste** : `type: "photo"`. Écran d'installation portant une ligne d'information dédiée (« cette intégration pourra fournir les photos affichées sur vos dashboards »).
- **Service proxy** : expose `photo.getSources` / `photo.getPhotos` / `photo.getImage`, relayés en WebSocket :

| Commande | Charge utile | Ack (`command-result`) | Délai |
|---|---|---|---|
| `external-integration.photo.get-sources` | `{ message_id }` | `data.sources` | 15 s |
| `external-integration.photo.get-photos` | `{ message_id, options: { source_type, source_id, limit } }` | `data.photos` | 15 s |
| `external-integration.photo.get-image` | `{ message_id, photo_id }` | `data.image` (base64 brut, sans préfixe data-URI) | 15 s |

Le délai de 15 s est celui déjà admis pour `camera.get-image` et `weather.get` (appel d'API tierce). L'ordre et le plafond restent appliqués par le cœur : l'intégration reçoit `limit` à titre indicatif (pour ne pas transférer 5000 entrées), le cœur re-tronque après normalisation.
- **Aucune surface « device »** : comme la météo et la communication, une intégration photo n'a ni écran Appareils, ni découverte, ni états — seulement Configuration / Supervision / Logs.
- **Rien de nouveau à valider** : `normalizeSources` / `normalizePhotos` / la validation d'image de §B.6 sont écrites pour être appliquées à **tout** fournisseur dès la v1 — le service interne Immich est traité avec la même méfiance qu'une intégration tierce, ce qui garantit que la phase 2 n'ajoute aucune surface de confiance.

## G. Tests

`AGENTS.md` impose **100 % de couverture de patch** côté serveur : chaque branche listée ci-dessous a son test.

| Fichier de test | Ce qu'il couvre |
|---|---|
| `server/test/lib/photo/photo.getProviders.test.js` | Énumération duck-typée, tri, service sans `photo.*`, fournisseur incomplet |
| `server/test/lib/photo/photo.getSources.test.js` | Normalisation, `type`/`id` hors regex écartés, `label` tronqué, plafond 200, cache et expiration |
| `server/test/lib/photo/photo.getPhotos.test.js` | Les 3 ordres (dont photos sans `taken_at`), plafond appliqué après tri, `random` stable dans la fenêtre de cache, liste vide, fournisseur non configuré, fournisseur en échec |
| `server/test/lib/photo/photo.getImage.test.js` | `photo_id` invalide → 404 sans appel fournisseur, nombres magiques rejetés (SVG, HTML, PDF), dépassement de taille, ré-encodage, cache LRU et éviction |
| `server/test/services/immich/immich.testConnection.test.js` | Les 4 classes d'erreur de §D.1 |
| `server/test/services/immich/photo.getSources.test.js` | Mapping albums + entrée souvenirs, album sans `assetCount` |
| `server/test/services/immich/photo.getPhotos.test.js` | Filtrage `VIDEO`, album vide, souvenirs vides, UUID invalide rejeté, `x-api-key` bien envoyé |
| `server/test/services/immich/photo.buildCaption.test.js` | Les 4 branches de légende + préfixe « Il y a N ans » |
| `server/test/api/photo.controller.test.js` | Les 4 routes : auth requise, paramètres manquants, codes d'erreur |
| `server/test/models/dashboard.test.js` (existant) | Nouveaux champs Joi : valeurs valides, invalides, et **boîte legacy sans `photo_source_mode`** qui doit rester valide |

Côté front : les tests Cypress existants du dashboard doivent passer sans modification (preuve non-régression du mode manuel) ; un scénario ajouté couvre la configuration d'un widget en mode fournisseur avec un `/api/v1/photo/*` bouchonné.

Avant chaque push (rappel `AGENTS.md`) : `npm run prettier && npm run prettier-check`, `npm run eslint` dans chaque dossier touché, `npm run coverage` côté serveur, `npm run compare-translations` côté front.

## H. Découpage de la livraison

| Lot | Contenu | Livrable observable |
|---|---|---|
| **1** | Lib cœur `gladys.photo` + normalisation + caches + 4 routes REST + tests | `GET /api/v1/photo/provider` renvoie `[]` sur une instance sans fournisseur ; rien ne change pour l'utilisateur |
| **2** | Service Immich + page de configuration + entrée de catalogue + i18n | L'utilisateur connecte son Immich et le test de connexion affiche le nombre d'albums |
| **3** | Widget : `EditPhotoBox` (mode, fournisseur, source, ordre, plafond, légendes) + `PhotoBox` (résolution, rafraîchissement, états vides) | Un album ou les souvenirs du jour défilent sur le dashboard, et se rafraîchissent seuls |
| **4** *(phase 2)* | `type: "photo"` pour les intégrations externes (§F) | Un fournisseur de photos communautaire s'installe depuis le store et apparaît dans le sélecteur du widget |

Les lots 1 à 3 peuvent tenir dans une seule PR ; le lot 4 est une PR distincte, qui met à jour `docs/specs/external-integrations.md`.

## I. Questions ouvertes

1. **Cache disque des images ?** Le cache mémoire (60 entrées / 10 min) suffit pour un diaporama, mais un dashboard mural rechargera Immich toutes les 10 minutes pour les mêmes photos. Un cache disque borné (le dossier de données de Gladys, ~50 Mo, purge LRU) diviserait le trafic vers Immich et l'usage CPU de `sharp` — à faire seulement si le besoin se confirme sur le terrain, pas par anticipation.
2. **Qualité d'image du widget.** Le ré-encodage 800×400 est hérité du proxy actuel et convient à un widget de dashboard ; il est visiblement insuffisant sur une tablette murale en plein écran. Rendre `maxWidth/maxHeight` dépendants d'un paramètre du widget (ou de la densité de l'écran) concerne **les deux modes** et mérite une décision séparée — hors périmètre ici, mais c'est le premier retour terrain attendu.
3. **Visibilité des libellés d'albums** pour les utilisateurs non-administrateurs (§D.3) : acceptée par cohérence avec les fournisseurs météo. À revoir si une instance multi-foyers remonte le sujet.
