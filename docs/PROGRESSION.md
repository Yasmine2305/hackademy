# Hackademy — Journal de progression du projet

> Projet Web · SUP’COM · Groupe 2 · 2026-2027
> Yasmine Sellami · Ameni Kharrat · Encadrante : Dr. Maroua Nouioua
> Dernière mise à jour : 17 novembre 2026

---

## Vue d’ensemble

**Hackademy — The Missing Packet** est une enquête web en 3D qui apprend la cybersécurité à des débutants.
L’utilisateur incarne un analyste SOC : un paquet réseau a disparu, il lui manque 12 octets, et chaque preuve
trouvée dans trois missions (journaux, décodage, chronologie) en restaure un.

| Objectif | Sujet | Livrable | Date | État |
|---|---|---|---|---|
| 1 | Vision, public cible, MVP | `Hackademy.pptx` | 5 nov. 2026 | ✅ rendu |
| 2 | Sitemap, maquettes, charte, choix techniques | `Groupe2_Projet_Web_Objectif2.pptx` + prototype | 7 nov. 2026 | ✅ rendu |
| 3 | Développement des fonctionnalités principales | `Groupe2_Projet_Web_Objectif3.zip` + GitHub | 12 nov. 2026 | ✅ terminé (voir point d’attention) |
| 4 | Finalisation du frontend et optimisation | `Groupe2_Projet_Web_Objectif4.zip` | 17 nov. 2026 | ✅ terminé, à envoyer sur GitHub |

**Dépôt GitHub** : https://github.com/Yasmine2305/hackademy (contient l’objectif 3 ; l’objectif 4 n’y est pas encore).

---

## Objectif 1 — Vision du projet (5 novembre)

- Concept : une enquête jouable plutôt qu’un cours ou un quiz (« apprendre en jouant »).
- Public : étudiants en informatique débutant en cybersécurité, aucun prérequis.
- Parcours en 4 étapes : briefing → preuves → missions → rapport et verdict.
- Trois missions : analyser des journaux, décoder un message, remettre une attaque dans l’ordre.
- Direction artistique inspirée des centres d’opérations cyber (bleu nuit, vert terminal, monospace).
- MVP prévu sans backend ; une version 2 envisageait sauvegarde et tableau de preuves complet.

## Objectif 2 — Conception (7 novembre)

- **Sitemap** de 10 pages, chacune à 2 clics maximum de l’accueil (exigence : 3).
- **Maquettes** basse fidélité (noir et blanc) et haute fidélité, importables dans Figma (dossier `figma/`).
- **Prototype interactif** en HTML/JS avec scènes 3D Three.js (dossier `prototype/`).
- **Charte « PCAP 3D »** : 8 couleurs à contraste mesuré, 3 polices (Chakra Petch, JetBrains Mono, IBM Plex Sans),
  icônes pixel 8 × 8, code couleur du Traffic Light Protocol.
- **Choix techniques** : React + Three.js, Node.js (Express), SQLite, mots de passe hachés avec bcrypt.

## Objectif 3 — Développement (10 → 12 novembre)

Le prototype est devenu une vraie application en deux parties :

| Partie | Technologie | Rôle |
|---|---|---|
| Client | React 18, React Router, Vite, Three.js | 11 pages, interface, 3D |
| Serveur | Node.js, Express, SQLite (`node:sqlite`), bcryptjs | vérifie les réponses, score, comptes, sauvegardes |

**Fonctionnalités livrées**
- Les 3 missions jouables de bout en bout, avec rapport final débloqué à 12 octets.
- **Réponses vérifiées par le serveur** : elles ne sont jamais envoyées au navigateur (on ne peut pas tricher avec F12).
- Comptes (inscription, connexion, suppression), jeu possible sans compte (sauvegarde dans le navigateur).
- Sauvegarde automatique, 3 points de restauration, rapports signés SHA-256.
- Formulaire de contact, recherche (« / »), filtres du journal, notifications, glisser-déposer.
- 29 tests automatiques ; README ; référence de l’API (`docs/API.md`).
- Lancement en un double-clic : `LANCER.bat`.

**Incidents rencontrés et résolus**

| Problème | Cause | Solution |
|---|---|---|
| Page `localhost:3001/api` affichait « Route inconnue » | mauvaise adresse ouverte | utiliser `localhost:3001` ; message de démarrage clarifié |
| Le site ne démarrait plus après suppression d’un dossier | installation `node_modules` interrompue à mi-chemin | réinstallation ; `LANCER.bat` détecte et répare une installation incomplète |
| Erreur au premier `git push` | adresse d’exemple `VOTRE-NOM` copiée telle quelle | `git remote set-url` avec la vraie adresse |
| Base SQLite vide dans le visualiseur | données encore dans le journal `hackademy.db-wal` | fermeture propre de la base à l’arrêt du serveur (objectif 4) |

## Objectif 4 — Finalisation et optimisation (17 novembre)

**Composants et code**
- Nouveaux composants réutilisables : `Button`, `Field`, `Skeleton`, `ErrorBoundary`, `MissionCard`,
  `AccountPanel`, `Leaderboard`, hook `useAsync` ; dossiers `assets/`, `account/`, `progress/`.
