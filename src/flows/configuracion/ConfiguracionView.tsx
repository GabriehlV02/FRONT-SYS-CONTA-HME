import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Icon from '@ui/components/Icon';
import type { IconName } from '@ui/components/Icon';
import { BotonSubvista } from '@ui/components/BotonSubvista';
import { HorizontalSubvistaNav } from '@ui/components/HorizontalSubvistaNav';
import './ConfiguracionView.css';

type SubvistaConfiguracion = 'sucursales-almacenes' | 'cajas' | 'vendedores' | 'administrar';
type TipoItem = 'Productos' | 'Insumos' | 'Servicios';
type Sucursal = { id: number; nombre: string; direccion: string; estado: 'Activa' | 'Inactiva' };
type Almacen = { id: number; nombre: string; codigo: string; sucursalId: number; tiposItem: TipoItem[]; estado: 'Activo' | 'Inactivo' };
type Caja = { id: number; nombre: string; codigo: string; sucursalId: number; almacenIds: number[]; tiposItem: TipoItem[]; estado: 'Activa' | 'Inactiva' };
type UsuarioSistema = { id: number; nombre: string; usuario: string };
type Vendedor = { id: number; codigo: string; usuarioId: number; sucursalId: number; cajaIds: number[]; estado: 'Activo' | 'Inactivo' };
const tiposItem: TipoItem[] = ['Productos', 'Insumos', 'Servicios'];

const subvistas: { id: SubvistaConfiguracion; nombre: string; icono: IconName; descripcion: string }[] = [
  { id: 'sucursales-almacenes', nombre: 'Almacenes y sucursales', icono: 'building', descripcion: 'Organización de almacenes y sucursales.' },
  { id: 'cajas', nombre: 'Cajas', icono: 'cash', descripcion: 'Gestión de cajas operativas.' },
  { id: 'vendedores', nombre: 'Vendedores', icono: 'users', descripcion: 'Administración de vendedores.' },
  { id: 'administrar', nombre: 'Administrar', icono: 'settings', descripcion: 'Ajustes de administración.' },
];

