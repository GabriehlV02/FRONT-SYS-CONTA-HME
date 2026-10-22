import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Icon from '@ui/components/Icon';
import type { IconName } from '@ui/components/Icon';
import { BotonSubvista } from '@ui/components/BotonSubvista';
import { HorizontalSubvistaNav } from '@ui/components/HorizontalSubvistaNav';
import './ConfiguracionView.css';
import { apiFetch } from '@ui/auth';

type SubvistaConfiguracion = 'contable' | 'general' | 'usuario';
type TipoItem = 'Productos' | 'Insumos' | 'Servicios';
type Sucursal = { id: number; nombre: string; direccion: string; estado: 'Activa' | 'Inactiva' };
type Almacen = { id: number; nombre: string; codigo: string; sucursalId: number; tiposItem: TipoItem[]; estado: 'Activo' | 'Inactivo' };
type Caja = { id: number; nombre: string; codigo: string; sucursalId: number; almacenIds: number[]; tiposItem: TipoItem[]; estado: 'Activa' | 'Inactiva' };
type Dispositivo = { id: number; nombre: string; codigo: string; tipo: string; sucursalId: number; area: string; uso: 'Institucional' | 'Personal'; vinculadoA: string; estado: 'Activo' | 'Inactivo' };
type UsuarioSistema = { id: number; nombre: string; usuario: string };
type Vendedor = { id: number; codigo: string; usuarioId: number; sucursalId: number; cajaIds: number[]; estado: 'Activo' | 'Inactivo' };
const tiposItem: TipoItem[] = ['Productos', 'Insumos', 'Servicios'];

const subvistas: { id: SubvistaConfiguracion; nombre: string; icono: IconName; descripcion: string }[] = [
  { id: 'contable', nombre: 'Configuración contable', icono: 'cash', descripcion: 'Cajas y parámetros operativos de contabilidad.' },
  { id: 'general', nombre: 'Configuración general', icono: 'building', descripcion: 'Sucursales, almacenes y datos generales.' },
  { id: 'usuario', nombre: 'Configuración usuario', icono: 'users', descripcion: 'Usuarios habilitados y permisos operativos.' },
];

const cajasIniciales: Caja[] = [
  { id: 1, nombre: 'Caja Recepción', codigo: 'CAJ-001', sucursalId: 1, almacenIds: [1], tiposItem: ['Productos', 'Insumos'], estado: 'Activa' },
  { id: 2, nombre: 'Caja Farmacia', codigo: 'CAJ-002', sucursalId: 1, almacenIds: [2], tiposItem: ['Productos', 'Insumos'], estado: 'Activa' },
];
const usuariosSistema: UsuarioSistema[] = [
  { id: 1, nombre: 'Administrador', usuario: 'admin' },
  { id: 2, nombre: 'Operador contable', usuario: 'operador' },
];
const vendedoresIniciales: Vendedor[] = [
  { id: 1, codigo: 'VEN-001', usuarioId: 2, sucursalId: 1, cajaIds: [1, 2], estado: 'Activo' },
];

function detectarDispositivoActual() {
  if (typeof navigator === 'undefined') return { nombre: 'Equipo actual', tipo: 'Equipo de escritorio' };
  const agente = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(agente)) return { nombre: 'Tableta actual', tipo: 'Tableta' };
  if (/mobi|android|iphone|ipod/.test(agente)) return { nombre: 'Teléfono móvil actual', tipo: 'Teléfono móvil' };
  if (/macintosh|mac os/.test(agente)) return { nombre: 'Equipo Mac actual', tipo: 'Computadora' };
  if (/windows/.test(agente)) return { nombre: 'Equipo Windows actual', tipo: 'Computadora' };
  return { nombre: 'Equipo actual', tipo: 'Computadora' };
}

