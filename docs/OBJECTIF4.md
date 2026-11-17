# Objectif 4 — Finalisation du frontend et optimisation

> Groupe 2 · Hackademy · Yasmine Sellami · Ameni Kharrat

Cette étape fait passer Hackademy d’un prototype fonctionnel (objectif 3) à une version quasi finale :
code plus modulaire, données dynamiques supplémentaires, meilleure expérience utilisateur, et site
nettement plus rapide et accessible. Chaque point ci-dessous reprend une diapositive de l’énoncé.

---

## 1. Résultats Lighthouse : avant / après

Mesures faites avec Lighthouse 12 sur la version compilée (`npm run build`, puis `npm start`),
en mode mobile (téléphone simulé, processeur ralenti ×4, réseau 4G lent) et ordinateur.
Les six rapports complets (une page par fichier, mobile et ordinateur) sont dans
[`docs/lighthouse/`](lighthouse/) : ouvrez-les dans un navigateur. Dernière mesure : 17 novembre 2026.
Les scores de performance varient de quelques points d’une mesure à l’autre (charge du PC).

| Page | Appareil | Performance | Accessibilité | Bonnes pratiques | SEO |
|---|---|---|---|---|---|
| Accueil | mobile | 33 → **80** | 94 → **100** | 100 → **100** | 91 → **100** |
| Accueil | ordinateur | 59 → **94** | 94 → **100** | 100 → **100** | 91 → **100** |
| Centre | mobile | 13 → **78** | 94 → **100** | 100 → **100** | 91 → **100** |
| Centre | ordinateur | 72 → **93** | 94 → **100** | 100 → **100** | 91 → **100** |
| À propos | mobile | 17 → **82** | 94 → **100** | 100 → **100** | 91 → **100** |
| À propos | ordinateur | 70 → **96** | 94 → **100** | 100 → **100** | 91 → **100** |

| Indicateur (page d’accueil, mobile) | Avant | Après |
|---|---|---|
| Poids transféré au premier chargement | 861 Ko | **347 Ko** (÷ 2,5) |
| Plus grand élément affiché (LCP) | 7,5 s | **2,3 s** (Centre et À propos : 2,3 s également) |
| Décalage de mise en page (CLS), Centre mobile | 0,547 | **0** |
| Décalage de mise en page (CLS), ordinateur | 0,20 à 0,27 | **0,001** |

**Limite assumée.** Sur mobile, le score de performance reste autour de 78–82 (contre 93–96 sur ordinateur) à cause du temps de calcul
de la 3D (WebGL + effet de lueur) sur un processeur volontairement ralenti ×4. La 3D est au cœur de
l’identité visuelle du projet (objectif 2) ; nous l’avons donc rendue **différée** et **allégée** plutôt
que supprimée : elle se charge après l’affichage de la page, seulement quand elle approche de l’écran,
avec une résolution réduite sur petit écran, et elle se met en pause hors de l’écran.

---

## 2. Finalisation des pages et composants (diapos 3 et 4)

**Toutes les pages du sitemap** sont intégrées (10 pages + charte + page 404), avec un routing complet
(React Router) et un filet de sécurité : si une page plante, `ErrorBoundary` affiche un message et un
bouton « Recharger » au lieu d’une page blanche.

**Nouveaux composants réutilisables :**

| Composant | Rôle | Utilisé dans |
|---|---|---|
| `Button` | Bouton de la charte (`go`, `danger`, `sm`), avec indicateur de chargement intégré | Accès, Contact, Compte, Classement, Progression |
| `Field` | Champ de formulaire : étiquette, saisie, aide ou erreur reliée au champ (ARIA) | Accès, Contact, Mot de passe, Suppression du compte |
| `Skeleton`, `SkeletonLines`, `PageSkeleton` | Squelettes de chargement | Chargement des pages, Sauvegardes, Classement |
| `ErrorBoundary` | Rattrape les erreurs d’affichage | Toutes les pages |
| `MissionCard` | Carte de mission inclinable (sortie de la page d’accueil) | Accueil |
| `AccountPanel` | Déconnexion, changement de mot de passe, suppression | Progression |
| `Leaderboard` | Classement des analystes | Progression |
| `useAsync` (hook) | Charge une donnée d’API et expose `loading` / `error` / `reload` | Classement, Sauvegardes |

