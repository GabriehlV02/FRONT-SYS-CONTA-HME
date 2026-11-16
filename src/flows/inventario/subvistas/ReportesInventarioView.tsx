import { apiFetch } from '@ui/auth';
import { useEffect, useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import '../InventarioView.css';
import { leerRespuesta } from '../../usuarios/accesos';


type Registro = Record<string, string | number>;
type Columna = { id: string; etiqueta: string };
type ItemAPI = { codigo: string; nombre_comercial: string; producto_base?: { tipo?: { nombre?: string }; categoria?: { nombre?: string } | null; subcategoria?: { nombre?: string } | null }; unidad?: { nombre?: string }; precio_1?: string | number; codigo_barras?: string | null; estado: string };
type PaginaItems = { data: ItemAPI[]; last_page: number };
type LoteAPI = { codigo: string; almacen: string; sucursal?: string; disponible: number; vence?: string };

const columnas: Columna[] = [
  { id: 'codigo', etiqueta: 'Código' }, { id: 'nombre', etiqueta: 'Nombre o identificación' },
  { id: 'tipo', etiqueta: 'Tipo' }, { id: 'categoria', etiqueta: 'Categoría' },
  { id: 'grupo', etiqueta: 'Subcategoría' }, { id: 'unidadMedida', etiqueta: 'Unidad' },
  { id: 'stock', etiqueta: 'Stock' }, { id: 'precioVenta', etiqueta: 'Precio venta' },
  { id: 'estado', etiqueta: 'Estado' }, { id: 'numeroSerie', etiqueta: 'Serie / barras' },
];
const columnasIniciales = columnas.map((columna) => columna.id);

const descargar = (contenido: BlobPart, tipo: string, nombre: string) => {
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  enlace.download = nombre;
  enlace.click();
  window.setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
};

const crearPdf = (lineas: string[], horizontal: boolean) => {
  const ancho = horizontal ? 842 : 595;
  const alto = horizontal ? 595 : 842;
  const texto = lineas.flatMap((linea) => {
    const limpio = linea.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '');
    return limpio.match(/.{1,110}/g) || [''];
  });
  const porPagina = Math.floor((alto - 80) / 11);
  const paginas = Array.from({ length: Math.max(1, Math.ceil(texto.length / porPagina)) }, (_, indice) => texto.slice(indice * porPagina, (indice + 1) * porPagina));
  const objetos: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${paginas.map((_, indice) => `${4 + indice * 2} 0 R`).join(' ')}] /Count ${paginas.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  paginas.forEach((lineasPagina, indice) => {
    const numeroPagina = 4 + indice * 2;
    const numeroContenido = numeroPagina + 1;
    const contenido = `BT /F1 9 Tf 35 ${alto - 40} Td 11 TL ${lineasPagina.map((linea, fila) => `${fila ? 'T* ' : ''}(${linea.replace(/([\\()])/g, '\\$1')}) Tj`).join(' ')} ET`;
    objetos[numeroPagina - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ancho} ${alto}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${numeroContenido} 0 R >>`;
    objetos[numeroContenido - 1] = `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`;
  });
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objetos.forEach((objeto, indice) => { offsets.push(pdf.length); pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer << /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
};

export function ReportesInventarioView({ onVolver }: { onVolver?: () => void }) {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [recarga, setRecarga] = useState(0);
  const [seleccionadas, setSeleccionadas] = useState(columnasIniciales);
  const [sucursal, setSucursal] = useState('');
  const [almacen, setAlmacen] = useState('');
  const [lotes, setLotes] = useState<LoteAPI[]>([]);
  const [error, setError] = useState('');
  const sucursalLote = (lote: { almacen: string; sucursal?: string }) => lote.sucursal || (lote.almacen.includes(' - ') ? lote.almacen.split(' - ')[0].trim() : 'Sin sucursal asignada');
  const sucursales = [...new Set(lotes.map(sucursalLote))].sort();
  const almacenes = [...new Set(lotes.filter(lote => !sucursal || sucursalLote(lote) === sucursal).map(lote => lote.almacen))].sort();
  const [tipo, setTipo] = useState('Todos');
  const [estado, setEstado] = useState('Todos');
  const [titulo, setTitulo] = useState('Reporte general de inventario');
  const [orientacion, setOrientacion] = useState<'vertical' | 'horizontal'>('horizontal');
  const [incluirFecha, setIncluirFecha] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setError('');
    Promise.all([
      apiFetch('/api/v1/inventario/items?por_pagina=100&page=1', { signal: controller.signal }).then(leerRespuesta<PaginaItems>),
      apiFetch('/api/v1/stock/lotes', { signal: controller.signal }).then(leerRespuesta<{ data: LoteAPI[] }>),
    ]).then(async ([primeraPagina, respuestaStock]) => {
      const items = [...primeraPagina.data];
      for (let page = 2; page <= primeraPagina.last_page; page += 1) {
        const siguiente = await apiFetch(`/api/v1/inventario/items?por_pagina=100&page=${page}`, { signal: controller.signal }).then(leerRespuesta<PaginaItems>);
        items.push(...siguiente.data);
      }
      if (controller.signal.aborted) return;
      const stock = respuestaStock.data;
      const cantidades = new Map<string, number>();
      stock.forEach((lote) => cantidades.set(lote.codigo, (cantidades.get(lote.codigo) || 0) + Number(lote.disponible || 0)));
      setLotes(stock);
      setRegistros(items.map((item) => ({
        codigo: item.codigo,
        nombre: item.nombre_comercial,
        tipo: item.producto_base?.tipo?.nombre || 'Sin tipo',
        categoria: item.producto_base?.categoria?.nombre || 'Sin categoría',
        grupo: item.producto_base?.subcategoria?.nombre || 'Sin subcategoría',
        unidadMedida: item.unidad?.nombre || '—',
        stock: cantidades.get(item.codigo) || 0,
        precioVenta: item.precio_1 ?? '—',
        estado: item.estado,
        numeroSerie: item.codigo_barras || '—',
      })));
    }).catch((causa) => { if (!controller.signal.aborted) setError(causa instanceof Error ? causa.message : 'No se pudieron cargar el inventario y sus almacenes.'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [recarga]);
  const visibles = useMemo(() => {
    const ubicados = lotes.filter(lote => (!sucursal || sucursalLote(lote) === sucursal) && (!almacen || lote.almacen === almacen));
    const codigos = new Set(ubicados.map(lote => lote.codigo));
    const stock = new Map<string, number>();
    ubicados.forEach(lote => { if (lote.disponible > 0) stock.set(lote.codigo, (stock.get(lote.codigo) || 0) + lote.disponible); });
    return registros.filter(registro => (!(sucursal || almacen) || codigos.has(String(registro.codigo))) && (tipo === 'Todos' || String(registro.tipo).toUpperCase() === tipo.toUpperCase()) && (estado === 'Todos' || String(registro.estado).toUpperCase() === estado.toUpperCase()))
      .map(registro => sucursal || almacen ? { ...registro, stock: stock.get(String(registro.codigo)) || 0 } : registro);
  }, [sucursal, almacen, lotes, estado, registros, tipo]);
  const columnasVisibles = columnas.filter((columna) => seleccionadas.includes(columna.id));
  const fecha = new Intl.DateTimeFormat('es-BO', { dateStyle: 'long' }).format(new Date());
  const filasTexto = [titulo, ...(incluirFecha ? [`Generado: ${fecha}`] : []), columnasVisibles.map((c) => c.etiqueta).join(' | '), ...visibles.map((registro) => columnasVisibles.map((c) => String(registro[c.id] ?? '—')).join(' | '))];
  const escaparHtml = (valor: unknown) => String(valor).replace(/[&<>"']/g, (caracter) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]!);
  const tablaHtml = `<html><head><meta charset="utf-8"><style>body{font-family:Arial}h1{color:#1d396e}table{border-collapse:collapse;width:100%}th,td{border:1px solid #c9dce8;padding:7px;text-align:left}th{color:#fff;background:#0d4f81}</style></head><body><h1>${escaparHtml(titulo)}</h1>${incluirFecha ? `<p>${escaparHtml(fecha)}</p>` : ''}<table><thead><tr>${columnasVisibles.map((c) => `<th>${escaparHtml(c.etiqueta)}</th>`).join('')}</tr></thead><tbody>${visibles.map((r) => `<tr>${columnasVisibles.map((c) => `<td>${escaparHtml(r[c.id] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;

  const alternar = (id: string) => setSeleccionadas((actual) => actual.includes(id) ? (actual.length > 1 ? actual.filter((item) => item !== id) : actual) : [...actual, id]);
  return <section className="reporte-inventario">
    {error && <p role="alert">{error} <button type="button" onClick={() => setRecarga((actual) => actual + 1)}>Reintentar</button></p>}
    <div className="reporte-inventario-layout">
      <aside className="reporte-configuracion">
        <section><h3>Contenido del reporte</h3><label>Título<input value={titulo} onChange={(event) => setTitulo(event.target.value)} /></label><div className="reporte-filtros"><label>Tipo<select value={tipo} onChange={(event) => setTipo(event.target.value)}><option>Todos</option><option>Producto</option><option>Insumo</option><option>Servicio</option></select></label><label>Estado<select value={estado} onChange={(event) => setEstado(event.target.value)}><option>Todos</option><option>ACTIVO</option><option>INACTIVO</option></select></label></div><label>Sucursal<select value={sucursal} onChange={event => { setSucursal(event.target.value); setAlmacen(''); }}><option value="">Todas</option>{sucursales.map(valor => <option key={valor} value={valor}>{valor}</option>)}</select></label><label>Almacenes<select value={almacen} onChange={event => setAlmacen(event.target.value)}><option value="">Todos</option>{almacenes.map(valor => <option key={valor} value={valor}>{valor}</option>)}</select></label></section>
        <section><div className="reporte-seccion-titulo"><h3>Columnas visibles</h3><button type="button" onClick={() => setSeleccionadas(columnasIniciales)}>Seleccionar todas</button></div><div className="reporte-columnas">{columnas.map((columna) => <label key={columna.id}><input type="checkbox" checked={seleccionadas.includes(columna.id)} onChange={() => alternar(columna.id)} /><span>{columna.etiqueta}</span></label>)}</div></section>
        <section><h3>Presentación</h3><div className="reporte-orientacion"><button type="button" className={orientacion === 'vertical' ? 'activo' : ''} onClick={() => setOrientacion('vertical')}>Vertical</button><button type="button" className={orientacion === 'horizontal' ? 'activo' : ''} onClick={() => setOrientacion('horizontal')}>Horizontal</button></div><label className="reporte-check"><input type="checkbox" checked={incluirFecha} onChange={(event) => setIncluirFecha(event.target.checked)} /> Incluir fecha de generación</label></section>
        <section className="reporte-descargas"><h3>Descargar reporte</h3><div className="reporte-exportaciones"><button className="exportar-pdf" aria-label="Descargar PDF" type="button" disabled={cargando || !!error} onClick={() => descargar(crearPdf(filasTexto, orientacion === 'horizontal'), 'application/pdf', 'inventario.pdf')}><b>PDF</b><span>Descargar PDF</span></button><button className="exportar-word" aria-label="Descargar Word" type="button" disabled={cargando || !!error} onClick={() => descargar(`\ufeff${tablaHtml}`, 'application/msword', 'inventario.doc')}><b>Word</b><span>Descargar Word</span></button><button className="exportar-excel" aria-label="Descargar Excel" type="button" disabled={cargando || !!error} onClick={() => descargar(`\ufeff${tablaHtml}`, 'application/vnd.ms-excel', 'inventario.xls')}><b>Excel</b><span>Descargar Excel</span></button></div></section>
      </aside>
      <main className="reporte-vista-previa"><header><div><span>VISTA PREVIA</span><h3>{titulo || 'Reporte sin título'}</h3><small>{[incluirFecha ? fecha : '', cargando ? 'Cargando inventario…' : error ? 'No se pudo actualizar' : `${visibles.length} registros incluidos`].filter(Boolean).join(' · ')}</small></div></header><div className={`reporte-hoja ${orientacion}`} aria-busy={cargando}><table><thead><tr>{columnasVisibles.map((columna) => <th key={columna.id}>{columna.etiqueta}</th>)}</tr></thead><tbody>{visibles.map((registro, indice) => <tr key={`${registro.codigo}-${indice}`}>{columnasVisibles.map((columna) => <td key={columna.id}>{String(registro[columna.id] ?? '—')}</td>)}</tr>)}</tbody></table>{!cargando && !error && !visibles.length && <p className="reporte-vacio">No hay registros con los filtros seleccionados.</p>}</div></main>
    </div>
  </section>;
}

