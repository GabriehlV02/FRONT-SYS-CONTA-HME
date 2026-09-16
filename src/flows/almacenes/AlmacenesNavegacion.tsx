import { HorizontalSubvistaNav } from '@ui/components/HorizontalSubvistaNav';
import { BotonSubvista } from '@ui/components/BotonSubvista';

export type SubvistaAlmacenes = 'stock' | 'almacenes' | 'reportes';

type Props = {
  activa: SubvistaAlmacenes;
  onSeleccionar: (vista: SubvistaAlmacenes) => void;
};

export function AlmacenesNavegacion({ activa, onSeleccionar }: Props) {
  return (
    <HorizontalSubvistaNav
      className="inventario-subvistas"
      ariaLabel="Subvistas de Almacenes"
    >
      <BotonSubvista
        nombre="Stock general"
        icono="warehouse"
        activa={activa === 'stock'}
        onSeleccionar={() => onSeleccionar('stock')}
        claseIcono="inventario-subvista-icono"
      />
      <BotonSubvista
        nombre="Almacenes"
        icono="building"
        activa={activa === 'almacenes'}
        onSeleccionar={() => onSeleccionar('almacenes')}
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