**Organisation** : nouveau dossier `src/assets/` (polices et icônes pixel), dossiers `components/account/`
et `components/progress/` par domaine. Conventions : `PascalCase.jsx` pour les composants,
`camelCase.js` pour le reste, un composant par fichier.

**Cohérence visuelle** : les titres de panneaux et du pied de page sont devenus de vrais titres `h2`
(même apparence, meilleure structure), et tous les boutons passent par le composant `Button`.

---

## 3. Gestion dynamique des données (diapo 5)

Le frontend est connecté à **notre backend réel** (Express + SQLite) ; deux nouvelles fonctions
couvrent l’affichage et la mise à jour de données :

| Fonction | Route | Type |
|---|---|---|
| **Classement des analystes** : meilleur score et temps de chaque compte, mis à jour à chaque rapport signé | `GET /api/leaderboard` | affichage |
| **Changement de mot de passe** : ancien mot de passe exigé, autres appareils déconnectés | `PATCH /api/auth/password` | mise à jour |

S’ajoutent à ce qui existait déjà : création (compte, message de contact, rapport), mise à jour
(progression à chaque action, restauration d’une sauvegarde), suppression (compte).

Le serveur ferme aussi la base proprement à l’arrêt (Ctrl + C ou fermeture de la fenêtre) : le journal
`hackademy.db-wal` est recopié dans `hackademy.db`, qui s’ouvre alors directement dans un visualiseur SQLite.

---

## 4. Expérience utilisateur et accessibilité (diapo 6)

**Animations légères (CSS)** : fondu à chaque changement de page, squelettes animés, indicateur
tournant dans les boutons, balayage lumineux pendant le chargement d’une scène 3D. Toutes sont
coupées si l’utilisateur a demandé « moins d’animations » dans son système (`prefers-reduced-motion`).

**États de chargement** :
- squelette de page pendant le chargement (au lieu d’un texte) ;
- squelettes dans les listes (sauvegardes, classement) ;
- boutons désactivés avec indicateur pendant un envoi (pas de double clic) ;
- en cas de panne du serveur : message clair et bouton **Réessayer**.

**Navigation responsive** :
- la barre d’onglets du bas affiche désormais les **6 sections** (« À propos » manquait) ;
- deux débordements horizontaux en tablette (768 px) sont corrigés : le rail d’octets passe sur deux
  lignes, les indicateurs du Centre sur deux colonnes ;
- vérifié sans débordement sur les 12 pages à 375 px, 768 px et 1440 px ;
- **grands écrans** : la maquette fait 1 440 px de large ; sur un écran 1080p, 1440p, 4K (ou avec
  un zoom navigateur réduit), le site restait une colonne étroite au centre. Au-delà de 1 600 px,
  toute l’interface est maintenant agrandie en proportion (`utils/uiScale.js`, propriété CSS `zoom`) :
  ×1,2 en 1080p, ×1,6 en 1440p, ×2,4 en 4K. La hauteur d’écran (`--vh`) est compensée pour que
  l’accueil tienne toujours dans l’écran, et la 3D est dessinée avec plus de pixels pour rester nette.

| Largeur d’écran | 375 | 768 | 1 280 | 1 536 | 1 920 | 2 560 | 3 840 |
|---|---|---|---|---|---|---|---|
| Échelle | ×1 | ×1 | ×1 | ×1 | ×1,2 | ×1,6 | ×2,4 |
| Largeur occupée par le site | 100 % | 100 % | 100 % | 94 % | 90 % | 90 % | 90 % |
| Débordement horizontal | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Mesures identiques avec les moteurs de Chrome et de Safari.

**Netteté de la 3D au zoom** : zoomer est un geste d’accessibilité courant (les règles WCAG demandent
qu’une page reste utilisable à 200 %). Le texte restait net, mais la 3D devenait floue puis pixelisée.
Trois causes, corrigées dans `components/three/engine.js` (fonction `pixelRatioFor`) :

