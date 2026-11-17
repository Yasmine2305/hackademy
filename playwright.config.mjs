/**
 * Tests de bout en bout multi-navigateurs (Playwright).
 * Un vrai navigateur ouvre le site et clique comme un utilisateur.
 *
 *   npm run test:e2e                 → tous les navigateurs
 *   npx playwright test --project=firefox
 *   npx playwright show-report      → rapport HTML détaillé
 *
 * Première fois seulement : npx playwright install chromium firefox webkit
 */
import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

const PORT = 3095;
// base de données jetable : les tests ne touchent jamais à vos vraies données
const DB_FILE = path.join(os.tmpdir(), `hackademy-e2e-${Date.now()}.db`);

const desktop = { viewport: { width: 1440, height: 900 } };

/**
 * Les navigateurs de test (WebKit, et Chromium en 4K) n'ont pas accès à la carte graphique : il calcule la 3D
 * au processeur, image par image. Avec « réduire les animations », le site dessine chaque scène
 * une seule fois au lieu de 60 fois par seconde : la 3D reste vérifiée, sans saturer la machine.
 * (Le vrai Safari d'un Mac utilise la carte graphique et n'a pas ce problème.)
 */
const softwareGL = { reducedMotion: 'reduce' };

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'docs/tests-navigateurs' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'fr-FR',
  },
  projects: [
    // moteurs installés par Playwright
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...desktop } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], ...desktop } },
    { name: 'webkit-safari', use: { ...devices['Desktop Safari'], ...desktop, ...softwareGL } },
    // vrais navigateurs installés sur le PC
    { name: 'google-chrome', use: { ...devices['Desktop Chrome'], ...desktop, channel: 'chrome' } },
    { name: 'microsoft-edge', use: { ...devices['Desktop Edge'], ...desktop, channel: 'msedge' } },
    // grands écrans : l'interface est agrandie pour remplir l'écran (client/src/utils/uiScale.js)
    { name: 'ecran-1080p', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
    // 4K : 8 millions de pixels de 3D calculés au processeur dans le navigateur de test → animations réduites
    { name: 'ecran-4k', use: { ...devices['Desktop Chrome'], viewport: { width: 3840, height: 2160 }, ...softwareGL } },
    // téléphones simulés (écran tactile, petite largeur)
    { name: 'mobile-android', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-iphone', use: { ...devices['iPhone 14'], ...softwareGL } },
  ],
  webServer: {
    command: 'npm run build && node --disable-warning=ExperimentalWarning server/src/index.js',
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { PORT: String(PORT), DB_FILE, RATE_LIMIT_FACTOR: '50' },
  },
});