- ESLint (0 problème) et Prettier (code uniformisé) ; moteur 3D rendu lisible (319 → 1 134 lignes).

**Données dynamiques**
- Classement des analystes (`GET /api/leaderboard`) et changement de mot de passe (`PATCH /api/auth/password`).

**Expérience utilisateur et accessibilité**
- Transitions de page, squelettes de chargement, indicateurs dans les boutons, bouton « Réessayer ».
- Barre de navigation mobile complète (6 sections), deux débordements tablette corrigés.
- Accessibilité 94 → **100** (ordre des titres, cibles tactiles, focus visible, erreurs reliées aux champs).

**Performances (Lighthouse, avant → après)**

| | Mobile | Ordinateur |
|---|---|---|
| Performance | 13–33 → **78–82** | 59–72 → **93–96** |
| Accessibilité | 94 → **100** | 94 → **100** |
| SEO | 91 → **100** | 91 → **100** |
| Poids de la page d’accueil | 861 Ko → **347 Ko** | idem |

Moyens : compression gzip, cache d’un an, Three.js chargé à la demande, polices hébergées localement,
`robots.txt`, squelette pleine hauteur (décalage de mise en page 0,35 → 0,001).

**Retours d’utilisation traités le même jour**

| Retour | Cause | Correction |
|---|---|---|
| « On dirait une appli mobile, tout est petit » | site limité à 1 440 px + zoom navigateur réduit | mise à l’échelle automatique au-delà de 1 600 px (×1,2 en 1080p, ×2,4 en 4K) |
| « La 3D est floue quand je zoome » | résolution 3D fixée au chargement, étiquettes en basse définition | résolution recalculée à chaque zoom, étiquettes et textures en haute définition |
| « Toujours floue, puis pixelisée au zoom » | ordinateur zoomé pris pour un téléphone (`innerWidth < 768`) ; zoom par pincement ignoré | téléphone reconnu par l’écran tactile ; pincement pris en compte (`visualViewport.scale`) ; 3× à 300 %, 4,1× en pinçant ×3 |
| « Teste les autres navigateurs » | — | 96 tests de bout en bout avec Playwright (voir ci-dessous) |

**Tests multi-navigateurs** (Playwright, `npm run test:e2e`)

| Configuration | Résultat |
|---|---|
| Google Chrome, Microsoft Edge, Chromium | 13 / 13 chacun |
| Écran 1080p | 13 / 13 |
| Écran 4K | 12 / 12 (+1 sans objet) |
| Safari (WebKit) | 11 / 11 (+2 sans objet) |
| Téléphone Android, iPhone | 9 / 9 chacun (+4 sans objet) |
| Firefox | non exécuté (Firefox de Playwright à réinstaller) |

**93 réussis, 0 échec.** Ils ont révélé deux vrais défauts sous Safari (débordement de la page Charte sur
iPhone, message d’erreur inutile en quittant une page), tous deux corrigés.

---

## État actuel

| Indicateur | Valeur |
|---|---|
| Pages | 11 (+ page 404) |
| Lignes de code (client, serveur, tests) | ≈ 9 900 |
| Composants React | 17 |
| Routes d’API | 16 |
| Tests unitaires et API | 34 (24 serveur + 10 client), tous au vert |
| Tests de bout en bout | 93 réussis sur 8 configurations |
| Lighthouse (ordinateur) | Performance 93–96 · Accessibilité 100 · Bonnes pratiques 100 · SEO 100 |

## Reste à faire

1. **Envoyer l’objectif 4 sur GitHub** (75 fichiers modifiés ou ajoutés, non encore commités).
2. **Tester Firefox** : le Visual C++ Redistributable est installé, mais Windows refuse de lancer le
   Firefox de Playwright (assemblage `mozglue` introuvable). Le réinstaller :
   `npx playwright install --force firefox`, puis `npx playwright test --project=firefox`.
3. **Compléter la répartition des rôles** dans `docs/ORGANISATION.md` selon le travail réel de chacune.
4. **Refaire le zip de l’objectif 3** si vous devez le rendre à nouveau (voir ci-dessous).

## ⚠️ Point d’attention

Le fichier `Groupe2_Projet_Web_Objectif3.zip` actuellement sur le disque a été recompressé après sa
création : il pèse **28 Mo** et contient `node_modules` (8 977 fichiers inutiles), le site compilé et
**la base de données personnelle** (`server/data/hackademy.db` : comptes et messages de contact).
Ces dossiers ne doivent pas être rendus ; le zip propre ne faisait que 130 Ko.
Le zip de l’objectif 4 est, lui, propre (1,1 Mo, sans `node_modules` ni base de données).

---

## Lancer le projet

Double-cliquer sur **`LANCER.bat`**, puis ouvrir **http://localhost:3001** (Node.js 22.13 ou plus requis).
Détails : `README.md`. Rapport complet de l’objectif 4 : `docs/OBJECTIF4.md`.