1. **Résolution figée au chargement** (plafonnée à 2×) : elle est maintenant recalculée à chaque zoom ou
   redimensionnement (événements `resize`, changement de densité `(resolution: …dppx)`, vérification
   de secours dans la boucle d’animation).
2. **Ordinateur zoomé pris pour un téléphone** : le téléphone était reconnu à `window.innerWidth < 768`.
   Or cette largeur, en pixels CSS, diminue quand on zoome : à 200 % sur un écran de 1 280 px, la 3D était
   bridée à 1,5× au lieu de 2×. Le téléphone est désormais reconnu à son écran tactile **et** à la petite
   taille physique de son écran (`pointer: coarse` et `screen`), qui ne changent pas avec le zoom.
   Le plafond fixe de 3× est remplacé par un **budget** d’une image 4K par scène : en zoomant, la scène
   occupe moins de pixels CSS, donc le nombre de pixels réels à calculer reste celui de l’écran.
3. **Zoom par pincement (pavé tactile)** : ce zoom ne change pas `devicePixelRatio` ; le navigateur
   agrandit l’image déjà dessinée. Le texte est redessiné net, mais la 3D était simplement étirée.
   Le moteur lit maintenant le facteur de pincement (`visualViewport.scale`) et redessine la 3D
   200 ms après la fin du geste (pas à chaque étape, pour rester fluide).

S’y ajoutent : le champ d’étoiles suit aussi le zoom (budget réduit à une image 1080p), et
`utils/uiScale.js` prévient le moteur 3D quand l’échelle grand écran change (événement `hackademy:uiscale`),
sinon la résolution était calculée avec l’ancienne échelle. Les étiquettes (adresses IP, techniques ATT&CK)
et les textures de texte sont dessinées 2 à 2,5 fois plus grandes.

| Situation (mesurée dans Chrome) | Pixels dessinés par pixel affiché, avant | Après |
|---|---|---|
| Zoom Ctrl + à 300 % | 1,5 | **3** |
| Pincement ×3, écran de densité 1,5 | 1,5 | **4,1** |

Deux tests de bout en bout le vérifient : la résolution attendue sur chaque configuration, et la netteté
après un pincement simulé (Chromium).

**Accessibilité (94 → 100)** :
- ordre des titres corrigé (`h1` → `h2` → `h3`) ;
- liens du pied de page agrandis (cibles tactiles d’au moins 24 px) ;
- contour de focus visible partout au clavier ;
- erreurs de formulaire reliées au champ (`aria-describedby`, `aria-invalid`, `role="alert"`) ;
- tableau du classement avec légende et en-têtes de colonnes (`caption`, `scope`) ;
- `aria-busy` sur les zones en chargement.

---

## 5. Performances et qualité du code (diapo 7)

| Action | Effet |
|---|---|
| **Compression gzip** de toutes les réponses (`compression`) | −550 Ko transférés |
| **Cache navigateur d’un an** pour les fichiers `/assets` (leur nom contient une empreinte) | visites suivantes quasi instantanées |
| **Three.js chargé à la demande** (`import()` dynamique), seulement quand une scène approche de l’écran | −500 Ko sur le premier chargement |
| Champ d’étoiles décoratif démarré quand le navigateur est inactif, désactivé sur mobile | moins de calcul au démarrage |
| Résolution 3D limitée à 1,5× sur téléphone, budget d’une image 4K par scène ailleurs | moins de pixels à calculer |
| **Polices hébergées avec le site** (`@fontsource`) au lieu de Google Fonts, alphabet latin seul | 0 requête tierce, CSS 124 → 42 Ko |
| Une page = un fichier chargé à la demande (`React.lazy`, déjà en place) | code splitting |
| `robots.txt` ajouté | SEO 100 |
| Squelette de page à hauteur d’écran | plus de décalage de mise en page |

**ESLint** (`npm run lint`) : règles recommandées JavaScript, React et Hooks. Résultat : **0 problème**.
Il a trouvé 8 défauts, tous corrigés : 6 variables inutilisées héritées du prototype 3D, et une boucle
dans le composant `Hexdump`, déplacée dans une fonction séparée.

