import { useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';

type Usuario = { nombre: string; usuario: string; rol: string; estado: string; datos: typeof formularioInicial };
const formularioInicial = { nombres: '', apellidos: '', ci: '', sucursal: '', cajas: '', almacenes: '', rol: '', usuario: '', contrasena: '', confirmarContrasena: '' };
const usuariosIniciales: Usuario[] = [
  { nombre: 'Administrador', usuario: 'admin', rol: 'Administrador', estado: 'Activo', datos: { ...formularioInicial, nombres: 'Administrador', ci: '1', sucursal: 'Casa matriz', cajas: 'Caja 01', almacenes: 'Almacén principal', rol: 'Administrador', usuario: 'admin' } },
  { nombre: 'Operador contable', usuario: 'operador', rol: 'Operador', estado: 'Activo', datos: { ...formularioInicial, nombres: 'Operador', apellidos: 'contable', ci: '2', sucursal: 'Casa matriz', cajas: 'Caja 01', almacenes: 'Almacén principal', rol: 'Operador', usuario: 'operador' } },
];

export function ListadoUsuariosView() {
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciales);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const visibles = useMemo(
    () =>
      usuarios.filter((item) => {
        const texto =
          `${item.nombre} ${item.usuario} ${item.rol}`.toLocaleLowerCase();
        return (
          texto.includes(query.toLocaleLowerCase()) &&
          (estado === 'Todos' || item.estado === estado)
        );
      }),
    [query, estado],
  );
  const actualizar = (campo: keyof typeof formulario, valor: string) => { setFormulario((actual) => ({ ...actual, [campo]: valor })); setErrorFormulario(''); };
  const registrar = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (Object.values(formulario).some((valor) => !valor.trim())) return setErrorFormulario('Completa todos los campos.');
    if (formulario.contrasena !== formulario.confirmarContrasena) return setErrorFormulario('Las contraseñas no coinciden.');
    if (usuarios.some((item) => item.usuario.toLowerCase() === formulario.usuario.toLowerCase())) return setErrorFormulario('Ese usuario ya está registrado.');
    setUsuarios((actual) => [...actual, { nombre: `${formulario.nombres} ${formulario.apellidos}`, usuario: formulario.usuario, rol: formulario.rol, estado: 'Activo', datos: formulario }]);
    setFormulario(formularioInicial); setModalAbierto(false);
  };

  return (
    <div className="usuarios-contenido">
      <div className="usuarios-filtros">
        <label className="usuarios-buscador-ventas">
          <Icon name="search" size={17} />
          <input
            type="search"
            placeholder="Buscar por nombre, usuario o rol"
            aria-label="Buscar en usuarios"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          aria-label="Filtrar por estado"
          value={estado}
          onChange={(event) => setEstado(event.target.value)}
        >
          <option>Todos</option>
          <option>Activos</option>
          <option>Inactivos</option>
        </select>
        <span className="usuarios-contador">{visibles.length} registros</span>
        <button className="usuarios-accion" type="button" onClick={() => setModalAbierto(true)}>
          <Icon name="plus" size={17} /> Registrar usuario
        </button>
      </div>

      <div className="usuarios-tabla" role="table" aria-label="Usuarios">
        <div className="usuarios-tabla-head" role="row">
          <span role="columnheader">N°</span><span role="columnheader">Nombre</span><span role="columnheader">Apellido</span><span role="columnheader">CI</span><span role="columnheader">Sucursal</span><span role="columnheader">Cant. cajas</span><span role="columnheader">Cant. almacenes</span><span role="columnheader">Usuario</span>
          <span role="columnheader">Acciones</span>
        </div>
        {visibles.map((item, indice) => (
          <div className="usuarios-tabla-fila" key={item.usuario}>
            <span>{indice + 1}</span>
            <strong>{item.datos.nombres}</strong>
            <span>{item.datos.apellidos || '—'}</span>
            <span>{item.datos.ci || '—'}</span>
            <span>{item.datos.sucursal || '—'}</span>
            <span>{item.datos.cajas ? 1 : 0}</span>
            <span>{item.datos.almacenes ? 1 : 0}</span>
            <span>{item.usuario}</span>
            <div className="usuarios-acciones"><button type="button" aria-label={`Ver ${item.nombre}`} onClick={() => { setUsuarioSeleccionado(item); setFormulario(item.datos); setModoEdicion(false); }}><Icon name="eye" size={16} /></button><button type="button" aria-label={`Editar ${item.nombre}`} onClick={() => { setUsuarioSeleccionado(item); setFormulario(item.datos); setModoEdicion(true); }}><Icon name="edit" size={16} /></button></div>
          </div>
        ))}
        {!visibles.length && (
          <div className="usuarios-vacio">
            <Icon name="users" size={25} />
            <strong>No hay usuarios para mostrar</strong>
            <small>Registra un usuario o cambia los filtros.</small>
          </div>
        )}
      </div>
      {usuarioSeleccionado && <div className="usuarios-modal-fondo" onMouseDown={() => setUsuarioSeleccionado(null)}><form className="usuarios-modal" onSubmit={(event) => { event.preventDefault(); if (!modoEdicion) return; setUsuarios((actual) => actual.map((item) => item.usuario === usuarioSeleccionado.usuario ? { ...item, nombre: `${formulario.nombres} ${formulario.apellidos}`, rol: formulario.rol, datos: formulario } : item)); setUsuarioSeleccionado(null); }} onMouseDown={(event) => event.stopPropagation()}><header><div><p>{modoEdicion ? 'EDICIÓN DE USUARIO' : 'DETALLE DE USUARIO'}</p><h3>{usuarioSeleccionado.nombre}</h3></div><button type="button" onClick={() => setUsuarioSeleccionado(null)}><Icon name="close" size={18}/></button></header><div className="usuarios-modal-grid">{([['nombres','Nombres'],['apellidos','Apellidos'],['ci','CI'],['sucursal','Sucursal'],['cajas','Cajas'],['almacenes','Almacenes'],['rol','Rol'],['usuario','Usuario'],['contrasena','Contraseña'],['confirmarContrasena','Confirmar contraseña']] as const).map(([campo, etiqueta]) => <label key={campo}>{etiqueta}<input disabled={!modoEdicion || campo === 'usuario'} type={campo.includes('contrasena') ? 'password' : 'text'} value={formulario[campo]} onChange={(event) => actualizar(campo, event.target.value)} /></label>)}</div>{modoEdicion && <label className="usuarios-estado-switch"><input type="checkbox" checked={usuarioSeleccionado.estado === 'Activo'} onChange={(event) => setUsuarioSeleccionado({ ...usuarioSeleccionado, estado: event.target.checked ? 'Activo' : 'Inactivo' })} /> Usuario activo</label>}<footer>{modoEdicion && <button className="usuarios-eliminar" type="button" onClick={() => { setUsuarios((actual) => actual.filter((item) => item.usuario !== usuarioSeleccionado.usuario)); setUsuarioSeleccionado(null); }}>Eliminar</button>}<button type="button" onClick={() => setUsuarioSeleccionado(null)}>Cancelar</button>{modoEdicion && <button type="submit"><Icon name="check" size={16}/> Guardar cambios</button>}</footer></form></div>}
      {modalAbierto && <div className="usuarios-modal-fondo" onMouseDown={() => setModalAbierto(false)}><form className="usuarios-modal" onSubmit={registrar} onMouseDown={(event) => event.stopPropagation()}><header><div><p>REGISTRO DE USUARIO</p><h3>Nuevo usuario</h3></div><button type="button" onClick={() => setModalAbierto(false)}><Icon name="close" size={18}/></button></header><div className="usuarios-modal-grid">{([['nombres','Nombres'],['apellidos','Apellidos'],['ci','CI'],['sucursal','Sucursal'],['cajas','Cajas'],['almacenes','Almacenes'],['rol','Rol'],['usuario','Usuario'],['contrasena','Contraseña'],['confirmarContrasena','Confirmar contraseña']] as const).map(([campo, etiqueta]) => <label key={campo}>{etiqueta}<input type={campo.includes('contrasena') ? 'password' : 'text'} value={formulario[campo]} onChange={(event) => actualizar(campo, event.target.value)} /></label>)}</div>{errorFormulario && <p className="usuarios-modal-error">{errorFormulario}</p>}<footer><button type="button" onClick={() => setModalAbierto(false)}>Cancelar</button><button type="submit"><Icon name="check" size={16}/> Registrar usuario</button></footer></form></div>}
    </div>
  );
}
