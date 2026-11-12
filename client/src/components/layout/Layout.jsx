import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { routeFor } from '../../routes.js';
import { useTitle } from '../../hooks/hooks.js';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import Rail from './Rail.jsx';

/** Gabarit commun : en-tête, rail du paquet (pendant l'enquête), page, pied de page. */
export default function Layout() {
  const { pathname, hash } = useLocation();
  const route = routeFor(pathname);
  useTitle(route?.title ?? 'Page introuvable');

  useEffect(() => {
    document.body.setAttribute('data-page', route?.section ?? 'autre');
  }, [route]);

  // remonte en haut à chaque page, ou descend jusqu'à l'ancre (#contact…)
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <>
      <Header section={route?.section} />
      {route?.inCase && <Rail />}
      <Outlet />
      <Footer />
    </>
  );
}
