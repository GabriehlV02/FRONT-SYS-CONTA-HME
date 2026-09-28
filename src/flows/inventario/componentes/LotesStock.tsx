import { useEffect, useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import PaginacionTabla from '@ui/components/PaginacionTabla';
import { SelectMenu } from '@ui/components/SelectMenu';
import { productosDemo } from '../datos/catalogoDemo';

type Lote = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  categoria: string;
  subcategoria: string;
  unidad: string;
  marca: string;
  lote: string;
  fecha: string;
  almacen: string;
  sucursal?: string;
  disponible: number;
  costoUnitario: number;
  vence: string;
};

const sucursalPorAlmacen: Record<string, string> = {
  'Almacén central': 'Hospital María Esperanza',
  Farmacia: 'Hospital María Esperanza',
  'Insumos policonsultorio': 'Policonsultorio Diabetes',
};

const obtenerSucursal = (lote: Lote) => {
  if (lote.sucursal?.trim()) return lote.sucursal.trim();
  if (sucursalPorAlmacen[lote.almacen]) return sucursalPorAlmacen[lote.almacen];
  const partes = lote.almacen.split(' - ');
  return partes.length > 1 ? partes[0].trim() : 'Sucursal no asignada';
};

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
  lote:
    existenciasDemo[indice % existenciasDemo.length] > 0
      ? `LT-${String(2501 + indice).padStart(4, '0')}`
      : 'Sin lote',
  fecha:
    existenciasDemo[indice % existenciasDemo.length] > 0
      ? `2026-${String((indice % 9) + 1).padStart(2, '0')}-${String((indice % 20) + 1).padStart(2, '0')}`
      : 'Sin ingreso',
  almacen: indice % 3 === 0 ? 'Farmacia' : 'Almacén central',
  disponible: existenciasDemo[indice % existenciasDemo.length],
  costoUnitario: 8 + (indice % 12) * 4.5,
  vence:
    existenciasDemo[indice % existenciasDemo.length] > 0
      ? `2027-${String((indice % 9) + 1).padStart(2, '0')}-28`
      : '',
}));

type RecepcionLocal = {
  id: string;
  codigo: string;
  producto: string;
  lote: string;
  cantidad: number;
  unidad: string;
  movimientoId: string;
  almacen: string;
  fecha: string;
  estado?: 'recibido' | 'devuelto';
};
const leerRecepciones = (): Lote[] => {
  try {
    const recepciones = JSON.parse(
      localStorage.getItem('contable-stock-recepciones') || '[]',
    ) as RecepcionLocal[];
    return recepciones.map((linea) => ({
      id: `recepcion-${linea.movimientoId}-${linea.id}`,
      codigo: linea.codigo,
      nombre: linea.producto,
      tipo: linea.unidad === 'Unidad' ? 'Insumo' : 'Producto',
      categoria:
        linea.estado === 'devuelto'
          ? 'Devolución de traspaso'
          : 'Traspaso entre almacenes',
      subcategoria:
        linea.estado === 'devuelto' ? 'No recibido' : 'Recepcionado',
      unidad: linea.unidad,
      marca: linea.producto.includes('Guantes')
        ? 'SafeTouch'
        : linea.producto.includes('Jeringa')
          ? 'BolMed'
          : 'MediCare',
      lote: linea.lote,
      fecha: linea.fecha,
      almacen: linea.almacen,
      disponible: linea.cantidad,
      costoUnitario: 0,
      vence: '',
    }));
  } catch {
    return [];
  }
};

