const formato = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' });

export function fechaISOEnBolivia(fecha = new Date()): string {
  if (Number.isNaN(fecha.getTime())) return '';
  const partes = formato.formatToParts(fecha);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((parte) => parte.type === tipo)?.value || '';
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}
