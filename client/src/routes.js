/** Plan du site (sitemap de l'objectif 2) : chemin, titre, section active du menu. */
export const ROUTES = [
  { path: '/', title: 'Accueil', section: 'accueil' },
  { path: '/acces', title: 'Accès analyste', section: null },
  { path: '/briefing', title: 'Briefing', section: 'briefing' },
  { path: '/centre', title: 'Centre d’opérations', section: 'centre', inCase: true },
  { path: '/centre/mission-1', title: 'Mission 1 — Journaux', section: 'centre', inCase: true },
  { path: '/centre/mission-2', title: 'Mission 2 — Décodage', section: 'centre', inCase: true },
  { path: '/centre/mission-3', title: 'Mission 3 — Chronologie', section: 'centre', inCase: true },
  { path: '/rapport', title: 'Rapport', section: 'rapport', inCase: true },
  { path: '/progression', title: 'Progression', section: 'progression' },
  { path: '/a-propos', title: 'À propos', section: 'apropos' },
  { path: '/charte', title: 'Charte graphique', section: null },
];

export const routeFor = (pathname) =>
  ROUTES.find((r) => r.path === pathname.replace(/\/$/, '') || (r.path === '/' && pathname === '/'));

/** Menu principal (desktop) et barre d'onglets (mobile). */
export const NAV = [
  ['/', 'accueil', 'accueil'],
  ['/briefing', 'briefing', 'briefing'],
  ['/centre', 'centre', 'centre'],
  ['/rapport', 'rapport', 'rapport'],
  ['/progression', 'progression', 'profil'],
  ['/a-propos', 'apropos', 'infos'],
];
