import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles/RefinamientoVisual.css';
import './styles.css';
import './subvistas.css';
import './topbar.css';
import './hospital-ui.css';
import './sidebar-productos.css';
import './tema-lila.css';
import './sidebar-ajustes.css';
import './paleta-unificada.css';
import './login-panel-refresh.css';
import './tema-financiero.css';
import './styles/ContableCorporativo.css';
import './login-fondo-animado.css';
import './login-institutional.css';
import './login-contable-profesional.css';
createRoot(document.getElementById('root')!).render(
  <App />,
);
