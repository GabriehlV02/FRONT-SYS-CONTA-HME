import { HorizontalSubvistaNav } from '@ui/components/HorizontalSubvistaNav';
import { BotonSubvista } from '@ui/components/BotonSubvista';

export type SubvistaAdquisiciones = 'cargado' | 'comprobante';
export type SubvistaTraspasos =
  'notas-envio' | 'recepcion' | 'devoluciones' | 'documentos';
export type SubvistaMovimientos = SubvistaAdquisiciones | SubvistaTraspasos;

type Props = {
  activa: SubvistaAdquisiciones;
  onSeleccionar: (vista: SubvistaAdquisiciones) => void;
};

export function MovimientosNavegacion({ activa, onSeleccionar }: Props) {
  return (
    <HorizontalSubvistaNav
      className="movimientos-subvistas"
      ariaLabel="Subvistas de Movimientos"
    >
      <BotonSubvista
        nombre="Cargado"
        icono="plus"
        activa={activa === 'cargado'}
        onSeleccionar={() => onSeleccionar('cargado')}
        claseIcono="movimientos-subvista-icono"
      />
      <BotonSubvista
        nombre="Comprobante"
        icono="fileText"
        activa={activa === 'comprobante'}
        onSeleccionar={() => onSeleccionar('comprobante')}
        claseIcono="movimientos-subvista-icono"
      />
    </HorizontalSubvistaNav>
  );
}

export function TraspasosNavegacion({
  activa,
  onSeleccionar,
}: {
  activa: SubvistaTraspasos;
  onSeleccionar: (vista: SubvistaTraspasos) => void;
}) {
  return (
    <HorizontalSubvistaNav
      className="movimientos-subvistas traspasos-subvistas"
      ariaLabel="Subvistas de Traspasos"
    >
      <BotonSubvista
        nombre="Notas de envio"
        icono="fileText"
        activa={activa === 'notas-envio'}
        onSeleccionar={() => onSeleccionar('notas-envio')}
        claseIcono="movimientos-subvista-icono"
      />
      <BotonSubvista
        nombre="Recepcion"
        icono="check"
        activa={activa === 'recepcion'}
        onSeleccionar={() => onSeleccionar('recepcion')}
        claseIcono="movimientos-subvista-icono"
      />
      <BotonSubvista
        nombre="Devoluciones"
        icono="logout"
        activa={activa === 'devoluciones'}
        onSeleccionar={() => onSeleccionar('devoluciones')}
        claseIcono="movimientos-subvista-icono"
      />
      <BotonSubvista
        nombre="Documentos"
        icono="fileText"
        activa={activa === 'documentos'}
        onSeleccionar={() => onSeleccionar('documentos')}
        claseIcono="movimientos-subvista-icono"
      />
    </HorizontalSubvistaNav>
  );
}