**Prettier** (`npm run format`) : tout le code a la même mise en forme. Le moteur 3D, écrit d’un bloc
compact dans le prototype (319 lignes), est devenu lisible (1 134 lignes aérées).

**Tests** : `npm test` → **34 tests** (24 serveur, dont 3 nouveaux : classement, mot de passe, gzip ;
10 client), tous au vert.

---

## 6. Tests multi-navigateurs (conseil de la diapo 8)

Des **tests de bout en bout** (Playwright, dossier `e2e/`) ouvrent le site dans un vrai navigateur et
l’utilisent comme une personne : ils jouent l’enquête entière, remplissent les formulaires, créent un
compte, changent le mot de passe, cherchent avec la touche `/`, et vérifient sur les 12 pages qu’il n’y a
ni erreur JavaScript ni débordement horizontal (en ordinateur, tablette 768 px et téléphone).

| Navigateur | Moteur | Résultat |
|---|---|---|
| Google Chrome 157 (installé sur le PC) | Blink | **13 / 13** |
| Microsoft Edge 157 (installé sur le PC) | Blink | **13 / 13** |
| Chromium 156 | Blink | **13 / 13** |
| Écran 1080p (1 920 × 1 080) | Blink | **13 / 13** |
| Écran 4K (3 840 × 2 160) | Blink | **12 / 12** (+1 sans objet) |
| Safari (WebKit 27) | WebKit | **11 / 11** (+2 sans objet) |
| Téléphone Android (Pixel 7) | Blink, tactile | **9 / 9** (+4 sans objet) |
| iPhone 14 | WebKit, tactile | **9 / 9** (+4 sans objet) |
| Firefox 157 | Gecko | **non exécuté** : voir ci-dessous |

**93 tests réussis, 0 échec** (dernier passage : 17 novembre 2026). Les tests « sans objet » sont sautés
volontairement : pas de clavier ni de barre de recherche sur téléphone ; sous Safari, la touche Tab ne
parcourt pas les liens par défaut (réglage du système) ; le test du zoom par pincement ne peut être simulé
que dans Chromium sur ordinateur (et pas sur le banc 4K, où la 3D est dessinée une seule fois).
Le rapport détaillé du dernier passage est dans
[`docs/tests-navigateurs/index.html`](tests-navigateurs/index.html).

**Défauts trouvés grâce à ces tests, et corrigés :**
- **iPhone** : le test « grands écrans » mesurait parfois la page avant son affichage (page chargée à la
  demande) ; il attend désormais que la page soit affichée.
- **Safari / iPhone** : la page Charte débordait de 4 px sur téléphone (colonne de légende trop large).
- **Safari** : un message d’erreur inutile s’affichait quand on quittait une page pendant le chargement de la 3D.

**Deux réglages propres au banc de test, documentés dans le code :**
- le défilement animé est coupé pendant les tests, sinon WebKit fait attendre Playwright ;
- sous WebKit, la 3D est dessinée en mode « animations réduites » : sans carte graphique,
  le WebKit de test calcule chaque image au processeur et saturait la machine.

**Firefox** : le moteur Firefox de Playwright ne démarre pas sur ce PC. Windows refuse de le lancer
(« configuration côte-à-côte incorrecte », assemblage `mozglue` introuvable), alors que ses fichiers sont
présents et que le « Visual C++ Redistributable » 2015-2022 est installé : l’installation de Playwright
est à refaire (`npx playwright install --force firefox`), puis `npx playwright test --project=firefox`.
Le site n’utilise que des fonctions standard, également prises en charge par Firefox
(React, WebGL, CSS Grid, `fetch`).

Lancer les tests : `npm run test:e2e` (première fois : `npx playwright install chromium firefox webkit`).

---

## 7. Ce qui reste à faire par l’équipe

- **Firefox** : réinstaller le Firefox de Playwright (voir ci-dessus), puis lancer les tests Firefox.
- **Répartition des rôles** : à compléter dans [`ORGANISATION.md`](ORGANISATION.md) selon le travail réel
  de chacune.
