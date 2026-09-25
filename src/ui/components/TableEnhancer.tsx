import { useEffect } from 'react';

const selectoresCabecera = [
  '.inventario-tabla-head',
  '.movimientos-tabla-head',
  '.usuarios-tabla-head',
  '.ventas-tabla-head',
  '.configuracion-tabla-head',
  '.cuentas-listado-cabecera',
  '.profesionales-head',
  '.traspasos-head',
].join(',');

const valorComparable = (texto: string) => {
  const limpio = texto.trim().replace(/\s+/g, ' ');
  const numero = Number(limpio.replace(/[^0-9,.-]/g, '').replace(',', '.'));
  return limpio && Number.isFinite(numero) && /\d/.test(limpio) ? numero : limpio;
};

const comparar = (a: string, b: string, direccion: 1 | -1) => {
  const valorA = valorComparable(a);
  const valorB = valorComparable(b);
  if (typeof valorA === 'number' && typeof valorB === 'number') return (valorA - valorB) * direccion;
  return String(valorA).localeCompare(String(valorB), 'es', { numeric: true, sensitivity: 'base' }) * direccion;
};

export function TableEnhancer() {
  useEffect(() => {
    const limpiar: Array<() => void> = [];

    const mejorarTablaHtml = (tabla: HTMLTableElement) => {
      if (tabla.dataset.interactiva || !tabla.tHead?.rows[0] || !tabla.tBodies[0]) return;
      tabla.dataset.interactiva = 'true';
      tabla.classList.add('tabla-interactiva');
      const celdas = [...tabla.tHead.rows[0].cells];
      celdas.forEach((celda, indice) => {
        const texto = celda.textContent?.trim().toLocaleLowerCase('es') || '';
        if (!texto.includes('acciones')) {
          celda.classList.add('tabla-columna-ordenable');
          const ordenar = (evento: MouseEvent) => {
            if ((evento.target as HTMLElement).closest('.tabla-redimensionador')) return;
            const ascendente = celda.dataset.orden !== 'asc';
            celdas.forEach((actual) => { delete actual.dataset.orden; actual.removeAttribute('aria-sort'); });
            celda.dataset.orden = ascendente ? 'asc' : 'desc';
            celda.setAttribute('aria-sort', ascendente ? 'ascending' : 'descending');
            [...tabla.tBodies[0].rows]
              .sort((a, b) => comparar(a.cells[indice]?.textContent || '', b.cells[indice]?.textContent || '', ascendente ? 1 : -1))
              .forEach((fila) => tabla.tBodies[0].appendChild(fila));
          };
          celda.addEventListener('click', ordenar);
          limpiar.push(() => celda.removeEventListener('click', ordenar));
        }

        if (indice === celdas.length - 1) return;
        const control = document.createElement('span');
        control.className = 'tabla-redimensionador';
        control.setAttribute('role', 'separator');
        control.setAttribute('aria-label', `Cambiar ancho de ${celda.textContent?.trim() || 'columna'}`);
        celda.appendChild(control);
        const iniciar = (evento: PointerEvent) => {
          evento.preventDefault(); evento.stopPropagation();
          const inicio = evento.clientX;
          const ancho = celda.getBoundingClientRect().width;
          tabla.style.tableLayout = 'fixed';
          const mover = (movimiento: PointerEvent) => { celda.style.width = `${Math.max(55, ancho + movimiento.clientX - inicio)}px`; };
          const terminar = () => { window.removeEventListener('pointermove', mover); document.body.classList.remove('inventario-redimensionando'); };
          document.body.classList.add('inventario-redimensionando');
          window.addEventListener('pointermove', mover);
          window.addEventListener('pointerup', terminar, { once: true });
        };
        control.addEventListener('pointerdown', iniciar);
        limpiar.push(() => control.removeEventListener('pointerdown', iniciar));
      });
    };

    const mejorarGrilla = (cabecera: HTMLElement) => {
      if (window.matchMedia('(max-width: 860px)').matches || cabecera.dataset.interactiva || cabecera.closest('.inventario-tabla-productos')) return;
      const raiz = cabecera.parentElement;
      if (!raiz) return;
      const celdas = [...cabecera.children] as HTMLElement[];
      if (celdas.length < 2) return;
      cabecera.dataset.interactiva = 'true';
      raiz.classList.add('tabla-interactiva');
      const filas = () => [...raiz.children].filter((elemento) => elemento !== cabecera && (elemento.matches('article') || elemento.getAttribute('role') === 'row')) as HTMLElement[];
      let columnas = getComputedStyle(cabecera).gridTemplateColumns.split(' ').filter(Boolean).map(Number.parseFloat);
      if (columnas.length !== celdas.length) columnas = celdas.map((celda) => celda.getBoundingClientRect().width);
      const aplicarColumnas = () => {
        const plantilla = columnas.map((ancho) => `${Math.max(55, ancho)}px`).join(' ');
        const anchoTotal = columnas.reduce((total, ancho) => total + Math.max(55, ancho), 0);
        [cabecera, ...filas()].forEach((fila) => {
          fila.style.gridTemplateColumns = plantilla;
          fila.style.width = `max(100%, ${anchoTotal}px)`;
          fila.style.minWidth = `${anchoTotal}px`;
        });
      };
      aplicarColumnas();

      celdas.forEach((celda, indice) => {
        const texto = celda.textContent?.trim().toLocaleLowerCase('es') || '';
        if (!texto.includes('acciones')) {
          celda.classList.add('tabla-columna-ordenable');
          const ordenar = (evento: MouseEvent) => {
            if ((evento.target as HTMLElement).closest('.tabla-redimensionador')) return;
            const ascendente = celda.dataset.orden !== 'asc';
            celdas.forEach((actual) => { delete actual.dataset.orden; actual.removeAttribute('aria-sort'); });
            celda.dataset.orden = ascendente ? 'asc' : 'desc';
            celda.setAttribute('aria-sort', ascendente ? 'ascending' : 'descending');
            filas()
              .sort((a, b) => comparar(a.children[indice]?.textContent || '', b.children[indice]?.textContent || '', ascendente ? 1 : -1))
              .forEach((fila) => raiz.appendChild(fila));
          };
          celda.addEventListener('click', ordenar);
          limpiar.push(() => celda.removeEventListener('click', ordenar));
        }
        if (indice === celdas.length - 1) return;
        const control = document.createElement('span');
        control.className = 'tabla-redimensionador';
        control.setAttribute('role', 'separator');
        control.setAttribute('aria-label', `Cambiar ancho de ${celda.textContent?.trim() || 'columna'}`);
        celda.appendChild(control);
        const iniciar = (evento: PointerEvent) => {
          evento.preventDefault(); evento.stopPropagation();
          const inicio = evento.clientX;
          const ancho = columnas[indice];
          const mover = (movimiento: PointerEvent) => { columnas[indice] = Math.max(55, ancho + movimiento.clientX - inicio); aplicarColumnas(); };
          const terminar = () => { window.removeEventListener('pointermove', mover); document.body.classList.remove('inventario-redimensionando'); };
          document.body.classList.add('inventario-redimensionando');
          window.addEventListener('pointermove', mover);
          window.addEventListener('pointerup', terminar, { once: true });
        };
        control.addEventListener('pointerdown', iniciar);
        limpiar.push(() => control.removeEventListener('pointerdown', iniciar));
      });
    };

    const buscar = () => {
      document.querySelectorAll<HTMLTableElement>('.sistema-contable table').forEach(mejorarTablaHtml);
      document.querySelectorAll<HTMLElement>(`.sistema-contable :is(${selectoresCabecera})`).forEach(mejorarGrilla);
    };
    buscar();
    const observador = new MutationObserver(buscar);
    observador.observe(document.body, { childList: true, subtree: true });
    return () => { observador.disconnect(); limpiar.forEach((retirar) => retirar()); };
  }, []);
  return null;
}
