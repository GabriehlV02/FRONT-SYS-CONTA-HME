import { useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';

type EstadoCuenta = 'Pendiente' | 'Parcial' | 'Vencida' | 'Cerrada';
type FiltroCuenta = 'Todas' | 'Internaciones' | 'Deudas' | 'Cerradas';
type Cuenta = { id: string; paciente: string; documento: string; origen: string; fecha: string; total: number; saldo: number; estado: EstadoCuenta };

const cuentasIniciales: Cuenta[] = [
  { id: 'CTA-1048', paciente: 'María Fernanda Rojas', documento: 'CI 6842159', origen: 'Consulta externa', fecha: '24 Sep 2026', total: 380, saldo: 180, estado: 'Parcial' },
  { id: 'CTA-1047', paciente: 'José Luis Vargas', documento: 'CI 4973621', origen: 'Laboratorio', fecha: '24 Sep 2026', total: 245, saldo: 245, estado: 'Pendiente' },
  { id: 'CTA-1042', paciente: 'Ana Belén Mamani', documento: 'CI 7251846', origen: 'Internación', fecha: '22 Sep 2026', total: 1850, saldo: 740, estado: 'Parcial' },
  { id: 'CTA-1039', paciente: 'Carlos Méndez Flores', documento: 'CI 3918475', origen: 'Imagenología', fecha: '20 Sep 2026', total: 520, saldo: 520, estado: 'Vencida' },
  { id: 'CTA-1035', paciente: 'Sofía Aguilar Soto', documento: 'CI 8124763', origen: 'Procedimiento', fecha: '19 Sep 2026', total: 310, saldo: 310, estado: 'Pendiente' },
  { id: 'CTA-1031', paciente: 'Diego Arce Molina', documento: 'CI 5489326', origen: 'Consulta externa', fecha: '18 Sep 2026', total: 180, saldo: 0, estado: 'Cerrada' },
];
const consumosDemo = [
  { concepto: 'Consulta médica general', fecha: '24 Sep 2026 · 09:30', cantidad: 1, monto: 80 },
  { concepto: 'Hemograma completo', fecha: '24 Sep 2026 · 10:15', cantidad: 1, monto: 50 },
  { concepto: 'Material de curación', fecha: '24 Sep 2026 · 10:45', cantidad: 1, monto: 50 },
];
const moneda = (monto: number) => `Bs ${monto.toFixed(2)}`;

export function CuentasAbiertasView() {
  const [cuentas] = useState(cuentasIniciales);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<FiltroCuenta>('Todas');
  const [cuentaActiva, setCuentaActiva] = useState<Cuenta | null>(null);
  const [modo, setModo] = useState<'cargar' | 'cobrar'>('cargar');
  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase();
    return cuentas.filter((cuenta) => {
      const coincideFiltro = estado === 'Todas' || (estado === 'Internaciones' && cuenta.origen === 'Internación') || (estado === 'Deudas' && cuenta.estado !== 'Cerrada') || (estado === 'Cerradas' && cuenta.estado === 'Cerrada');
      return coincideFiltro && (!termino || `${cuenta.id} ${cuenta.paciente} ${cuenta.documento} ${cuenta.origen}`.toLocaleLowerCase().includes(termino));
    });
  }, [busqueda, cuentas, estado]);

  if (cuentaActiva) return <section className="cuenta-detalle-vista">
    <header className="cuenta-detalle-cabecera"><button type="button" onClick={() => setCuentaActiva(null)}><Icon name="chevronLeft" size={17} /> Volver a cuentas</button><div><p>{cuentaActiva.id}</p><h2>{cuentaActiva.paciente}</h2><small>{cuentaActiva.documento} · {cuentaActiva.origen} · Saldo pendiente: <b>{moneda(cuentaActiva.saldo)}</b></small></div></header>
    <div className="cuenta-detalle-layout">
      <section className="cuenta-consumos"><header><div><p>CONSUMOS REGISTRADOS</p><h3>Detalle de la cuenta</h3></div><strong>{consumosDemo.length} ítems</strong></header><div className="cuenta-consumos-cabecera"><span>Concepto</span><span>Fecha</span><span>Cant.</span><span>Importe</span></div>{consumosDemo.map((consumo) => <article key={consumo.concepto}><strong>{consumo.concepto}</strong><span>{consumo.fecha}</span><span>{consumo.cantidad}</span><b>{moneda(consumo.monto)}</b></article>)}<footer><span>Total registrado</span><strong>{moneda(cuentaActiva.total)}</strong></footer></section>
      <aside className="cuenta-operacion"><div className="cuenta-operacion-tabs" role="tablist" aria-label="Operaciones de cuenta"><button type="button" role="tab" aria-selected={modo === 'cargar'} className={modo === 'cargar' ? 'activo' : ''} onClick={() => setModo('cargar')}><Icon name="plus" size={16} /> Cargar</button><button type="button" role="tab" aria-selected={modo === 'cobrar'} className={modo === 'cobrar' ? 'activo' : ''} onClick={() => setModo('cobrar')}><Icon name="cash" size={16} /> Cobrar</button></div><section className="cuenta-operacion-vacia"><Icon name={modo === 'cargar' ? 'plus' : 'cash'} size={26} /><strong>{modo === 'cargar' ? 'Cargar a la cuenta' : 'Cobrar cuenta'}</strong><small>Esta sección se encuentra vacía por el momento.</small></section></aside>
    </div>
  </section>;

  return <section className="cuentas-abiertas-vista"><section className="cuentas-abiertas-panel">
    <div className="cuentas-abiertas-herramientas"><label><Icon name="search" size={17} /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por paciente, CI o número de cuenta" /></label><button type="button" className="cuentas-nueva"><Icon name="plus" size={16} /> Nueva cuenta</button></div>
    <div className="cuentas-listado" role="table" aria-label="Listado de cuentas abiertas"><div className="cuentas-listado-control"><div className="cuentas-filtros" role="group" aria-label="Filtrar cuentas">{(['Todas', 'Internaciones', 'Deudas', 'Cerradas'] as const).map((item) => <button key={item} type="button" className={estado === item ? 'activo' : ''} onClick={() => setEstado(item)}>{item}</button>)}</div><div className="cuentas-paginacion"><span>{visibles.length} de {cuentas.length} cuentas</span><button type="button" disabled aria-label="Página anterior"><Icon name="chevronLeft" size={15} /></button><b>1</b><button type="button" disabled aria-label="Página siguiente"><Icon name="chevronRight" size={15} /></button></div></div><div className="cuentas-listado-cabecera" role="row"><span>Cuenta</span><span>Paciente</span><span>CI / NIT</span><span>Origen</span><span>Fecha</span><span>Saldo pendiente</span><span>Estado</span><span>Total</span><span>Acciones</span></div>{visibles.map((cuenta) => <article key={cuenta.id} className="cuentas-listado-fila" role="row"><strong>{cuenta.id}</strong><strong>{cuenta.paciente}</strong><span>{cuenta.documento}</span><span>{cuenta.origen}</span><span>{cuenta.fecha}</span><strong className="cuenta-saldo">{moneda(cuenta.saldo)}</strong><span><i className={`cuenta-estado ${cuenta.estado.toLocaleLowerCase()}`}>{cuenta.estado}</i></span><span>{moneda(cuenta.total)}</span><span className="cuenta-acciones"><button type="button" onClick={() => setCuentaActiva(cuenta)}><Icon name="eye" size={15} /> Ver</button></span></article>)}{!visibles.length && <p className="cuentas-vacio">No se encontraron cuentas con esos criterios.</p>}</div>
  </section></section>;
}
