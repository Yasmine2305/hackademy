import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import Ambient from './components/three/Ambient.jsx';
import { Loading } from './components/ui/ui.jsx';
import { useGame } from './context/GameContext.jsx';

// une page = un fichier, chargé à la demande (code splitting)
const Accueil = lazy(() => import('./pages/Accueil.jsx'));
const Acces = lazy(() => import('./pages/Acces.jsx'));
const Briefing = lazy(() => import('./pages/Briefing.jsx'));
const Centre = lazy(() => import('./pages/Centre.jsx'));
const Mission1 = lazy(() => import('./pages/Mission1.jsx'));
const Mission2 = lazy(() => import('./pages/Mission2.jsx'));
const Mission3 = lazy(() => import('./pages/Mission3.jsx'));
const Rapport = lazy(() => import('./pages/Rapport.jsx'));
const Progression = lazy(() => import('./pages/Progression.jsx'));
const APropos = lazy(() => import('./pages/APropos.jsx'));
const Charte = lazy(() => import('./pages/Charte.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  const { scenario, state, error } = useGame();
  // on attend seulement le tout premier chargement ; ensuite les pages restent montées
  const ready = Boolean(scenario && state);

  return (
    <>
      <Ambient />
      <Routes>
        <Route element={<Layout />}>
          {ready ? (
            <>
              <Route index element={<Page><Accueil /></Page>} />
              <Route path="acces" element={<Page><Acces /></Page>} />
              <Route path="briefing" element={<Page><Briefing /></Page>} />
              <Route path="centre" element={<Page><Centre /></Page>} />
              <Route path="centre/mission-1" element={<Page><Mission1 /></Page>} />
              <Route path="centre/mission-2" element={<Page><Mission2 /></Page>} />
              <Route path="centre/mission-3" element={<Page><Mission3 /></Page>} />
              <Route path="rapport" element={<Page><Rapport /></Page>} />
              <Route path="progression" element={<Page><Progression /></Page>} />
              <Route path="a-propos" element={<Page><APropos /></Page>} />
              <Route path="charte" element={<Page><Charte /></Page>} />
              <Route path="*" element={<Page><NotFound /></Page>} />
            </>
          ) : (
            <Route path="*" element={<Loading error={error} />} />
          )}
        </Route>
      </Routes>
    </>
  );
}

function Page({ children }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}
