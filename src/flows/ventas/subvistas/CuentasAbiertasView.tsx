import { VistaPendiente } from '@ui/components/VistaPendiente';

export function CuentasAbiertasView() {
  return <VistaPendiente
    className="ventas-subvista"
    area="VENTAS"
    titulo="Cuentas abiertas"
    descripcion="Seguimiento de saldos pendientes por paciente."
    icono="fileText"
  />;
}
