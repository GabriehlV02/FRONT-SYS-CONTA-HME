import { useEffect, useState } from 'react';
import {
  VentasNavegacion,
  type SubvistaVentas,
} from './componentes/VentasNavegacion';
import { PuntoVentaView } from './subvistas/PuntoVentaView';
import { CuentasAbiertasView } from './subvistas/CuentasAbiertasView';
import { CajaDiaView } from './subvistas/CajaDiaView';
import { ClientesView } from '../inventario/subvistas/ClientesView';
import './VentasView.css';

export function VentasView({ activeId }: { activeId?: string }) {
  const [subvista, setSubvista] = useState<SubvistaVentas>(() =>
    activeId === 'ventas-cuentas'
      ? 'cuentas-abiertas'
      : activeId === 'ventas-caja'
        ? 'caja-dia'
        : activeId === 'ventas-clientes'
          ? 'clientes'
          : 'ventas',
  );
  useEffect(() => {
    setSubvista(
      activeId === 'ventas-cuentas'
        ? 'cuentas-abiertas'
        : activeId === 'ventas-caja'
          ? 'caja-dia'
          : activeId === 'ventas-clientes'
            ? 'clientes'
            : 'ventas',
    );
  }, [activeId]);

  return (
    <section className="ventas-vista ventas-vista-vacia">
      <VentasNavegacion activa={subvista} onSeleccionar={setSubvista} />
      {subvista === 'ventas' && <PuntoVentaView />}
      {subvista === 'cuentas-abiertas' && <CuentasAbiertasView />}
      {subvista === 'caja-dia' && <CajaDiaView />}
      {subvista === 'clientes' && <ClientesView />}
    </section>
  );
}
