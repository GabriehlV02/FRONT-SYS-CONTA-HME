import { useEffect, useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';

type Lote = { id: string; codigo: string; marca: string; lote: string; fecha: string; almacen: string; disponible: number; costoUnitario: number; vence: string };

export function LotesStock() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [sucursal, setSucursal] = useState('todas');
  const [almacen, setAlmacen] = useState('todos');

  useEffect(() => {
    fetch('/api/stock/lotes')
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error('No se pudo cargar el stock');
        return respuesta.json();
      })
      .then((respuesta) => setLotes(respuesta.data))
      .catch((errorCarga) => setError(errorCarga.message));
  }, []);

  const almacenes = useMemo(
    () => [...new Set(lotes.map((lote) => lote.almacen).filter(Boolean))].sort(),
    [lotes],
  );
  const lotesVisibles = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es');
    return lotes.filter((lote) =>
      (almacen === 'todos' || lote.almacen === almacen)
      && (sucursal === 'todas' || sucursal === 'hospital-maria-esperanza')
      && (!texto || `${lote.codigo} ${lote.marca} ${lote.lote} ${lote.almacen}`.toLocaleLowerCase('es').includes(texto)),
    );
  }, [almacen, busqueda, lotes, sucursal]);

  return <section className="stock-lotes">
    <header className="stock-lotes-cabecera">
      <div><span>CONTROL DE EXISTENCIAS</span><h2>Stock por marca y lote</h2></div>
      <b>{lotesVisibles.length} lotes</b>
    </header>
    <div className="stock-lotes-filtros">
      <label className="stock-lotes-busqueda"><span>Buscar</span><div><Icon name="search" size={18} /><input aria-label="Buscar ítem, marca, lote o almacén" placeholder="Ítem, marca, lote o almacén..." value={busqueda} onChange={(event) => setBusqueda(event.target.value)} /></div></label>
      <label><span>Sucursal</span><select value={sucursal} onChange={(event) => { setSucursal(event.target.value); setAlmacen('todos'); }}><option value="todas">Todas las sucursales</option><option value="hospital-maria-esperanza">Hospital María Esperanza</option></select></label>
      <label><span>Almacén</span><select value={almacen} onChange={(event) => setAlmacen(event.target.value)}><option value="todos">Todos los almacenes</option>{almacenes.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="stock-lotes-filtro-reservado"><span aria-hidden="true">&nbsp;</span><select aria-label="Filtro adicional" defaultValue=""><option value=""></option></select></label>
    </div>
    {error && <p className="stock-lotes-error" role="alert">{error}</p>}
    <div className="stock-lotes-tabla"><table><thead><tr>{['Ítem', 'Marca', 'Lote', 'Recepción', 'Almacén', 'Disponible', 'Costo/unidad', 'Vence'].map((columna) => <th key={columna}>{columna}</th>)}</tr></thead><tbody>
      {lotesVisibles.map((lote) => <tr key={lote.id}><td>{lote.codigo}</td><td>{lote.marca}</td><td>{lote.lote}</td><td>{lote.fecha}</td><td>{lote.almacen}</td><td>{lote.disponible}</td><td>Bs {lote.costoUnitario.toFixed(2)}</td><td>{lote.vence || 'Sin vencimiento'}</td></tr>)}
    </tbody></table>{!lotesVisibles.length && !error && <div className="stock-lotes-vacio"><Icon name="package" size={24} /><div><strong>{lotes.length ? 'No hay coincidencias' : 'No hay ingresos registrados'}</strong><p>{lotes.length ? 'Cambia los filtros para consultar otros lotes.' : 'El stock aparecerá después de registrar una adquisición.'}</p></div></div>}</div>
  </section>;
}
