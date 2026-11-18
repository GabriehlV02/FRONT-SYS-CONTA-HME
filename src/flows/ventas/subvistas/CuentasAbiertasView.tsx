import { useEffect, useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import { apiFetch } from '@ui/auth';

type Detalle = { id: string; concepto: string; codigo: string; tipo: string; fecha: string | null; cantidad: number; unidad: string; precio: number; importe: number };
type Cuenta = { id: string; codigo: string; paciente: string; documento: string; origen: string; fecha: string; estado: string; total: number; detalles: Detalle[]; atencionFinalizada: boolean };
type Filtro = 'Todas' | 'Emergencias';
const moneda = (monto: number) => `Bs ${monto.toFixed(2)}`;
const fecha = (valor: string | null) => valor ? new Date(valor).toLocaleString('es-BO') : 'Sin registro';
const normalizar = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

export function CuentasAbiertasView() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('Todas');
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    void apiFetch('/api/v1/cuentas-emergencias', { signal: controller.signal }).then(async (respuesta) => {
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.message || 'No se pudieron cargar las cuentas.');
      if (!Array.isArray(resultado.data)) throw new Error('La respuesta de cuentas no es válida.');
      setCuentas(resultado.data);
      setError('');
    }).catch((causa: unknown) => {
      if (!controller.signal.aborted) {
        setCuentas([]);
        setError(causa instanceof Error ? causa.message : 'No se pudieron cargar las cuentas.');
      }
    }).finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [version]);

  const visibles = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return cuentas.filter((cuenta) => {
      const coincideFiltro = filtro === 'Todas' || cuenta.origen === filtro;
      return coincideFiltro && normalizar(`${cuenta.codigo || cuenta.id} ${cuenta.paciente} ${cuenta.documento} ${cuenta.origen}`).includes(termino);
    });
  }, [busqueda, cuentas, filtro]);
  const cuentaActiva = cuentas.find((cuenta) => cuenta.id === seleccion);

  if (cuentaActiva) return <section className="cuenta-detalle-vista">
    <header className="cuenta-detalle-cabecera"><button type="button" onClick={() => setSeleccion(null)}><Icon name="chevronLeft" size={17} /> Volver a cuentas</button><div><p>{cuentaActiva.codigo || cuentaActiva.id}</p><h2>{cuentaActiva.paciente}</h2><small>{cuentaActiva.documento || 'Sin documento'} · {cuentaActiva.origen} · Total registrado: <b>{moneda(cuentaActiva.total)}</b></small></div></header>
    <div className="cuenta-detalle-layout"><section className="cuenta-consumos"><header><div><p>CONSUMOS REGISTRADOS</p><h3>Detalle de la cuenta</h3></div><strong>{cuentaActiva.detalles.length} ítems</strong></header><div className="cuenta-consumos-cabecera"><span>Concepto</span><span>Fecha</span><span>Cant.</span><span>Importe</span></div>{cuentaActiva.detalles.map((detalle) => <article key={detalle.id}><strong>{detalle.concepto}{detalle.codigo && <small>{detalle.codigo} · {moneda(detalle.precio)} por {detalle.unidad || 'unidad'}</small>}</strong><span>{fecha(detalle.fecha)}</span><span>{detalle.cantidad} {detalle.unidad}</span><b>{moneda(detalle.importe)}</b></article>)}{!cuentaActiva.detalles.length && <p className="cuentas-vacio">Esta cuenta todavía no tiene consumos registrados.</p>}<footer><span>Total registrado</span><strong>{moneda(cuentaActiva.total)}</strong></footer></section><aside className="cuenta-operacion"><h3>Cuenta de emergencias</h3><p>Los consumos se registran desde la atención del paciente.</p><p>El cobro de estas cuentas aún no está conectado.</p></aside></div>
  </section>;

  return <section className="cuentas-abiertas-vista"><section className="cuentas-abiertas-panel">
    <div className="cuentas-abiertas-herramientas"><label><Icon name="search" size={17} /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por paciente, CI o número de cuenta" /></label><button type="button" onClick={() => setVersion((actual) => actual + 1)} disabled={cargando}>Actualizar</button></div>
    {error && <p role="alert">{error}</p>}
    <div className="cuentas-listado" role="table" aria-label="Listado de cuentas abiertas"><div className="cuentas-listado-control"><div className="cuentas-filtros" role="group" aria-label="Filtrar cuentas">{(['Todas', 'Emergencias'] as const).map((item) => <button key={item} type="button" className={filtro === item ? 'activo' : ''} onClick={() => setFiltro(item)}>{item}</button>)}</div><div className="cuentas-paginacion"><span>{visibles.length} de {cuentas.length} cuentas</span></div></div><div className="cuentas-listado-cabecera" role="row"><span>Cuenta</span><span>Paciente</span><span>CI / NIT</span><span>Origen</span><span>Fecha</span><span>Saldo pendiente</span><span>Estado</span><span>Total</span><span>Acciones</span></div>{visibles.map((cuenta) => <article key={cuenta.id} className="cuentas-listado-fila" role="row"><strong>{cuenta.codigo || cuenta.id}</strong><strong>{cuenta.paciente}</strong><span>{cuenta.documento || 'Sin registro'}</span><span>{cuenta.origen}</span><span>{fecha(cuenta.fecha)}</span><span>No disponible</span><span><i className="cuenta-estado pendiente">Abierta</i></span><span>{moneda(cuenta.total)}</span><span className="cuenta-acciones"><button type="button" onClick={() => setSeleccion(cuenta.id)}><Icon name="eye" size={15} /> Ver</button></span></article>)}{!visibles.length && <p className="cuentas-vacio">{cargando ? 'Cargando cuentas…' : error ? 'No se pudieron consultar las cuentas.' : 'No se encontraron cuentas con esos criterios.'}</p>}</div>
  </section></section>;
}
