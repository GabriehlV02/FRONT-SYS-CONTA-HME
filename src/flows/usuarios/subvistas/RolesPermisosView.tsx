import { useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import { SelectMenu } from '@ui/components/SelectMenu';

export function RolesPermisosView() {
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [editando, setEditando] = useState<string | null>(null);
  const roles = [
    {
      nombre: 'Administrador',
      descripcion: 'Acceso completo al sistema.',
      permisos: totalPermisos,
      estado: 'Activo',
    },
    {
      nombre: 'Operador',
      descripcion: 'Gestión de ventas e inventario.',
      permisos: 24,
      estado: 'Activo',
    },
    {
      nombre: 'Consulta',
      descripcion: 'Lectura de información operativa.',
      permisos: 11,
      estado: 'Activo',
    },
  ];
  const visibles = useMemo(
    () =>
      roles.filter(
        (item) =>
          `${item.nombre} ${item.descripcion}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()) &&
          (estado === 'Todos' || item.estado === estado),
      ),
    [query, estado],
  );
  if (editando)
    return <EditorRol nombre={editando} onBack={() => setEditando(null)} />;

  return (
    <div className="usuarios-contenido">
      <div className="usuarios-filtros roles-filtros">
        <label>
          <Icon name="search" size={17} />
          <input
            placeholder="Buscar por nombre o descripción"
            aria-label="Buscar roles"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <SelectMenu
          className="roles-estado-select"
          ariaLabel="Filtrar roles por estado"
          value={estado}
          options={['Todos', 'Activos', 'Inactivos']}
          onChange={setEstado}
        />
        <span className="usuarios-contador">{visibles.length} roles</span>
        <button
          className="usuarios-accion"
          onClick={() => setEditando('Nuevo rol')}
        >
          <Icon name="plus" size={17} /> Nuevo rol
        </button>
      </div>

      <div
        className="usuarios-tabla"
        role="table"
        aria-label="Roles y permisos"
      >
        <div className="usuarios-tabla-head" role="row">
          <span role="columnheader">Nombre</span>
          <span role="columnheader">Permisos</span>
          <span role="columnheader">Estado</span>
          <span role="columnheader">Acciones</span>
        </div>
        {visibles.map((item) => (
          <div className="usuarios-tabla-fila roles-fila" key={item.nombre}>
            <div>
              <strong>{item.nombre}</strong>
              <small>{item.descripcion}</small>
            </div>
            <span className="permisos-contador">{item.permisos} permisos</span>
            <span className="estado-activo">{item.estado}</span>
            <button
              onClick={() => setEditando(item.nombre)}
              aria-label={`Editar ${item.nombre}`}
            >
              <Icon name="edit" size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const gruposPermisos = [
  {
    flujo: 'Ventas',
    permisos: [
      'Ver modulo ventas',
      'Ver punto de venta',
      'Ver cuentas abiertas',
      'Ver caja del dia',
      'Buscar ventas',
      'Filtrar ventas',
      'Registrar venta',
      'Editar venta',
      'Ver detalle de venta',
      'Anular venta',
      'Cobrar cuenta',
      'Marcar cuenta como pagada',
      'Imprimir comprobante de venta',
      'Exportar reporte de ventas',
    ],
  },
  {
    flujo: 'Inventario',
    permisos: [
      'Ver modulo inventario',
      'Ver productos e insumos',
      'Ver servicios',
      'Ver catalogo general',
      'Ver reportes de inventario',
      'Buscar inventario',
      'Filtrar inventario',
      'Ordenar inventario',
      'Cambiar vista galeria/listado',
      'Registrar producto',
      'Registrar servicio',
      'Editar producto o servicio',
      'Ver detalle de producto o servicio',
      'Cerrar formulario de registro',
      'Guardar producto o servicio',
      'Ver stock general',
      'Ver detalle de stock por almacen',
      'Cerrar detalle de stock',
      'Exportar inventario',
    ],
  },
  {
    flujo: 'Almacenes',
    permisos: [
      'Ver modulo almacenes',
      'Buscar almacenes',
      'Filtrar almacenes',
      'Ordenar almacenes',
      'Ver detalle de almacen',
      'Registrar almacen',
      'Editar almacen',
      'Gestionar ubicaciones',
    ],
  },
  {
    flujo: 'Movimientos',
    permisos: [
      'Ver modulo movimientos',
      'Ver adquisiciones',
      'Ver traspasos',
      'Ver reportes de movimientos',
      'Buscar movimientos',
      'Filtrar movimientos',
      'Registrar adquisicion',
      'Cargar stock',
      'Agregar linea de stock',
      'Quitar linea de stock',
      'Guardar carga de stock',
      'Ver comprobante',
      'Ver detalle de comprobante',
      'Registrar traspaso',
      'Recepcionar traspaso',
      'Anular movimiento',
      'Exportar movimientos',
    ],
  },
  {
    flujo: 'Usuarios',
    permisos: [
      'Ver modulo usuarios',
      'Ver listado de usuarios',
      'Buscar usuarios',
      'Filtrar usuarios',
      'Crear usuario',
      'Editar usuario',
      'Activar o desactivar usuario',
      'Ver roles y permisos',
      'Buscar roles',
      'Filtrar roles',
      'Crear rol',
      'Editar rol',
      'Guardar rol',
      'Asignar permisos',
    ],
  },
  {
    flujo: 'Cajas y almacenes',
    permisos: [
      'Ver módulo cajas y almacenes',
      'Ver sucursales y almacenes',
      'Crear y editar sucursales',
      'Crear y editar almacenes',
      'Ver y administrar cajas',
      'Abrir y cerrar cajas',
      'Ver vendedores',
      'Crear y editar vendedores',
      'Administrar parámetros operativos',
    ],
  },
  {
    flujo: 'Notificaciones',
    permisos: [
      'Ver centro de notificaciones',
      'Ver creación de registros',
      'Ver cambios de registros',
      'Acceder al módulo relacionado',
      'Marcar notificaciones como leídas',
    ],
  },
];

const totalPermisos = gruposPermisos.reduce(
  (total, grupo) => total + grupo.permisos.length,
  0,
);

function EditorRol({ nombre, onBack }: { nombre: string; onBack: () => void }) {
  const [nombreRol, setNombreRol] = useState(
    nombre === 'Nuevo rol' ? '' : nombre,
  );
  const [descripcion, setDescripcion] = useState('');
  const [seleccionados, setSeleccionados] = useState<string[]>(
    nombre === 'Administrador'
      ? gruposPermisos.flatMap((item) => item.permisos)
      : [],
  );
  const alternar = (permiso: string) =>
    setSeleccionados((actual) =>
      actual.includes(permiso)
        ? actual.filter((item) => item !== permiso)
        : [...actual, permiso],
    );
  return (
    <div className="rol-editor">
      <button className="usuarios-volver" onClick={onBack}>
        <Icon name="chevronLeft" size={16} /> Volver a roles
      </button>
      <header className="usuarios-vista-cabecera">
        <div>
          <p>CONFIGURACION DEL ROL</p>
          <h2>{nombreRol || 'Nuevo rol'}</h2>
          <small>Define la identidad del rol y selecciona sus permisos.</small>
        </div>
        <button className="usuarios-accion">Guardar rol</button>
      </header>
      <section className="rol-datos">
        <label>
          <span>Nombre del rol</span>
          <input
            value={nombreRol}
            onChange={(event) => setNombreRol(event.target.value)}
            placeholder="Ej. Recepción"
          />
        </label>
        <label>
          <span>Descripción</span>
          <textarea
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            placeholder="Describe el alcance de este rol"
            rows={3}
          />
        </label>
      </section>
      <div className="permisos-encabezado">
        <div>
          <h3>Permisos por flujo</h3>
          <small>Selecciona las acciones que podrá realizar este rol.</small>
        </div>
        <span>{seleccionados.length} seleccionados</span>
      </div>
      <div className="permisos-grid">
        {gruposPermisos.map((grupo) => (
          <section className="permiso-grupo" key={grupo.flujo}>
            <h3>{grupo.flujo}</h3>
            {grupo.permisos.map((permiso) => (
              <label key={permiso}>
                <input
                  type="checkbox"
                  checked={seleccionados.includes(permiso)}
                  onChange={() => alternar(permiso)}
                />
                {permiso}
              </label>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
