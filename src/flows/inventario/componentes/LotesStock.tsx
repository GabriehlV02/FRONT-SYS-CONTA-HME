import { apiFetch } from '@ui/auth';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@ui/components/Icon';
import PaginacionTabla from '@ui/components/PaginacionTabla';
import { leerRespuesta } from '../../usuarios/accesos';
import '../InventarioView.css';

type Lote = {
  id: string; itemId: number; loteId: number; codigo: string; nombre: string;
  generico: string; codigoGenerico: string; tipo: string; categoria: string; subcategoria: string;
  unidad: string; presentacion: string; marca: string; lote: string; fecha: string;
  almacenId: number | null; almacen: string; sucursalId: number | null; sucursal: string;
  disponible: number; costoUnitario: string | null; vence: string;
  precio1: string; precio2: string; precio3: string;
};
type Campo = 'codigo' | 'nombre' | 'tipo' | 'categoria' | 'subcategoria' | 'unidad' | 'marca' | 'lote' | 'disponible' | 'almacen' | 'vence';
const columnas: { texto: string; campo: Campo }[] = [
  { texto: 'Código', campo: 'codigo' }, { texto: 'Nombre o identificación', campo: 'nombre' },
  { texto: 'Tipo', campo: 'tipo' }, { texto: 'Categoría', campo: 'categoria' },
  { texto: 'Subcategoría', campo: 'subcategoria' }, { texto: 'Unidad', campo: 'unidad' },
  { texto: 'Marca', campo: 'marca' }, { texto: 'Lote', campo: 'lote' },
  { texto: 'Stock', campo: 'disponible' }, { texto: 'Almacén', campo: 'almacen' }, { texto: 'Vence', campo: 'vence' },
];
const clave = (id: number | null) => id === null ? 'sin-asignar' : String(id);
const textoBusqueda = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
const cantidad = (valor: number) => valor.toLocaleString('es-BO', { maximumFractionDigits: 3 });
const sumar = (lotes: Lote[]) => Number(lotes.reduce((total, lote) => total + lote.disponible, 0).toFixed(3));
const dinero = (valor: string | null, decimales = 2) => valor === null ? 'Sin costo registrado' : 'Bs ' + Number(valor).toLocaleString('es-BO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

export function LotesStock() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [sucursal, setSucursal] = useState('todas');
  const [almacen, setAlmacen] = useState('todos');
  const [filas, setFilas] = useState(20);
  const [pagina, setPagina] = useState(1);
  const [orden, setOrden] = useState<Campo>('codigo');
  const [direccion, setDireccion] = useState<'asc' | 'desc'>('asc');
  const [detalle, setDetalle] = useState<Lote | null>(null);
  const [almacenDetalle, setAlmacenDetalle] = useState('todos');
  const dialogo = useRef<HTMLElement>(null);
  const origen = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setError('');
    apiFetch('/api/v1/stock/lotes', { signal: controller.signal }).then(leerRespuesta<{ data: Lote[] }>).then(respuesta => setLotes(respuesta.data))
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'No se pudo consultar el stock.'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    const actualizar = () => setRecarga(valor => valor + 1);
    window.addEventListener('contable-stock-actualizado', actualizar);
    return () => { controller.abort(); window.removeEventListener('contable-stock-actualizado', actualizar); };
  }, [recarga]);
  useEffect(() => {
    if (!detalle) return;
    dialogo.current?.querySelector<HTMLElement>('button')?.focus();
    const contenedor = document.querySelector('.sistema-contable') || document.body;
    const hermanos = Array.from(contenedor.children).filter((elemento): elemento is HTMLElement => elemento instanceof HTMLElement && !elemento.contains(dialogo.current));
    const estados = hermanos.map(elemento => elemento.inert);
    hermanos.forEach(elemento => { elemento.inert = true; });
    const scroll = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { hermanos.forEach((elemento, indice) => { elemento.inert = estados[indice]; }); document.body.style.overflow = scroll; };
  }, [!!detalle]);

  const sucursales = useMemo(() => Array.from(new Map(lotes.map(lote => [clave(lote.sucursalId), lote.sucursal])).entries()).sort((a, b) => a[1].localeCompare(b[1], 'es')), [lotes]);
  const almacenes = useMemo(() => Array.from(new Map(lotes.filter(lote => sucursal === 'todas' || clave(lote.sucursalId) === sucursal).map(lote => [clave(lote.almacenId), { nombre: lote.almacen, sucursal: lote.sucursal }])).entries()).sort((a, b) => a[1].nombre.localeCompare(b[1].nombre, 'es')), [lotes, sucursal]);
  const visibles = useMemo(() => {
    const texto = textoBusqueda(busqueda.trim());
    return lotes.filter(lote => (sucursal === 'todas' || clave(lote.sucursalId) === sucursal) && (almacen === 'todos' || clave(lote.almacenId) === almacen) &&
      (!texto || textoBusqueda([lote.codigo, lote.nombre, lote.generico, lote.codigoGenerico, lote.marca, lote.lote, lote.almacen, lote.sucursal, lote.presentacion].join(' ')).includes(texto)))
      .sort((a, b) => {
        const comparacion = orden === 'disponible' ? a.disponible - b.disponible : String(a[orden]).localeCompare(String(b[orden]), 'es', { numeric: true });
        return (comparacion || a.id.localeCompare(b.id)) * (direccion === 'asc' ? 1 : -1);
      });
  }, [lotes, sucursal, almacen, busqueda, orden, direccion]);
  const totalPaginas = Math.max(1, Math.ceil(visibles.length / filas));
  const paginaActual = Math.min(pagina, totalPaginas);
  const lotesPagina = visibles.slice((paginaActual - 1) * filas, paginaActual * filas);
  const filasDetalle = detalle ? lotes.filter(lote => lote.itemId === detalle.itemId) : [];
  const almacenesDetalle = Array.from(new Map(filasDetalle.map(lote => [clave(lote.almacenId), lote])).entries());
  const detalleFiltrado = filasDetalle.filter(lote => almacenDetalle === 'todos' || clave(lote.almacenId) === almacenDetalle);
  const gruposDetalle = Array.from(new Map(detalleFiltrado.map(lote => [clave(lote.sucursalId), lote.sucursal])).entries()).map(([id, nombre]) => ({ id, nombre, lotes: detalleFiltrado.filter(lote => clave(lote.sucursalId) === id) }));
  const sinIngresos = lotes.filter(lote => lote.almacenId === null).length;
  const cerrar = () => { setDetalle(null); requestAnimationFrame(() => origen.current?.focus()); };

  return <section className="stock-lotes stock-general-real">
    <div className="stock-lotes-filtros"><label className="stock-lotes-busqueda"><div><Icon name="search" size={17}/><input type="search" aria-label="Buscar ítem, marca, lote o almacén" placeholder="Buscar ítem, genérico, marca, lote o almacén…" value={busqueda} onChange={evento => { setBusqueda(evento.target.value); setPagina(1); }} /></div></label>
      <label><select aria-label="Filtrar por sucursal" value={sucursal} onChange={evento => { setSucursal(evento.target.value); setAlmacen('todos'); setPagina(1); }}><option value="todas">Todas las sucursales</option>{sucursales.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}</select></label>
      <label><select aria-label="Filtrar por almacén" value={almacen} onChange={evento => { setAlmacen(evento.target.value); setPagina(1); }}><option value="todos">Todos los almacenes</option>{almacenes.map(([id, datos]) => <option key={id} value={id}>{datos.nombre}{id !== 'sin-asignar' && sucursal === 'todas' ? ' · ' + datos.sucursal : ''}</option>)}</select></label>
      <button className="stock-actualizar" type="button" disabled={cargando} onClick={() => setRecarga(valor => valor + 1)}>{cargando ? 'Actualizando…' : 'Actualizar'}</button>
    </div>
    {error && <p className="stock-lotes-error" role="alert">{error} <button type="button" onClick={() => setRecarga(valor => valor + 1)}>Reintentar</button></p>}
    {!cargando && !error && sinIngresos > 0 && <p className="stock-general-aviso" role="status">{sinIngresos} {sinIngresos === 1 ? 'lote todavía no tiene un ingreso registrado' : 'lotes todavía no tienen ingresos registrados'}. Su stock es cero hasta registrar la compra y asignar el almacén.</p>}
    <PaginacionTabla total={visibles.length} filas={filas} pagina={paginaActual} totalPaginas={totalPaginas} onFilas={valor => { setFilas(valor); setPagina(1); }} onPagina={setPagina}/>
    <div className="stock-lotes-tabla" aria-busy={cargando}><table data-interactiva="true"><thead><tr>{columnas.map(columna => <th key={columna.campo} scope="col" aria-sort={orden === columna.campo ? direccion === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" className="stock-orden" onClick={() => { setOrden(columna.campo); setDireccion(orden === columna.campo && direccion === 'asc' ? 'desc' : 'asc'); setPagina(1); }}>{columna.texto}<span aria-hidden="true">{orden === columna.campo ? direccion === 'asc' ? '↑' : '↓' : '↕'}</span></button></th>)}<th scope="col">Acciones</th></tr></thead><tbody>{lotesPagina.map(lote => <tr key={lote.id}>
      <td>{lote.codigo}<small>{lote.codigoGenerico}</small></td><td className="stock-lote-nombre">{lote.nombre}<small>{lote.generico} · {lote.presentacion}</small></td><td><span className="stock-lote-tipo">{lote.tipo}</span></td><td>{lote.categoria}</td><td>{lote.subcategoria}</td><td>{lote.unidad}</td><td>{lote.marca}</td><td>{lote.lote}</td><td className={lote.disponible === 0 ? 'stock-cero' : lote.disponible < 0 ? 'stock-negativo' : ''}>{cantidad(lote.disponible)}</td><td>{lote.almacen}<small>{lote.sucursalId !== null ? lote.sucursal : ''}</small></td><td>{lote.vence || 'Sin vencimiento'}</td><td><button className="stock-lote-detalle" aria-label={'Ver detalle de ' + lote.nombre + ', lote ' + lote.lote} type="button" onClick={evento => { origen.current = evento.currentTarget; setDetalle(lote); setAlmacenDetalle(clave(lote.almacenId)); }}><Icon name="eye" size={15}/> Ver detalle</button></td>
    </tr>)}</tbody></table>
      {cargando && <p className="stock-lotes-vacio" role="status">Consultando existencias…</p>}
      {!cargando && !error && !visibles.length && <div className="stock-lotes-vacio" role="status"><Icon name="package" size={24}/><div><strong>{lotes.length ? 'No hay coincidencias' : 'No hay lotes registrados'}</strong><p>{lotes.length ? 'Cambia la búsqueda o los filtros para consultar otras existencias.' : 'Registra los lotes en Ítems general. Las cantidades aparecerán al registrar los ingresos de compra.'}</p></div></div>}
    </div>
    {detalle && createPortal(<div className="stock-lote-detalle-fondo stock-general-detalle-fondo"><section ref={dialogo} className="stock-lote-detalle-modal stock-general-detalle" role="dialog" aria-modal="true" aria-labelledby="stock-lote-detalle-titulo" onKeyDown={evento => {
      if (evento.key === 'Escape') { evento.preventDefault(); cerrar(); }
      if (evento.key === 'Tab') {
        const elementos = dialogo.current?.querySelectorAll<HTMLElement>('button:enabled, select:enabled, summary');
        if (!elementos?.length) return;
        const primero = elementos[0], ultimo = elementos[elementos.length - 1];
        if (evento.shiftKey && document.activeElement === primero) { evento.preventDefault(); ultimo.focus(); }
        if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primero.focus(); }
      }
    }}><header><div><small>{detalle.codigo} · {detalle.codigoGenerico}</small><h3 id="stock-lote-detalle-titulo">{detalle.nombre}</h3><p>{detalle.generico} · {detalle.marca}</p></div><button type="button" onClick={cerrar} aria-label="Cerrar detalle"><Icon name="close" size={18}/></button></header>
      <div className="stock-general-detalle-cuerpo"><dl className="stock-general-datos"><div><dt>Lote seleccionado</dt><dd>{detalle.lote}</dd></div><div><dt>Vencimiento</dt><dd>{detalle.vence || 'Sin vencimiento'}</dd></div><div><dt>Presentación</dt><dd>{detalle.presentacion}</dd></div><div><dt>Unidad de medida</dt><dd>{detalle.unidad}</dd></div><div><dt>Almacén del lote</dt><dd>{detalle.almacen}</dd></div><div><dt>Sucursal del lote</dt><dd>{detalle.sucursal}</dd></div><div><dt>Stock de este lote en el almacén</dt><dd>{cantidad(detalle.disponible)}</dd></div><div><dt>Costo unitario registrado</dt><dd>{dinero(detalle.costoUnitario, 4)}</dd></div><div><dt>Fecha de ingreso</dt><dd>{detalle.fecha || 'Sin ingreso registrado'}</dd></div><div><dt>Categoría</dt><dd>{detalle.categoria} / {detalle.subcategoria}</dd></div></dl>
      <div className="stock-general-precios">{[detalle.precio1, detalle.precio2, detalle.precio3].map((precio, indice) => <div key={indice}><small>Precio {indice + 1} del lote</small><strong>{dinero(precio)}</strong></div>)}</div>
      <section className="stock-general-distribucion"><h4>Existencias del ítem en todos sus lotes</h4><label>Consultar almacén<select aria-label="Consultar almacén en el detalle" value={almacenDetalle} onChange={evento => setAlmacenDetalle(evento.target.value)}><option value="todos">Todos los almacenes</option>{almacenesDetalle.map(([id, lote]) => <option key={id} value={id}>{lote.almacen}{lote.sucursalId !== null ? ' · ' + lote.sucursal : ''}</option>)}</select></label><p className="stock-general-total">Stock total del ítem: <strong>{cantidad(sumar(detalleFiltrado))}</strong></p>
        {gruposDetalle.map(grupo => <details key={grupo.id} open><summary>{grupo.nombre} <strong>{cantidad(sumar(grupo.lotes))}</strong></summary><div className="stock-general-desglose"><table data-interactiva="true"><thead><tr><th>Almacén</th><th>Lote</th><th>Stock</th><th>Vence</th></tr></thead><tbody>{grupo.lotes.map(lote => <tr key={lote.id}><td>{lote.almacen}</td><td>{lote.lote}</td><td>{cantidad(lote.disponible)}</td><td>{lote.vence || 'Sin fecha'}</td></tr>)}</tbody></table></div></details>)}
      </section></div><footer><button type="button" onClick={cerrar}>Cerrar</button></footer></section></div>, document.querySelector('.sistema-contable') || document.body)}
  </section>;
}
