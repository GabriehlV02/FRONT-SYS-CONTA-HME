import { useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';

export function ListadoUsuariosView() {
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState('Todos');
  const usuarios = [
    {
      nombre: 'Administrador',
      usuario: 'admin',
      rol: 'Administrador',
      estado: 'Activo',
    },
    {
      nombre: 'Operador contable',
      usuario: 'operador',
      rol: 'Operador',
      estado: 'Activo',
    },
  ];
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

  return (
    <div className="usuarios-contenido">
      <header className="usuarios-vista-cabecera">
        <div>
          <p>GESTION DE ACCESOS</p>
          <h2>Usuarios</h2>
          <small>Administra las cuentas y niveles de acceso del sistema.</small>
        </div>
        <button className="usuarios-accion">
          <Icon name="plus" size={17} /> Registrar usuario
        </button>
      </header>
      <div className="usuarios-filtros">
        <label>
          <Icon name="search" size={17} />
          <input
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
      </div>

      <div className="usuarios-tabla" role="table" aria-label="Usuarios">
        <div className="usuarios-tabla-head" role="row">
          <span role="columnheader">Nombre</span>
          <span role="columnheader">Rol</span>
          <span role="columnheader">Permisos</span>
          <span role="columnheader">Estado</span>
          <span role="columnheader">Acciones</span>
        </div>
        {visibles.map((item) => (
          <div className="usuarios-tabla-fila" key={item.usuario}>
            <strong>{item.nombre}</strong>
            <span>{item.usuario}</span>
            <span>{item.rol}</span>
            <span className="estado-activo">{item.estado}</span>
            <button aria-label={`Editar ${item.nombre}`}>
              <Icon name="edit" size={16} />
            </button>
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
    </div>
  );
}
