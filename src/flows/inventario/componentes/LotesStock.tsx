import { useEffect, useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import PaginacionTabla from '@ui/components/PaginacionTabla';
import { productosDemo } from '../datos/catalogoDemo';

type Lote = { id: string; codigo: string; nombre: string; tipo: string; categoria: string; subcategoria: string; unidad: string; marca: string; lote: string; fecha: string; almacen: string; disponible: number; costoUnitario: number; vence: string };

const existenciasDemo = [10, 15, 20, 25, 30, 35, 40, 45, 0, -3];
const lotesDemo: Lote[] = productosDemo.map((producto, indice) => ({
  id: `demo-${indice + 1}`,
  codigo: `ITM-${String(indice + 1).padStart(4, '0')}`,
  nombre: producto.nombre,
  tipo: indice % 2 === 0 ? 'Insumo' : 'Producto',
  categoria: producto.categoria,
  subcategoria: 'General',
  unidad: producto.presentacion,
  marca: producto.marca,
  lote: existenciasDemo[indice % existenciasDemo.length] > 0 ? `LT-${String(2501 + indice).padStart(4, '0')}` : 'Sin lote',
  fecha: existenciasDemo[indice % existenciasDemo.length] > 0 ? `2026-${String((indice % 9) + 1).padStart(2, '0')}-${String((indice % 20) + 1).padStart(2, '0')}` : 'Sin ingreso',
  almacen: indice % 3 === 0 ? 'Farmacia' : 'Almacén central',
  disponible: existenciasDemo[indice % existenciasDemo.length],
  costoUnitario: 8 + (indice % 12) * 4.5,
  vence: existenciasDemo[indice % existenciasDemo.length] > 0 ? `2027-${String((indice % 9) + 1).padStart(2, '0')}-28` : '',
}));

type RecepcionLocal = { id: string; codigo: string; producto: string; lote: string; cantidad: number; unidad: string; movimientoId: string; almacen: string; fecha: string; estado?: 'recibido' | 'devuelto' };
const leerRecepciones = (): Lote[] => {
  try {
    const recepciones = JSON.parse(localStorage.getItem('contable-stock-recepciones') || '[]') as RecepcionLocal[];
    return recepciones.map((linea) => ({
      id: `recepcion-${linea.movimientoId}-${linea.id}`,
      codigo: linea.codigo,
      nombre: linea.producto,
      tipo: linea.unidad === 'Unidad' ? 'Insumo' : 'Producto',
      categoria: linea.estado === 'devuelto' ? 'Devolución de traspaso' : 'Traspaso entre almacenes',
      subcategoria: linea.estado === 'devuelto' ? 'No recibido' : 'Recepcionado',
      unidad: linea.unidad,
      marca: linea.producto.includes('Guantes') ? 'SafeTouch' : linea.producto.includes('Jeringa') ? 'BolMed' : 'MediCare',
      lote: linea.lote,
      fecha: linea.fecha,
      almacen: linea.almacen,
      disponible: linea.cantidad,
      costoUnitario: 0,
      vence: '',
    }));
  } catch { return []; }
};

export function LotesStock() {
  const [lotes, setLotes] = useState<Lote[]>(lotesDemo);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [sucursal, setSucursal] = useState('todas');
  const [almacen, setAlmacen] = useState('todos');
  const [filas, setFilas] = useState(20);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    const incorporarRecepciones = (base: Lote[]) => [...leerRecepciones(), ...base];
    const actualizarRecepciones = () => setLotes((actual) => {
      const base = actual.filter((lote) => !lote.id.startsWith('recepcion-'));
      return incorporarRecepciones(base);
    });
    fetch('/api/stock/lotes')
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error('No se pudo cargar el stock');
        return respuesta.json();
      })
      .then((respuesta) => {
        const reales = Array.isArray(respuesta.data) ? respuesta.data as Array<Partial<Lote> & Pick<Lote, 'id' | 'codigo'>> : [];
        const codigosReales = new Set(reales.map((lote) => lote.codigo));
        const catalogo = new Map(lotesDemo.map((lote) => [lote.codigo, lote]));
        setLotes(incorporarRecepciones([
          ...reales.map((lote) => ({ ...catalogo.get(lote.codigo), ...lote } as Lote)),
          ...lotesDemo.filter((lote) => !codigosReales.has(lote.codigo)),
        ]));
      })
      .catch(() => setError('Se muestran existencias de ejemplo mientras se conecta el inventario.'));
    window.addEventListener('contable-stock-actualizado', actualizarRecepciones);
    return () => window.removeEventListener('contable-stock-actualizado', actualizarRecepciones);
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
      && (!texto || `${lote.codigo} ${lote.nombre} ${lote.marca} ${lote.lote} ${lote.almacen}`.toLocaleLowerCase('es').includes(texto)),
    );
  }, [almacen, busqueda, lotes, sucursal]);
  const totalPaginas = Math.max(1, Math.ceil(lotesVisibles.length / filas));
  const paginaActual = Math.min(pagina, totalPaginas);
  const lotesPagina = lotesVisibles.slice((paginaActual - 1) * filas, paginaActual * filas);

  return <section className="stock-lotes">
    <div className="stock-lotes-filtros">
      <label className="stock-lotes-busqueda"><div><Icon name="search" size={17} /><input aria-label="Buscar ítem, marca, lote o almacén" placeholder="Buscar ítem, marca, lote o almacén..." value={busqueda} onChange={(event) => { setBusqueda(event.target.value); setPagina(1); }} /></div></label>
      <label><select aria-label="Filtrar por sucursal" value={sucursal} onChange={(event) => { setSucursal(event.target.value); setAlmacen('todos'); setPagina(1); }}><option value="todas">Todas las sucursales</option><option value="hospital-maria-esperanza">Hospital María Esperanza</option></select></label>
      <label><select aria-label="Filtrar por almacén" value={almacen} onChange={(event) => { setAlmacen(event.target.value); setPagina(1); }}><option value="todos">Todos los almacenes</option>{almacenes.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    </div>
    {error && <p className="stock-lotes-error" role="alert">{error}</p>}
    <PaginacionTabla total={lotesVisibles.length} filas={filas} pagina={paginaActual} totalPaginas={totalPaginas} onFilas={(cantidad) => { setFilas(cantidad); setPagina(1); }} onPagina={setPagina} />
    <div className="stock-lotes-tabla"><table><colgroup><col className="col-codigo" /><col className="col-nombre" /><col className="col-tipo" /><col className="col-categoria" /><col className="col-subcategoria" /><col className="col-unidad" /><col className="col-marca" /><col className="col-lote" /><col className="col-stock" /><col className="col-almacen" /><col className="col-vence" /></colgroup><thead><tr>{['Código', 'Nombre o identificación', 'Tipo', 'Categoría', 'Sub categoría', 'Unidad', 'Marca', 'Lote', 'Stock', 'Almacén', 'Vence'].map((columna) => <th key={columna}>{columna}</th>)}</tr></thead><tbody>
      {lotesPagina.map((lote) => <tr key={lote.id}><td>{lote.codigo}</td><td className="stock-lote-nombre">{lote.nombre}</td><td><span className="stock-lote-tipo">{lote.tipo}</span></td><td>{lote.categoria}</td><td>{lote.subcategoria}</td><td>{lote.unidad}</td><td>{lote.marca}</td><td>{lote.lote}</td><td className={lote.disponible < 0 ? 'stock-negativo' : lote.disponible === 0 ? 'stock-cero' : ''}>{lote.disponible}</td><td>{lote.almacen}</td><td>{lote.vence || 'Sin vencimiento'}</td></tr>)}
    </tbody></table>{!lotesVisibles.length && !error && <div className="stock-lotes-vacio"><Icon name="package" size={24} /><div><strong>{lotes.length ? 'No hay coincidencias' : 'No hay ingresos registrados'}</strong><p>{lotes.length ? 'Cambia los filtros para consultar otros lotes.' : 'El stock aparecerá después de registrar una adquisición.'}</p></div></div>}</div>
  </section>;
}
