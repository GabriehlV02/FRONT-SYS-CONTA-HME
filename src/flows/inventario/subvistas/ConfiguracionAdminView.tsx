import { useEffect, useRef, useState, type FormEvent } from 'react';
import { apiFetch } from '@ui/auth';

type Catalogo = 'tipos' | 'unidades' | 'categorias' | 'subcategorias' | 'clasificaciones';
type Registro = { id: string; nombre: string; clave: string; activo: boolean; descripcion?: string | null; tipo_base?: string; prefijo?: string; cantidad?: number; categoria_id?: string; categoria?: { id: string; nombre: string; activo: boolean } };
type Catalogos = Record<Catalogo, Registro[]>;
const iniciales: Catalogos = { tipos: [], unidades: [], categorias: [], subcategorias: [], clasificaciones: [] };
const secciones: { catalogo: Catalogo; titulo: string }[] = [
  { catalogo: 'tipos', titulo: 'Tipo' }, { catalogo: 'unidades', titulo: 'Unidad de medida' },
  { catalogo: 'categorias', titulo: 'Categoría' }, { catalogo: 'subcategorias', titulo: 'Subcategoría' },
  { catalogo: 'clasificaciones', titulo: 'Clasificación / familia' },
];

async function respuesta<T>(response: Response): Promise<T> {
  const datos = await response.json().catch(() => null);
  if (!response.ok) {
    const errores = datos?.errors as Record<string, string[]> | undefined;
    throw new Error(errores ? Object.values(errores).flat().join(' ') : datos?.message || 'No se pudo completar la operación.');
  }
  if (!datos) throw new Error('El servidor devolvió una respuesta inválida.');
  return datos as T;
}

