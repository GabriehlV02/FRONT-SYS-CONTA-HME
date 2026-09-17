import Icon, { type IconName } from './Icon';

type Props = {
  area: string;
  titulo: string;
  descripcion: string;
  icono: IconName;
  className?: string;
};

export function VistaPendiente({ area, titulo, descripcion, icono, className = '' }: Props) {
  return <section className={`vista-pendiente ${className}`} aria-label={titulo}>
    <span className="vista-pendiente-icono"><Icon name={icono} size={28} /></span>
    <p>{area}</p>
    <h2>{titulo}</h2>
    <span>{descripcion}</span>
    <small>Esta sección está en preparación.</small>
  </section>;
}
