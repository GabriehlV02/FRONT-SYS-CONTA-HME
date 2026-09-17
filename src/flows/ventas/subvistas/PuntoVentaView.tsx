import { VistaPendiente } from '@ui/components/VistaPendiente';

export function PuntoVentaView() {
  return <VistaPendiente
    className="ventas-subvista"
    area="VENTAS"
    titulo="Punto de venta"
    descripcion="Registro de ventas, servicios y cobros del hospital."
    icono="cart"
  />;
}
