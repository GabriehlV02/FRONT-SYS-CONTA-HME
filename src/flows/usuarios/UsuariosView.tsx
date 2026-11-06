import { useState } from 'react';
import {
  UsuariosNavegacion,
  type SubvistaUsuarios,
} from './componentes/UsuariosNavegacion';
import { ListadoUsuariosView } from './subvistas/ListadoUsuariosView';
import { RolesPermisosView } from './subvistas/RolesPermisosView';
import { PacientesUsuariosView } from './subvistas/PacientesUsuariosView';
import { EspecialidadesView } from './subvistas/EspecialidadesView';
import './UsuariosView.css';
import { EncabezadoVista } from '@ui/components/EncabezadoVista';

export function UsuariosView({ permisos }: { permisos: string[] }) {
  const [subvista, setSubvista] = useState<SubvistaUsuarios>('usuarios');

  return (
    <section className="usuarios-vista">
      <UsuariosNavegacion activa={subvista} onSeleccionar={setSubvista} />
      {subvista !== 'usuarios' && <EncabezadoVista
        titulo={subvista === 'pacientes-usuarios' ? 'Registro de pacientes' : subvista === 'especialidades' ? 'Especialidades' : 'Roles y permisos'}
        descripcion={subvista === 'pacientes-usuarios' ? 'Registra y consulta los pacientes compartidos con el sistema clínico.' : subvista === 'especialidades' ? 'Consulta y administra las especialidades del personal de salud.' : 'Define qué puede consultar y gestionar cada usuario del sistema.'}
        icono={subvista === 'roles-permisos' ? 'userCheck' : 'users'}
      />}
      {subvista === 'usuarios' && (permisos.includes('USUARIOS_VER') ? <ListadoUsuariosView puedeCrear={permisos.includes('USUARIOS_CREAR')} /> : <p role="status">No tienes permiso para consultar usuarios.</p>)}
      {subvista === 'pacientes-usuarios' && (permisos.includes('USUARIOS_VER') ? <PacientesUsuariosView puedeCrear={permisos.includes('USUARIOS_CREAR')} /> : <p role="status">No tienes permiso para consultar pacientes.</p>)}
      {subvista === 'roles-permisos' && (permisos.includes('ROLES_GESTIONAR') ? <RolesPermisosView /> : <p role="status">No tienes permiso para gestionar roles y permisos.</p>)}
      {subvista === 'especialidades' && <EspecialidadesView puedeGestionar={permisos.includes('ROLES_GESTIONAR')} />}
    </section>
  );
}
