/**
 * Tests de bout en bout : un vrai navigateur ouvre le site et l'utilise comme une personne.
 * Le même fichier est rejoué sur chaque navigateur déclaré dans playwright.config.mjs.
 */
import { test, expect } from '@playwright/test';

const PAGES = [
  ['/', 'The Missing Packet'],
  ['/acces', 'Accès analyste'],
  ['/briefing', 'Briefing de mission'],
  ['/centre', 'Centre d’opérations'],
  ['/centre/mission-1', 'Analyser les journaux'],
  ['/centre/mission-2', 'Décoder le message'],
  ['/centre/mission-3', 'Reconstituer l’attaque'],
  ['/rapport', 'Rapport d’incident'],
  ['/progression', 'Votre progression'],
  ['/a-propos', 'man hackademy'],
  ['/charte', 'Charte graphique'],
  ['/page-qui-nexiste-pas', 'Ce paquet-là non plus'],
];

/** Relève les erreurs JavaScript et les messages d'erreur de la console. */
function watchErrors(page, browserName) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`exception : ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // WebKit écrit ce message quand on change de page alors qu'un morceau de code était
    // encore en téléchargement (chargement interrompu). Vérifié : 0 occurrence quand chaque
    // page se charge jusqu'au bout. On l'ignore donc, et seulement sous WebKit.
    if (browserName === 'webkit' && m.text() === 'TypeError: Importing a module script failed.') return;
    errors.push(`console : ${m.text()}`);
  });
  return errors;
}

/**
 * Le site fait défiler la page en douceur (scroll-behavior: smooth). Pendant les tests,
 * on coupe cette animation : sous WebKit, Playwright attendrait sinon qu'un élément
 * « arrête de bouger » avant de cliquer dessus. Sans effet sur ce qui est vérifié.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = 'html{scroll-behavior:auto!important}';
      document.head.appendChild(s);
    });
  });
});

const horizontalOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test.describe('Affichage', () => {
  test('les 12 pages s’affichent, sans erreur ni débordement horizontal', async ({ page, browserName }) => {
    const errors = watchErrors(page, browserName);
    for (const [path, title] of PAGES) {
      await page.goto(path);
      await expect(page.locator('main h1').first(), `titre de ${path}`).toContainText(title);
      expect(await horizontalOverflow(page), `débordement horizontal sur ${path}`).toBeLessThanOrEqual(0);
    }
    expect(errors).toEqual([]);
  });

  test('tablette (768 px) : barre d’onglets et aucune page qui déborde', async ({ page, isMobile }) => {
    test.skip(isMobile, 'déjà couvert par les projets mobiles');
    await page.setViewportSize({ width: 768, height: 1024 });
    for (const [path] of PAGES) {
      await page.goto(path);
      await expect(page.locator('main')).toBeVisible();
      expect(await horizontalOverflow(page), `débordement horizontal sur ${path}`).toBeLessThanOrEqual(0);
    }
    await expect(page.locator('.tabbar')).toBeVisible();
    await expect(page.locator('.tabbar a')).toHaveCount(6);
  });

  test('navigation adaptée à la taille d’écran', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) {
      await expect(page.locator('.tabbar')).toBeVisible();
      await page.locator('.tabbar a', { hasText: 'centre' }).click();
    } else {
      await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
      await page
        .getByRole('navigation', { name: 'Navigation principale' })
        .getByRole('link', { name: /centre/ })
        .click();
    }
    await expect(page).toHaveURL(/\/centre$/);
    await expect(page.locator('main h1')).toContainText('Centre d’opérations');
  });

  test('3D : chaque scène visible s’affiche (WebGL) ou bascule sur son repli', async ({ page }) => {
    await page.goto('/');
    const scene = page.locator('.scene').first();
    // la scène quitte l'état « chargement » : soit un canvas WebGL, soit la grille de repli
    await expect(scene).not.toHaveClass(/loading3d/, { timeout: 20_000 });
    const hasCanvas = (await scene.locator('canvas').count()) > 0;
    const fallback = await scene.evaluate((el) => el.classList.contains('no3d'));
    expect(hasCanvas || fallback).toBe(true);
    test.info().annotations.push({ type: '3D', description: hasCanvas ? 'WebGL actif' : 'repli sans WebGL' });

    // netteté : la 3D est dessinée avec autant de pixels que l'écran en affiche
    // (densité de l'écran × agrandissement grand écran ; plafond 1,5 sur téléphone, sinon budget
    // d'une image 4K par scène — même règle que pixelRatioFor() dans components/three/engine.js)
    if (hasCanvas) {
      const m = await scene.evaluate((el) => {
        const c = el.querySelector('canvas');
        const ui = window.__uiScale || 1;
        const phone = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 768;
        let want = (window.devicePixelRatio || 1) * ui;
        if (phone) want = Math.min(want, 1.5);
        const w = el.clientWidth;
        const h = el.clientHeight;
        const budget = Math.min(Math.sqrt((3840 * 2160) / (w * h)), 8192 / Math.max(w, h));
        return {
          drawn: c.width / c.getBoundingClientRect().width,
          expected: Math.min(want, Math.max(1, budget)) / ui,
        };
      });
      expect(m.drawn, 'pixels dessinés par pixel affiché').toBeCloseTo(m.expected, 1);
    }
  });

  // Zoom par pincement (pavé tactile) : le navigateur agrandit l'image sans changer devicePixelRatio.
  // Sans correction, la 3D restait à la résolution d'origine et paraissait pixelisée.
  // Le pincement ne peut être simulé que dans les navigateurs Chromium (protocole CDP).
  test('3D : reste nette après un zoom par pincement', async ({ page, browserName, isMobile }) => {
    test.skip(browserName !== 'chromium' || isMobile, 'pincement simulable seulement sous Chromium ordinateur');
    test.skip(Boolean(test.info().project.use.reducedMotion), 'scène statique sur ce banc de test');
    await page.goto('/');
    const scene = page.locator('.scene').first();
    await expect(scene).not.toHaveClass(/loading3d/, { timeout: 20_000 });
    test.skip((await scene.locator('canvas').count()) === 0, 'WebGL indisponible');
    const ratio = () => scene.evaluate((el) => el.querySelector('canvas').width / el.clientWidth);
    const before = await ratio();
    const box = await scene.boundingBox();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.synthesizePinchGesture', {
      x: Math.round(box.x + box.width / 2),
      y: Math.round(box.y + Math.min(box.height, 400) / 2),
      scaleFactor: 2,
      relativeSpeed: 2000,
    });
    // le moteur recalcule 200 ms après la fin du geste
    await expect.poll(ratio, { timeout: 5_000 }).toBeGreaterThan(before * 1.5);
  });
});

test.describe('Grands écrans', () => {
  test('au-delà de 1 600 px, le site s’agrandit pour remplir l’écran', async ({ page }) => {
    await page.goto('/');
    // la page est chargée à la demande (React.lazy) : on attend qu'elle soit affichée avant de mesurer
    await page.locator('main .wrap').first().waitFor();
    const m = await page.evaluate(() => {
      const r = document.querySelector('main .wrap').getBoundingClientRect();
      return { width: window.innerWidth, scale: window.__uiScale, fill: r.width / window.innerWidth };
    });
    const expected = Math.min(3, Math.max(1, m.width / 1600));
    expect(m.scale).toBeCloseTo(expected, 2);
    // la colonne de contenu occupe au moins 85 % de la largeur dès que l'écran dépasse 1 280 px
    if (m.width >= 1280) expect(m.fill).toBeGreaterThan(0.85);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});

test.describe('Enquête', () => {
  test('parcours complet : briefing, 3 missions, rapport à 100/100', async ({ page, browserName }) => {
    const errors = watchErrors(page, browserName);
    await page.goto('/briefing');
    await page.getByRole('button', { name: /Accepter la mission/ }).click();
    await expect(page).toHaveURL(/\/centre$/);

    // Mission 1 : marquer les 4 lignes de l'intrusion, puis choisir la bonne priorité
    await page.getByRole('link', { name: /Analyser les journaux/ }).click();
    for (const line of [2, 6, 7, 10]) {
      const row = page.locator(`.ll[data-log="${line}"]`);
      await row.click();
      await expect(row).toHaveAttribute('aria-pressed', 'true');
    }
    await page.locator('.opt').nth(1).click();
    await expect(page.getByText('MISSION 1 RÉSOLUE.')).toBeVisible();

    // Mission 2 : recette Base64 puis ROT13, puis les deux informations du texte clair
    await page.locator('.mtabs a', { hasText: 'décodage' }).click();
    await page.getByRole('button', { name: /From Base64/ }).click();
    await expect(page.locator('.rec .stepc')).toHaveCount(1);
    await page.getByRole('button', { name: /^ROT13/ }).click();
    await expect(page.locator('.io.out button.ent')).toHaveCount(2);
    await page.locator('.io.out button.ent', { hasText: '198.51.100.23' }).click();
    await page.locator('.io.out button.ent', { hasText: '23h47' }).click();
    await expect(page.getByText('MISSION 2 RÉSOLUE.')).toBeVisible();

    // Mission 3 : cliquer une carte, puis l'étape où la poser
    await page.locator('.mtabs a', { hasText: 'chronologie' }).click();
    const order = ['T1110', 'T1078', 'T1560', 'T1048', 'T1070'];
    for (const [slot, id] of order.entries()) {
      await page.locator('.pool .card', { hasText: id }).click();
      await page.locator('.slot').nth(slot).locator('.empty').click();
      await expect(page.locator('.slot').nth(slot)).toContainText(id);
    }
    await page.getByRole('button', { name: 'Vérifier l’ordre' }).click();
    await expect(page.getByText('MISSION 3 RÉSOLUE.')).toBeVisible();

    // Rapport
    await page
      .locator('.toast')
      .getByRole('link', { name: /Générer le rapport/ })
      .click();
    await expect(page.locator('.reveal .big')).toHaveText('EXFIL:BACKUP');
    await expect(page.locator('.score')).toContainText('100');
    await expect(page.locator('.rail .cnt')).toContainText('12/12');
    expect(errors).toEqual([]);
  });

  test('une mauvaise réponse est signalée et coûte des points', async ({ page }) => {
    await page.goto('/centre/mission-1');
    await page.locator('.ll[data-log="1"]').click();
    await expect(page.locator('.ntf.error')).toContainText('−4 pts');
  });
});

test.describe('Formulaires et compte', () => {
  test('contact : erreurs affichées, puis envoi réussi', async ({ page }) => {
    await page.goto('/a-propos#contact');
    const form = page.locator('#contact + .ind form');
    await form.locator('input[type=email]').fill('pas-un-mail');
    await form.locator('textarea').fill('court');
    await form.getByRole('button', { name: /Envoyer/ }).click();
    await expect(form.getByText('Adresse e-mail invalide.')).toBeVisible();
    await expect(form.getByText('10 caractères minimum.')).toBeVisible();

    await form.locator('input[type=email]').fill('vous@exemple.tn');
    await form.locator('textarea').fill('Test automatique multi-navigateurs : tout fonctionne.');
    await form.getByRole('button', { name: /Envoyer/ }).click();
    await expect(page.getByText('Message reçu.')).toBeVisible();
  });

  test('compte : inscription, classement, changement de mot de passe, déconnexion', async ({ page }, info) => {
    const user = `e2e_${info.project.name.replace(/[^a-z]/g, '').slice(0, 8)}_${Math.random().toString(36).slice(2, 6)}`;
    const pw = 'mot-de-passe-de-test';
    await page.goto('/acces');
    await page.getByRole('tab', { name: 'Créer un compte' }).click();
    await page.locator('input[name=username]').fill(user);
    await page.locator('input[name=password]').fill(pw);
    await page.locator('input[name=confirm]').fill(pw);
    await page.getByRole('button', { name: /Créer mon compte/ }).click();
    await expect(page).toHaveURL(/\/briefing$/);

    await page.goto('/progression');
    await expect(page.locator('.idc')).toContainText(user);
    await expect(page.getByRole('heading', { name: 'classement des analystes' })).toBeVisible();

    await page.getByRole('button', { name: 'Changer le mot de passe' }).click();
    const zone = page.locator('.danger-zone');
    const inputs = zone.locator('input[type=password]');
    await inputs.nth(0).fill(pw);
    await inputs.nth(1).fill(`${pw}-2`);
    await inputs.nth(2).fill(`${pw}-2`);
    await zone.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.locator('.ntf.success')).toContainText('Mot de passe modifié');

    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await expect(page.locator('.ntf', { hasText: 'Session fermée' })).toBeVisible();
    await expect(page.locator('.danger-zone')).toContainText('Créer un compte');
  });

  test('recherche « / » : trouve un terme et y mène', async ({ page, isMobile }) => {
    test.skip(isMobile, 'la barre de recherche est masquée sur téléphone');
    await page.goto('/');
    await page.locator('body').press('/');
    await page.keyboard.type('base64');
    await expect(page.locator('#grep-results')).toContainText('Base64');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/centre\/mission-2$/);
  });
});

test.describe('Accessibilité', () => {
  test('clavier : le premier Tab atteint « Aller au contenu »', async ({ page, browserName, isMobile }) => {
    test.skip(isMobile, 'pas de clavier sur téléphone');
    // Safari ne déplace pas le focus sur les liens avec Tab par défaut (réglage du système)
    test.skip(browserName === 'webkit', 'comportement propre à Safari');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip')).toBeFocused();
  });

  test('chaque page a un seul h1 et une langue déclarée', async ({ page }) => {
    for (const [path] of PAGES) {
      await page.goto(path);
      await expect(page.locator('main h1').first()).toBeAttached();
      expect(await page.locator('h1').count(), `nombre de h1 sur ${path}`).toBe(1);
    }
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  });
});
