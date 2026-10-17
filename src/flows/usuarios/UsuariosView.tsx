import { useState } from 'react';
import {
  UsuariosNavegacion,
  type SubvistaUsuarios,
} from './componentes/UsuariosNavegacion';
import { ListadoUsuariosView } from './subvistas/ListadoUsuariosView';
import { RolesPermisosView } from './subvistas/RolesPermisosView';
import { PacientesUsuariosView } from './subvistas/PacientesUsuariosView';
import './UsuariosView.css';

export function UsuariosView({ permisos }: { permisos: string[] }) {
  const [subvista, setSubvista] = useState<SubvistaUsuarios>('usuarios');

  return (
    <section className="usuarios-vista">
      <UsuariosNavegacion activa={subvista} onSeleccionar={setSubvista} />
      {subvista === 'usuarios' && (permisos.includes('USUARIOS_VER') ? <ListadoUsuariosView puedeCrear={permisos.includes('USUARIOS_CREAR')} /> : <p role="status">No tienes permiso para consultar usuarios.</p>)}
      {subvista === 'pacientes-usuarios' && (permisos.includes('USUARIOS_VER') ? <PacientesUsuariosView puedeCrear={permisos.includes('USUARIOS_CREAR')} /> : <p role="status">No tienes permiso para consultar cuentas de pacientes.</p>)}
      {subvista === 'roles-permisos' && (permisos.includes('ROLES_GESTIONAR') ? <RolesPermisosView /> : <p role="status">No tienes permiso para gestionar roles y permisos.</p>)}
    </section>
  );
}