async function registrarConfiguracion<T>(recurso: string, datos: object): Promise<T> {
  const respuesta = await apiFetch(`/api/v1/configuracion/${recurso}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
  const resultado = await respuesta.json();
  if (!respuesta.ok) throw new Error(resultado.errors ? Object.values(resultado.errors).flat().join(' ') : resultado.message || 'No se pudo guardar el registro.');
  return resultado.data as T;
}

export function ConfiguracionView({ inicial = 'contable', usuarioSesion = 'Usuario actual', administraCatalogo = false }: { inicial?: SubvistaConfiguracion; usuarioSesion?: string; administraCatalogo?: boolean }) {
  const [subvista, setSubvista] = useState<SubvistaConfiguracion>(inicial);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [cajas, setCajas] = useState(cajasIniciales);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [vendedores, setVendedores] = useState(vendedoresIniciales);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setError('');
    void apiFetch('/api/v1/configuracion/general', { signal: controller.signal }).then(async respuesta => {
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.message || 'No se pudo cargar la configuración general.');
      if (!controller.signal.aborted) {
        setSucursales(resultado.data.sucursales); setAlmacenes(resultado.data.almacenes); setDispositivos(resultado.data.dispositivos);
      }
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'No se pudo cargar la configuración general.'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [revision]);

  return <section className="configuracion-vista">
    <HorizontalSubvistaNav className="configuracion-subvistas" ariaLabel="Opciones de configuración">
      {subvistas.map((item) => <BotonSubvista key={item.id} nombre={item.nombre} icono={item.icono} activa={subvista === item.id} onSeleccionar={() => setSubvista(item.id)} claseIcono="configuracion-subvista-icono" />)}
    </HorizontalSubvistaNav>
    {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => setRevision(actual => actual + 1)}>Volver a cargar</button></div>}
    {cargando && <p role="status">Cargando configuración general…</p>}
    {subvista === 'contable' && <Cajas sucursales={sucursales} almacenes={almacenes} cajas={cajas} onCrear={(item) => setCajas((actual) => [...actual, item])} />}
    {subvista === 'general' && <AlmacenesSucursales puedeGestionar={administraCatalogo} sucursales={sucursales} almacenes={almacenes} dispositivos={dispositivos} usuarioSesion={usuarioSesion} cargando={cargando} onSucursal={async (item) => { const creado = await registrarConfiguracion<Sucursal>("sucursales", item); setSucursales(actual => [...actual, creado]); }} onAlmacen={async (item) => { const creado = await registrarConfiguracion<Almacen>("almacenes", item); setAlmacenes(actual => [...actual, creado]); }} onDispositivo={async (item) => { const creado = await registrarConfiguracion<Dispositivo>("dispositivos", item); setDispositivos(actual => [...actual, creado]); }} />}
    {subvista === 'usuario' && <Vendedores sucursales={sucursales} almacenes={almacenes} cajas={cajas} vendedores={vendedores} onCrear={(item) => setVendedores((actual) => [...actual, item])} />}
  </section>;
}

function AlmacenesSucursales({ puedeGestionar, cargando, sucursales, almacenes, dispositivos, usuarioSesion, onSucursal, onAlmacen, onDispositivo }: { puedeGestionar: boolean; sucursales: Sucursal[]; almacenes: Almacen[]; dispositivos: Dispositivo[]; usuarioSesion: string; cargando: boolean; onSucursal: (item: { nombre: string; direccion: string }) => Promise<void>; onAlmacen: (item: { nombre: string; codigo: string; sucursalId: number; tiposItem: TipoItem[] }) => Promise<void>; onDispositivo: (item: { nombre: string; codigo: string; tipo: string; sucursalId: number; area: string; uso: string }) => Promise<void> }) {
  const [buscar, setBuscar] = useState('');
  const [modal, setModal] = useState<'sucursal' | 'almacen' | 'dispositivo' | null>(null);
  const [sucursalForm, setSucursalForm] = useState({ nombre: '', direccion: '' });
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [almacenForm, setAlmacenForm] = useState({ nombre: '', codigo: '', sucursalId: String(sucursales.find(s => s.estado === 'Activa')?.id || ''), tiposItem: [] as TipoItem[] });
  const [buscarDispositivo, setBuscarDispositivo] = useState('');
  const sugerenciaDispositivo = detectarDispositivoActual();
  const formularioDispositivoInicial = (): { nombre: string; codigo: string; tipo: string; sucursalId: string; area: string; uso: 'Institucional' | 'Personal' } => ({ nombre: sugerenciaDispositivo.nombre, codigo: '', tipo: sugerenciaDispositivo.tipo, sucursalId: String(sucursales.find(s => s.estado === 'Activa')?.id || ''), area: '', uso: 'Institucional' });
  const [dispositivoForm, setDispositivoForm] = useState(formularioDispositivoInicial);
  const texto = buscar.toLowerCase();
  const sucursalesVisibles = sucursales.filter((item) => `${item.nombre} ${item.direccion}`.toLowerCase().includes(texto));
  const almacenesVisibles = almacenes.filter((item) => `${item.nombre} ${item.codigo} ${sucursales.find((s) => s.id === item.sucursalId)?.nombre || ''}`.toLowerCase().includes(texto));
  const dispositivosVisibles = dispositivos.filter((item) => `${item.nombre} ${item.codigo} ${item.tipo} ${item.area} ${item.uso} ${item.vinculadoA} ${sucursales.find((s) => s.id === item.sucursalId)?.nombre || ''}`.toLowerCase().includes(buscarDispositivo.toLowerCase()));
  const guardarSucursal = async (event: FormEvent) => {
    event.preventDefault(); if (guardando) return; setGuardando(true); setErrorFormulario('');
    try { await onSucursal({ nombre: sucursalForm.nombre.trim(), direccion: sucursalForm.direccion.trim() }); setSucursalForm({ nombre: '', direccion: '' }); setModal(null); }
    catch (error) { setErrorFormulario(error instanceof Error ? error.message : 'No se pudo guardar la sucursal.'); }
    finally { setGuardando(false); }
  };
  const guardarAlmacen = async (event: FormEvent) => {
    event.preventDefault(); if (guardando) return; setGuardando(true); setErrorFormulario('');
    try { await onAlmacen({ nombre: almacenForm.nombre.trim(), codigo: almacenForm.codigo.trim().toUpperCase(), sucursalId: Number(almacenForm.sucursalId), tiposItem: almacenForm.tiposItem }); setAlmacenForm({ nombre: '', codigo: '', sucursalId: String(sucursales.find(s => s.estado === 'Activa')?.id || ''), tiposItem: [] }); setModal(null); }
    catch (error) { setErrorFormulario(error instanceof Error ? error.message : 'No se pudo guardar el almacén.'); }
    finally { setGuardando(false); }
  };
  const abrirRegistroDispositivo = () => { setDispositivoForm(formularioDispositivoInicial()); setModal('dispositivo'); };
  const guardarDispositivo = async (event: FormEvent) => {
    event.preventDefault(); if (guardando) return; setGuardando(true); setErrorFormulario('');
    try { await onDispositivo({ nombre: dispositivoForm.nombre.trim(), codigo: dispositivoForm.codigo.trim().toUpperCase(), tipo: dispositivoForm.tipo.trim(), sucursalId: Number(dispositivoForm.sucursalId), area: dispositivoForm.area.trim(), uso: dispositivoForm.uso }); setDispositivoForm(formularioDispositivoInicial()); setModal(null); }
    catch (error) { setErrorFormulario(error instanceof Error ? error.message : 'No se pudo guardar el dispositivo.'); }
    finally { setGuardando(false); }
  };

  return <div className="configuracion-operativa">
    <div className="configuracion-barra"><label><Icon name="search" size={17} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Buscar sucursal, almacén o código" /></label><span>{sucursalesVisibles.length + almacenesVisibles.length} registros</span><button type="button" disabled={!puedeGestionar || cargando || guardando} onClick={() => { setErrorFormulario(''); setModal('sucursal'); }}><Icon name="plus" size={16} /> Nueva sucursal</button><button type="button" disabled={!puedeGestionar || cargando || guardando || !sucursales.some(s => s.estado === 'Activa')} onClick={() => { setErrorFormulario(''); setAlmacenForm(actual => ({ ...actual, sucursalId: actual.sucursalId || String(sucursales.find(s => s.estado === 'Activa')?.id || '') })); setModal('almacen'); }}><Icon name="plus" size={16} /> Nuevo almacén</button></div>
    <section className="configuracion-bloque"><header><div><h2>Sucursales</h2><small>Sedes donde operan almacenes y cajas.</small></div><b>{sucursalesVisibles.length}</b></header><div className="configuracion-tabla configuracion-sucursales-tabla"><div className="configuracion-tabla-head"><span>N°</span><span>Sucursal</span><span>Dirección</span><span>Almacenes</span><span>Estado</span></div>{sucursalesVisibles.map((item, indice) => <article key={item.id}><span>{indice + 1}</span><strong>{item.nombre}</strong><span>{item.direccion}</span><span>{almacenes.filter((almacen) => almacen.sucursalId === item.id).length}</span><span><i>{item.estado}</i></span></article>)}</div></section>
    <section className="configuracion-bloque"><header><div><h2>Almacenes</h2><small>Cada almacén define qué tipos de ítems puede manejar.</small></div><b>{almacenesVisibles.length}</b></header><div className="configuracion-tabla configuracion-almacenes-tabla"><div className="configuracion-tabla-head"><span>N°</span><span>Código</span><span>Almacén</span><span>Sucursal</span><span>Tipos de ítems</span><span>Estado</span></div>{almacenesVisibles.map((item, indice) => <article key={item.id}><span>{indice + 1}</span><strong>{item.codigo}</strong><span>{item.nombre}</span><span>{sucursales.find((sucursal) => sucursal.id === item.sucursalId)?.nombre}</span><span className="configuracion-etiquetas">{item.tiposItem.map((tipo) => <i key={tipo}>{tipo}</i>)}</span><span><i>{item.estado}</i></span></article>)}</div></section>
    <section className="configuracion-bloque configuracion-dispositivos"><header><div><h2>Dispositivos</h2><small>Equipos, móviles y periféricos habilitados para operar.</small></div><b>{dispositivosVisibles.length}</b></header><div className="configuracion-dispositivos-barra"><label><Icon name="search" size={17} /><input value={buscarDispositivo} onChange={(event) => setBuscarDispositivo(event.target.value)} placeholder="Buscar dispositivo, área, usuario o código" /></label><button className="configuracion-dispositivos-accion" type="button" disabled={!puedeGestionar || cargando || guardando || !sucursales.some(s => s.estado === 'Activa')} onClick={() => { setErrorFormulario(''); abrirRegistroDispositivo(); }}><span className="configuracion-dispositivos-accion-icono"><Icon name="plus" size={16} /></span><span>Registrar nuevo dispositivo</span></button></div><div className="configuracion-tabla configuracion-dispositivos-tabla"><div className="configuracion-tabla-head"><span>N°</span><span>Código</span><span>Dispositivo</span><span>Área / uso</span><span>Vinculado a</span><span>Estado</span></div>{dispositivosVisibles.map((item, indice) => <article key={item.id}><span>{indice + 1}</span><strong>{item.codigo}</strong><span><b>{item.nombre}</b><small>{item.tipo}</small></span><span><b>{item.area}</b><small>{item.uso}</small></span><span>{item.vinculadoA}</span><span><i>{item.estado}</i></span></article>)}{!dispositivosVisibles.length && <p className="configuracion-dispositivos-vacio">No hay dispositivos que coincidan con la búsqueda.</p>}</div></section>
    {modal === 'sucursal' && <Modal titulo="Nueva sucursal" onCerrar={() => setModal(null)}><form onSubmit={guardarSucursal}>{errorFormulario && <p role="alert">{errorFormulario}</p>}<div className="configuracion-modal-campos"><label>Nombre<input required value={sucursalForm.nombre} onChange={(event) => setSucursalForm({ ...sucursalForm, nombre: event.target.value })} /></label><label>Dirección<input required value={sucursalForm.direccion} onChange={(event) => setSucursalForm({ ...sucursalForm, direccion: event.target.value })} /></label></div><footer><button type="button" onClick={() => setModal(null)}>Cancelar</button><button type="submit" disabled={guardando}>Guardar sucursal</button></footer></form></Modal>}
    {modal === 'almacen' && <Modal titulo="Nuevo almacén" onCerrar={() => setModal(null)}><form onSubmit={guardarAlmacen}>{errorFormulario && <p role="alert">{errorFormulario}</p>}<div className="configuracion-modal-campos"><label>Nombre<input required value={almacenForm.nombre} onChange={(event) => setAlmacenForm({ ...almacenForm, nombre: event.target.value })} /></label><label>Código<input required value={almacenForm.codigo} onChange={(event) => setAlmacenForm({ ...almacenForm, codigo: event.target.value })} /></label><label className="campo-completo">Sucursal<select required value={almacenForm.sucursalId} onChange={(event) => setAlmacenForm({ ...almacenForm, sucursalId: event.target.value })}>{sucursales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label><fieldset className="campo-completo"><legend>Tipos de ítems permitidos</legend>{tiposItem.map((tipo) => <label key={tipo}><input type="checkbox" checked={almacenForm.tiposItem.includes(tipo)} onChange={() => setAlmacenForm({ ...almacenForm, tiposItem: almacenForm.tiposItem.includes(tipo) ? almacenForm.tiposItem.filter((item) => item !== tipo) : [...almacenForm.tiposItem, tipo] })} /> {tipo}</label>)}</fieldset></div><footer><button type="button" onClick={() => setModal(null)}>Cancelar</button><button type="submit" disabled={guardando}>Guardar almacén</button></footer></form></Modal>}
    {modal === 'dispositivo' && <Modal titulo="Registrar nuevo dispositivo" onCerrar={() => setModal(null)}><form onSubmit={guardarDispositivo}>{errorFormulario && <p role="alert">{errorFormulario}</p>}<div className="configuracion-modal-campos"><label>Nombre del dispositivo<input required value={dispositivoForm.nombre} onChange={(event) => setDispositivoForm({ ...dispositivoForm, nombre: event.target.value })} /><small className="configuracion-ayuda">Sugerido según el equipo actual. Puedes cambiarlo, por ejemplo: DESKTOP-Q63EP6K.</small></label><label>Código<input required value={dispositivoForm.codigo} onChange={(event) => setDispositivoForm({ ...dispositivoForm, codigo: event.target.value })} placeholder="Ej. DIS-003" /></label><label>Tipo de dispositivo<input required value={dispositivoForm.tipo} onChange={(event) => setDispositivoForm({ ...dispositivoForm, tipo: event.target.value })} placeholder="Ej. Computadora, teléfono móvil o cámara" /></label><label>Área asignada<input value={dispositivoForm.area} onChange={(event) => setDispositivoForm({ ...dispositivoForm, area: event.target.value })} placeholder="Ej. Consultorio 1" /></label><label>Uso<select value={dispositivoForm.uso} onChange={(event) => setDispositivoForm({ ...dispositivoForm, uso: event.target.value as 'Institucional' | 'Personal' })}><option>Institucional</option><option>Personal</option></select></label><label>Sucursal<select required value={dispositivoForm.sucursalId} onChange={(event) => setDispositivoForm({ ...dispositivoForm, sucursalId: event.target.value })}>{sucursales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label><p className="configuracion-dispositivo-sesion campo-completo">Este dispositivo quedará vinculado a la sesión de <strong>{usuarioSesion}</strong>.</p></div><footer><button type="button" onClick={() => setModal(null)}>Cancelar</button><button type="submit" disabled={guardando}>Guardar dispositivo</button></footer></form></Modal>}
  </div>;
}

function Cajas({ sucursales, almacenes, cajas, onCrear }: { sucursales: Sucursal[]; almacenes: Almacen[]; cajas: Caja[]; onCrear: (item: Caja) => void }) {
  const [buscar, setBuscar] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ nombre: '', codigo: '', sucursalId: String(sucursales.find(s => s.estado === 'Activa')?.id || ''), almacenIds: [] as number[], tiposItem: [] as TipoItem[] });
  const disponibles = almacenes.filter((item) => item.sucursalId === Number(form.sucursalId));
  const tiposPermitidos = tiposItem.filter((tipo) => almacenes.some((almacen) => form.almacenIds.includes(almacen.id) && almacen.tiposItem.includes(tipo)));
  const visibles = useMemo(() => cajas.filter((item) => `${item.nombre} ${item.codigo} ${sucursales.find((s) => s.id === item.sucursalId)?.nombre || ''}`.toLowerCase().includes(buscar.toLowerCase())), [buscar, cajas, sucursales]);
  const guardar = (event: FormEvent) => { event.preventDefault(); if (!form.nombre.trim() || !form.codigo.trim() || !form.sucursalId || !form.almacenIds.length || !form.tiposItem.length) return; onCrear({ id: Date.now(), nombre: form.nombre.trim(), codigo: form.codigo.trim().toUpperCase(), sucursalId: Number(form.sucursalId), almacenIds: form.almacenIds, tiposItem: form.tiposItem, estado: 'Activa' }); setForm({ nombre: '', codigo: '', sucursalId: String(sucursales.find(s => s.estado === 'Activa')?.id || ''), almacenIds: [], tiposItem: [] }); setAbierto(false); };
  const cambiarSucursal = (valor: string) => setForm({ ...form, sucursalId: valor, almacenIds: [], tiposItem: [] });
  const cambiarAlmacen = (id: number) => { const almacenIds = form.almacenIds.includes(id) ? form.almacenIds.filter((item) => item !== id) : [...form.almacenIds, id]; const permitidos = tiposItem.filter((tipo) => almacenes.some((almacen) => almacenIds.includes(almacen.id) && almacen.tiposItem.includes(tipo))); setForm({ ...form, almacenIds, tiposItem: form.tiposItem.filter((tipo) => permitidos.includes(tipo)) }); };

  return <div className="configuracion-operativa"><div className="configuracion-barra"><label><Icon name="search" size={17} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Buscar caja, código o sucursal" /></label><span>{visibles.length} cajas</span><button type="button" onClick={() => setAbierto(true)}><Icon name="plus" size={16} /> Nueva caja</button></div><section className="configuracion-bloque"><header><div><h2>Cajas</h2><small>Los tipos de ítems de cada caja están limitados por sus almacenes.</small></div><b>{visibles.length}</b></header><div className="configuracion-tabla configuracion-cajas-tabla"><div className="configuracion-tabla-head"><span>N°</span><span>Código</span><span>Caja</span><span>Sucursal</span><span>Almacenes asociados</span><span>Tipos de ítems</span><span>Estado</span></div>{visibles.map((item, indice) => <article key={item.id}><span>{indice + 1}</span><strong>{item.codigo}</strong><span>{item.nombre}</span><span>{sucursales.find((sucursal) => sucursal.id === item.sucursalId)?.nombre}</span><span className="configuracion-etiquetas">{item.almacenIds.map((id) => <i key={id}>{almacenes.find((almacen) => almacen.id === id)?.nombre}</i>)}</span><span className="configuracion-etiquetas">{item.tiposItem.map((tipo) => <i key={tipo}>{tipo}</i>)}</span><span><i>{item.estado}</i></span></article>)}</div></section>
    {abierto && <Modal titulo="Nueva caja" onCerrar={() => setAbierto(false)}><form onSubmit={guardar}><div className="configuracion-modal-campos"><label>Nombre<input required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} /></label><label>Código<input required value={form.codigo} onChange={(event) => setForm({ ...form, codigo: event.target.value })} /></label><label className="campo-completo">Sucursal<select required value={form.sucursalId} onChange={(event) => cambiarSucursal(event.target.value)}>{sucursales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label><fieldset className="campo-completo"><legend>Almacenes relacionados</legend>{disponibles.map((item) => <label key={item.id}><input type="checkbox" checked={form.almacenIds.includes(item.id)} onChange={() => cambiarAlmacen(item.id)} /> {item.nombre} <small>({item.tiposItem.join(', ')})</small></label>)}{!disponibles.length && <small>No hay almacenes registrados en esta sucursal.</small>}</fieldset><fieldset className="campo-completo"><legend>Tipos de ítems habilitados en la caja</legend>{tiposPermitidos.map((tipo) => <label key={tipo}><input type="checkbox" checked={form.tiposItem.includes(tipo)} onChange={() => setForm({ ...form, tiposItem: form.tiposItem.includes(tipo) ? form.tiposItem.filter((item) => item !== tipo) : [...form.tiposItem, tipo] })} /> {tipo}</label>)}{!form.almacenIds.length && <small>Selecciona al menos un almacén para habilitar tipos de ítems.</small>}</fieldset></div><footer><button type="button" onClick={() => setAbierto(false)}>Cancelar</button><button type="submit">Guardar caja</button></footer></form></Modal>}
  </div>;
}

function Vendedores({ sucursales, almacenes, cajas, vendedores, onCrear }: { sucursales: Sucursal[]; almacenes: Almacen[]; cajas: Caja[]; vendedores: Vendedor[]; onCrear: (item: Vendedor) => void }) {
  const [buscar, setBuscar] = useState('');
  const [sucursalFiltro, setSucursalFiltro] = useState('Todas');
  const [almacenFiltro, setAlmacenFiltro] = useState('Todos');
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ codigo: '', usuarioId: '', sucursalId: String(sucursales.find(s => s.estado === 'Activa')?.id || ''), cajaIds: [] as number[] });
  const cajasDisponibles = cajas.filter((caja) => caja.sucursalId === Number(form.sucursalId));
  const usuariosDisponibles = usuariosSistema.filter((usuario) => !vendedores.some((vendedor) => vendedor.usuarioId === usuario.id));
  const visibles = useMemo(() => vendedores.filter((item) => {
    const usuario = usuariosSistema.find((actual) => actual.id === item.usuarioId);
    const coincideTexto = `${item.codigo} ${usuario?.nombre || ''} ${usuario?.usuario || ''}`.toLowerCase().includes(buscar.toLowerCase());
    const coincideSucursal = sucursalFiltro === 'Todas' || item.sucursalId === Number(sucursalFiltro);
    const coincideAlmacen = almacenFiltro === 'Todos' || item.cajaIds.some((id) => cajas.find((caja) => caja.id === id)?.almacenIds.includes(Number(almacenFiltro)));
    return coincideTexto && coincideSucursal && coincideAlmacen;
  }), [almacenFiltro, buscar, cajas, sucursalFiltro, vendedores]);
  const cambiarSucursal = (valor: string) => setForm({ ...form, sucursalId: valor, cajaIds: [] });
  const guardar = (event: FormEvent) => { event.preventDefault(); if (!form.codigo.trim() || !form.usuarioId || !form.sucursalId || !form.cajaIds.length) return; onCrear({ id: Date.now(), codigo: form.codigo.trim().toUpperCase(), usuarioId: Number(form.usuarioId), sucursalId: Number(form.sucursalId), cajaIds: form.cajaIds, estado: 'Activo' }); setForm({ codigo: '', usuarioId: '', sucursalId: String(sucursales.find(s => s.estado === 'Activa')?.id || ''), cajaIds: [] }); setAbierto(false); };

  return <div className="configuracion-operativa">
    <div className="configuracion-barra configuracion-barra-vendedores"><label><Icon name="search" size={17} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Buscar vendedor, usuario o código" /></label><select className="configuracion-filtro" value={sucursalFiltro} onChange={(event) => setSucursalFiltro(event.target.value)} aria-label="Filtrar por sucursal"><option>Todas</option>{sucursales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select><select className="configuracion-filtro" value={almacenFiltro} onChange={(event) => setAlmacenFiltro(event.target.value)} aria-label="Filtrar por almacén"><option>Todos</option>{almacenes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select><span>{visibles.length} vendedores</span><button type="button" onClick={() => setAbierto(true)}><Icon name="plus" size={16} /> Registrar vendedor</button></div>
    <section className="configuracion-bloque"><header><div><h2>Vendedores</h2><small>Usuarios habilitados para operar en sucursales y cajas específicas.</small></div><b>{visibles.length}</b></header><div className="configuracion-tabla configuracion-vendedores-tabla"><div className="configuracion-tabla-head"><span>N°</span><span>Código vendedor</span><span>Nombre</span><span>Usuario</span><span>Sucursal</span><span>Cajas autorizadas</span><span>Estado</span></div>{visibles.map((item, indice) => { const usuario = usuariosSistema.find((actual) => actual.id === item.usuarioId); return <article key={item.id}><span>{indice + 1}</span><strong>{item.codigo}</strong><span>{usuario?.nombre}</span><span>{usuario?.usuario}</span><span>{sucursales.find((sucursal) => sucursal.id === item.sucursalId)?.nombre}</span><span className="configuracion-etiquetas">{item.cajaIds.map((id) => <i key={id}>{cajas.find((caja) => caja.id === id)?.nombre}</i>)}</span><span><i>{item.estado}</i></span></article>; })}</div></section>
    {abierto && <Modal titulo="Registrar vendedor" onCerrar={() => setAbierto(false)}><form onSubmit={guardar}><div className="configuracion-modal-campos"><label>Código de vendedor<input required value={form.codigo} onChange={(event) => setForm({ ...form, codigo: event.target.value })} placeholder="Ej. VEN-002" /></label><UsuarioCombobox usuarios={usuariosDisponibles} value={form.usuarioId} onChange={(usuarioId) => setForm({ ...form, usuarioId })} /><label className="campo-completo">Sucursal<select required value={form.sucursalId} onChange={(event) => cambiarSucursal(event.target.value)}>{sucursales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label><fieldset className="campo-completo"><legend>Cajas autorizadas</legend>{cajasDisponibles.map((item) => <label key={item.id}><input type="checkbox" checked={form.cajaIds.includes(item.id)} onChange={() => setForm({ ...form, cajaIds: form.cajaIds.includes(item.id) ? form.cajaIds.filter((id) => id !== item.id) : [...form.cajaIds, item.id] })} /> {item.nombre}</label>)}{!cajasDisponibles.length && <small>No hay cajas registradas en esta sucursal.</small>}</fieldset></div><footer><button type="button" onClick={() => setAbierto(false)}>Cancelar</button><button type="submit">Guardar vendedor</button></footer></form></Modal>}
  </div>;
}

function UsuarioCombobox({ usuarios, value, onChange }: { usuarios: UsuarioSistema[]; value: string; onChange: (id: string) => void }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const seleccionado = usuarios.find((item) => String(item.id) === value);
  const [texto, setTexto] = useState(seleccionado ? `${seleccionado.nombre} · ${seleccionado.usuario}` : '');
  const [abierto, setAbierto] = useState(false);
  const coincidencias = usuarios.filter((item) => `${item.nombre} ${item.usuario}`.toLocaleLowerCase().includes(texto.trim().toLocaleLowerCase()));

  useEffect(() => {
    const cerrar = (event: MouseEvent) => { if (!contenedor.current?.contains(event.target as Node)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  const seleccionar = (usuario: UsuarioSistema) => {
    setTexto(`${usuario.nombre} · ${usuario.usuario}`);
    onChange(String(usuario.id));
    setAbierto(false);
  };

  return <label className="usuario-combobox">Usuario existente
    <div ref={contenedor} className={`usuario-combobox-control ${abierto ? 'abierto' : ''}`}>
      <Icon name="search" size={16} />
      <input required autoComplete="off" value={texto} placeholder="Escribe un nombre o usuario" onFocus={() => setAbierto(true)} onChange={(event) => { setTexto(event.target.value); onChange(''); setAbierto(true); }} onKeyDown={(event) => { if (event.key === 'Escape') setAbierto(false); if (event.key === 'Enter' && abierto && coincidencias[0]) { event.preventDefault(); seleccionar(coincidencias[0]); } }} />
      {texto && <button type="button" aria-label="Limpiar usuario" onClick={() => { setTexto(''); onChange(''); setAbierto(true); }}><Icon name="close" size={14} /></button>}
      {abierto && <div className="usuario-combobox-opciones" role="listbox">
        {coincidencias.length ? coincidencias.map((usuario) => <button type="button" role="option" aria-selected={String(usuario.id) === value} className={String(usuario.id) === value ? 'seleccionado' : ''} key={usuario.id} onMouseDown={(event) => event.preventDefault()} onClick={() => seleccionar(usuario)}><span><Icon name="user" size={16} /></span><div><strong>{usuario.nombre}</strong><small>@{usuario.usuario}</small></div>{String(usuario.id) === value && <Icon name="check" size={16} />}</button>) : <p>No se encontraron usuarios disponibles.</p>}
      </div>}
    </div>
    <input className="usuario-combobox-validacion" tabIndex={-1} aria-hidden="true" required value={value} onChange={() => undefined} />
  </label>;
}

function Modal({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: ReactNode }) {
  return <div className="configuracion-modal-fondo" onMouseDown={onCerrar}><section className="configuracion-modal" onMouseDown={(event) => event.stopPropagation()}><header><div><p>REGISTRO OPERATIVO</p><h3>{titulo}</h3></div><button type="button" aria-label="Cerrar" onClick={onCerrar}><Icon name="close" size={18} /></button></header>{children}</section></div>;
}
