import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles.css';
import './subvistas.css';
import './topbar.css';
import './hospital-ui.css';
import './sidebar-productos.css';
import './tema-lila.css';
import './sidebar-ajustes.css';
import './paleta-unificada.css';
import './login-panel-refresh.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
