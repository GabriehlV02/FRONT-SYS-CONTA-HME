import { useEffect, useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import { productosDemo } from '../../inventario/datos/catalogoDemo';
import type { SubvistaAdquisiciones } from '../componentes/MovimientosNavegacion';

type LineaCargaStock = {
  id: string;
  codigo: string;
  producto: string;
  categoria: string;
  lote: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  vence: string;
  observacion: string;
};

type RegistroIngreso = {
  id: string;
  fecha: string;
  proveedor: string;
  comprobante: string;
  almacen: string;
  lineas: LineaCargaStock[];
};

type ItemInventario = {
  codigo: string;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  tipo: string;
};

const moneda = new Intl.NumberFormat('es-BO', {
  currency: 'BOB',
  style: 'currency',
});

const almacenesDestino = [
  'Central - Almacen general',
  'Central - Farmacia interna',
  'Sucursal Norte - Caja farmacia',
  'Sucursal Norte - Almacen insumos',
  'Sucursal Sur - Caja farmacia',
  'Sucursal Sur - Almacen clinico',
];

const registrosIniciales: RegistroIngreso[] = [0, 1].map((grupo) => ({
  id: `ING-${String(grupo + 1).padStart(4, '0')}`,
  fecha: `2026-09-${String(10 - grupo).padStart(2, '0')}`,
  proveedor: grupo === 0 ? 'Distribuidora Medica Andina' : 'Insumos Clinicos Bolivia',
  comprobante: `FAC-${2400 + grupo}`,
  almacen: grupo === 0 ? almacenesDestino[0] : almacenesDestino[1],
  lineas: productosDemo.slice(grupo * 4, grupo * 4 + 4).map((producto, indice) => ({
    id: `LIN-DEMO-${grupo}-${indice}`,
    codigo: `DEMO-${grupo}-${indice}`,
    producto: producto.nombre,
    categoria: producto.categoria,
    lote: `L-${producto.marca.slice(0, 3).toUpperCase()}-${86 + indice}`,
    cantidad: (indice + 2) * 6,
    unidad: producto.presentacion.includes('Caja') ? 'Caja' : producto.presentacion.includes('Paquete') ? 'Paquete' : 'Unidad',
    costoUnitario: 18 + indice * 7.5,
    vence: `2027-${String((indice % 9) + 1).padStart(2, '0')}-28`,
    observacion: '',
  })),
}));

const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');

const titulos: Record<SubvistaAdquisiciones, string> = {
  cargado: 'cargado',
  comprobante: 'comprobantes',
};

export function AdquisicionesView({ activeId }: { activeId?: string }) {
  const resolveSubvista = (id?: string): SubvistaAdquisiciones =>
    id === 'adquisiciones-comprobante' ? 'comprobante' : 'cargado';
  const [subvista, setSubvista] = useState<SubvistaAdquisiciones>(() =>
    resolveSubvista(activeId),
  );
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [almacen, setAlmacen] = useState('todos');
  const [registros, setRegistros] = useState<RegistroIngreso[]>(registrosIniciales);
  const [cargandoStock, setCargandoStock] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [edicionId, setEdicionId] = useState<string | null>(null);
  const [itemsInventario, setItemsInventario] = useState<ItemInventario[]>([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [codigoSeleccionado, setCodigoSeleccionado] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [errorCatalogo, setErrorCatalogo] = useState('');
  const [almacenDestino, setAlmacenDestino] = useState(almacenesDestino[0]);
  const [proveedorCarga, setProveedorCarga] = useState('');
  const [comprobanteCarga, setComprobanteCarga] = useState('');
  const [fechaCarga, setFechaCarga] = useState('2026-09-12');
  const [lineasCarga, setLineasCarga] = useState<LineaCargaStock[]>([]);
  const [lineaEditandoId, setLineaEditandoId] = useState<string | null>(null);
  const [cantidadLinea, setCantidadLinea] = useState('');
  const [costoLinea, setCostoLinea] = useState('');
  const [loteLinea, setLoteLinea] = useState('');
  const [venceLinea, setVenceLinea] = useState('');
  const [observacionLinea, setObservacionLinea] = useState('');
  useEffect(() => setSubvista(resolveSubvista(activeId)), [activeId]);
  useEffect(() => {
    if (!cargandoStock) return;
    let vigente = true;
    fetch('/api/inventario')
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error('No se pudo cargar el catálogo de inventario.');
        return respuesta.json() as Promise<{ data?: ItemInventario[] }>;
      })
      .then(({ data }) => {
        if (!vigente) return;
        setItemsInventario((data ?? []).filter((item) =>
          ['PRODUCTO', 'INSUMO'].includes(item.tipo.toUpperCase()),
        ));
        setErrorCatalogo('');
      })
      .catch((error: unknown) => {
        if (vigente) setErrorCatalogo(error instanceof Error ? error.message : 'No se pudo cargar el catálogo.');
      });
    return () => { vigente = false; };
  }, [cargandoStock]);
  useEffect(() => {
    if (!cargandoStock && !detalleId) return;
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCargandoStock(false);
        setDetalleId(null);
      }
    };
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [cargandoStock, detalleId]);

  const almacenes = useMemo(
    () => [...new Set(registros.map((registro) => registro.almacen))].sort(),
    [registros],
  );

  const lineaActual = lineasCarga.find((linea) => linea.id === lineaEditandoId && linea.codigo === codigoSeleccionado);
  const productoActual = itemsInventario.find((item) => item.codigo === codigoSeleccionado)
    ?? (lineaActual ? {
      codigo: lineaActual.codigo,
      nombre: lineaActual.producto,
      categoria: lineaActual.categoria,
      unidadMedida: lineaActual.unidad,
      tipo: 'PRODUCTO',
    } : undefined);
  const detalleRegistro = registros.find((registro) => registro.id === detalleId);
  const productosEncontrados = itemsInventario.filter((item) =>
    [item.codigo, item.nombre].some((valor) => normalizar(valor).includes(normalizar(busquedaProducto.trim()))),
  ).slice(0, 8);

  const registrosFiltrados = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return registros
      .filter((registro) => almacen === 'todos' || registro.almacen === almacen)
      .filter((registro) => !fechaDesde || registro.fecha >= fechaDesde)
      .filter((registro) => !fechaHasta || registro.fecha <= fechaHasta)
      .filter(
        (registro) =>
          !termino ||
          [
            registro.id,
            registro.proveedor,
            registro.comprobante,
            registro.almacen,
            ...registro.lineas.flatMap((linea) => [linea.codigo, linea.producto, linea.categoria, linea.lote]),
          ].some((valor) => normalizar(valor).includes(termino)),
      );
  }, [almacen, busqueda, fechaDesde, fechaHasta, registros]);

  function agregarLineaCarga(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productoActual) {
      setErrorCatalogo('Selecciona un producto del catálogo.');
      return;
    }
    const cantidad = Number(cantidadLinea);
    const costoUnitario = Number(costoLinea);
    const nuevaLinea: LineaCargaStock = {
      id: lineaEditandoId ?? `LIN-${crypto.randomUUID()}`,
      codigo: productoActual.codigo,
      producto: productoActual.nombre,
      categoria: productoActual.categoria,
      lote: loteLinea.trim(),
      cantidad,
      unidad: productoActual.unidadMedida,
      costoUnitario,
      vence: venceLinea,
      observacion: observacionLinea,
    };
    setLineasCarga((actuales) => lineaEditandoId
      ? actuales.map((item) => item.id === lineaEditandoId ? nuevaLinea : item)
      : [...actuales, nuevaLinea]);
    setLineaEditandoId(null);
    setCantidadLinea('');
    setCostoLinea('');
    setLoteLinea('');
    setVenceLinea('');
    setObservacionLinea('');
    setCodigoSeleccionado('');
    setBusquedaProducto('');
    setMostrarResultados(false);
    setErrorCatalogo('');
  }

  function nuevoRegistro() {
    setEdicionId(null);
    setAlmacenDestino(almacenesDestino[0]);
    setProveedorCarga('');
    setComprobanteCarga('');
    setFechaCarga(new Date().toISOString().slice(0, 10));
    setLineasCarga([]);
    setLineaEditandoId(null);
    setCodigoSeleccionado('');
    setBusquedaProducto('');
    setCantidadLinea('');
    setCostoLinea('');
    setLoteLinea('');
    setVenceLinea('');
    setObservacionLinea('');
    setErrorCatalogo('');
    setCargandoStock(true);
  }

  function modificarRegistro(registro: RegistroIngreso) {
    setDetalleId(null);
    setEdicionId(registro.id);
    setAlmacenDestino(registro.almacen);
    setProveedorCarga(registro.proveedor);
    setComprobanteCarga(registro.comprobante);
    setFechaCarga(registro.fecha);
    setLineasCarga(registro.lineas.map((linea) => ({ ...linea })));
    setLineaEditandoId(null);
    setCodigoSeleccionado('');
    setBusquedaProducto('');
    setCantidadLinea('');
    setCostoLinea('');
    setLoteLinea('');
    setVenceLinea('');
    setObservacionLinea('');
    setErrorCatalogo('');
    setCargandoStock(true);
  }

  function modificarLinea(linea: LineaCargaStock) {
    setLineaEditandoId(linea.id);
    setCodigoSeleccionado(linea.codigo);
    setBusquedaProducto(`${linea.codigo} · ${linea.producto}`);
    setCantidadLinea(String(linea.cantidad));
    setCostoLinea(String(linea.costoUnitario));
    setLoteLinea(linea.lote);
    setVenceLinea(linea.vence);
    setObservacionLinea(linea.observacion);
  }

  function guardarLoteCarga() {
    if (lineasCarga.length === 0 || lineaEditandoId) return;
    const registro: RegistroIngreso = {
      id: edicionId ?? `ING-${crypto.randomUUID()}`,
      fecha: fechaCarga,
      proveedor: proveedorCarga || 'Proveedor por definir',
      comprobante: comprobanteCarga || 'Sin comprobante',
      almacen: almacenDestino,
      lineas: lineasCarga.map((linea) => ({ ...linea })),
    };
    setRegistros((actuales) => edicionId
      ? actuales.map((item) => item.id === edicionId ? registro : item)
      : [registro, ...actuales]);
    setLineasCarga([]);
    setEdicionId(null);
    setProveedorCarga('');
    setComprobanteCarga('');
    setCargandoStock(false);
  }

  return (
    <>
      <div className="movimientos-contenido adquisiciones-contenido">
        {subvista === 'cargado' ? (
          <>
          {cargandoStock && (
          <div
            className="adquisiciones-modal-fondo"
            role="presentation"
            onMouseDown={() => setCargandoStock(false)}
          >
          <section
            className="adquisiciones-carga-stock"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adquisiciones-carga-titulo"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="adquisiciones-carga-header">
              <div>
                <span>{edicionId ? `Modificar ingreso ${edicionId}` : 'Nuevo ingreso de stock'}</span>
                <h2 id="adquisiciones-carga-titulo">{edicionId ? 'Modificar registro' : 'Cargar stock'}</h2>
              </div>
              <button
                className="adquisiciones-volver"
                type="button"
                aria-label="Cerrar carga de stock"
                onClick={() => setCargandoStock(false)}
              >
                <Icon name="close" size={18} />
              </button>
            </header>

            <div className="adquisiciones-lote-panel">
              <label>
                <span>Almacen destino</span>
                <select
                  value={almacenDestino}
                  onChange={(event) => setAlmacenDestino(event.target.value)}
                >
                  {almacenesDestino.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Fecha de recepcion</span>
                <input
                  type="date"
                  value={fechaCarga}
                  onChange={(event) => setFechaCarga(event.target.value)}
                />
              </label>
              <label>
                <span>Proveedor</span>
                <input
                  value={proveedorCarga}
                  onChange={(event) => setProveedorCarga(event.target.value)}
                  placeholder="Proveedor del lote"
                />
              </label>
              <label>
                <span>Comprobante</span>
                <input
                  value={comprobanteCarga}
                  onChange={(event) => setComprobanteCarga(event.target.value)}
                  placeholder="Factura, recibo o nota"
                />
              </label>
            </div>

            <h3 className="adquisiciones-carga-seccion">Productos del registro</h3>
            <form className="adquisiciones-linea-form" onSubmit={agregarLineaCarga}>
              <div className="adquisiciones-linea-producto adquisiciones-buscador-producto">
                <span>Producto o insumo</span>
                <input
                  value={busquedaProducto}
                  onChange={(event) => {
                    setBusquedaProducto(event.target.value);
                    setCodigoSeleccionado('');
                    setMostrarResultados(true);
                  }}
                  onFocus={() => { if (!codigoSeleccionado) setMostrarResultados(true); }}
                  placeholder="Buscar por código o nombre"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={mostrarResultados}
                  aria-controls="adquisiciones-resultados-producto"
                />
                {mostrarResultados && busquedaProducto.trim() && (
                  <div className="adquisiciones-buscador-resultados" id="adquisiciones-resultados-producto" role="listbox">
                    {productosEncontrados.length ? productosEncontrados.map((item) => (
                      <button
                        key={item.codigo}
                        type="button"
                        role="option"
                        aria-selected={item.codigo === codigoSeleccionado}
                        onClick={() => {
                          setCodigoSeleccionado(item.codigo);
                          setBusquedaProducto(`${item.codigo} · ${item.nombre}`);
                          setMostrarResultados(false);
                          setErrorCatalogo('');
                        }}
                      >
                        <strong>{item.codigo}</strong> {item.nombre}
                      </button>
                    )) : <p>No se encontraron artículos.</p>}
                  </div>
                )}
                {errorCatalogo && <small className="adquisiciones-catalogo-error" role="alert">{errorCatalogo}</small>}
              </div>
              <label>
                <span>Categoria</span>
                <input value={productoActual?.categoria ?? ''} placeholder="Se completa al seleccionar" disabled readOnly />
              </label>
              <label>
                <span>Cantidad</span>
                <input name="cantidad" required min="1" step="1" type="number" value={cantidadLinea} onChange={(event) => setCantidadLinea(event.target.value)} />
              </label>
              <label>
                <span>Unidad</span>
                <input value={productoActual?.unidadMedida ?? ''} placeholder="Se completa al seleccionar" disabled readOnly />
              </label>
              <label>
                <span>Costo unitario</span>
                <input
                  name="costoUnitario"
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  placeholder="0.00"
                  value={costoLinea}
                  onChange={(event) => setCostoLinea(event.target.value)}
                />
              </label>
              <label>
                <span>Lote del producto</span>
                <input name="lote" required placeholder="Código de lote" value={loteLinea} onChange={(event) => setLoteLinea(event.target.value)} />
              </label>
              <label>
                <span>Vencimiento</span>
                <input name="vence" required type="date" value={venceLinea} onChange={(event) => setVenceLinea(event.target.value)} />
              </label>
              <label className="adquisiciones-linea-observacion">
                <span>Observacion</span>
                <input name="observacion" placeholder="Estado o nota puntual" value={observacionLinea} onChange={(event) => setObservacionLinea(event.target.value)} />
              </label>
              <button className="adquisiciones-agregar-linea" type="submit">
                <Icon name={lineaEditandoId ? 'check' : 'plus'} size={16} /> {lineaEditandoId ? 'Actualizar producto' : 'Agregar'}
              </button>
              {lineaEditandoId && (
                <button className="adquisiciones-cancelar-linea" type="button" onClick={() => {
                  setLineaEditandoId(null);
                  setCodigoSeleccionado('');
                  setBusquedaProducto('');
                  setCantidadLinea('');
                  setCostoLinea('');
                  setLoteLinea('');
                  setVenceLinea('');
                  setObservacionLinea('');
                }}>Cancelar edición</button>
              )}
            </form>

            <div className="adquisiciones-lote-tabla">
              <div className="adquisiciones-lote-head">
                <span>Producto</span>
                <span>Categoria</span>
                <span>Cantidad</span>
                <span>Lote</span>
                <span>Costo</span>
                <span>Vence</span>
                <span>Nota</span>
                <span>Acciones</span>
              </div>
              {lineasCarga.length === 0 ? (
                <p className="adquisiciones-lote-vacio">
                  Agrega productos o insumos al registro antes de guardarlo.
                </p>
              ) : (
                lineasCarga.map((linea) => (
                  <article className="adquisiciones-lote-row" key={linea.id}>
                    <strong>{linea.producto}</strong>
                    <span>{linea.categoria}</span>
                    <span>
                      {linea.cantidad} {linea.unidad}
                    </span>
                    <span>{linea.lote}</span>
                    <span>{moneda.format(linea.cantidad * linea.costoUnitario)}</span>
                    <span>{linea.vence}</span>
                    <span>{linea.observacion || 'Sin nota'}</span>
                    <div className="adquisiciones-linea-acciones">
                      <button type="button" onClick={() => modificarLinea(linea)}>Editar</button>
                      <button type="button" onClick={() => {
                        setLineasCarga((actuales) => actuales.filter((item) => item.id !== linea.id));
                        if (lineaEditandoId === linea.id) setLineaEditandoId(null);
                      }}>Quitar</button>
                    </div>
                  </article>
                ))
              )}
            </div>
            <footer className="adquisiciones-carga-footer">
              <button className="adquisiciones-volver" type="button" onClick={() => setCargandoStock(false)}>
                Cancelar
              </button>
              <button
                className="adquisiciones-cargar"
                type="button"
                disabled={lineasCarga.length === 0 || Boolean(lineaEditandoId)}
                onClick={guardarLoteCarga}
              >
                {edicionId ? 'Guardar cambios' : 'Guardar registro'}
              </button>
            </footer>
          </section>
          </div>
          )}
          {detalleRegistro && (
            <div className="adquisiciones-modal-fondo" role="presentation" onMouseDown={() => setDetalleId(null)}>
              <section className="adquisiciones-carga-stock adquisiciones-detalle" role="dialog" aria-modal="true" aria-labelledby="adquisiciones-detalle-titulo" onMouseDown={(event) => event.stopPropagation()}>
                <header className="adquisiciones-carga-header">
                  <div><span>Ingreso de stock</span><h2 id="adquisiciones-detalle-titulo">{detalleRegistro.id}</h2></div>
                  <button className="adquisiciones-volver" type="button" aria-label="Cerrar detalle" onClick={() => setDetalleId(null)}><Icon name="close" size={18} /></button>
                </header>
                <div className="adquisiciones-detalle-resumen">
                  <div><small>Fecha de recepción</small><strong>{detalleRegistro.fecha}</strong></div>
                  <div><small>Almacén destino</small><strong>{detalleRegistro.almacen}</strong></div>
                  <div><small>Proveedor</small><strong>{detalleRegistro.proveedor}</strong></div>
                  <div><small>Comprobante</small><strong>{detalleRegistro.comprobante}</strong></div>
                </div>
                <h3 className="adquisiciones-carga-seccion">Productos ({detalleRegistro.lineas.length})</h3>
                <div className="adquisiciones-lote-tabla">
                  <div className="adquisiciones-lote-head">
                    <span>Producto</span><span>Categoría</span><span>Cantidad</span><span>Lote</span><span>Costo</span><span>Vence</span><span>Nota</span>
                  </div>
                  {detalleRegistro.lineas.map((linea) => (
                    <article className="adquisiciones-lote-row" key={linea.id}>
                      <strong>{linea.codigo} · {linea.producto}</strong>
                      <span>{linea.categoria}</span>
                      <span>{linea.cantidad} {linea.unidad}</span>
                      <span>{linea.lote}</span>
                      <span>{moneda.format(linea.cantidad * linea.costoUnitario)}</span>
                      <span>{linea.vence}</span>
                      <span>{linea.observacion || 'Sin nota'}</span>
                    </article>
                  ))}
                </div>
                <div className="adquisiciones-detalle-total">Total: <strong>{moneda.format(detalleRegistro.lineas.reduce((total, linea) => total + linea.cantidad * linea.costoUnitario, 0))}</strong></div>
                <footer className="adquisiciones-carga-footer">
                  <button className="adquisiciones-volver" type="button" onClick={() => setDetalleId(null)}>Cerrar</button>
                  <button className="adquisiciones-imprimir" type="button" onClick={() => window.print()}>Imprimir</button>
                  <button className="adquisiciones-cargar" type="button" onClick={() => modificarRegistro(detalleRegistro)}>Modificar registro</button>
                </footer>
              </section>
            </div>
          )}
            <div className="adquisiciones-controles">
              <div className="adquisiciones-controles-top">
                <div>
                  <h3>Ingresos de stock</h3>
                  <p>{registrosFiltrados.length} {registrosFiltrados.length === 1 ? 'registro encontrado' : 'registros encontrados'}</p>
                </div>
                <button className="adquisiciones-cargar" type="button" onClick={nuevoRegistro}>
                  <Icon name="plus" size={17} /> Cargar stock
                </button>
              </div>
              <div className="adquisiciones-filtros">
                <label className="adquisiciones-filtro-busqueda">
                  <Icon name="search" size={17} />
                  <input
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    placeholder="Buscar registro, producto, proveedor o lote"
                    aria-label="Buscar cargas de stock"
                  />
                </label>
                <label className="adquisiciones-filtro-campo">
                  <span>Desde</span>
                  <input type="date" value={fechaDesde} max={fechaHasta || undefined} onChange={(event) => setFechaDesde(event.target.value)} aria-label="Fecha desde" />
                </label>
                <label className="adquisiciones-filtro-campo">
                  <span>Hasta</span>
                  <input type="date" value={fechaHasta} min={fechaDesde || undefined} onChange={(event) => setFechaHasta(event.target.value)} aria-label="Fecha hasta" />
                </label>
                <label className="adquisiciones-filtro-campo">
                  <span>Almacén</span>
                  <select value={almacen} onChange={(event) => setAlmacen(event.target.value)} aria-label="Filtrar por almacén">
                    <option value="todos">Todos los almacenes</option>
                    {almacenes.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                {(busqueda || fechaDesde || fechaHasta || almacen !== 'todos') && (
                  <button className="adquisiciones-limpiar" type="button" onClick={() => {
                    setBusqueda(''); setFechaDesde(''); setFechaHasta(''); setAlmacen('todos');
                  }}>Limpiar filtros</button>
                )}
              </div>
            </div>

            <div
              className="movimientos-tabla adquisiciones-tabla"
              role="table"
              aria-label="Adquisiciones - cargado de stock"
            >
              <div className="movimientos-tabla-head" role="row">
                <span role="columnheader">Fecha</span>
                <span role="columnheader">Registro</span>
                <span role="columnheader">Proveedor</span>
                <span role="columnheader">Comprobante</span>
                <span role="columnheader">Productos</span>
                <span role="columnheader">Costo total</span>
                <span role="columnheader">Almacen</span>
                <span role="columnheader">Acciones</span>
              </div>
              {registrosFiltrados.map((registro) => (
                <article className="adquisiciones-row" role="row" key={registro.id}>
                  <span className="adquisiciones-codigo">{registro.fecha}</span>
                  <div className="adquisiciones-producto-cell">
                    <strong>{registro.id}</strong>
                    <small>{registro.lineas.length} productos en este ingreso</small>
                  </div>
                  <span>{registro.proveedor}</span>
                  <span className="adquisiciones-chip">{registro.comprobante}</span>
                  <span className="adquisiciones-cantidad">
                    {registro.lineas.length} artículos
                  </span>
                  <span className="adquisiciones-costo">
                    {moneda.format(registro.lineas.reduce((total, linea) => total + linea.cantidad * linea.costoUnitario, 0))}
                  </span>
                  <span>{registro.almacen}</span>
                  <div className="adquisiciones-acciones">
                    <button type="button" onClick={() => setDetalleId(registro.id)}><Icon name="eye" size={15} /> Ver detalle</button>
                    <button type="button" onClick={() => modificarRegistro(registro)}><Icon name="edit" size={15} /> Modificar</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="movimientos-filtros">
              <label>
                <Icon name="search" size={17} />
                <input
                  placeholder={`Buscar en ${titulos[subvista]}`}
                  aria-label="Buscar en comprobantes"
                />
              </label>
              <select aria-label="Filtrar por tipo">
                <option>Tipo</option>
              </select>
              <select aria-label="Filtrar por fecha">
                <option>Fecha</option>
              </select>
              <span className="movimientos-contador">0 registros</span>
            </div>
            <div
              className="movimientos-tabla"
              role="table"
              aria-label="Adquisiciones - comprobantes"
            >
              <div className="movimientos-tabla-head" role="row">
                <span role="columnheader">Fecha</span>
                <span role="columnheader">Comprobante</span>
                <span role="columnheader">Origen</span>
                <span role="columnheader">Destino</span>
                <span role="columnheader">Estado</span>
                <span role="columnheader">Acciones</span>
              </div>
            </div>
          </>
        )}
      </div>

    </>
  );
}
