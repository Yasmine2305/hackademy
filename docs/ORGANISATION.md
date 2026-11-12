# Organisation de l’équipe

## Répartition proposée

| Domaine | Responsable | Contenu |
|---|---|---|
| Frontend — pages d’entrée | Yasmine Sellami | Accueil, Accès, Briefing, Rapport, À propos, Charte, en-tête, recherche |
| Frontend — enquête | Ameni Kharrat | Centre, Missions 1 à 3, Progression, rail d’octets, scènes 3D |
| Backend | Yasmine Sellami | Express, authentification, base SQLite, contact |
| Moteur de jeu + tests | Ameni Kharrat | `engine.js`, règles de score, tests `node:test` et Vitest |
| Intégration et recette | les deux | Parcours complet, mobile, navigateurs, README |

Suivi des tâches : un tableau GitHub Projects (À faire / En cours / En revue / Fait),
une carte par page ou par route d’API.

## Conventions Git

- Une branche par fonctionnalité : `feat/mission-2`, `feat/api-auth`, `fix/rail-mobile`.
- Messages de commit courts à l’impératif : `feat(m2): ajoute la recette de décodage`.
- Fusion dans `main` par pull request relue par l’autre membre, tests au vert (`npm test`).

## Tests avant intégration

1. `npm test` : moteur de jeu, API et utilitaires du client.
2. Parcours manuel : accueil → briefing → 3 missions → rapport, avec et sans compte.
3. Largeurs 375 px, 768 px et 1440 px ; Chrome, Firefox, Edge (et Safari si disponible).
4. Clavier seul : lien d’évitement, recherche `/`, journal `↑ ↓ m`, formulaires.

## Journal des versions

- **Objectif 1** : vision, public, MVP.
- **Objectif 2** : sitemap, maquettes basse et haute fidélité, charte, prototype HTML/JS.
- **Objectif 3** : passage en React + Express + SQLite ; réponses vérifiées côté serveur,
  comptes, sauvegardes, points de restauration, rapports signés, formulaire de contact, tests.
