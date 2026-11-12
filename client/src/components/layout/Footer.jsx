import { Link } from 'react-router-dom';
import { Logo } from '../ui/ui.jsx';

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="cols">
          <div>
            <Logo />
            <p>Une enquête cybersécurité jouable, pour apprendre en remontant une vraie méthode d’analyste.</p>
          </div>
          <div>
            <h4># enquête</h4>
            <ul>
              <li><Link to="/briefing">./briefing</Link></li>
              <li><Link to="/centre">./centre</Link></li>
              <li><Link to="/rapport">./rapport</Link></li>
            </ul>
          </div>
          <div>
            <h4># missions</h4>
            <ul>
              <li><Link to="/centre/mission-1">./journaux</Link></li>
              <li><Link to="/centre/mission-2">./decodage</Link></li>
              <li><Link to="/centre/mission-3">./chronologie</Link></li>
            </ul>
          </div>
          <div>
            <h4># projet</h4>
            <ul>
              <li><Link to="/a-propos">./a_propos</Link></li>
              <li><Link to="/a-propos#contact">./contact</Link></li>
              <li><Link to="/a-propos#mentions">./mentions_legales</Link></li>
              <li><Link to="/charte">./charte</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="status">
        <div className="wrap">
          <span>[0417] defensys-soc · scénario fictif · IP réservées RFC 5737</span>
          <span>HACK\x41DEMY · SUP’COM · 2026</span>
        </div>
      </div>
    </footer>
  );
}
