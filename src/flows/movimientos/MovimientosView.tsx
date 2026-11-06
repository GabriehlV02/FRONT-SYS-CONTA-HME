import { useEffect, useState } from 'react';
import { AdquisicionesView } from './subvistas/AdquisicionesView';
import { TraspasosView } from './subvistas/TraspasosView';
import './MovimientosView.css';

export function MovimientosView({
  activeId,
  administraCatalogo = false,
  tipo = 'adquisiciones',
}: {
  activeId?: string;
  administraCatalogo?: boolean;
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
      {subvista === 'adquisiciones' && (
        <AdquisicionesView activeId={activeId} administraCatalogo={administraCatalogo} />
      )}
      {subvista === 'traspasos' && <TraspasosView activeId={activeId} />}
    </section>
  );
}
