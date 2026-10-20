import { useEffect, useState } from 'react';
import { AdquisicionesView } from './subvistas/AdquisicionesView';
import { TraspasosView } from './subvistas/TraspasosView';
import './MovimientosView.css';
import { EncabezadoVista } from '@ui/components/EncabezadoVista';

export function MovimientosView({
  activeId,
  tipo = 'adquisiciones',
}: {
  activeId?: string;
  tipo?: 'adquisiciones' | 'traspasos';
}) {
  const resolveTipo = (id?: string): 'adquisiciones' | 'traspasos' =>
    id?.startsWith('traspasos-')
      ? 'traspasos'
      : id?.startsWith('adquisiciones-')
        ? 'adquisiciones'
        : tipo;
  const [subvista, setSubvista] = useState<'adquisiciones' | 'traspasos'>(() =>
    resolveTipo(activeId),
  );
  useEffect(() => setSubvista(resolveTipo(activeId)), [activeId, tipo]);

  return (
    <section className="movimientos-vista">
      <EncabezadoVista titulo={subvista === 'adquisiciones' ? 'Compras y recepciones' : 'Movimientos entre almacenes'} descripcion={subvista === 'adquisiciones' ? 'Revisa las notas de ingreso, los proveedores y el detalle de cada recepción.' : 'Consulta los envíos, las recepciones y las devoluciones entre almacenes.'} icono={subvista === 'adquisiciones' ? 'fileText' : 'arrowRight'} />
      {subvista === 'adquisiciones' && (
        <AdquisicionesView activeId={activeId} />
      )}
      {subvista === 'traspasos' && <TraspasosView activeId={activeId} />}
    </section>
  );
}
