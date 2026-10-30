import { useState } from 'react';

type Props = { codigo: string; onCodigo: (valor: string) => void };

export default function CapturaCodigo({ codigo, onCodigo }: Props) {
  const [mensaje, setMensaje] = useState('');
  return <div className="inventario-campo-completo captura-codigo">
    <label><span>Serie / código de barras</span><input maxLength={128} value={codigo} onChange={e => { onCodigo(e.target.value); setMensaje(''); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setMensaje('Lectura recibida.'); } }} placeholder="Escribe o enfoca este campo y escanea con el lector" /></label>
    {mensaje && <small role="status">{mensaje}</small>}
  </div>;
}
