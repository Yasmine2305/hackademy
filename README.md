# Hackademy — The Missing Packet

> Projet Web · Objectifs 3 et 4 · Groupe 2 · SUP’COM 2026-2027
> Yasmine Sellami · Ameni Kharrat

> ### ▶ Lancer le site en 30 secondes (Windows)
> 1. Installer **Node.js 22.13+** (version LTS sur https://nodejs.org) si ce n’est pas déjà fait.
> 2. Double-cliquer sur **`LANCER.bat`** dans ce dossier.
> 3. Le navigateur s’ouvre sur **http://localhost:3001** (la première fois, compter ~1 minute d’installation).
>
> L’adresse du site est `http://localhost:3001`. L’adresse `/api` est réservée au serveur
> et répond en JSON : ce n’est pas une page à ouvrir.
> Sous macOS / Linux, ou en ligne de commande : voir la section 1 ci-dessous.

Hackademy est une enquête web en 3D qui apprend la cybersécurité à des débutants.
L’utilisateur incarne un analyste SOC : un paquet réseau (`0x7F3A`) a disparu, il lui manque
12 octets. Chaque preuve trouvée dans les trois missions en restaure un. Une fois le paquet complet,
il révèle le verdict et débloque le rapport d’incident.

Ce dépôt est la version développée des maquettes de l’objectif 2 : 11 pages dynamiques,
un frontend React complet et un backend Node.js qui vérifie les réponses, calcule le score et
sauvegarde la progression.

**Objectif 4 (finalisation et optimisation)** : composants réutilisables, classement et
changement de mot de passe, états de chargement, navigation tablette, accessibilité 100/100,
performances optimisées (gzip, 3D chargée à la demande, polices locales), ESLint et Prettier.
Le détail, avec les scores Lighthouse avant/après, est dans [`docs/OBJECTIF4.md`](docs/OBJECTIF4.md).

---

## 1. Lancer le projet

Prérequis : **Node.js 22.13 ou plus récent** (testé avec Node 24) et npm. Aucune base à installer :
SQLite est intégré à Node (`node:sqlite`), le fichier de base se crée tout seul.

```bash
npm install          # installe le client et le serveur (workspaces npm)
npm run build        # compile le site React dans client/dist
npm start            # lance l'API + le site sur http://localhost:3001
```

Puis ouvrir **http://localhost:3001** dans le navigateur. Arrêter avec `Ctrl + C`.

**Parcours de démonstration** (solutions) : Accueil → « Lancer l’enquête » → « Accepter la mission ».
Mission 1 : marquer les lignes 2, 6, 7, 10 et répondre 23:47. Mission 2 : recette From Base64 puis
ROT13, cliquer sur 198.51.100.23 et 23h47. Mission 3 : T1110, T1078, T1560, T1048, T1070 puis
« Vérifier l’ordre ». Le rapport se débloque avec le mot EXFIL:BACKUP.

Mode développement (rechargement à chaud) :

```bash
npm run dev          # API sur :3001 et site Vite sur http://localhost:5173
```

Tests automatisés :

```bash
npm test             # 24 tests serveur (node:test) + 10 tests client (Vitest)
```

Qualité du code :

```bash
npm run lint         # ESLint : erreurs et mauvaises pratiques (doit afficher 0 problème)
npm run format       # Prettier : met en forme tout le code de la même façon
```

Tests multi-navigateurs (Chrome, Edge, Chromium, Safari/WebKit, Firefox, Android, iPhone) :

```bash
npx playwright install chromium firefox webkit   # première fois seulement
npm run test:e2e                                 # rapport : docs/tests-navigateurs/index.html
```

> **Adaptatif à tous les écrans** : de 375 px (téléphone) à 3 840 px (4K). Au-delà de 1 600 px, toute
> l’interface s’agrandit en proportion pour remplir l’écran (`client/src/utils/uiScale.js`).

Variables d’environnement facultatives : `PORT` (défaut `3001`), `DB_FILE`
(défaut `server/data/hackademy.db`).

---

## 2. Choix du framework

| Couche | Choix | Pourquoi |
|---|---|---|
| Interface | **React 18** + **React Router 6** | Les trois missions partagent les mêmes briques (onglets, indices, glossaire, rail d’octets) : des composants réutilisables évitent de dupliquer le code. Le routeur donne une vraie URL à chaque page du sitemap. |
| Outil de build | **Vite 5** | Démarrage instantané, rechargement à chaud, découpage du code par page. `create-react-app` n’est plus maintenu. |
| 3D | **Three.js** (r128) | La bibliothèque 3D la mieux documentée ; nos scènes du prototype (voxels, globe, paquet en volume) ont été reprises telles quelles dans un module ES. |
| Serveur | **Node.js + Express** | Le même langage du navigateur au serveur. Express suffit pour une API REST de taille modeste. |
| Données | **SQLite** (module natif `node:sqlite`) | Un seul fichier, rien à installer ni à compiler sous Windows. |
| Mots de passe | **bcryptjs** | Hachage bcrypt en JavaScript pur, sans module natif. |

La gestion d’état utilise les **React Hooks** et l’**API Context** (trois contextes : `AuthContext`,
`GameContext`, `ToastContext`). Redux aurait été surdimensionné pour un seul état de partie.

**Principe clé : les réponses ne sont jamais dans le navigateur.** Le client envoie des actions
(« je marque la ligne 7 », « je place T1110 à l’étape 1 ») ; le serveur les applique, décide ce qui
est juste, et renvoie uniquement les octets mérités. Ouvrir les outils de développement ne permet
donc pas de tricher : `GET /api/scenario` ne contient ni le mot final, ni l’ordre de la chaîne.

---

## 3. Fonctionnalités développées

### Pages (sitemap de l’objectif 2)

| Route | Page | Contenu dynamique |
|---|---|---|
| `/` | Accueil | Titre 3D en voxels, capture réseau, vidage hexadécimal animé, cartes de mission inclinables |
| `/acces` | Accès analyste | Connexion / inscription avec validation, ou partie sans compte |
| `/briefing` | Briefing | Message PGP, globe 3D, vidéo sous-titrée lisible, bouton « Accepter la mission » |
| `/centre` | Centre d’opérations | Indicateurs (score, octets, indices, chrono), paquet 3D qui se complète, liste des preuves, journal d’activité réel |
| `/centre/mission-1` | Journaux | Journal filtrable (texte + niveau), marquage à la souris ou au clavier, question de priorité |
| `/centre/mission-2` | Décodage | Atelier façon CyberChef : recette d’opérations, sortie en direct, informations cliquables |
| `/centre/mission-3` | Chronologie | Glisser-déposer (ou clic) des techniques MITRE ATT&CK, vérification serveur |
| `/rapport` | Rapport | Verrouillé tant que le paquet est incomplet ; verdict, IOC, score final, export PDF (impression), rejouer |
| `/progression` | Progression | Avatar 3D, barres par mission, badges, points de restauration, rapports signés (SHA-256), déconnexion, suppression du compte |
| `/a-propos` | À propos | Page de manuel, équipe, stack, **formulaire de contact** envoyé à l’API |
| `/charte` | Charte graphique | Couleurs, typographies, composants |
| `*` | 404 | Page introuvable |

### Formulaires dynamiques
- **Inscription / connexion** : validation immédiate (identifiant, 12 caractères minimum, confirmation),
  erreurs du serveur affichées (identifiant pris, mot de passe faux, trop de tentatives).
- **Contact** : validation client et serveur, compteur de caractères, état d’envoi, message de confirmation.
- **Recherche** (« grep le dossier », touche `/`) : pages, glossaire et lignes de journal, navigation au clavier.
- **Filtres** du journal (texte libre + niveaux ALL / WARN / DENY / CRIT / INFO).

### Interactions et notifications
- Notifications à chaque octet restauré, erreur (−4 pts), mission résolue, rapport débloqué.
- Animations : octets qui « sautent » dans le rail, cartes inclinables, scènes 3D qui réagissent aux preuves.
- Indices payants (−5 pts) : leur texte n’est envoyé par le serveur qu’une fois l’indice utilisé.
- Glisser-déposer accessible (alternative au clic), navigation clavier dans le journal (`↑` `↓` `m`).

### Gestion des données
- **Sans compte** : la partie est gardée dans `localStorage`, mais chaque action reste vérifiée par le serveur.
- **Avec compte** : la partie est sur le serveur (SQLite), synchronisée à chaque action
  (indicateur « sync hh:mm » dans l’en-tête). À l’inscription, la partie commencée sans compte est reprise.
- **Points de restauration** : créés automatiquement (dossier ouvert, chaque mission, rapport), 3 gardés.
- **Rapports signés** : empreinte SHA-256 enregistrée à chaque enquête terminée.

### Sécurité (cohérent avec le sujet du site)
Mots de passe hachés avec bcrypt, jetons de session aléatoires (32 octets) avec expiration,
limitation des tentatives de connexion, validation et nettoyage de tout ce qui vient du client,
en-têtes HTTP de sécurité, droit à l’effacement (suppression du compte et des données).

### Accessibilité et responsive
Lien d’évitement, balises sémantiques (`header`, `nav`, `main`, `article`, `footer`), `aria-live` pour
les résultats, contrastes mesurés (texte 17,5:1), couleur toujours doublée d’un mot (RÉSOLUE, CRIT…),
respect de `prefers-reduced-motion`, repli si WebGL est absent. Mise en page vérifiée à 375 px
(barre d’onglets mobile) et 1440 px, sans défilement horizontal.

---

## 4. Organisation du code

```
hackademy/
├── package.json            scripts communs (workspaces client + server)
├── client/                 frontend React (Vite)
│   ├── index.html
│   └── src/
│       ├── main.jsx        point d'entrée : routeur + contextes
│       ├── App.jsx         déclaration des routes (pages chargées à la demande)
│       ├── routes.js       sitemap : chemins, titres, menu
│       ├── context/        AuthContext, GameContext, ToastContext
│       ├── services/       api.js (client REST), storage.js (partie invitée)
│       ├── hooks/          useTitle, useClock, useTilt, useAsync…
│       ├── assets/         polices (fonts.js), icônes pixel et avatars (pixels.js)
│       ├── components/
│       │   ├── layout/     Header, Search, Rail, Footer, Layout
│       │   ├── ui/         Button, Field, Skeleton, ErrorBoundary, Pane, MissionCard, Hexdump…
│       │   ├── account/    AccountPanel (déconnexion, mot de passe, suppression)
│       │   ├── progress/   Leaderboard (classement)
│       │   └── three/      engine.js (scènes Three.js), Scene.jsx, Ambient.jsx
│       ├── pages/          une page = un fichier
│       ├── utils/          décodeurs, formatage (+ tests Vitest)
│       └── styles/         charte « PCAP 3D » (global.css) + ajouts
├── server/                 backend Node.js (Express)
│   ├── src/
│   │   ├── index.js        démarrage
│   │   ├── app.js          application Express (middlewares, routes, erreurs)
│   │   ├── game/           scenario.js (données + réponses), engine.js (règles, score)
│   │   ├── routes/         auth.js, game.js, contact.js
│   │   ├── middleware/     auth.js (jetons, limiteur)
│   │   └── db/             database.js (schéma SQLite + requêtes)
│   └── test/               engine.test.js, api.test.js
├── eslint.config.mjs       règles ESLint (qualité du code)
├── .prettierrc.json        règles Prettier (mise en forme)
└── docs/
    ├── API.md              référence de l'API REST
    ├── OBJECTIF4.md        rapport de l'objectif 4 (optimisations, scores avant/après)
    ├── lighthouse/         rapports Lighthouse finaux (à ouvrir dans un navigateur)
    └── ORGANISATION.md     répartition des tâches, conventions Git
```

Conventions : composants React en `PascalCase.jsx`, utilitaires en `camelCase.js`, routes d’URL en
français et en minuscules (`/centre/mission-1`), commentaires en français.

La référence complète de l’API est dans [`docs/API.md`](docs/API.md).

---

## 5. Données de démonstration

Le scénario est **fictif** : Defensys n’existe pas et toutes les adresses IP sont réservées à la
documentation (RFC 5737). Aucun compte n’est fourni : créez-en un depuis la page *Accès analyste*,
ou jouez sans compte.
