import { HorizontalSubvistaNav } from '@ui/components/HorizontalSubvistaNav';
import { BotonSubvista } from '@ui/components/BotonSubvista';

export type SubvistaUsuarios = 'usuarios' | 'pacientes-usuarios' | 'roles-permisos';

type Props = {
  activa: SubvistaUsuarios;
  onSeleccionar: (vista: SubvistaUsuarios) => void;
};

export function UsuariosNavegacion({ activa, onSeleccionar }: Props) {
  return (
    <HorizontalSubvistaNav
      className="usuarios-subvistas"
      ariaLabel="Subvistas de Usuarios"
    >
      <BotonSubvista
        nombre="Usuarios"
        icono="users"
        activa={activa === 'usuarios'}
        onSeleccionar={() => onSeleccionar('usuarios')}
        claseIcono="usuarios-subvista-icono"
      />
      <BotonSubvista nombre="Pacientes usuarios" icono="users" activa={activa === 'pacientes-usuarios'} onSeleccionar={() => onSeleccionar('pacientes-usuarios')} claseIcono="usuarios-subvista-icono" />
      <BotonSubvista
        nombre="Roles y permisos"
        icono="userCheck"
        activa={activa === 'roles-permisos'}
        onSeleccionar={() => onSeleccionar('roles-permisos')}
        claseIcono="usuarios-subvista-icono"
      />
    </HorizontalSubvistaNav>
  );
}
