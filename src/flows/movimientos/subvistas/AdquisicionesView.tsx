import { useEffect, useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import { productosDemo } from '../../inventario/datos/catalogoDemo';
import {
  MovimientosNavegacion,
  type SubvistaAdquisiciones,
} from '../componentes/MovimientosNavegacion';

type EstadoCarga = 'Recibido' | 'Pendiente' | 'Observado';

type CargaStock = {
  id: string;
  fecha: string;
  producto: string;
  categoria: string;
  proveedor: string;
  comprobante: string;
  almacen: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  lote: string;
  vence: string;
  estado: EstadoCarga;
};

type LineaCargaStock = {
  id: string;
  producto: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  vence: string;
  observacion: string;
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

const registrosIniciales: CargaStock[] = productosDemo.slice(0, 8).map(
  (producto, indice) => ({
    id: `ING-${String(indice + 1).padStart(4, '0')}`,
    fecha: `2026-09-${String(10 - (indice % 5)).padStart(2, '0')}`,
    producto: producto.nombre,
    categoria: producto.categoria,
    proveedor:
      indice % 3 === 0
        ? 'Distribuidora Medica Andina'
        : indice % 3 === 1
          ? 'Insumos Clinicos Bolivia'
          : 'Proveedor Hospitalario SRL',
    comprobante: `FAC-${2400 + indice}`,
    almacen: indice % 2 === 0 ? 'Almacen central' : 'Farmacia interna',
    cantidad: (indice + 2) * 6,
    unidad: producto.presentacion.includes('Caja')
      ? 'Caja'
      : producto.presentacion.includes('Paquete')
        ? 'Paquete'
        : 'Unidad',
    costoUnitario: 18 + indice * 7.5,
    lote: `L-${producto.marca.slice(0, 3).toUpperCase()}-${86 + indice}`,
    vence: `2027-${String((indice % 9) + 1).padStart(2, '0')}-28`,
    estado: indice === 5 ? 'Observado' : indice === 7 ? 'Pendiente' : 'Recibido',
  }),
);

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
  const [estado, setEstado] = useState<'todos' | EstadoCarga>('todos');
  const [almacen, setAlmacen] = useState('todos');
  const [registros, setRegistros] = useState<CargaStock[]>(registrosIniciales);
  const [cargandoStock, setCargandoStock] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(
    productosDemo[0]?.nombre ?? '',
  );
  const [loteCarga, setLoteCarga] = useState(
    `LOT-${new Date().getFullYear()}-${String(registrosIniciales.length + 1).padStart(3, '0')}`,
  );
  const [almacenDestino, setAlmacenDestino] = useState(almacenesDestino[0]);
  const [proveedorCarga, setProveedorCarga] = useState('');
  const [comprobanteCarga, setComprobanteCarga] = useState('');
  const [fechaCarga, setFechaCarga] = useState('2026-09-12');
  const [lineasCarga, setLineasCarga] = useState<LineaCargaStock[]>([]);
  useEffect(() => setSubvista(resolveSubvista(activeId)), [activeId]);

  const almacenes = useMemo(
    () => [...new Set(registros.map((registro) => registro.almacen))].sort(),
    [registros],
  );

  const productoActual = useMemo(
    () =>
      productosDemo.find((producto) => producto.nombre === productoSeleccionado) ??
      productosDemo[0],
    [productoSeleccionado],
  );

  const registrosFiltrados = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return registros
      .filter((registro) => estado === 'todos' || registro.estado === estado)
      .filter((registro) => almacen === 'todos' || registro.almacen === almacen)
      .filter(
        (registro) =>
          !termino ||
          [
            registro.id,
            registro.producto,
            registro.categoria,
            registro.proveedor,
            registro.comprobante,
            registro.almacen,
            registro.lote,
          ].some((valor) => normalizar(valor).includes(termino)),
      );
  }, [almacen, busqueda, estado, registros]);

  function agregarLineaCarga(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    const cantidad = Number(datos.get('cantidad') || 0);
    const costoUnitario = Number(datos.get('costoUnitario') || 0);
    const nuevaLinea: LineaCargaStock = {
      id: `LIN-${Date.now()}`,
      producto: productoActual.nombre,
      categoria: productoActual.categoria,
      cantidad,
      unidad: String(datos.get('unidad') || ''),
      costoUnitario,
      vence: String(datos.get('vence') || ''),
      observacion: String(datos.get('observacion') || ''),
    };
    setLineasCarga((actuales) => [...actuales, nuevaLinea]);
    event.currentTarget.reset();
    setProductoSeleccionado(productosDemo[0]?.nombre ?? '');
  }

  function guardarLoteCarga() {
    if (lineasCarga.length === 0) return;
    const nuevosRegistros: CargaStock[] = lineasCarga.map((linea, indice) => ({
      id: `ING-${String(registros.length + indice + 1).padStart(4, '0')}`,
      fecha: fechaCarga,
      producto: linea.producto,
      categoria: linea.categoria,
      proveedor: proveedorCarga || 'Proveedor por definir',
      comprobante: comprobanteCarga || 'Sin comprobante',
      almacen: almacenDestino,
      cantidad: linea.cantidad,
      unidad: linea.unidad,
      costoUnitario: linea.costoUnitario,
      lote: loteCarga,
      vence: linea.vence,
      estado: 'Recibido',
    }));
    setRegistros((actuales) => [...nuevosRegistros, ...actuales]);
    setLineasCarga([]);
    setProveedorCarga('');
    setComprobanteCarga('');
    setLoteCarga(
      `LOT-${new Date().getFullYear()}-${String(registros.length + nuevosRegistros.length + 1).padStart(3, '0')}`,
    );
    setCargandoStock(false);
  }

  return (
    <>
      <MovimientosNavegacion activa={subvista} onSeleccionar={setSubvista} />
      <div className="movimientos-contenido adquisiciones-contenido">
        {subvista === 'cargado' ? (
          cargandoStock ? (
          <section className="adquisiciones-carga-stock">
            <header className="adquisiciones-carga-header">
              <button
                className="adquisiciones-volver"
                type="button"
                onClick={() => setCargandoStock(false)}
              >
                <Icon name="chevronLeft" size={16} /> Volver
              </button>
              <div>
                <span>Nuevo ingreso por lote</span>
                <h2>Cargar stock</h2>
              </div>
              <button
                className="adquisiciones-cargar"
                type="button"
                disabled={lineasCarga.length === 0}
                onClick={guardarLoteCarga}
              >
                <Icon name="check" size={17} /> Guardar lote
              </button>
            </header>

            <div className="adquisiciones-lote-panel">
              <label>
                <span>Lote</span>
                <input
                  value={loteCarga}
                  onChange={(event) => setLoteCarga(event.target.value)}
                  placeholder="Codigo de lote"
                />
              </label>
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

            <form className="adquisiciones-linea-form" onSubmit={agregarLineaCarga}>
              <label className="adquisiciones-linea-producto">
                <span>Producto o insumo</span>
                <select
                  value={productoSeleccionado}
                  onChange={(event) => setProductoSeleccionado(event.target.value)}
                  required
                >
                  {productosDemo.map((producto) => (
                    <option key={producto.nombre} value={producto.nombre}>
                      {producto.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Categoria</span>
                <input value={productoActual?.categoria ?? ''} disabled readOnly />
              </label>
              <label>
                <span>Cantidad</span>
                <input name="cantidad" required min="1" step="1" type="number" />
              </label>
              <label>
                <span>Unidad</span>
                <select name="unidad" required defaultValue="Unidad">
                  <option>Unidad</option>
                  <option>Caja</option>
                  <option>Paquete</option>
                  <option>Frasco</option>
                  <option>Bidon</option>
                </select>
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
                />
              </label>
              <label>
                <span>Vencimiento</span>
                <input name="vence" required type="date" />
              </label>
              <label className="adquisiciones-linea-observacion">
                <span>Observacion</span>
                <input name="observacion" placeholder="Estado o nota puntual" />
              </label>
              <button className="adquisiciones-agregar-linea" type="submit">
                <Icon name="plus" size={16} /> Agregar
              </button>
            </form>

            <div className="adquisiciones-lote-tabla">
              <div className="adquisiciones-lote-head">
                <span>Producto</span>
                <span>Categoria</span>
                <span>Cantidad</span>
                <span>Costo</span>
                <span>Vence</span>
                <span>Nota</span>
                <span>Acciones</span>
              </div>
              {lineasCarga.length === 0 ? (
                <p className="adquisiciones-lote-vacio">
                  Agrega productos o insumos al lote antes de guardarlo.
                </p>
              ) : (
                lineasCarga.map((linea) => (
                  <article className="adquisiciones-lote-row" key={linea.id}>
                    <strong>{linea.producto}</strong>
                    <span>{linea.categoria}</span>
                    <span>
                      {linea.cantidad} {linea.unidad}
                    </span>
                    <span>{moneda.format(linea.cantidad * linea.costoUnitario)}</span>
                    <span>{linea.vence}</span>
                    <span>{linea.observacion || 'Sin nota'}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setLineasCarga((actuales) =>
                          actuales.filter((item) => item.id !== linea.id),
                        )
                      }
                    >
                      Quitar
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
          ) : (
          <>
            <div className="adquisiciones-controles">
              <div className="movimientos-filtros adquisiciones-filtros">
                <label>
                  <Icon name="search" size={17} />
                  <input
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    placeholder="Buscar producto, proveedor, lote o comprobante"
                    aria-label="Buscar cargas de stock"
                  />
                </label>
                <select
                  value={estado}
                  onChange={(event) =>
                    setEstado(event.target.value as 'todos' | EstadoCarga)
                  }
                  aria-label="Filtrar por estado"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="Recibido">Recibidos</option>
                  <option value="Pendiente">Pendientes</option>
                  <option value="Observado">Observados</option>
                </select>
                <select
                  value={almacen}
                  onChange={(event) => setAlmacen(event.target.value)}
                  aria-label="Filtrar por almacen"
                >
                  <option value="todos">Todos los almacenes</option>
                  {almacenes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="adquisiciones-cargar"
                type="button"
                onClick={() => setCargandoStock(true)}
              >
                <Icon name="plus" size={17} /> Cargar stock
              </button>
            </div>

            <div
              className="movimientos-tabla adquisiciones-tabla"
              role="table"
              aria-label="Adquisiciones - cargado de stock"
            >
              <div className="movimientos-tabla-head" role="row">
                <span role="columnheader">Fecha</span>
                <span role="columnheader">Producto recibido</span>
                <span role="columnheader">Proveedor</span>
                <span role="columnheader">Comprobante</span>
                <span role="columnheader">Cantidad</span>
                <span role="columnheader">Costo</span>
                <span role="columnheader">Almacen</span>
                <span role="columnheader">Lote / vence</span>
                <span role="columnheader">Estado</span>
                <span role="columnheader">Acciones</span>
              </div>
              {registrosFiltrados.map((registro) => (
                <article className="adquisiciones-row" role="row" key={registro.id}>
                  <span className="adquisiciones-codigo">{registro.fecha}</span>
                  <div className="adquisiciones-producto-cell">
                    <strong>{registro.producto}</strong>
                    <small>{registro.categoria}</small>
                  </div>
                  <span>{registro.proveedor}</span>
                  <span className="adquisiciones-chip">{registro.comprobante}</span>
                  <span className="adquisiciones-cantidad">
                    {registro.cantidad} {registro.unidad}
                  </span>
                  <span className="adquisiciones-costo">
                    {moneda.format(registro.cantidad * registro.costoUnitario)}
                  </span>
                  <span>{registro.almacen}</span>
                  <span className="adquisiciones-lote">
                    {registro.lote}
                    <small>{registro.vence}</small>
                  </span>
                  <span
                    className={`adquisiciones-estado adquisiciones-estado-${normalizar(
                      registro.estado,
                    )}`}
                  >
                    <i /> {registro.estado}
                  </span>
                  <div className="adquisiciones-acciones">
                    <button aria-label={`Ver ${registro.id}`}>
                      <Icon name="eye" size={15} />
                    </button>
                    <button>Detalle</button>
                  </div>
                </article>
              ))}
            </div>
          </>
          )
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
              <select aria-label="Filtrar por estado">
                <option>Todos</option>
                <option>Activos</option>
                <option>Inactivos</option>
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