const sucursalesIniciales: Sucursal[] = [
  { id: 1, nombre: 'Hospital María Esperanza', direccion: 'Casa matriz', estado: 'Activa' },
  { id: 2, nombre: 'Policonsultorio Diabetes', direccion: 'Sucursal externa', estado: 'Activa' },
];
const almacenesIniciales: Almacen[] = [
  { id: 1, nombre: 'Almacén central', codigo: 'ALM-001', sucursalId: 1, tiposItem: ['Productos', 'Insumos'], estado: 'Activo' },
  { id: 2, nombre: 'Farmacia', codigo: 'ALM-002', sucursalId: 1, tiposItem: ['Productos', 'Insumos'], estado: 'Activo' },
  { id: 3, nombre: 'Insumos policonsultorio', codigo: 'ALM-003', sucursalId: 2, tiposItem: ['Insumos'], estado: 'Activo' },
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

export function ConfiguracionView({ inicial = 'sucursales-almacenes', vacia = false }: { inicial?: SubvistaConfiguracion; vacia?: boolean }) {
  const [subvista, setSubvista] = useState<SubvistaConfiguracion>(inicial);
  const [sucursales, setSucursales] = useState(sucursalesIniciales);
  const [almacenes, setAlmacenes] = useState(almacenesIniciales);
  const [cajas, setCajas] = useState(cajasIniciales);
  const [vendedores, setVendedores] = useState(vendedoresIniciales);

  if (vacia) return <section className="configuracion-vista configuracion-vista-vacia" aria-label="Configuración" />;

  return <section className="configuracion-vista">
    <HorizontalSubvistaNav className="configuracion-subvistas" ariaLabel="Opciones de configuración">
      {subvistas.map((item) => <BotonSubvista key={item.id} nombre={item.nombre} icono={item.icono} activa={subvista === item.id} onSeleccionar={() => setSubvista(item.id)} claseIcono="configuracion-subvista-icono" />)}
    </HorizontalSubvistaNav>
    {subvista === 'sucursales-almacenes' && <AlmacenesSucursales sucursales={sucursales} almacenes={almacenes} onSucursal={(item) => setSucursales((actual) => [...actual, item])} onAlmacen={(item) => setAlmacenes((actual) => [...actual, item])} />}
    {subvista === 'cajas' && <Cajas sucursales={sucursales} almacenes={almacenes} cajas={cajas} onCrear={(item) => setCajas((actual) => [...actual, item])} />}
    {subvista === 'vendedores' && <Vendedores sucursales={sucursales} almacenes={almacenes} cajas={cajas} vendedores={vendedores} onCrear={(item) => setVendedores((actual) => [...actual, item])} />}
    {subvista === 'administrar' && <div className="configuracion-contenido configuracion-vista-vacia" aria-label={subvista} />}
  </section>;
}

function AlmacenesSucursales({ sucursales, almacenes, onSucursal, onAlmacen }: { sucursales: Sucursal[]; almacenes: Almacen[]; onSucursal: (item: Sucursal) => void; onAlmacen: (item: Almacen) => void }) {
  const [buscar, setBuscar] = useState('');
  const [modal, setModal] = useState<'sucursal' | 'almacen' | null>(null);
  const [sucursalForm, setSucursalForm] = useState({ nombre: '', direccion: '' });
  const [almacenForm, setAlmacenForm] = useState({ nombre: '', codigo: '', sucursalId: String(sucursales[0]?.id || ''), tiposItem: [] as TipoItem[] });
  const texto = buscar.toLowerCase();
  const sucursalesVisibles = sucursales.filter((item) => `${item.nombre} ${item.direccion}`.toLowerCase().includes(texto));
  const almacenesVisibles = almacenes.filter((item) => `${item.nombre} ${item.codigo} ${sucursales.find((s) => s.id === item.sucursalId)?.nombre || ''}`.toLowerCase().includes(texto));
  const guardarSucursal = (event: FormEvent) => { event.preventDefault(); if (!sucursalForm.nombre.trim() || !sucursalForm.direccion.trim()) return; onSucursal({ id: Date.now(), nombre: sucursalForm.nombre.trim(), direccion: sucursalForm.direccion.trim(), estado: 'Activa' }); setSucursalForm({ nombre: '', direccion: '' }); setModal(null); };
  const guardarAlmacen = (event: FormEvent) => { event.preventDefault(); if (!almacenForm.nombre.trim() || !almacenForm.codigo.trim() || !almacenForm.sucursalId || !almacenForm.tiposItem.length) return; onAlmacen({ id: Date.now(), nombre: almacenForm.nombre.trim(), codigo: almacenForm.codigo.trim().toUpperCase(), sucursalId: Number(almacenForm.sucursalId), tiposItem: almacenForm.tiposItem, estado: 'Activo' }); setAlmacenForm({ nombre: '', codigo: '', sucursalId: String(sucursales[0]?.id || ''), tiposItem: [] }); setModal(null); };

  return <div className="configuracion-operativa">
    <div className="configuracion-barra"><label><Icon name="search" size={17} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Buscar sucursal, almacén o código" /></label><span>{sucursalesVisibles.length + almacenesVisibles.length} registros</span><button type="button" onClick={() => setModal('sucursal')}><Icon name="plus" size={16} /> Nueva sucursal</button><button type="button" onClick={() => setModal('almacen')}><Icon name="plus" size={16} /> Nuevo almacén</button></div>
    <section className="configuracion-bloque"><header><div><h2>Sucursales</h2><small>Sedes donde operan almacenes y cajas.</small></div><b>{sucursalesVisibles.length}</b></header><div className="configuracion-tabla configuracion-sucursales-tabla"><div className="configuracion-tabla-head"><span>N°</span><span>Sucursal</span><span>Dirección</span><span>Almacenes</span><span>Estado</span></div>{sucursalesVisibles.map((item, indice) => <article key={item.id}><span>{indice + 1}</span><strong>{item.nombre}</strong><span>{item.direccion}</span><span>{almacenes.filter((almacen) => almacen.sucursalId === item.id).length}</span><span><i>{item.estado}</i></span></article>)}</div></section>
    <section className="configuracion-bloque"><header><div><h2>Almacenes</h2><small>Cada almacén define qué tipos de ítems puede manejar.</small></div><b>{almacenesVisibles.length}</b></header><div className="configuracion-tabla configuracion-almacenes-tabla"><div className="configuracion-tabla-head"><span>N°</span><span>Código</span><span>Almacén</span><span>Sucursal</span><span>Tipos de ítems</span><span>Estado</span></div>{almacenesVisibles.map((item, indice) => <article key={item.id}><span>{indice + 1}</span><strong>{item.codigo}</strong><span>{item.nombre}</span><span>{sucursales.find((sucursal) => sucursal.id === item.sucursalId)?.nombre}</span><span className="configuracion-etiquetas">{item.tiposItem.map((tipo) => <i key={tipo}>{tipo}</i>)}</span><span><i>{item.estado}</i></span></article>)}</div></section>
    {modal === 'sucursal' && <Modal titulo="Nueva sucursal" onCerrar={() => setModal(null)}><form onSubmit={guardarSucursal}><div className="configuracion-modal-campos"><label>Nombre<input required value={sucursalForm.nombre} onChange={(event) => setSucursalForm({ ...sucursalForm, nombre: event.target.value })} /></label><label>Dirección<input required value={sucursalForm.direccion} onChange={(event) => setSucursalForm({ ...sucursalForm, direccion: event.target.value })} /></label></div><footer><button type="button" onClick={() => setModal(null)}>Cancelar</button><button type="submit">Guardar sucursal</button></footer></form></Modal>}
    {modal === 'almacen' && <Modal titulo="Nuevo almacén" onCerrar={() => setModal(null)}><form onSubmit={guardarAlmacen}><div className="configuracion-modal-campos"><label>Nombre<input required value={almacenForm.nombre} onChange={(event) => setAlmacenForm({ ...almacenForm, nombre: event.target.value })} /></label><label>Código<input required value={almacenForm.codigo} onChange={(event) => setAlmacenForm({ ...almacenForm, codigo: event.target.value })} /></label><label className="campo-completo">Sucursal<select required value={almacenForm.sucursalId} onChange={(event) => setAlmacenForm({ ...almacenForm, sucursalId: event.target.value })}>{sucursales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label><fieldset className="campo-completo"><legend>Tipos de ítems permitidos</legend>{tiposItem.map((tipo) => <label key={tipo}><input type="checkbox" checked={almacenForm.tiposItem.includes(tipo)} onChange={() => setAlmacenForm({ ...almacenForm, tiposItem: almacenForm.tiposItem.includes(tipo) ? almacenForm.tiposItem.filter((item) => item !== tipo) : [...almacenForm.tiposItem, tipo] })} /> {tipo}</label>)}</fieldset></div><footer><button type="button" onClick={() => setModal(null)}>Cancelar</button><button type="submit">Guardar almacén</button></footer></form></Modal>}
  </div>;
}

function Cajas({ sucursales, almacenes, cajas, onCrear }: { sucursales: Sucursal[]; almacenes: Almacen[]; cajas: Caja[]; onCrear: (item: Caja) => void }) {
  const [buscar, setBuscar] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ nombre: '', codigo: '', sucursalId: String(sucursales[0]?.id || ''), almacenIds: [] as number[], tiposItem: [] as TipoItem[] });
  const disponibles = almacenes.filter((item) => item.sucursalId === Number(form.sucursalId));
  const tiposPermitidos = tiposItem.filter((tipo) => almacenes.some((almacen) => form.almacenIds.includes(almacen.id) && almacen.tiposItem.includes(tipo)));
  const visibles = useMemo(() => cajas.filter((item) => `${item.nombre} ${item.codigo} ${sucursales.find((s) => s.id === item.sucursalId)?.nombre || ''}`.toLowerCase().includes(buscar.toLowerCase())), [buscar, cajas, sucursales]);
  const guardar = (event: FormEvent) => { event.preventDefault(); if (!form.nombre.trim() || !form.codigo.trim() || !form.sucursalId || !form.almacenIds.length || !form.tiposItem.length) return; onCrear({ id: Date.now(), nombre: form.nombre.trim(), codigo: form.codigo.trim().toUpperCase(), sucursalId: Number(form.sucursalId), almacenIds: form.almacenIds, tiposItem: form.tiposItem, estado: 'Activa' }); setForm({ nombre: '', codigo: '', sucursalId: String(sucursales[0]?.id || ''), almacenIds: [], tiposItem: [] }); setAbierto(false); };
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
  const [form, setForm] = useState({ codigo: '', usuarioId: '', sucursalId: String(sucursales[0]?.id || ''), cajaIds: [] as number[] });
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
  const guardar = (event: FormEvent) => { event.preventDefault(); if (!form.codigo.trim() || !form.usuarioId || !form.sucursalId || !form.cajaIds.length) return; onCrear({ id: Date.now(), codigo: form.codigo.trim().toUpperCase(), usuarioId: Number(form.usuarioId), sucursalId: Number(form.sucursalId), cajaIds: form.cajaIds, estado: 'Activo' }); setForm({ codigo: '', usuarioId: '', sucursalId: String(sucursales[0]?.id || ''), cajaIds: [] }); setAbierto(false); };

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
