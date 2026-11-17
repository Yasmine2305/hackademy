import { Link } from 'react-router-dom';
import { useTilt } from '../../hooks/hooks.js';

/**
 * Carte de mission (page d'accueil) : un lien entier, qui s'incline en 3D au survol.
 * La prop `scene` reçoit une petite scène 3D d'illustration.
 */
export default function MissionCard({ to, code, perm, scene, title, text, tool, level }) {
  const ref = useTilt();
  return (
    <Link ref={ref} className="pane mis tilt" to={to}>
      <i className="led" />
      <i className="hl" />
      <div className="t">{code}</div>
      <div className="r">{level}</div>
      {scene}
      <div className="perm">{perm}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="tool">{tool}</div>
      <span className="btn sm">Ouvrir le dossier</span>
    </Link>
  );
}
