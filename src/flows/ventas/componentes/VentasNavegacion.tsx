import { HorizontalSubvistaNav } from '@ui/components/HorizontalSubvistaNav';
import { BotonSubvista } from '@ui/components/BotonSubvista';

export type SubvistaVentas =
  'ventas' | 'cuentas-abiertas' | 'caja-dia' | 'clientes';

type Props = {
  activa: SubvistaVentas;
  onSeleccionar: (vista: SubvistaVentas) => void;
};

export function VentasNavegacion({ activa, onSeleccionar }: Props) {
  return (
    <HorizontalSubvistaNav
      className="ventas-tabs"
      ariaLabel="Subvistas de Ventas"
    >
      <BotonSubvista
        nombre="Ventas"
        icono="cart"
        activa={activa === 'ventas'}
        onSeleccionar={() => onSeleccionar('ventas')}
        claseIcono=""
      />
      <BotonSubvista
        nombre="Cuentas abiertas"
        icono="fileText"
        activa={activa === 'cuentas-abiertas'}
        onSeleccionar={() => onSeleccionar('cuentas-abiertas')}
        claseIcono=""
      />
      <BotonSubvista
        nombre="Caja del dia"
        icono="cash"
        activa={activa === 'caja-dia'}
        onSeleccionar={() => onSeleccionar('caja-dia')}
        claseIcono=""
      />
    </HorizontalSubvistaNav>
  );
}
