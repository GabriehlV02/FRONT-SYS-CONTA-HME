import { useEffect, useMemo, useState } from "react";
import Icon from "@ui/components/Icon";
import {
  TraspasosNavegacion,
  type SubvistaTraspasos,
} from "../componentes/MovimientosNavegacion";

type LineaMovimiento = {
  id: string;
  codigo: string;
  producto: string;
  lote: string;
  cantidad: number;
  unidad: string;
};
type Movimiento = {
  id: string;
  fecha: string;
  origen: string;
  destino: string;
  tipo: "Traspaso" | "Devolución";
  estado: "Pendiente de recepción" | "Recibido" | "Recepción con faltantes";
  lineas: LineaMovimiento[];
};
type StockRecepcionado = LineaMovimiento & { movimientoId: string; origen: string; almacen: string; fecha: string; estado: 'recibido' | 'devuelto' };

const almacenes = [
  "Central - Almacén general",
  "Central - Farmacia interna",
  "Sucursal Norte - Almacén de insumos",
  "Sucursal Sur - Almacén clínico",
];
const catalogo = [
  {
    codigo: "MED-001",
    nombre: "Paracetamol 500 mg",
    unidad: "Caja",
    lotes: ["PAR-2406", "PAR-2411"],
  },
  {
    codigo: "MED-014",
    nombre: "Amoxicilina 500 mg",
    unidad: "Caja",
    lotes: ["AMX-2408", "AMX-2410"],
  },
  {
    codigo: "INS-023",
    nombre: "Guantes de nitrilo M",
    unidad: "Caja",
    lotes: ["GNT-2405", "GNT-2412"],
  },
  {
    codigo: "INS-031",
    nombre: "Jeringa descartable 10 ml",
    unidad: "Unidad",
    lotes: ["JER-2409", "JER-2411"],
  },
];
const movimientosIniciales: Movimiento[] = [
  {
    id: "TR-0001",
    fecha: "2026-09-21",
    origen: almacenes[0],
    destino: almacenes[1],
    tipo: "Traspaso",
    estado: "Pendiente de recepción",
    lineas: [
      {
        id: "L-1",
        codigo: "MED-001",
        producto: "Paracetamol 500 mg",
        lote: "PAR-2406",
        cantidad: 12,
        unidad: "Caja",
      },
      {
        id: "L-2",
        codigo: "INS-023",
        producto: "Guantes de nitrilo M",
        lote: "GNT-2405",
        cantidad: 6,
        unidad: "Caja",
      },
    ],
  },
  {
    id: "TR-0002",
    fecha: "2026-09-22",
    origen: almacenes[1],
    destino: almacenes[2],
    tipo: "Traspaso",
    estado: "Pendiente de recepción",
    lineas: [
      { id: "L-3", codigo: "MED-014", producto: "Amoxicilina 500 mg", lote: "AMX-2408", cantidad: 8, unidad: "Caja" },
      { id: "L-4", codigo: "INS-031", producto: "Jeringa descartable 10 ml", lote: "JER-2409", cantidad: 120, unidad: "Unidad" },
    ],
  },
  {
    id: "TR-0003",
    fecha: "2026-09-23",
    origen: almacenes[0],
    destino: almacenes[3],
    tipo: "Traspaso",
    estado: "Pendiente de recepción",
    lineas: [
      { id: "L-5", codigo: "INS-023", producto: "Guantes de nitrilo M", lote: "GNT-2412", cantidad: 15, unidad: "Caja" },
    ],
  },
  {
    id: "TR-0004",
    fecha: "2026-09-20",
    origen: almacenes[2],
    destino: almacenes[0],
    tipo: "Traspaso",
    estado: "Recibido",
    lineas: [
      { id: "L-6", codigo: "MED-001", producto: "Paracetamol 500 mg", lote: "PAR-2411", cantidad: 10, unidad: "Caja" },
    ],
  },
];
const fechaHoy = "2026-09-21";

