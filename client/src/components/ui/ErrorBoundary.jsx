import { Component } from 'react';

/**
 * Filet de sécurité : si un composant plante pendant l'affichage, on montre
 * un message clair au lieu d'une page blanche, avec un bouton pour recharger.
 * (React impose une classe pour ce mécanisme : c'est le seul composant-classe du projet.)
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[hackademy] erreur d’affichage', error, info.componentStack);
  }

  componentDidUpdate(prev) {
    // on réessaie quand l'utilisateur change de page
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main id="main">
        <div className="wrap nf">
          <div className="crumb">
            <b>~</b>/kernel panic
          </div>
          <h1>Cette page a rencontré une erreur.</h1>
          <p className="lead m">{String(this.state.error.message || this.state.error)}</p>
          <div className="row" style={{ marginTop: 24 }}>
            <button type="button" className="btn go" onClick={() => window.location.reload()}>
              Recharger la page
            </button>
            <a className="btn" href="/">
              Retour à l’accueil
            </a>
          </div>
        </div>
      </main>
    );
  }
}
