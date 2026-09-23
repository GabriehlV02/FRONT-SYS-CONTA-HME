import { useEffect, useState } from 'react';
type Lote = { id: string; codigo: string; marca: string; lote: string; fecha: string; almacen: string; disponible: number; costoUnitario: number; vence: string };
export function LotesStock() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  useEffect(() => { fetch('/api/stock/lotes').then(async r => { if (!r.ok) throw new Error('No se pudo cargar el stock'); return r.json(); }).then(r => setLotes(r.data)).catch(e => setError(e.message)); }, []);
  return <section style={{ padding: 24 }}><h2>Stock por marca y lote</h2><p>Orden de salida FIFO: primero la fecha de recepción más antigua dentro del almacén seleccionado. Los lotes vencidos no se venden. Cambiar el precio no modifica este orden.</p>
    <label>Buscar ítem, marca o almacén <input value={busqueda} onChange={e => setBusqueda(e.target.value)} /></label>
    {error && <p role="alert">{error}</p>}
    <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', textAlign: 'left', borderSpacing: 12 }}><thead><tr>{['Ítem', 'Marca', 'Lote', 'Recepción', 'Almacén', 'Disponible', 'Costo/unidad', 'Vence'].map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {lotes.filter(l => `${l.codigo} ${l.marca} ${l.almacen}`.toLowerCase().includes(busqueda.toLowerCase())).map(l => <tr key={l.id}><td>{l.codigo}</td><td>{l.marca}</td><td>{l.lote}</td><td>{l.fecha}</td><td>{l.almacen}</td><td>{l.disponible}</td><td>Bs {l.costoUnitario.toFixed(2)}</td><td>{l.vence || 'Sin vencimiento'}</td></tr>)}
    </tbody></table></div>{!lotes.length && !error && <p>No hay ingresos registrados. Carga stock desde Adquisiciones.</p>}</section>;
}
