import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './AvisoTemporal.css';

type TipoAviso = 'exito' | 'advertencia' | 'error' | 'info';

export function AvisoTemporal({ mensaje, tipo = 'exito' }: { mensaje: string; tipo?: TipoAviso }) {
  const [visible, setVisible] = useState(Boolean(mensaje));
  useEffect(() => {
    setVisible(Boolean(mensaje));
    if (!mensaje) return;
    const timer = window.setTimeout(() => setVisible(false), 4800);
    return () => window.clearTimeout(timer);
  }, [mensaje]);
  if (!visible || !mensaje) return null;
  const icono = tipo === 'exito' ? '\u2713' : tipo === 'advertencia' ? '!' : tipo === 'error' ? '\u00D7' : 'i';
  return createPortal(
    <div className={`aviso-temporal aviso-temporal-${tipo}`} role={tipo === 'error' || tipo === 'advertencia' ? 'alert' : 'status'}>
      <span aria-hidden="true">{icono}</span>
      <p>{mensaje}</p>
      <button type="button" aria-label="Cerrar aviso" onClick={() => setVisible(false)}>{'\u00D7'}</button>
    </div>,
    document.querySelector('dialog[open]') || document.body,
  );
}
