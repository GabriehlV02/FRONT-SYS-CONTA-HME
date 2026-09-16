import { useState } from 'react';
import {
  UsuariosNavegacion,
  type SubvistaUsuarios,
} from './componentes/UsuariosNavegacion';
import { ListadoUsuariosView } from './subvistas/ListadoUsuariosView';
import { RolesPermisosView } from './subvistas/RolesPermisosView';
import './UsuariosView.css';

export function UsuariosView() {
  const [subvista, setSubvista] = useState<SubvistaUsuarios>('usuarios');

  return (
    <section className="usuarios-vista">
      <UsuariosNavegacion activa={subvista} onSeleccionar={setSubvista} />
      {subvista === 'usuarios' && <ListadoUsuariosView />}
      {subvista === 'roles-permisos' && <RolesPermisosView />}
    </section>
  );
}
