type PaginacionTablaProps = {
  total: number;
  filas: number;
  pagina: number;
  totalPaginas: number;
  onFilas: (filas: number) => void;
  onPagina: (pagina: number) => void;
};

export default function PaginacionTabla({ total, filas, pagina, totalPaginas, onFilas, onPagina }: PaginacionTablaProps) {
  const desde = total ? (pagina - 1) * filas + 1 : 0;
  const hasta = Math.min(pagina * filas, total);
  return <div className="paginacion-tabla" aria-label="Paginación de la tabla">
    <div className="paginacion-tabla-resumen"><b>{total} registros</b><span>{desde}–{hasta} de {total}</span></div>
    <label className="paginacion-tabla-filas"><span>Filas</span><select value={filas} onChange={(event) => onFilas(Number(event.target.value))}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
    <div className="paginacion-tabla-navegacion"><button type="button" disabled={pagina === 1} onClick={() => onPagina(1)} aria-label="Primera página">&lt;&lt;</button><button type="button" disabled={pagina === 1} onClick={() => onPagina(pagina - 1)} aria-label="Página anterior">&lt;</button><strong>Página {pagina} de {totalPaginas}</strong><button type="button" disabled={pagina === totalPaginas} onClick={() => onPagina(pagina + 1)} aria-label="Página siguiente">&gt;</button><button type="button" disabled={pagina === totalPaginas} onClick={() => onPagina(totalPaginas)} aria-label="Última página">&gt;&gt;</button></div>
  </div>;
}
