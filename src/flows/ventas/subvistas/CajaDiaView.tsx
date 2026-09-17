import { VistaPendiente } from '@ui/components/VistaPendiente';

export function CajaDiaView() {
  return <VistaPendiente
    className="ventas-subvista"
    area="VENTAS"
    titulo="Caja del día"
    descripcion="Apertura, movimientos y cierre de caja."
    icono="cash"
  />;
}
