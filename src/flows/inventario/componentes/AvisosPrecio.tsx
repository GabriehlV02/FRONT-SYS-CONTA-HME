import { useEffect, useState } from 'react';
export function AvisosPrecio() {
  const [avisos, setAvisos] = useState<{ id: number; detalle: string; prioridad: string; fecha: string }[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/inventario/avisos').then(async r => { if (!r.ok) throw new Error('No se pudieron cargar las alertas de costos'); return r.json(); }).then(r => setAvisos(r.data)).catch(e => setError(e.message)); }, []);
  return <section className="avisos-precio"><h2>Historial de alertas de costos y precios</h2><p>Confirma los precios pendientes desde Ítems → Editar → Confirmar precio de venta revisado. Las compras más baratas nunca reducen automáticamente el precio.</p>{error && <p role="alert">{error}</p>}{avisos.map(a => <article key={a.id} className={`aviso-precio${a.prioridad === 'alta' ? ' prioridad-alta' : ''}`}><small>{new Date(a.fecha).toLocaleString('es-BO')}</small><p>{a.detalle}</p></article>)}{!avisos.length && !error && <p>Sin cambios de costo registrados.</p>}</section>;
}