export function TraspasosView({ activeId }: { activeId?: string }) {
  const resolver = (id?: string): SubvistaTraspasos =>
    id === "traspasos-recepcion"
      ? "recepcion"
      : id === "traspasos-devoluciones"
        ? "devoluciones"
        : id === "traspasos-documentos"
          ? "documentos"
        : "notas-envio";
  const [subvista, setSubvista] = useState<SubvistaTraspasos>(() =>
    resolver(activeId),
  );
  const [movimientos, setMovimientos] =
    useState<Movimiento[]>(movimientosIniciales);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [recepcionActiva, setRecepcionActiva] = useState<Movimiento | null>(null);
  const [estadoLineasRecepcion, setEstadoLineasRecepcion] = useState<Record<string, 'recibido' | 'no-recibido'>>({});
  const [origen, setOrigen] = useState(almacenes[0]);
  const [destino, setDestino] = useState(almacenes[1]);
  const [codigo, setCodigo] = useState("");
  const [lote, setLote] = useState("");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [cantidad, setCantidad] = useState("");
  const [lineas, setLineas] = useState<LineaMovimiento[]>([]);
  const [error, setError] = useState("");
  useEffect(() => setSubvista(resolver(activeId)), [activeId]);
  const producto = useMemo(
    () => catalogo.find((item) => item.codigo === codigo),
    [codigo],
  );
  const resultadosProducto = useMemo(() => {
    const termino = busquedaProducto
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return catalogo.filter((item) =>
      `${item.codigo} ${item.nombre}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(termino),
    );
  }, [busquedaProducto]);
  const pendientes = movimientos.filter(
    (movimiento) =>
      movimiento.tipo === "Traspaso" &&
      movimiento.estado === "Pendiente de recepción",
  );
  const lista =
    subvista === "notas-envio"
      ? movimientos.filter((movimiento) => movimiento.tipo === "Traspaso")
      : subvista === "devoluciones"
        ? movimientos.filter((movimiento) => movimiento.tipo === "Devolución")
        : subvista === "documentos"
          ? movimientos
        : pendientes;
  const esDevolucion = subvista === "devoluciones";
  const mostrarCabecera = Boolean(subvista === "notas-envio" || subvista === "devoluciones");
  const titulo =
    subvista === "notas-envio"
      ? "Notas de envío"
      : subvista === "recepcion"
        ? "Recepción de traspasos"
        : subvista === "documentos"
          ? "Documentos de traspaso"
          : "Devoluciones entre almacenes";

  function abrirFormulario() {
    setOrigen(esDevolucion ? almacenes[1] : almacenes[0]);
    setDestino(esDevolucion ? almacenes[0] : almacenes[1]);
    setCodigo("");
    setLote("");
    setBusquedaProducto("");
    setMostrarOpciones(false);
    setCantidad("");
    setLineas([]);
    setError("");
    setModalAbierto(true);
  }
  function cambiarProducto(nuevoCodigo: string) {
    const nuevo = catalogo.find((item) => item.codigo === nuevoCodigo);
    if (!nuevo) return;
    setCodigo(nuevo.codigo);
    setLote(nuevo.lotes[0]);
    setBusquedaProducto(`${nuevo.codigo} · ${nuevo.nombre}`);
    setMostrarOpciones(false);
    setError("");
  }
  function agregarLinea() {
    if (!producto || !lote) {
      setError("Selecciona un producto de los resultados y su lote.");
      return;
    }
    const valor = Number(cantidad);
    if (!Number.isFinite(valor) || valor <= 0) {
      setError("Ingresa una cantidad válida.");
      return;
    }
    if (
      lineas.some(
        (linea) => linea.codigo === producto.codigo && linea.lote === lote,
      )
    ) {
      setError("Ese producto y lote ya fue agregado.");
      return;
    }
    setLineas((actual) => [
      ...actual,
      {
        id: crypto.randomUUID(),
        codigo: producto.codigo,
        producto: producto.nombre,
        lote,
        cantidad: valor,
        unidad: producto.unidad,
      },
    ]);
    setCodigo("");
    setLote("");
    setBusquedaProducto("");
    setCantidad("");
    setError("");
  }
  function guardar() {
    if (origen === destino) {
      setError("El almacén de origen y destino deben ser distintos.");
      return;
    }
    if (!lineas.length) {
      setError("Agrega al menos un producto al movimiento.");
      return;
    }
    setMovimientos((actual) => [
      {
        id: `${esDevolucion ? "DEV" : "TR"}-${String(actual.length + 1).padStart(4, "0")}`,
        fecha: fechaHoy,
        origen,
        destino,
        tipo: esDevolucion ? "Devolución" : "Traspaso",
        estado: "Pendiente de recepción",
        lineas,
      },
      ...actual,
    ]);
    setModalAbierto(false);
  }
  function recibir(id: string) {
    setMovimientos((actual) =>
      actual.map((movimiento) =>
        movimiento.id === id
          ? { ...movimiento, estado: "Recibido" }
          : movimiento,
      ),
    );
  }
  function abrirRecepcion(movimiento: Movimiento) {
    setRecepcionActiva(movimiento);
    setEstadoLineasRecepcion({});
  }
  function confirmarRecepcion() {
    if (!recepcionActiva || !Object.keys(estadoLineasRecepcion).length) return;
    const ingresos: StockRecepcionado[] = recepcionActiva.lineas
      .filter((linea) => estadoLineasRecepcion[linea.id] === 'recibido')
      .map((linea) => ({ ...linea, movimientoId: recepcionActiva.id, origen: recepcionActiva.origen, almacen: recepcionActiva.destino, fecha: fechaHoy, estado: 'recibido' as const }));
    const devoluciones: StockRecepcionado[] = recepcionActiva.lineas
      .filter((linea) => estadoLineasRecepcion[linea.id] === 'no-recibido')
      .map((linea) => ({ ...linea, movimientoId: `${recepcionActiva.id}-DEV`, origen: recepcionActiva.destino, almacen: recepcionActiva.origen, fecha: fechaHoy, estado: 'devuelto' as const }));
    try {
      const anteriores = JSON.parse(localStorage.getItem('contable-stock-recepciones') || '[]');
      localStorage.setItem('contable-stock-recepciones', JSON.stringify([...anteriores, ...ingresos, ...devoluciones]));
      window.dispatchEvent(new Event('contable-stock-actualizado'));
    } catch { /* La recepción continúa aunque el navegador no permita almacenamiento local. */ }
    const todoRecibido = ingresos.length === recepcionActiva.lineas.length;
    setMovimientos((actual) => actual.map((movimiento) => movimiento.id === recepcionActiva.id ? { ...movimiento, estado: todoRecibido ? 'Recibido' : 'Recepción con faltantes' } : movimiento));
    setRecepcionActiva(null);
    setEstadoLineasRecepcion({});
  }
  const dividirUbicacion = (ubicacion: string) => {
    const [sucursal, ...almacen] = ubicacion.split(' - ');
    return { sucursal, almacen: almacen.join(' - ') || ubicacion };
  };

  return (
    <>
      <TraspasosNavegacion activa={subvista} onSeleccionar={setSubvista} />
      <div className="movimientos-contenido traspasos-contenido">
        {mostrarCabecera && <header className="traspasos-cabecera">
          <div>
            <h2>{titulo}</h2>
            <p>
              {subvista === "recepcion"
                ? "Confirma únicamente los traspasos que ya llegaron al almacén destino."
                : esDevolucion
                  ? "Registra medicamentos o insumos devueltos entre almacenes."
                  : "Registra y consulta los productos enviados entre almacenes."}
            </p>
          </div>
          {subvista !== "recepcion" && (
            <button
              className="traspasos-nuevo"
              type="button"
              onClick={abrirFormulario}
            >
              <Icon name="plus" size={17} />{" "}
              {esDevolucion ? "Registrar devolución" : "Nuevo traspaso"}
            </button>
          )}
        </header>}
        <div className="traspasos-tabla" role="table" aria-label={titulo}>
          <div className="traspasos-fila traspasos-head" role="row">
            <span>Fecha</span>
            <span>Documento</span>
            <span>Productos</span>
            <span>Origen</span>
            <span>Destino</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {lista.length === 0 ? (
            <p className="traspasos-vacio">No hay registros para mostrar.</p>
          ) : (
            lista.map((movimiento) => (
              <article
                className="traspasos-fila"
                role="row"
                key={movimiento.id}
              >
                <span>{movimiento.fecha}</span>
                <strong>
                  {movimiento.id}
                  <small>{movimiento.tipo}</small>
                </strong>
                <span>
                  {movimiento.lineas.length}{" "}
                  {movimiento.lineas.length === 1 ? "producto" : "productos"}
                  <small>
                    {movimiento.lineas
                      .map((linea) => `${linea.codigo} · ${linea.lote}`)
                      .join(" · ")}
                  </small>
                </span>
                <span>{movimiento.origen}</span>
                <span>{movimiento.destino}</span>
                <span
                  className={`traspasos-estado ${movimiento.estado === "Recibido" ? "recibido" : ""}`}
                >
                  {movimiento.estado}
                </span>
                <div>
                  {subvista === "recepcion" ? (
                    <button
                      className="traspasos-confirmar"
                      type="button"
                      onClick={() => abrirRecepcion(movimiento)}
                    >
                      <Icon name="check" size={15} /> Confirmar llegada
                    </button>
                  ) : (
                    <button className="traspasos-ver" type="button">
                      Ver detalle
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
      {recepcionActiva && <div className="traspasos-modal-fondo" role="presentation" onMouseDown={() => setRecepcionActiva(null)}>
        <section className="traspasos-modal traspasos-recepcion-modal" role="dialog" aria-modal="true" aria-labelledby="recepcion-titulo" onMouseDown={(event) => event.stopPropagation()}>
          <header><div><span>RECEPCIÓN DE STOCK</span><h2 id="recepcion-titulo">Verificar envío {recepcionActiva.id}</h2></div><button type="button" aria-label="Cerrar recepción" onClick={() => setRecepcionActiva(null)}><Icon name="close" size={18} /></button></header>
          <div className="recepcion-ubicaciones">
            <section><small>ORIGEN</small><strong>{dividirUbicacion(recepcionActiva.origen).sucursal}</strong><span>{dividirUbicacion(recepcionActiva.origen).almacen}</span></section>
            <Icon name="arrowRight" size={19} />
            <section><small>DESTINO · RECEPCIÓN</small><strong>{dividirUbicacion(recepcionActiva.destino).sucursal}</strong><span>{dividirUbicacion(recepcionActiva.destino).almacen}</span></section>
          </div>
          <div className="recepcion-tabla" role="table" aria-label="Artículos enviados">
            <div className="recepcion-tabla-fila recepcion-tabla-head" role="row"><span>Código</span><span>Nombre</span><span>Tipo</span><span>Cantidad</span><span>Marca</span><span>Recepción</span></div>
            {recepcionActiva.lineas.map((linea) => {
              const productoLinea = catalogo.find((producto) => producto.codigo === linea.codigo);
              const estadoLinea = estadoLineasRecepcion[linea.id];
              return <div className="recepcion-tabla-fila" key={linea.id}><span>{linea.codigo}</span><strong>{linea.producto}<small>Lote: {linea.lote}</small></strong><span>{linea.unidad === 'Unidad' ? 'Insumo' : 'Producto'}</span><b>{linea.cantidad} {linea.unidad}</b><span>{productoLinea?.nombre.includes('Guantes') ? 'SafeTouch' : productoLinea?.nombre.includes('Jeringa') ? 'BolMed' : 'MediCare'}</span><div className="recepcion-decision"><label className={estadoLinea === 'no-recibido' ? 'activo no-recibido' : ''}><input type="checkbox" checked={estadoLinea === 'no-recibido'} onChange={(event) => setEstadoLineasRecepcion((actual) => { const siguiente = { ...actual }; if (event.target.checked) siguiente[linea.id] = 'no-recibido'; else delete siguiente[linea.id]; return siguiente; })} /><span>No recibido</span></label><label className={estadoLinea === 'recibido' ? 'activo recibido' : ''}><input type="checkbox" checked={estadoLinea === 'recibido'} onChange={(event) => setEstadoLineasRecepcion((actual) => { const siguiente = { ...actual }; if (event.target.checked) siguiente[linea.id] = 'recibido'; else delete siguiente[linea.id]; return siguiente; })} /><span>Recibido</span></label></div></div>;
            })}
          </div>
          <footer><small>{Object.values(estadoLineasRecepcion).filter((estado) => estado === 'recibido').length} recibidos · {Object.values(estadoLineasRecepcion).filter((estado) => estado === 'no-recibido').length} no recibidos. Los no recibidos se devolverán al stock de origen.</small><span><button className="traspasos-cancelar" type="button" onClick={() => setRecepcionActiva(null)}>Cancelar</button><button className="traspasos-guardar" type="button" disabled={!Object.keys(estadoLineasRecepcion).length} onClick={confirmarRecepcion}><Icon name="check" size={16} /> Finalizar recepción</button></span></footer>
        </section>
      </div>}
      {modalAbierto && (
        <div
          className="traspasos-modal-fondo"
          role="presentation"
          onMouseDown={() => setModalAbierto(false)}
        >
          <section
            className="traspasos-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="traspasos-modal-titulo"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>
                  {esDevolucion ? "Nueva devolución" : "Nueva nota de envío"}
                </span>
                <h2 id="traspasos-modal-titulo">
                  {esDevolucion ? "Registrar devolución" : "Registrar traspaso"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setModalAbierto(false)}
              >
                <Icon name="close" size={18} />
              </button>
            </header>
            <div className="traspasos-modal-cuerpo">
              <label>
                Almacén de origen
                <select
                  value={origen}
                  onChange={(event) => setOrigen(event.target.value)}
                >
                  {almacenes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                Almacén de destino
                <select
                  value={destino}
                  onChange={(event) => setDestino(event.target.value)}
                >
                  {almacenes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <h3>Productos del movimiento</h3>
              <div className="traspasos-producto-form">
                <div className="traspasos-buscador-producto">
                  <label htmlFor="traspasos-busqueda-producto">Código o producto</label>
                  <div className="traspasos-buscador-entrada">
                    <Icon name="search" size={16} />
                    <input
                      id="traspasos-busqueda-producto"
                      type="text"
                      value={busquedaProducto}
                      autoComplete="off"
                      placeholder="Buscar por código o nombre"
                      role="combobox"
                      aria-expanded={mostrarOpciones}
                      aria-controls="traspasos-productos-resultados"
                      onFocus={() => setMostrarOpciones(true)}
                      onChange={(event) => {
                        setBusquedaProducto(event.target.value);
                        setCodigo('');
                        setLote('');
                        setMostrarOpciones(true);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setMostrarOpciones(false);
                        if (event.key === 'Enter' && mostrarOpciones && resultadosProducto.length) {
                          event.preventDefault();
                          cambiarProducto(resultadosProducto[0].codigo);
                        }
                      }}
                    />
                  </div>
                  {mostrarOpciones && (
                    <div id="traspasos-productos-resultados" className="traspasos-buscador-opciones" role="listbox">
                      {resultadosProducto.length ? resultadosProducto.map((item) => (
                        <button key={item.codigo} type="button" role="option" aria-selected={codigo === item.codigo} onClick={() => cambiarProducto(item.codigo)}>
                          <strong>{item.codigo}</strong><span>{item.nombre}</span>
                        </button>
                      )) : <p>No se encontraron productos.</p>}
                    </div>
                  )}
                </div>
                <label>
                  Lote
                  <select
                    value={lote}
                    onChange={(event) => setLote(event.target.value)}
                  >
                    <option value="" disabled>Seleccionar lote</option>
                    {(producto?.lotes ?? []).map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(event) => setCantidad(event.target.value)}
                    placeholder={producto ? `En ${producto.unidad}` : 'Cantidad'}
                  />
                </label>
                <button type="button" onClick={agregarLinea}>
                  <Icon name="plus" size={16} /> Agregar
                </button>
              </div>
              {error && <p className="traspasos-error">{error}</p>}
              <div className="traspasos-lineas">
                {lineas.length === 0 ? (
                  <p>Agrega uno o varios productos al movimiento.</p>
                ) : (
                  lineas.map((linea) => (
                    <article key={linea.id}>
                      <strong>
                        {linea.codigo} · {linea.producto}
                      </strong>
                      <span>
                        Lote {linea.lote} · {linea.cantidad} {linea.unidad}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setLineas((actual) =>
                            actual.filter((item) => item.id !== linea.id),
                          )
                        }
                      >
                        Quitar
                      </button>
                    </article>
                  ))
                )}
              </div>
            </div>
            <footer>
              <button
                type="button"
                className="traspasos-cancelar"
                onClick={() => setModalAbierto(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="traspasos-guardar"
                onClick={guardar}
              >
                Guardar movimiento
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