export function LotesStock() {
  const [lotes, setLotes] = useState<Lote[]>(lotesDemo);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [sucursal, setSucursal] = useState('todas');
  const [almacen, setAlmacen] = useState('todos');
  const [filas, setFilas] = useState(20);
  const [pagina, setPagina] = useState(1);
  const [detalle, setDetalle] = useState<Lote | null>(null);
  const [almacenDetalle, setAlmacenDetalle] = useState('todos');
  const [stockDetalleAbierto, setStockDetalleAbierto] = useState(false);

  useEffect(() => {
    if (!detalle) setStockDetalleAbierto(false);
  }, [detalle]);

  useEffect(() => {
    const incorporarRecepciones = (base: Lote[]) => [
      ...leerRecepciones(),
      ...base,
    ];
    const actualizarRecepciones = () =>
      setLotes((actual) => {
        const base = actual.filter((lote) => !lote.id.startsWith('recepcion-'));
        return incorporarRecepciones(base);
      });
    fetch('/api/stock/lotes')
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error('No se pudo cargar el stock');
        return respuesta.json();
      })
      .then((respuesta) => {
        const reales = Array.isArray(respuesta.data)
          ? (respuesta.data as Array<
              Partial<Lote> & Pick<Lote, 'id' | 'codigo'>
            >)
          : [];
        const codigosReales = new Set(reales.map((lote) => lote.codigo));
        const catalogo = new Map(lotesDemo.map((lote) => [lote.codigo, lote]));
        setLotes(
          incorporarRecepciones([
            ...reales.map(
              (lote) => ({ ...catalogo.get(lote.codigo), ...lote }) as Lote,
            ),
            ...lotesDemo.filter((lote) => !codigosReales.has(lote.codigo)),
          ]),
        );
      })
      .catch(() =>
        setError(
          'Se muestran existencias de ejemplo mientras se conecta el inventario.',
        ),
      );
    window.addEventListener(
      'contable-stock-actualizado',
      actualizarRecepciones,
    );
    return () =>
      window.removeEventListener(
        'contable-stock-actualizado',
        actualizarRecepciones,
      );
  }, []);

  const almacenes = useMemo(
    () =>
      [...new Set(lotes.map((lote) => lote.almacen).filter(Boolean))].sort(),
    [lotes],
  );
  const almacenesDetalle = useMemo(() => {
    if (!detalle) return [];
    return [...new Set(
      lotes
        .filter((lote) => lote.codigo === detalle.codigo)
        .map((lote) => lote.almacen)
        .filter(Boolean),
    )].sort();
  }, [detalle, lotes]);
  const existenciaDetalle = useMemo(() => {
    if (!detalle) return 0;
    return lotes
      .filter((lote) =>
        lote.codigo === detalle.codigo &&
        (almacenDetalle === 'todos' || lote.almacen === almacenDetalle),
      )
      .reduce((total, lote) => total + lote.disponible, 0);
  }, [almacenDetalle, detalle, lotes]);
  const stockPorAlmacen = useMemo(() => {
    if (!detalle) return [];
    const cantidades = new Map<string, { nombre: string; sucursal: string; cantidad: number; lotes: Lote[] }>();
    lotes
      .filter((lote) => lote.codigo === detalle.codigo)
      .forEach((lote) => {
        const sucursalLote = obtenerSucursal(lote);
        const clave = `${sucursalLote}\u0000${lote.almacen}`;
        const actual = cantidades.get(clave);
        cantidades.set(clave, {
          nombre: lote.almacen,
          sucursal: sucursalLote,
          cantidad: (actual?.cantidad || 0) + lote.disponible,
          lotes: [...(actual?.lotes || []), ...(lote.disponible > 0 ? [lote] : [])],
        });
      });
    return [...cantidades.values()].sort((a, b) =>
      a.sucursal.localeCompare(b.sucursal, 'es') || a.nombre.localeCompare(b.nombre, 'es'),
    );
  }, [detalle, lotes]);
  const stockPorSucursal = useMemo(() => {
    const grupos = new Map<string, typeof stockPorAlmacen>();
    stockPorAlmacen.forEach((item) => grupos.set(
      item.sucursal,
      [...(grupos.get(item.sucursal) || []), item],
    ));
    return [...grupos.entries()].map(([nombre, almacenesSucursal]) => ({
      nombre,
      almacenes: almacenesSucursal,
      total: almacenesSucursal.reduce((suma, item) => suma + item.cantidad, 0),
    }));
  }, [stockPorAlmacen]);
  const lotesVisibles = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es');
    return lotes.filter(
      (lote) =>
        (almacen === 'todos' || lote.almacen === almacen) &&
        (sucursal === 'todas' || sucursal === 'hospital-maria-esperanza') &&
        (!texto ||
          `${lote.codigo} ${lote.nombre} ${lote.marca} ${lote.lote} ${lote.almacen}`
            .toLocaleLowerCase('es')
            .includes(texto)),
    );
  }, [almacen, busqueda, lotes, sucursal]);
  const totalPaginas = Math.max(1, Math.ceil(lotesVisibles.length / filas));
  const paginaActual = Math.min(pagina, totalPaginas);
  const lotesPagina = lotesVisibles.slice(
    (paginaActual - 1) * filas,
    paginaActual * filas,
  );

  return (
    <section className="stock-lotes">
      <div className="stock-lotes-filtros">
        <label className="stock-lotes-busqueda">
          <div>
            <Icon name="search" size={17} />
            <input
              aria-label="Buscar ítem, marca, lote o almacén"
              placeholder="Buscar ítem, marca, lote o almacén..."
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value);
                setPagina(1);
              }}
            />
          </div>
        </label>
        <label>
          <select
            aria-label="Filtrar por sucursal"
            value={sucursal}
            onChange={(event) => {
              setSucursal(event.target.value);
              setAlmacen('todos');
              setPagina(1);
            }}
          >
            <option value="todas">Todas las sucursales</option>
            <option value="hospital-maria-esperanza">
              Hospital María Esperanza
            </option>
          </select>
        </label>
        <label>
          <select
            aria-label="Filtrar por almacén"
            value={almacen}
            onChange={(event) => {
              setAlmacen(event.target.value);
              setPagina(1);
            }}
          >
            <option value="todos">Todos los almacenes</option>
            {almacenes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p className="stock-lotes-error" role="alert">
          {error}
        </p>
      )}
      <PaginacionTabla
        total={lotesVisibles.length}
        filas={filas}
        pagina={paginaActual}
        totalPaginas={totalPaginas}
        onFilas={(cantidad) => {
          setFilas(cantidad);
          setPagina(1);
        }}
        onPagina={setPagina}
      />
      <div className="stock-lotes-tabla">
        <table>
          <colgroup>
            <col className="col-codigo" />
            <col className="col-nombre" />
            <col className="col-tipo" />
            <col className="col-categoria" />
            <col className="col-subcategoria" />
            <col className="col-unidad" />
            <col className="col-marca" />
            <col className="col-lote" />
            <col className="col-stock" />
            <col className="col-almacen" />
            <col className="col-vence" />
            <col className="col-acciones" />
          </colgroup>
          <thead>
            <tr>
              {[
                'Código',
                'Nombre o identificación',
                'Tipo',
                'Categoría',
                'Sub categoría',
                'Unidad',
                'Marca',
                'Lote',
                'Stock',
                'Almacén',
                'Vence',
                'Acciones',
              ].map((columna) => (
                <th key={columna}>{columna}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lotesPagina.map((lote) => (
              <tr key={lote.id}>
                <td>{lote.codigo}</td>
                <td className="stock-lote-nombre">{lote.nombre}</td>
                <td>
                  <span className="stock-lote-tipo">{lote.tipo}</span>
                </td>
                <td>{lote.categoria}</td>
                <td>{lote.subcategoria}</td>
                <td>{lote.unidad}</td>
                <td>{lote.marca}</td>
                <td>{lote.lote}</td>
                <td
                  className={
                    lote.disponible < 0
                      ? 'stock-negativo'
                      : lote.disponible === 0
                        ? 'stock-cero'
                        : ''
                  }
                >
                  {lote.disponible}
                </td>
                <td>{lote.almacen}</td>
                <td>{lote.vence || 'Sin vencimiento'}</td>
                <td>
                  <button
                    className="stock-lote-detalle"
                    type="button"
                    onClick={() => {
                      setDetalle(lote);
                      setAlmacenDetalle(lote.almacen);
                    }}
                  >
                    <Icon name="eye" size={15} /> Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!lotesVisibles.length && !error && (
          <div className="stock-lotes-vacio">
            <Icon name="package" size={24} />
            <div>
              <strong>
                {lotes.length
                  ? 'No hay coincidencias'
                  : 'No hay ingresos registrados'}
              </strong>
              <p>
                {lotes.length
                  ? 'Cambia los filtros para consultar otros lotes.'
                  : 'El stock aparecerá después de registrar una adquisición.'}
              </p>
            </div>
          </div>
        )}
      </div>
      {detalle && (
        <div
          className="stock-lote-detalle-fondo"
          role="presentation"
          onMouseDown={() => setDetalle(null)}
        >
          <section
            className="stock-lote-detalle-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-lote-detalle-titulo"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <div className="stock-lote-identificacion">
                  <span>Código</span>
                  <strong>{detalle.codigo}</strong>
                </div>
                <h3 id="stock-lote-detalle-titulo">{detalle.nombre}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetalle(null)}
                aria-label="Cerrar detalle"
              >
                <Icon name="close" size={18} />
              </button>
            </header>
            <div className="stock-lote-detalle-datos">
              <p>
                <span>Tipo de ítem</span>
                <strong>{detalle.tipo}</strong>
              </p>
              <p>
                <span>Categoría</span>
                <strong>{detalle.categoria}</strong>
              </p>
              <p className="stock-lote-costo">
                <span>Costo unitario</span>
                <strong>Bs {detalle.costoUnitario.toFixed(2)}</strong>
              </p>
              <p>
                <span>Subcategoría</span>
                <strong>{detalle.subcategoria}</strong>
              </p>
              <div className="stock-lote-separador" aria-hidden="true" />
              <p>
                <span>Almacén</span>
                <SelectMenu
                  className="stock-lote-almacen-select"
                  value={almacenDetalle === 'todos' ? 'Todos' : almacenDetalle}
                  options={['Todos', ...almacenesDetalle]}
                  formatOption={(opcion) => {
                    const cantidad = stockPorAlmacen
                      .filter((item) => opcion === 'Todos' || item.nombre === opcion)
                      .reduce((total, item) => total + item.cantidad, 0);
                    return `${opcion} (Stock: ${cantidad.toLocaleString('es-BO')})`;
                  }}
                  onChange={(opcion) => setAlmacenDetalle(opcion === 'Todos' ? 'todos' : opcion)}
                  ariaLabel="Seleccionar almacén para consultar existencias"
                />
              </p>
              <p className="stock-lote-dato-destacado">
                <span>Existencia disponible</span>
                <span className="stock-lote-existencia-control">
                  <strong>{existenciaDetalle}</strong>
                  <button type="button" onClick={() => setStockDetalleAbierto(true)}>
                    <Icon name="eye" size={15} /> Ver stock
                  </button>
                </span>
              </p>
              <p>
                <span>Marca</span>
                <strong>{detalle.marca}</strong>
              </p>
              <p>
                <span>Lote</span>
                <strong>{detalle.lote}</strong>
              </p>
              <p>
                <span>Presentación</span>
                <strong>{detalle.unidad}</strong>
              </p>
              <p>
                <span>Vencimiento</span>
                <strong>{detalle.vence || 'Sin vencimiento'}</strong>
              </p>
              <p>
                <span>Fecha de ingreso</span>
                <strong>{detalle.fecha || 'Sin registro'}</strong>
              </p>
              <p className={`stock-lote-estado ${existenciaDetalle > 0 ? 'disponible' : 'sin-stock'}`}>
                <span>Estado de existencias</span>
                <strong>
                  {existenciaDetalle < 0
                    ? 'Stock negativo'
                    : existenciaDetalle === 0
                      ? 'Sin existencias'
                      : 'Disponible'}
                </strong>
              </p>
            </div>
            <footer>
              <button type="button" onClick={() => setDetalle(null)}>
                Cerrar
              </button>
            </footer>
          </section>
          {stockDetalleAbierto && (
            <div
              className="stock-desglose-fondo"
              role="presentation"
              onMouseDown={(event) => {
                event.stopPropagation();
                setStockDetalleAbierto(false);
              }}
            >
              <section
                className="stock-desglose-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="stock-desglose-titulo"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <header>
                  <div>
                    <span>Stock por almacén</span>
                    <h3 id="stock-desglose-titulo">{detalle.nombre}</h3>
                    <small>{detalle.codigo}</small>
                  </div>
                  <button type="button" onClick={() => setStockDetalleAbierto(false)} aria-label="Cerrar stock por almacén">
                    <Icon name="close" size={18} />
                  </button>
                </header>
                <div className="stock-desglose-contenido">
                  <div className="stock-desglose-general">
                    <span>Stock general</span>
                    <strong>{stockPorAlmacen.reduce((total, item) => total + item.cantidad, 0)}</strong>
                    <small>Suma de todas las sucursales y almacenes</small>
                  </div>
                  {stockPorSucursal.map((grupo) => (
                    <section className="stock-desglose-sucursal" key={grupo.nombre}>
                      <header>
                        <div><span>Sucursal</span><strong>{grupo.nombre}</strong></div>
                        <div><span>Total sucursal</span><b>{grupo.total}</b></div>
                      </header>
                      <div className="stock-desglose-head" role="row">
                        <span>Almacén</span><span>Existencia</span><span>Estado</span><span>Lotes</span>
                      </div>
                      {grupo.almacenes.map((item) => (
                        <div className="stock-desglose-fila" role="row" key={`${grupo.nombre}-${item.nombre}`}>
                          <strong>{item.nombre}</strong>
                          <b>{item.cantidad}</b>
                          <span className={item.cantidad > 0 ? 'disponible' : 'sin-stock'}>
                            {item.cantidad < 0 ? 'Stock negativo' : item.cantidad === 0 ? 'Sin existencias' : 'Disponible'}
                          </span>
                          <div className="stock-desglose-lotes">
                            {item.lotes.length ? (
                              <details>
                                <summary aria-label={`Ver lotes de ${item.nombre}, ${grupo.nombre}`}>
                                  <span>Lotes disponibles <em>{item.lotes.length}</em></span>
                                  <Icon name="chevronDown" size={15} />
                                </summary>
                                <ul className="stock-desglose-lotes-lista" aria-label={`Lotes disponibles en ${item.nombre}`}>
                                    {item.lotes.map((lote) => (
                                      <li key={lote.id}>
                                        <div className="stock-desglose-lote-identidad">
                                          <strong>{lote.lote || 'Sin lote'}</strong>
                                          <small>Marca: {lote.marca || 'Sin marca'}</small>
                                        </div>
                                        <div className="stock-desglose-lote-cantidad">
                                          <strong>{lote.disponible.toLocaleString('es-BO')}</strong>
                                          <small>{lote.unidad || 'unidades'}</small>
                                        </div>
                                      </li>
                                    ))}
                                </ul>
                              </details>
                            ) : <small>Sin lotes disponibles</small>}
                          </div>
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
                <footer>
                  <span>{stockPorSucursal.length} {stockPorSucursal.length === 1 ? 'sucursal' : 'sucursales'}</span>
                  <button type="button" onClick={() => setStockDetalleAbierto(false)}>Cerrar</button>
                </footer>
              </section>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
