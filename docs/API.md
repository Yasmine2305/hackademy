# API REST Hackademy

Base : `/api`. Corps en JSON. Les routes marquées 🔒 demandent l’en-tête
`Authorization: Bearer <jeton>` obtenu à l’inscription ou à la connexion.
Toutes les erreurs ont la forme `{ "error": "message lisible" }` (plus `fields` pour un formulaire).

## Scénario

| Méthode | Route | Description |
|---|---|---|
| GET | `/scenario` | Contenu public : en-tête du paquet (40 octets), journaux, cartes ATT&CK, message encodé, glossaire, nombre d’indices. **Aucune réponse.** |
| GET | `/health` | `{ ok: true }` |

## Comptes

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| POST | `/auth/register` | `{ username, password, guestState? }` | `201 { token, user }` · `400` invalide · `409` identifiant pris |
| POST | `/auth/login` | `{ username, password, guestState? }` | `200 { token, user }` · `401` · `429` trop de tentatives |
| GET 🔒 | `/auth/me` | — | `{ user }` |
| POST 🔒 | `/auth/logout` | — | `204` |
| DELETE 🔒 | `/auth/me` | `{ password }` | `204` (compte, progression, sauvegardes et rapports supprimés) |
| PATCH 🔒 | `/auth/password` | `{ current, next }` | `204` (les autres sessions sont fermées) · `400` trop court ou identique · `401` mot de passe actuel faux |

`guestState` : la partie jouée sans compte. Elle est reprise si le compte n’a pas encore de partie.

## Partie

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| GET 🔒 | `/game` | — | `{ state, view, savedAt }` |
| POST | `/game/evaluate` | `{ state }` | `{ state, view }` (partie invitée, rien n’est stocké) |
| POST | `/game/action` | `{ action, state? }` | `{ state, view, events, milestones, savedAt }` |

Connecté : l’état stocké sur le serveur fait foi (le `state` envoyé est ignoré) et il est sauvegardé.
Invité : le `state` envoyé est nettoyé, l’action appliquée, le nouvel état renvoyé.

### Actions

| `type` | Paramètres | Effet |
|---|---|---|
| `start` | — | Démarre le chronomètre, ouvre le dossier |
| `tagLog` | `line` (1-12) | Marque / démarque une ligne du journal (ligne anodine : −4 pts) |
| `answerQ1` | `choice` (0 ou 1) | Question de priorité de la mission 1 |
| `useHint` | `mission` (`m1`…`m3`), `index` | Achète un indice (−5 pts) |
| `setRecipe` | `ops` (tableau de `b64`, `rot`, `hex`, `cae`, `url`) | Recette de décodage |
| `markEntity` | `entity` (`ip` ou `hr`) | Relève une information du texte clair (recette correcte exigée) |
| `placeCard` | `card` (`a`…`e`), `slot` (0-4 ou `null`) | Place une technique dans la chaîne |
| `checkChain` | — | Vérifie l’ordre (erreur : −4 pts) |
| `reset` | — | Recommence l’enquête |

### `view` (ce que le joueur a mérité)

```json
{
  "found": [{ "hex": "45", "ch": "E", "t": "Rafale d’échecs SSH", "s": "203.0.113.66 · 23:41" }, null, "…"],
  "count": 1, "score": 4, "rank": "Analyste junior", "hintsUsed": 0, "errors": 0,
  "missions": { "1": { "done": 1, "solved": false }, "2": { "…": "…" }, "3": { "…": "…" } },
  "marks": { "2": "45" }, "q1": null, "recipeClear": false, "chainWrong": [],
  "hints": { "m1": {}, "m2": {}, "m3": {} },
  "complete": false, "report": null
}
```

Score : `round(octets / 12 × 100) − 5 × indices − 4 × erreurs`, jamais négatif.

## Progression 🔒

| Méthode | Route | Réponse |
|---|---|---|
| GET | `/progress/snapshots` | Les 3 derniers points de restauration |
| POST | `/progress/snapshots/:id/restore` | `{ state, view, savedAt }` |
| GET | `/progress/reports` | Rapports signés : score, durée, SHA-256 |

## Classement

| Méthode | Route | Réponse |
|---|---|---|
| GET | `/leaderboard?limit=10` | `{ entries: [{ username, score, duration_s, created_at }], players }` : meilleur rapport de chaque analyste, trié par score puis par temps. Aucune donnée privée. |

## Contact

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| POST | `/contact` | `{ email, message }` | `201` · `400 { fields }` · `429` |
