/**
 * Scénario « The Missing Packet » — source de vérité unique.
 *
 * Ce fichier contient deux familles de données :
 *  - PUBLIC  : ce que le navigateur a le droit de connaître (journaux, cartes, message encodé…)
 *  - SECRETS : les réponses (octets du paquet, ordre de la chaîne, verdict). Elles ne quittent
 *              jamais le serveur, sauf octet par octet quand le joueur les a mérités.
 *
 * Le paquet, l'encodage Base64/ROT13 et les adresses sont réels et cohérents entre eux.
 * Les adresses IP sont réservées à la documentation (RFC 5737).
 */

/* ------------------------------------------------------------------ */
/* SECRETS                                                             */
/* ------------------------------------------------------------------ */

/** Paquet complet (52 octets) : en-tête IPv4 + TCP (40 octets) puis 12 octets de données. */
export const PACKET = (
  '45 00 00 34 7f 3a 40 00 40 06 84 3c 0a 00 03 03 c6 33 64 17 cb dc 01 bb ' +
  '1a 2b 3c 4d 5e 6f 70 81 50 18 fa f0 d7 c8 00 00 ' +
  '45 58 46 49 4c 3a 42 41 43 4b 55 50'
).split(' ');
export const PAYLOAD_OFFSET = 40;
export const WORD = 'EXFIL:BACKUP';

/** Ligne de journal → index de l'octet qu'elle restaure (plusieurs lignes peuvent viser le même). */
export const LOG_TO_BYTE = { 2: 0, 3: 0, 4: 0, 6: 1, 7: 2, 10: 3 };
/** Lignes suspectes mais non décisives : on ne pénalise pas le joueur s'il les marque. */
export const LOG_PLAUSIBLE = [9, 11];
/** Bonne réponse à la question « quelle alerte d'abord ? » */
export const Q1_ANSWER = 1;
/** Recette de décodage attendue. */
export const RECIPE = ['b64', 'rot'];
/** Entités à repérer dans le texte clair. */
export const ENTITIES = ['ip', 'hr'];
/** Ordre correct de la chaîne d'attaque. */
export const CHAIN_ORDER = ['a', 'b', 'c', 'd', 'e'];

/** Titres des 12 preuves (dévoilés une fois la preuve trouvée). */
export const PROOFS = [
  { m: 1, t: 'Rafale d’échecs SSH', s: '203.0.113.66 · 23:41' },
  { m: 1, t: 'Accès refusé sur admin', s: 'DenyUsers · 23:43' },
  { m: 1, t: 'Connexion svc-backup', s: 'mot de passe · 23:44' },
  { m: 1, t: 'Flux perdu, id 0x7f3a', s: 'srv-03 · 23:47' },
  { m: 2, t: 'Couche 1 : Base64', s: 'message intercepté' },
  { m: 2, t: 'Couche 2 : ROT13', s: 'message intercepté' },
  { m: 2, t: 'Destination révélée', s: '198.51.100.23' },
  { m: 2, t: 'Fenêtre de tir révélée', s: '23h47' },
  { m: 3, t: 'Accès initial ordonné', s: 'T1110 puis T1078' },
  { m: 3, t: 'Collecte placée', s: 'T1560' },
  { m: 3, t: 'Exfiltration placée', s: 'T1048' },
  { m: 3, t: 'Effacement placé', s: 'T1070' },
];

export const HINTS = {
  m1: [
    'Commencez par filtrer les lignes qui mentionnent l’adresse 203.0.113.66.',
    'Un mot de passe « Accepted » juste après des « Failed » depuis la même IP, c’est le pivot.',
    'Il reste une ligne hors SSH : cherchez id=0x7f3a.',
  ],
  m2: [
    'Le = final et l’alphabet A–Z a–z 0–9 + / trahissent un encodage courant.',
    'Après la première couche, le texte garde sa ponctuation mais les mots sont décalés de 13 lettres.',
    'Dans le texte clair, cliquez sur l’adresse IP et sur l’heure.',
  ],
  m3: [
    'L’attaquant doit entrer avant de pouvoir collecter.',
    'Une archive se prépare avant d’être envoyée.',
    'On efface ses traces en dernier.',
  ],
};

/** Contenu du rapport final : envoyé seulement quand les 12 octets sont retrouvés. */
export const REPORT = {
  title: 'Exfiltration via le compte de sauvegarde',
  verdict:
    'Le 12 mars à 23:41, une attaque par force brute depuis 203.0.113.66 a visé srv-03. À 23:44, ' +
    'l’attaquant est entré avec le compte de service svc-backup, a archivé /var/backups/clients et ' +
    'l’a envoyé vers 198.51.100.23, avant d’effacer son historique.',
  timeline: [
    ['23:41', 'T1110', 'Force brute sur root'],
    ['23:44', 'T1078', 'Connexion réussie, svc-backup'],
    ['23:45', 'T1560', 'Archive de /var/backups/clients'],
    ['23:47', 'T1048', 'Exfiltration, paquet 0x7F3A perdu'],
    ['23:49', 'T1070', 'Effacement de l’historique'],
  ],
  iocs: [
    ['IP source', '203.0.113.66'],
    ['IP destination', '198.51.100.23'],
    ['Compte', 'svc-backup'],
    ['Fichier', '/tmp/.b.tgz'],
  ],
  recommendations: [
    'Changer le secret de svc-backup et le passer en authentification par clé',
    'Limiter les tentatives SSH (fail2ban) et fermer SSH depuis Internet',
    'Filtrer les flux sortants de srv-03 vers une liste autorisée',
    'Envoyer les journaux hors de la machine pour empêcher leur effacement',
  ],
  chainError: 'l’archivage précède l’envoi',
};

