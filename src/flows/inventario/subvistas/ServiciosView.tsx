import { CatalogoView } from '../componentes/CatalogoView';

export function ServiciosView({ puedeGestionar = false }: { puedeGestionar?: boolean }) {
  return <CatalogoView tipo="servicios" puedeGestionar={puedeGestionar} />;
}
