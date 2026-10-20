import Icon, { type IconName } from './Icon';

export function EncabezadoVista({ titulo, descripcion, icono }: { titulo: string; descripcion: string; icono: IconName }) {
  return <header className="vista-encabezado">
    <span className="vista-encabezado-icono" aria-hidden="true"><Icon name={icono} size={23} /></span>
    <div><h2>{titulo}</h2><p>{descripcion}</p></div>
  </header>;
}