/* ------------------------------------------------------------------ */
/* PUBLIC                                                              */
/* ------------------------------------------------------------------ */

export const LOGS = [
  [1, '23:40:02', 'INFO', 'cron', 'CMD (/usr/local/bin/rotate-logs)'],
  [2, '23:41:07', 'WARN', 'sshd', 'Failed password for root from 203.0.113.66 port 52144 ssh2'],
  [3, '23:41:09', 'WARN', 'sshd', 'Failed password for root from 203.0.113.66 port 52146 ssh2'],
  [4, '23:41:14', 'WARN', 'sshd', 'Failed password for root from 203.0.113.66 port 52151 ssh2'],
  [5, '23:42:58', 'INFO', 'sshd', 'Accepted publickey for noc-admin from 10.0.3.41 port 40022 ssh2'],
  [6, '23:43:12', 'DENY', 'sshd', 'User admin from 203.0.113.66 not allowed because listed in DenyUsers'],
  [7, '23:44:51', 'CRIT', 'sshd', 'Accepted password for svc-backup from 203.0.113.66 port 52190 ssh2'],
  [8, '23:44:52', 'INFO', 'systemd', 'Started Session 412 of user svc-backup'],
  [9, '23:45:20', 'WARN', 'sudo', 'svc-backup : COMMAND=/bin/tar czf /tmp/.b.tgz /var/backups/clients'],
  [10, '23:47:03', 'CRIT', 'kernel', 'nf_conntrack: flow 10.0.3.3 -> 198.51.100.23 id=0x7f3a lost'],
  [11, '23:49:40', 'CRIT', 'bash', 'svc-backup : shred -u ~/.bash_history'],
  [12, '23:50:01', 'INFO', 'cron', 'CMD (/usr/local/bin/backup-check)'],
];

export const CARDS = {
  a: { id: 'T1110', n: 'Force brute', d: 'Rafale de mots de passe sur le compte root.', r: 'auth.log L2–4' },
  b: { id: 'T1078', n: 'Compte valide', d: 'Connexion réussie avec svc-backup depuis l’IP attaquante.', r: 'auth.log L7' },
  c: { id: 'T1560', n: 'Archivage', d: 'Compression de /var/backups/clients dans /tmp.', r: 'auth.log L9' },
  d: { id: 'T1048', n: 'Exfiltration', d: 'Envoi de l’archive : le paquet 0x7F3A se perd en route.', r: 'auth.log L10' },
  e: { id: 'T1070', n: 'Effacement', d: 'Suppression de l’historique des commandes.', r: 'auth.log L11' },
};
/** Ordre d'affichage (mélangé) des cartes dans la réserve. */
export const CARD_POOL = ['c', 'a', 'e', 'b', 'd'];

export const B64_MESSAGE =
  'bmVwdXZpciBjZXJnci4gcG5hbnk6IGZpcC1vbnB4aGMgLT4gMTk4LjUxLjEwMC4yMy4gc3JhcmdlciAyM3U0Ny4=';

export const OPERATIONS = ['b64', 'rot', 'hex', 'cae', 'url'];

export const GLOSSARY = {
  sshd: 'Service qui reçoit les connexions à distance (SSH).',
  'Failed / Accepted': 'Mot de passe refusé ou accepté par le serveur.',
  svc: 'Préfixe des comptes de service : ils lancent des tâches, pas des humains.',
  'id=0x7f3a': 'Champ « Identification » de l’en-tête IPv4 : le numéro du paquet.',
  Base64: 'Encodage, pas chiffrement : n’importe qui peut le lire sans clé.',
  ROT13: 'Décale chaque lettre de 13 rangs. Ne protège rien.',
  'MITRE ATT&CK': 'Catalogue public des techniques d’attaque (T1110, T1078…).',
  'Kill chain': 'Enchaînement des étapes d’une attaque, de l’entrée à la sortie.',
};

/** Ce que renvoie GET /api/scenario : aucune réponse n'y figure. */
export function publicScenario() {
  return {
    id: '0417',
    packetId: '0x7F3A',
    header: PACKET.slice(0, PAYLOAD_OFFSET),
    payloadLength: PACKET.length - PAYLOAD_OFFSET,
    proofMissions: PROOFS.map((p) => p.m),
    logs: LOGS,
    cards: CARDS,
    cardPool: CARD_POOL,
    message: B64_MESSAGE,
    operations: OPERATIONS,
    hintCounts: { m1: HINTS.m1.length, m2: HINTS.m2.length, m3: HINTS.m3.length },
    glossary: GLOSSARY,
    scoring: { perHint: 5, perError: 4 },
  };
}
