import { HorizontalSubvistaNav } from '@ui/components/HorizontalSubvistaNav';
import { BotonSubvista } from '@ui/components/BotonSubvista';

export type SubvistaInventario =
  'productos' | 'servicios' | 'todo' | 'reportes';

type Props = {
  activa: SubvistaInventario;
  onSeleccionar: (vista: SubvistaInventario) => void;
};

export function InventarioNavegacion({ activa, onSeleccionar }: Props) {
  return (
    <HorizontalSubvistaNav
      className="inventario-subvistas"
      ariaLabel="Subvistas de Inventario"
    >
      <BotonSubvista
        nombre="Productos e insumos"
        icono="package"
        activa={activa === 'productos'}
        onSeleccionar={() => onSeleccionar('productos')}
        claseIcono="inventario-subvista-icono"
      />
      <BotonSubvista
        nombre="Servicios"
        icono="asset"
        activa={activa === 'servicios'}
        onSeleccionar={() => onSeleccionar('servicios')}
        claseIcono="inventario-subvista-icono"
      />
      <BotonSubvista
        nombre="Vista general"
        icono="eye"
        activa={activa === 'todo'}
        onSeleccionar={() => onSeleccionar('todo')}
        claseIcono="inventario-subvista-icono"
      />
      <BotonSubvista
        nombre="Reportes"
        icono="audit"
        activa={activa === 'reportes'}
        onSeleccionar={() => onSeleccionar('reportes')}
        claseIcono="inventario-subvista-icono"
      />
    </HorizontalSubvistaNav>
  );
}