export function ConfiguracionAdminView({ puedeGestionar = true }: { puedeGestionar?: boolean }) {
  const [datos, setDatos] = useState<Catalogos>(iniciales);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setError('');
    apiFetch('/api/v1/inventario/configuracion', { signal: controller.signal })
      .then(respuesta<{ data: Catalogos }>).then(resultado => { if (!controller.signal.aborted) setDatos(resultado.data); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'No se pudo cargar la configuración.'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [recarga]);
  return <section className="inventario-admin" aria-label="Configuración admin">
    {error && <div className="inventario-admin-error" role="alert">{error} <button type="button" onClick={() => setRecarga(valor => valor + 1)}>Reintentar</button></div>}
    <div className="inventario-admin-recuadros">
      {secciones.map(seccion => <RecuadroConfiguracion key={seccion.catalogo} {...seccion} registros={datos[seccion.catalogo]} categorias={datos.categorias.filter(categoria => categoria.activo)} cargando={cargando} puedeGestionar={puedeGestionar && !error} onGuardado={() => setRecarga(valor => valor + 1)} />)}
    </div>
  </section>;
}

function RecuadroConfiguracion({ titulo, catalogo, registros, categorias, cargando, puedeGestionar, onGuardado }: {
  titulo: string; catalogo: Catalogo; registros: Registro[]; categorias: Registro[];
  cargando: boolean; puedeGestionar: boolean; onGuardado: () => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState<'registro' | 'estado' | null>(null);
  const [pendiente, setPendiente] = useState<Registro | null>(null);
  const [formulario, setFormulario] = useState({ nombre: '', descripcion: '', tipo_base: 'PRODUCTO', prefijo: '', categoria_id: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const primerCampo = useRef<HTMLInputElement>(null);
  const botonConfirmar = useRef<HTMLButtonElement>(null);
  const ultimoBoton = useRef<HTMLElement | null>(null);
  const esTipo = catalogo === 'tipos';
  const esSubcategoria = catalogo === 'subcategorias';
  const filtrados = registros.filter(registro => [registro.nombre, registro.descripcion || '', registro.categoria?.nombre || '', registro.activo ? 'Activo' : 'Inactivo'].join(' ').toLocaleLowerCase().includes(busqueda.toLocaleLowerCase()));
  const sinCategoria = esSubcategoria && categorias.length === 0;

  useEffect(() => {
    if (modal === 'registro') primerCampo.current?.focus();
    if (modal === 'estado') botonConfirmar.current?.focus();
  }, [modal]);

  function abrir(modo: 'registro' | 'estado', boton: HTMLElement, registro: Registro | null = null) {
    ultimoBoton.current = boton; setPendiente(registro); setError(''); setMensaje('');
    setFormulario({ nombre: '', descripcion: '', tipo_base: 'PRODUCTO', prefijo: '', categoria_id: '' });
    setModal(modo);
  }
  function cerrar() {
    if (guardando) return;
    setModal(null); setPendiente(null); setError('');
    requestAnimationFrame(() => ultimoBoton.current?.focus());
  }
  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando) return;
    setGuardando(true); setError('');
    try {
      const cambiandoEstado = modal === 'estado' && pendiente;
      const url = '/api/v1/inventario/configuracion/' + catalogo + (cambiandoEstado ? '/' + pendiente.id : '');
      const payload = cambiandoEstado ? { activo: !pendiente.activo } : {
        nombre: formulario.nombre.trim(),
        ...(esTipo ? { descripcion: formulario.descripcion, tipo_base: formulario.tipo_base } : {}),
        ...(catalogo === 'categorias' ? { prefijo: formulario.prefijo } : {}),
        ...(esSubcategoria ? { categoria_id: formulario.categoria_id } : {}),
      };
      await respuesta(await apiFetch(url, {
        method: cambiandoEstado ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      }));
      setMensaje(cambiandoEstado ? 'El estado se actualizó correctamente.' : titulo + ' registrado correctamente.');
      if (!cambiandoEstado) setBusqueda('');
      setModal(null); setPendiente(null); onGuardado();
      requestAnimationFrame(() => ultimoBoton.current?.focus());
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar el registro.'); }
    finally { setGuardando(false); }
  }
  return <section className="inventario-admin-recuadro">
    <h2>{titulo}</h2>
    <div className="inventario-admin-controles">
      <label><span>Buscar</span><input type="search" aria-label={'Buscar ' + titulo.toLocaleLowerCase()} value={busqueda} onChange={event => setBusqueda(event.target.value)} placeholder={'Buscar ' + titulo.toLocaleLowerCase()} /></label>
      {puedeGestionar && <button type="button" className="inventario-admin-registrar" style={{ backgroundColor: '#0284c7', borderColor: '#0369a1', color: '#fff' }} disabled={cargando || sinCategoria} title={sinCategoria ? 'Registra primero una categoría activa.' : undefined} onClick={event => abrir('registro', event.currentTarget)}>Registrar nuevo</button>}
    </div>
    {sinCategoria && !cargando && <p className="inventario-admin-ayuda">Registra una categoría activa para añadir sus subcategorías.</p>}
    {mensaje && <p className="inventario-admin-exito" role="status">{mensaje}</p>}
    <div className="inventario-admin-tabla-contenedor">
      <table className="inventario-admin-tabla-configuracion" aria-label={titulo} aria-busy={cargando}>
        <thead><tr><th>{esTipo ? 'Nombre del tipo' : 'Nombre'}</th>{esTipo && <th>Descripción</th>}{esSubcategoria && <th>Categoría</th>}<th>Estado</th>{esTipo && <th>Cantidad</th>}<th>Acciones</th></tr></thead>
        <tbody>
          {cargando ? <tr><td colSpan={esTipo ? 5 : esSubcategoria ? 4 : 3} role="status">Cargando registros…</td></tr> : filtrados.map(registro => <tr key={registro.id}>
            <td>{registro.nombre}{catalogo === 'categorias' && <small className="inventario-admin-prefijo">Prefijo: {registro.prefijo}</small>}</td>
            {esTipo && <td>{registro.descripcion || '—'}</td>}{esSubcategoria && <td>{registro.categoria?.nombre || '—'}</td>}<td>{registro.activo ? 'Activo' : 'Inactivo'}</td>{esTipo && <td>{registro.cantidad ?? 0}</td>}
            <td><button type="button" className={'inventario-admin-switch ' + (registro.activo ? 'activo' : '')} role="switch" aria-checked={registro.activo} aria-label={'Cambiar ' + registro.nombre + ' a ' + (registro.activo ? 'inactivo' : 'activo')} disabled={!puedeGestionar || guardando} onClick={event => abrir('estado', event.currentTarget, registro)}><span /></button></td>
          </tr>)}
          {!cargando && !filtrados.length && <tr><td colSpan={esTipo ? 5 : esSubcategoria ? 4 : 3}>{busqueda ? 'No hay resultados para esta búsqueda.' : 'No hay registros.'}</td></tr>}
        </tbody>
      </table>
    </div>
    {modal && <div className="inventario-admin-modal-fondo" role="presentation" onClick={cerrar}>
      <form className="inventario-admin-modal" role="dialog" aria-modal="true" aria-labelledby={'modal-' + catalogo} onSubmit={guardar} onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key === 'Escape') cerrar();
        if (event.key === 'Tab') {
          const campos = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled)'));
          const primero = campos[0], ultimo = campos[campos.length - 1];
          if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo?.focus(); }
          else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero?.focus(); }
        }
      }}>
        <h3 id={'modal-' + catalogo}>{modal === 'estado' ? 'Confirmar cambio' : 'Registrar ' + titulo.toLocaleLowerCase()}</h3>
        {modal === 'estado' ? <p>¿Quieres cambiar <strong>{pendiente?.nombre}</strong> a {pendiente?.activo ? 'inactivo' : 'activo'}?</p> : <div className="inventario-admin-form-campos">
          <label>Nombre<input ref={primerCampo} required maxLength={100} disabled={guardando} value={formulario.nombre} onChange={event => setFormulario(actual => ({ ...actual, nombre: event.target.value }))} /></label>
          {esTipo && <><label>Descripción<textarea maxLength={1000} rows={3} disabled={guardando} value={formulario.descripcion} onChange={event => setFormulario(actual => ({ ...actual, descripcion: event.target.value }))} /></label><label>Tipo de ítem<select disabled={guardando} value={formulario.tipo_base} onChange={event => setFormulario(actual => ({ ...actual, tipo_base: event.target.value }))}><option value="PRODUCTO">Producto</option><option value="INSUMO">Insumo</option><option value="SERVICIO">Servicio</option></select></label></>}
          {catalogo === 'categorias' && <label>Prefijo de código<input required maxLength={10} pattern="[A-Za-z0-9]+" placeholder="Ej. FAR" disabled={guardando} value={formulario.prefijo} onChange={event => setFormulario(actual => ({ ...actual, prefijo: event.target.value }))} /></label>}
          {esSubcategoria && <label>Categoría<select required disabled={guardando} value={formulario.categoria_id} onChange={event => setFormulario(actual => ({ ...actual, categoria_id: event.target.value }))}><option value="">Selecciona una categoría</option>{categorias.map(categoria => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}</select></label>}
        </div>}
        {error && <p className="inventario-admin-error" role="alert">{error}</p>}
        <div className="inventario-admin-modal-acciones"><button ref={botonConfirmar} type="submit" disabled={guardando}>{guardando ? 'Guardando…' : modal === 'estado' ? 'Sí, confirmar' : 'Registrar'}</button><button type="button" disabled={guardando} onClick={cerrar}>Cancelar</button></div>
      </form>
    </div>}
  </section>;
}