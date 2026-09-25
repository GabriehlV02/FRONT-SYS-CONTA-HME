import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Icon from '@ui/components/Icon';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useRef } from 'react';
import { SelectMenu } from '@ui/components/SelectMenu';
import { productosDemo, serviciosDemo } from '../datos/catalogoDemo';

type ModoInventario = 'galeria' | 'listado';
type CampoOrden = 'codigo' | 'nombre' | 'tipo' | 'categoria' | 'subcategoria' | 'unidad' | 'stock' | 'precio' | 'estado' | 'serie' | 'marca';
type TipoRegistro = 'Producto' | 'Insumo' | 'Servicio';
type TipoCatalogo = 'productos' | 'servicios' | 'todo';
type RegistroInventario = {
  id?: number;
  codigo: string;
  nombre: string;
  categoria: string;
  grupo: string;
  tipo: string;
  unidadMedida: string;
  descripcion: string;
  precioVenta: number;
  stock?: number;
  marcas?: string[];
  revisionPrecio?: boolean;
  confirmarPrecio?: boolean;
  estado: 'ACTIVO' | 'INACTIVO' | 'activo' | 'inactivo';
  numeroSerie?: string;
  usarNumeroSerie?: boolean;
};
type ElementoCatalogo = {
  codigo?: string;
  nombre: string;
  categoria: string;
  marca: string;
  presentacion: string;
  origen: string;
  proveedores: number;
  disponible: number;
  descripcion?: string;
  precioVenta?: number;
  revisionPrecio?: boolean;
  stock?: number;
  estado?: string;
  numeroSerie?: string;
  usarNumeroSerie?: boolean;
};

const columnasCatalogo: Array<{ etiqueta: string; campo?: CampoOrden; minimo: number }> = [
  { etiqueta: 'Código', campo: 'codigo', minimo: 68 },
  { etiqueta: 'Nombre o identificación', campo: 'nombre', minimo: 150 },
  { etiqueta: 'Tipo', campo: 'tipo', minimo: 65 },
  { etiqueta: 'Categoría', campo: 'categoria', minimo: 90 },
  { etiqueta: 'Sub categoría', campo: 'subcategoria', minimo: 85 },
  { etiqueta: 'Unidad', campo: 'unidad', minimo: 85 },
  { etiqueta: 'Stock', campo: 'stock', minimo: 50 },
  { etiqueta: 'Precio venta', campo: 'precio', minimo: 72 },
  { etiqueta: 'Estado', campo: 'estado', minimo: 70 },
  { etiqueta: 'Serie / barras', campo: 'serie', minimo: 82 },
  { etiqueta: 'Acciones', minimo: 95 },
];

const anchosInicialesCatalogo = [85, 220, 80, 140, 110, 125, 55, 90, 85, 110, 120];

const subcategoriasPorCategoria: Record<string, string[]> = {
  'Proteccion personal': ['Guantes', 'Mascarillas', 'Respiradores'],
  'Material descartable': ['Jeringas', 'Venoclisis', 'Cateteres'],
  'Curacion y heridas': ['Gasas', 'Vendas', 'Antisepticos'],
  Medicamentos: ['Analgesicos', 'Antibioticos', 'Inyectables'],
  Diagnostico: ['Laboratorio', 'Imagenologia', 'Consulta'],
  Procedimientos: ['Ambulatorios', 'Quirofano', 'Terapias'],
};

const normalizarTexto = (valor: string | undefined | null) =>
  String(valor ?? '').trim().toUpperCase();

const normalizarEstadoFormulario = (
  valor: string | undefined | null,
): 'activo' | 'inactivo' => {
  const estado = normalizarTexto(valor);
  return estado === 'INACTIVO' ? 'inactivo' : 'activo';
};

const normalizarBusqueda = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');

const crearPrefijoCodigo = (valor: string) =>
  normalizarBusqueda(valor)
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((parte) => parte.slice(0, 2).toUpperCase())
    .join('')
    .slice(0, 6);

const registrosDemoIniciales: RegistroInventario[] = [
  ...productosDemo.map((producto, indice) => ({
    id: indice + 1,
    codigo: `ITM-${String(indice + 1).padStart(4, '0')}`,
    nombre: producto.nombre,
    categoria: producto.categoria,
    grupo: 'General',
    tipo: indice % 2 === 0 ? 'Insumo' : 'Producto',
    unidadMedida: producto.presentacion,
    descripcion: producto.descripcion,
    precioVenta: 15 + (indice % 10) * 12,
    stock: producto.disponible ? 10 + (indice % 8) * 5 : 0,
    marcas: [producto.marca],
    estado: producto.disponible ? ('ACTIVO' as const) : ('INACTIVO' as const),
  })),
  ...serviciosDemo.map((servicio, indice) => ({
    id: productosDemo.length + indice + 1,
    codigo: `SRV-${String(indice + 1).padStart(4, '0')}`,
    nombre: servicio.nombre,
    categoria: servicio.categoria,
    grupo: 'General',
    tipo: 'Servicio',
    unidadMedida: servicio.presentacion,
    descripcion: servicio.descripcion,
    precioVenta: 50 + (indice % 12) * 25,
    stock: 0,
    marcas: [servicio.marca],
    estado: 'ACTIVO' as const,
  })),
];

export function CatalogoView({ tipo, onReportes }: { tipo: TipoCatalogo; onReportes?: () => void }) {
  const subvista = tipo;
  const [modo, setModo] = useState<ModoInventario>('listado');
  const [porPagina, setPorPagina] = useState<number | 'Todos'>(10);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [direccion, setDireccion] = useState<'asc' | 'desc'>('asc');
  const [campoOrden, setCampoOrden] = useState<CampoOrden | ''>('');
  const [anchosColumnas, setAnchosColumnas] = useState<number[]>(() => {
    try {
      const guardados = JSON.parse(localStorage.getItem('inventario-anchos-columnas') || '[]');
      return Array.isArray(guardados) && guardados.length === columnasCatalogo.length
        ? guardados.map((ancho, indice) => Math.max(columnasCatalogo[indice].minimo, Number(ancho) || anchosInicialesCatalogo[indice]))
        : anchosInicialesCatalogo;
    } catch {
      return anchosInicialesCatalogo;
    }
  });
  const [tablaCompacta, setTablaCompacta] = useState(() => window.matchMedia('(max-width: 860px)').matches);
  const [columnasGaleria, setColumnasGaleria] = useState(1);
  const galeriaRef = useRef<HTMLDivElement>(null);
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [detalleRegistro, setDetalleRegistro] = useState<RegistroInventario | null>(null);
  const [edicionRegistro, setEdicionRegistro] = useState<RegistroInventario | null>(null);
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>(
    tipo === 'servicios' ? 'Servicio' : 'Producto',
  );
  const [categoriaRegistro, setCategoriaRegistro] = useState('');
  const [subcategoriaRegistro, setSubcategoriaRegistro] = useState('');
  const [serieHabilitada, setSerieHabilitada] = useState(false);
  const [registrosGuardados, setRegistrosGuardados] = useState<RegistroInventario[]>(registrosDemoIniciales);
  const [mensajeGuardado, setMensajeGuardado] = useState('');
  const [formularioRegistro, setFormularioRegistro] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    unidadMedida: '',
    tipo: tipo === 'servicios' ? 'Servicio' : 'Producto' as TipoRegistro,
    categoria: '',
    grupo: '',
    precioVenta: '',
    estado: 'activo' as 'activo' | 'inactivo',
    numeroSerie: '',
    usarNumeroSerie: false,
  });

  async function cargarRegistros() {
    try {
      const respuesta = await fetch('/api/inventario');
      if (!respuesta.ok) throw new Error('No se pudo cargar el inventario.');
      const datos = (await respuesta.json().catch(() => ({ data: [] }))) as {
        data?: RegistroInventario[];
      };
      const siguientes = Array.isArray(datos.data) ? datos.data : [];
      if (siguientes.length > 0) {
        setRegistrosGuardados(siguientes);
        return siguientes;
      }
      setRegistrosGuardados(registrosDemoIniciales);
      return registrosDemoIniciales;
    } catch {
      setRegistrosGuardados(registrosDemoIniciales);
      return registrosDemoIniciales;
    }
  }

  useEffect(() => {
    let cancelado = false;

    void (async () => {
      const registros = await cargarRegistros();
      if (cancelado) return;
      void registros;
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    const consulta = window.matchMedia('(max-width: 860px)');
    const actualizar = () => setTablaCompacta(consulta.matches);
    consulta.addEventListener('change', actualizar);
    return () => consulta.removeEventListener('change', actualizar);
  }, []);

  useEffect(() => {
    if (modo !== 'galeria' || !galeriaRef.current) return;
    const galeria = galeriaRef.current;
    const medir = () => {
      const columnas = getComputedStyle(galeria).gridTemplateColumns.split(' ').filter(Boolean).length;
      setColumnasGaleria(Math.max(1, columnas));
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(galeria);
    return () => observador.disconnect();
  }, [modo]);

  const titulo =
    subvista === 'servicios'
      ? 'Servicios'
      : subvista === 'todo'
        ? 'Vista general'
        : 'Productos e insumos';
  const esServicio = subvista === 'servicios';
  const esVistaGeneral = subvista === 'todo';
  const elementosDemo = useMemo<ElementoCatalogo[]>(() => {
    if (registrosGuardados.length > 0) {
      const registrosDeVista = registrosGuardados.filter((registro) => {
        const tipoRegistroGuardado = normalizarTexto(registro.tipo);
        return esVistaGeneral
          || (esServicio
            ? tipoRegistroGuardado === 'SERVICIO'
            : tipoRegistroGuardado === 'PRODUCTO' || tipoRegistroGuardado === 'INSUMO');
      });

      return registrosDeVista.map((registro) => ({
        codigo: registro.codigo,
        nombre: normalizarTexto(registro.nombre),
        categoria: normalizarTexto(registro.categoria),
        marca: registro.marcas?.join(', ') || 'Sin ingresos',
        revisionPrecio: registro.revisionPrecio,
        presentacion: normalizarTexto(registro.unidadMedida),
        origen: normalizarTexto(registro.tipo),
        proveedores: 1,
        disponible: normalizarTexto(registro.estado) === 'ACTIVO' ? 1 : 0,
        precioVenta: Number(registro.precioVenta || 0),
        stock: registro.stock ?? 0,
        estado: normalizarTexto(registro.estado) === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO',
        numeroSerie: registro.numeroSerie || '',
        usarNumeroSerie: Boolean(registro.usarNumeroSerie),
      }));
    }

    return [];
  }, [esServicio, esVistaGeneral, registrosGuardados]);
  const nombreElemento = esServicio
    ? 'servicio'
    : esVistaGeneral
      ? 'registro'
      : 'producto';
  const nombreElementos = esServicio
    ? 'servicios'
    : esVistaGeneral
      ? 'registros'
      : 'productos';
  const categorias = useMemo(
    () =>
      [...new Set(elementosDemo.map((producto) => producto.categoria))].sort(),
    [elementosDemo],
  );
  const subcategoriasDisponibles = useMemo(() => {
    const existentes = categoriaRegistro
      ? subcategoriasPorCategoria[categoriaRegistro] ?? []
      : [];
    return existentes.length > 0 ? existentes : ['General'];
  }, [categoriaRegistro]);
  const codigoRegistro = useMemo(() => {
    const categoriaBase = categoriaRegistro || categorias[0] || 'Catalogo';
    const subcategoriaBase = subcategoriaRegistro || subcategoriasDisponibles[0];
    const prefijoCategoria = crearPrefijoCodigo(categoriaBase) || 'CAT';
    const prefijoSubcategoria = crearPrefijoCodigo(subcategoriaBase) || 'GEN';
    const correlativo = String(elementosDemo.length + 1).padStart(4, '0');
    return `${prefijoCategoria}-${prefijoSubcategoria}-${correlativo}`;
  }, [
    categoriaRegistro,
    categorias,
    elementosDemo.length,
    subcategoriaRegistro,
    subcategoriasDisponibles,
  ]);

  useEffect(() => {
    setFormularioRegistro((actual) => ({
      ...actual,
      codigo: codigoRegistro,
      categoria: categoriaRegistro,
      grupo: subcategoriaRegistro,
      tipo: tipoRegistro,
      usarNumeroSerie: serieHabilitada,
    }));
  }, [categoriaRegistro, codigoRegistro, serieHabilitada, subcategoriaRegistro, tipoRegistro]);
  const obtenerDatosTabla = (producto: (typeof elementosDemo)[number]) => {
    const categoriaProducto = producto.categoria;
    const subcategorias = subcategoriasPorCategoria[categoriaProducto] ?? [
      'General',
    ];
    const subcategoria =
      subcategorias.find((item) =>
        normalizarBusqueda(producto.nombre).includes(
          normalizarBusqueda(item.slice(0, 5)),
        ),
      ) ?? subcategorias[0];
    const codigo =
      typeof producto.codigo === 'string' && producto.codigo.trim()
        ? producto.codigo
        : `${crearPrefijoCodigo(categoriaProducto) || 'CAT'}-${
            crearPrefijoCodigo(subcategoria) || 'GEN'
          }-${String(elementosDemo.indexOf(producto) + 1).padStart(4, '0')}`;
    const esServicioTabla = normalizarTexto(producto.origen) === 'SERVICIO';
    const tipoProducto: TipoRegistro =
      typeof producto.origen === 'string' && producto.origen
        ? (normalizarTexto(producto.origen) === 'SERVICIO'
            ? 'Servicio'
            : normalizarTexto(producto.origen) === 'INSUMO'
              ? 'Insumo'
              : 'Producto')
        : esServicioTabla
          ? 'Servicio'
          : producto.categoria === 'Medicamentos'
            ? 'Insumo'
            : 'Producto';
    const unidad =
      typeof producto.presentacion === 'string' && producto.presentacion
        ? producto.presentacion
        : esServicioTabla
          ? 'Servicio'
          : 'Unidad';
    const precio =
      typeof producto.precioVenta === 'number' && Number.isFinite(producto.precioVenta)
        ? producto.precioVenta
        : esServicioTabla
          ? 80 + (elementosDemo.indexOf(producto) % 8) * 25
          : 12 + producto.disponible * 7 + (elementosDemo.indexOf(producto) % 5) * 4;
    const serie =
      typeof producto.numeroSerie === 'string' && producto.numeroSerie.trim()
        ? producto.numeroSerie
        : !esServicioTabla && producto.disponible > 1
          ? codigo.replaceAll('-', '')
          : 'Sin serie';
    const stock =
      typeof producto.stock === 'number' && Number.isFinite(producto.stock)
        ? producto.stock
        : esServicioTabla
          ? producto.disponible
          : producto.disponible * 12;
    const estado =
      typeof producto.estado === 'string' && producto.estado
        ? normalizarTexto(producto.estado) === 'ACTIVO'
          ? 'Activo'
          : 'Inactivo'
        : 'Activo';

    return {
      codigo,
      estado,
      precio: `Bs ${precio.toFixed(2)}`,
      serie,
      stock,
      subcategoria,
      tipoProducto,
      unidad,
    };
  };
  const productosFiltrados = useMemo(() => {
    const termino = normalizarBusqueda(busqueda.trim());
    const factor = direccion === 'asc' ? 1 : -1;
    return elementosDemo
      .filter(
        (producto) => categoria === 'todas' || producto.categoria === categoria,
      )
      .filter(
        (producto) =>
          !termino ||
          [
            producto.nombre,
            producto.categoria,
            producto.marca,
            producto.presentacion,
            producto.origen,
          ].some((valor) => normalizarBusqueda(valor).includes(termino)),
      )
      .sort((a, b) => {
        if (!campoOrden) return 0;
        const datosA = obtenerDatosTabla(a);
        const datosB = obtenerDatosTabla(b);
        const obtenerValor = (producto: ElementoCatalogo, datos: ReturnType<typeof obtenerDatosTabla>) => {
          switch (campoOrden) {
            case 'codigo': return datos.codigo;
            case 'nombre': return producto.nombre;
            case 'tipo': return datos.tipoProducto;
            case 'categoria': return producto.categoria;
            case 'subcategoria': return datos.subcategoria;
            case 'unidad': return datos.unidad;
            case 'stock': return datos.stock;
            case 'precio': return producto.precioVenta ?? 0;
            case 'estado': return datos.estado;
            case 'serie': return datos.serie;
            case 'marca': return producto.marca;
            default: return '';
          }
        };
        const valorA = obtenerValor(a, datosA);
        const valorB = obtenerValor(b, datosB);
        if (typeof valorA === 'number' && typeof valorB === 'number') {
          return (valorA - valorB) * factor;
        }
        return (
          String(valorA).localeCompare(String(valorB), 'es', {
            numeric: true,
            sensitivity: 'base',
          }) * factor
        );
      });
  }, [busqueda, campoOrden, categoria, direccion, elementosDemo]);
  const cantidadPorPagina = porPagina === 'Todos'
    ? Math.max(productosFiltrados.length, 1)
    : modo === 'galeria'
      ? porPagina * columnasGaleria
      : porPagina;
  const totalPaginas = Math.max(
    1,
    Math.ceil(productosFiltrados.length / cantidadPorPagina),
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const desde = (paginaActual - 1) * cantidadPorPagina;
  const productosPagina = useMemo(
    () => productosFiltrados.slice(desde, desde + cantidadPorPagina),
    [cantidadPorPagina, desde, productosFiltrados],
  );

  function actualizarFiltro(actualizar: () => void) {
    actualizar();
    setPagina(1);
  }

  function cambiarPorPagina(valor: string) {
    setPorPagina(valor === 'Todos' ? 'Todos' : Number(valor));
    setPagina(1);
  }

  function cambiarModo(siguiente: ModoInventario) {
    setModo(siguiente);
    setPagina(1);
    setPorPagina(siguiente === 'galeria' ? 5 : 10);
  }

  function ordenarPor(campo: CampoOrden) {
    setPagina(1);
    if (campoOrden === campo) {
      setDireccion((actual) => actual === 'asc' ? 'desc' : 'asc');
    } else {
      setCampoOrden(campo);
      setDireccion('asc');
    }
  }

  function iniciarRedimension(indice: number, event: ReactPointerEvent<HTMLSpanElement>) {
    event.preventDefault();
    event.stopPropagation();
    const inicioX = event.clientX;
    const anchoInicial = anchosColumnas[indice];
    const minimo = columnasCatalogo[indice].minimo;

    const mover = (movimiento: PointerEvent) => {
      const siguiente = Math.max(minimo, anchoInicial + movimiento.clientX - inicioX);
      setAnchosColumnas((actuales) => actuales.map((ancho, posicion) => posicion === indice ? siguiente : ancho));
    };
    const terminar = () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', terminar);
      document.body.classList.remove('inventario-redimensionando');
      setAnchosColumnas((actuales) => {
        try { localStorage.setItem('inventario-anchos-columnas', JSON.stringify(actuales)); } catch { /* Preferencia opcional. */ }
        return actuales;
      });
    };

    document.body.classList.add('inventario-redimensionando');
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', terminar, { once: true });
  }

  const estiloColumnas = {
    '--inventario-columnas': anchosColumnas.map((ancho) => `${ancho}px`).join(' '),
    '--inventario-ancho-tabla': `${anchosColumnas.reduce((total, ancho) => total + ancho, 0)}px`,
  } as CSSProperties;
  const estiloGrilla = tablaCompacta ? undefined : {
    gridTemplateColumns: anchosColumnas.map((ancho) => `${ancho}px`).join(' '),
    width: `max(100%, ${anchosColumnas.reduce((total, ancho) => total + ancho, 0)}px)`,
    minWidth: `${anchosColumnas.reduce((total, ancho) => total + ancho, 0)}px`,
  } as CSSProperties;

  function actualizarCampoRegistro<K extends keyof typeof formularioRegistro>(
    campo: K,
    valor: (typeof formularioRegistro)[K],
  ) {
    setFormularioRegistro((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function guardarRegistroInventario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensajeGuardado('');

    const payload: RegistroInventario = {
      codigo: normalizarTexto(formularioRegistro.codigo || codigoRegistro),
      nombre: normalizarTexto(formularioRegistro.nombre),
      descripcion: normalizarTexto(formularioRegistro.descripcion),
      unidadMedida: normalizarTexto(formularioRegistro.unidadMedida),
      tipo: normalizarTexto(formularioRegistro.tipo),
      categoria: normalizarTexto(formularioRegistro.categoria || categoriaRegistro),
      grupo: normalizarTexto(formularioRegistro.grupo || subcategoriaRegistro),
      precioVenta: Number(formularioRegistro.precioVenta || 0),
      estado:
        normalizarTexto(formularioRegistro.estado) === 'INACTIVO'
          ? 'INACTIVO'
          : 'ACTIVO',
      numeroSerie: formularioRegistro.usarNumeroSerie
        ? normalizarTexto(formularioRegistro.numeroSerie)
        : '',
      usarNumeroSerie: formularioRegistro.usarNumeroSerie,
    };

    if (
      !payload.nombre ||
      !payload.descripcion ||
      !payload.categoria ||
      !payload.grupo ||
      !payload.unidadMedida ||
      Number.isNaN(payload.precioVenta)
    ) {
      return;
    }

    try {
      const respuesta = await fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudo guardar el registro.');
      }

      const respuestaJson = (await respuesta.json().catch(() => ({}))) as {
        data?: RegistroInventario;
      };
      if (respuestaJson.data) {
        setRegistrosGuardados((actual) => [...actual, respuestaJson.data!]);
      }
    } catch (error) {
      setMensajeGuardado(error instanceof Error ? error.message : 'No se pudo guardar el registro.');
      return;
    }

    setFormularioRegistro({
      codigo: '',
      nombre: '',
      descripcion: '',
      unidadMedida: '',
      tipo: tipo === 'servicios' ? 'Servicio' : 'Producto',
      categoria: '',
      grupo: '',
      precioVenta: '',
      estado: 'activo',
      numeroSerie: '',
      usarNumeroSerie: false,
    });
    setCategoriaRegistro('');
    setSubcategoriaRegistro('');
    setSerieHabilitada(false);
    setModalRegistroAbierto(false);
  }

  async function guardarEdicionRegistro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensajeGuardado('');
    if (!edicionRegistro) return;

    const payload: RegistroInventario = {
      ...edicionRegistro,
      codigo: normalizarTexto(edicionRegistro.codigo),
      nombre: normalizarTexto(edicionRegistro.nombre),
      descripcion: normalizarTexto(edicionRegistro.descripcion),
      tipo: normalizarTexto(edicionRegistro.tipo),
      categoria: normalizarTexto(edicionRegistro.categoria),
      grupo: normalizarTexto(edicionRegistro.grupo),
      unidadMedida: normalizarTexto(edicionRegistro.unidadMedida),
      precioVenta: Number(edicionRegistro.precioVenta || 0),
      estado:
        normalizarTexto(edicionRegistro.estado) === 'INACTIVO'
          ? 'INACTIVO'
          : 'ACTIVO',
      numeroSerie: edicionRegistro.usarNumeroSerie
        ? normalizarTexto(edicionRegistro.numeroSerie || '')
        : '',
    };

    try {
      const id = edicionRegistro.id ?? edicionRegistro.codigo;
      const respuesta = await fetch(`/api/inventario/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudo actualizar el registro.');
      }

      const respuestaJson = (await respuesta.json().catch(() => ({ data: payload }))) as {
        data?: RegistroInventario;
      };
      const actualizado = respuestaJson.data || payload;
      setRegistrosGuardados((actual) =>
        actual.map((item) =>
          (item.id ?? item.codigo) === (actualizado.id ?? actualizado.codigo)
            ? actualizado
            : item,
        ),
      );
      await cargarRegistros();
      setMensajeGuardado('Cambios guardados correctamente');
      window.setTimeout(() => setMensajeGuardado(''), 2200);
    } catch (error) {
      setMensajeGuardado(error instanceof Error ? error.message : 'No se pudo actualizar el registro.');
      return;
    }

    setEdicionRegistro(null);
  }

  const controlesSuperiores = (
    <div className="inventario-paginacion inventario-paginacion-superior">
      <span className="inventario-contador">
        {productosFiltrados.length} {nombreElementos}
      </span>
      <span>
        {productosFiltrados.length === 0 ? 0 : desde + 1}-
        {Math.min(desde + cantidadPorPagina, productosFiltrados.length)} de{' '}
        {productosFiltrados.length}
        {modo === 'galeria' && <> · {porPagina} filas × {columnasGaleria} por fila</>}
      </span>
      <div className="inventario-paginas">
        <label className="inventario-cantidad-vista">
          <span>Filas</span>
          <SelectMenu
            className="inventario-cantidad-select"
            value={String(porPagina)}
            onChange={cambiarPorPagina}
            ariaLabel={`${nombreElementos} visibles por página`}
            options={modo === 'galeria' ? ['5', '10', '15'] : ['10', '15', '20']}
          />
        </label>
        <div
          className="inventario-modo inventario-modo-paginacion"
          role="group"
          aria-label="Modo de visualización"
        >
          <button
            className={modo === 'listado' ? 'activo' : ''}
            aria-pressed={modo === 'listado'}
            onClick={() => cambiarModo('listado')}
          >
            <Icon name="menu" size={16} /> Listado
          </button>
          <button
            className={modo === 'galeria' ? 'activo' : ''}
            aria-pressed={modo === 'galeria'}
            onClick={() => cambiarModo('galeria')}
          >
            <Icon name="image" size={16} /> Galería
          </button>
        </div>
        <button
          disabled={paginaActual === 1}
          onClick={() => setPagina(1)}
          aria-label="Primera pagina"
        >
          {'<<'}
        </button>
        <button
          disabled={paginaActual === 1}
          onClick={() => setPagina(paginaActual - 1)}
          aria-label="Pagina anterior"
        >
          {'<'}
        </button>
        <strong>
          Pagina {paginaActual} de {totalPaginas}
        </strong>
        <button
          disabled={paginaActual === totalPaginas}
          onClick={() => setPagina(paginaActual + 1)}
          aria-label="Pagina siguiente"
        >
          {'>'}
        </button>
        <button
          disabled={paginaActual === totalPaginas}
          onClick={() => setPagina(totalPaginas)}
          aria-label="Ultima pagina"
        >
          {'>>'}
        </button>
      </div>
    </div>
  );

  const controles = (
    <div className="inventario-paginacion">
      <span>
        {productosFiltrados.length === 0 ? 0 : desde + 1}-
        {Math.min(desde + cantidadPorPagina, productosFiltrados.length)} de{' '}
        {productosFiltrados.length}
      </span>
      <label>
        {modo === 'galeria' ? 'Filas' : 'Mostrar'}
        <SelectMenu
          className="inventario-cantidad-select"
          value={String(porPagina)}
          onChange={cambiarPorPagina}
          ariaLabel="Productos por página"
          options={modo === 'galeria' ? ['5', '10', '15'] : ['10', '15', '20']}
        />
        {modo === 'listado' && nombreElementos}
      </label>
      <div className="inventario-paginas">
        <button
          disabled={paginaActual === 1}
          onClick={() => setPagina(1)}
          aria-label="Primera pagina"
        >
          {'<<'}
        </button>
        <button
          disabled={paginaActual === 1}
          onClick={() => setPagina(paginaActual - 1)}
          aria-label="Pagina anterior"
        >
          {'<'}
        </button>
        <strong>
          Pagina {paginaActual} de {totalPaginas}
        </strong>
        <button
          disabled={paginaActual === totalPaginas}
          onClick={() => setPagina(paginaActual + 1)}
          aria-label="Pagina siguiente"
        >
          {'>'}
        </button>
        <button
          disabled={paginaActual === totalPaginas}
          onClick={() => setPagina(totalPaginas)}
          aria-label="Ultima pagina"
        >
          {'>>'}
        </button>
      </div>
    </div>
  );

  return (
    <section className="inventario-catalogo">
      <div className="inventario-contenido">
        <div className="inventario-controles-principales">
          <div className="inventario-filtros inventario-filtros-productos">
            <label>
              <Icon name="search" size={17} />
              <input
                value={busqueda}
                onChange={(event) =>
                  actualizarFiltro(() => setBusqueda(event.target.value))
                }
                placeholder={`Buscar ${
                  esServicio
                    ? 'servicio'
                    : esVistaGeneral
                      ? 'producto, insumo o servicio'
                      : 'producto o insumo'
                }`}
                aria-label={`Buscar ${nombreElemento}`}
              />
            </label>
            <select
              value={direccion}
              onChange={(event) =>
                actualizarFiltro(() =>
                  setDireccion(event.target.value as 'asc' | 'desc'),
                )
              }
              aria-label="Direccion de orden"
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
            <select
              value={categoria}
              onChange={(event) =>
                actualizarFiltro(() => setCategoria(event.target.value))
              }
              aria-label="Filtrar por categoria"
            >
              <option value="todas">Todas las categorias</option>
              {categorias.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <SelectMenu
              className="inventario-orden inventario-orden-menu"
              value={campoOrden ? ({ codigo: 'Código', nombre: `Nombre del ${nombreElemento}`, categoria: 'Categoría', marca: 'Marca' } as Record<CampoOrden, string>)[campoOrden] : 'Ordenar por:'}
              options={['Ordenar por:', 'Código', `Nombre del ${nombreElemento}`, 'Categoría', 'Marca']}
              ariaLabel="Campo para ordenar"
              onChange={(opcion) => actualizarFiltro(() => setCampoOrden(({ Código: 'codigo', [`Nombre del ${nombreElemento}`]: 'nombre', Categoría: 'categoria', Marca: 'marca' } as Record<string, CampoOrden>)[opcion] || ''))}
            />
          </div>
          <div className="inventario-toolbar">
            {onReportes && (
              <button className="inventario-reportes-accion" type="button" onClick={onReportes}>
                <Icon name="audit" size={17} /> Reportes
              </button>
            )}
            <button
              className="inventario-nuevo"
              type="button"
              onClick={() => setModalRegistroAbierto(true)}
            >
              <Icon name="plus" size={17} /> Registro
            </button>
          </div>
        </div>
        {controlesSuperiores}
        {modo === 'listado' ? (
          <div
            className="inventario-tabla inventario-tabla-productos"
            role="table"
            aria-label={titulo}
            style={estiloColumnas}
          >
            <div className="inventario-tabla-head" role="row" style={estiloGrilla}>
              {columnasCatalogo.map((columna, indice) => (
                <span
                  className={columna.campo ? 'inventario-columna-ordenable' : ''}
                  role="columnheader"
                  aria-sort={columna.campo && campoOrden === columna.campo ? (direccion === 'asc' ? 'ascending' : 'descending') : undefined}
                  key={columna.etiqueta}
                >
                  {columna.campo ? (
                    <button type="button" onClick={() => ordenarPor(columna.campo!)}>
                      <span>{columna.etiqueta}</span>
                      <i aria-hidden="true">{campoOrden === columna.campo ? (direccion === 'asc' ? '▲' : '▼') : '↕'}</i>
                    </button>
                  ) : columna.etiqueta}
                  {indice < columnasCatalogo.length - 1 && (
                    <span
                      className="inventario-redimensionador"
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Cambiar ancho de ${columna.etiqueta}`}
                      onPointerDown={(event) => iniciarRedimension(indice, event)}
                    />
                  )}
                </span>
              ))}
            </div>
            {productosPagina.map((producto) => {
              const datosTabla = obtenerDatosTabla(producto);
              return (
                <article
                  className={`inventario-row${producto.revisionPrecio ? ' requiere-revision' : ''}`}
                  role="row"
                  key={producto.nombre}
                  style={estiloGrilla}
                >
                      <span className="inventario-codigo">{datosTabla.codigo}</span>
                  <div className="inventario-producto-cell">
                    <strong>{producto.nombre}{producto.revisionPrecio && <small> - Precio provisional: revision pendiente</small>}</strong>
                  </div>
                  <span className="inventario-chip">{datosTabla.tipoProducto}</span>
                  <span className="inventario-chip">{producto.categoria}</span>
                  <span>{datosTabla.subcategoria}</span>
                  <span>{datosTabla.unidad}</span>
                  <span className="inventario-stock">{datosTabla.stock}</span>
                  <span className="inventario-precio">{datosTabla.precio}</span>
                      <span
                    className={`inventario-disponible ${
                      normalizarTexto(datosTabla.estado) === 'ACTIVO'
                        ? 'activo'
                        : 'inactivo'
                    }`}
                  >
                    <i />{' '}
                    {normalizarTexto(datosTabla.estado) === 'ACTIVO'
                      ? 'ACTIVO'
                      : 'INACTIVO'}
                  </span>
                  <span className="inventario-serie">{datosTabla.serie}</span>
                  <div className="inventario-acciones">
                    <button
                      type="button"
                      aria-label={`Ver ${producto.nombre}`}
                      onClick={() => {
                        const registroBase =
                          registrosGuardados.find(
                            (item) =>
                              item.codigo === producto.codigo,
                          ) || {
                            id: Date.now() + Math.random(),
                            codigo: datosTabla.codigo,
                            nombre: producto.nombre,
                            categoria: producto.categoria,
                            grupo: datosTabla.subcategoria,
                            tipo: datosTabla.tipoProducto,
                            unidadMedida: datosTabla.unidad,
                            descripcion: 'Registro sin descripcion adicional.',
                            precioVenta: Number(
                              datosTabla.precio.replace(/[^0-9.]/g, ''),
                            ),
                            estado:
                              normalizarTexto(datosTabla.estado) === 'ACTIVO'
                                ? 'activo'
                                : 'inactivo',
                            numeroSerie: datosTabla.serie === 'Sin serie' ? '' : datosTabla.serie,
                            usarNumeroSerie: datosTabla.serie !== 'Sin serie',
                          };
                        setDetalleRegistro({
                          ...registroBase,
                          estado: String(registroBase.estado ?? 'activo').toLowerCase() as 'activo' | 'inactivo',
                        });
                      }}
                    >
                      <Icon name="eye" size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const registroBase =
                          registrosGuardados.find(
                            (item) =>
                              item.codigo === producto.codigo,
                          ) || {
                            id: Date.now() + Math.random(),
                            codigo: datosTabla.codigo,
                            nombre: producto.nombre,
                            categoria: producto.categoria,
                            grupo: datosTabla.subcategoria,
                            tipo: datosTabla.tipoProducto,
                            unidadMedida: datosTabla.unidad,
                            descripcion: 'Registro sin descripcion adicional.',
                            precioVenta: Number(
                              datosTabla.precio.replace(/[^0-9.]/g, ''),
                            ),
                            estado: normalizarTexto(datosTabla.estado) === 'ACTIVO' ? 'activo' : 'inactivo',
                            numeroSerie: datosTabla.serie === 'Sin serie' ? '' : datosTabla.serie,
                            usarNumeroSerie: datosTabla.serie !== 'Sin serie',
                          };
                        setEdicionRegistro({
                          ...registroBase,
                          confirmarPrecio: false,
                          estado: normalizarEstadoFormulario(registroBase.estado),
                        });
                      }}
                    >
                      Editar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="inventario-galeria" aria-label={titulo} ref={galeriaRef}>
            {productosPagina.map((producto) => {
              const datos = obtenerDatosTabla(producto);
              return <article className={`inventario-card inventario-card-compacta${producto.revisionPrecio ? ' requiere-revision' : ''}`} key={producto.nombre}>
                <div className="inventario-card-imagen">
                  <small>{producto.categoria}</small>
                  <span>{producto.nombre.split(' ').slice(0, 2).map((palabra) => palabra[0]).join('')}</span>
                  <strong><i /> {datos.estado}</strong>
                </div>
                <div className="inventario-card-cuerpo">
                  <small>{datos.codigo}</small>
                  <h3>{producto.nombre}</h3>
                  <p>{datos.tipoProducto}{!esServicio && <> · Stock {datos.stock}</>}</p>
                  {producto.revisionPrecio && <em>Precio pendiente de revisión</em>}
                </div>
                <footer className="inventario-card-pie">
                  <div><b>{datos.precio}</b><small>{datos.unidad}</small></div>
                  <div className="inventario-card-actions">
                    <button type="button"><Icon name="eye" size={15} /> Ver</button>
                    <button type="button">Editar</button>
                  </div>
                </footer>
              </article>;
            })}
          </div>
        )}
        {controles}
      </div>
      {detalleRegistro && (
        <div
          className="inventario-modal-fondo"
          role="presentation"
          onMouseDown={() => setDetalleRegistro(null)}
        >
          <section
            className="inventario-modal inventario-modal-registro"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventario-modal-detalle-titulo"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Detalle del registro</span>
                <h3 id="inventario-modal-detalle-titulo">{detalleRegistro.nombre}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetalleRegistro(null)}
                aria-label="Cerrar detalle"
              >
                <Icon name="close" size={18} />
              </button>
            </header>
            <div className="inventario-modal-cuerpo inventario-modal-registro-grid">
              <label>
                <span>Codigo</span>
                <input value={detalleRegistro.codigo} readOnly />
              </label>
              <label>
                <span>Nombre</span>
                <input value={detalleRegistro.nombre} readOnly />
              </label>
              <label className="inventario-campo-completo">
                <span>Descripcion</span>
                <textarea value={detalleRegistro.descripcion} readOnly rows={4} />
              </label>
              <label>
                <span>Tipo</span>
                <input value={detalleRegistro.tipo} readOnly />
              </label>
              <label>
                <span>Categoria</span>
                <input value={detalleRegistro.categoria} readOnly />
              </label>
              <label>
                <span>Grupo</span>
                <input value={detalleRegistro.grupo} readOnly />
              </label>
              <label>
                <span>Unidad</span>
                <input value={detalleRegistro.unidadMedida} readOnly />
              </label>
              <label>
                <span>Precio</span>
                <input value={`Bs ${Number(detalleRegistro.precioVenta || 0).toFixed(2)}`} readOnly />
              </label>
              <label>
                <span>Estado</span>
                <input
                  value={
                    normalizarTexto(detalleRegistro.estado) === 'ACTIVO'
                      ? 'Activo'
                      : 'Inactivo'
                  }
                  readOnly
                />
              </label>
              <label>
                <span>Serie</span>
                <input value={detalleRegistro.usarNumeroSerie ? detalleRegistro.numeroSerie || 'Sin serie' : 'Sin serie'} readOnly />
              </label>
            </div>
            <footer>
              <button
                className="inventario-secundario"
                type="button"
                onClick={() => setDetalleRegistro(null)}
              >
                Cerrar
              </button>
            </footer>
          </section>
        </div>
      )}

      {edicionRegistro && (
        <div
          className="inventario-modal-fondo"
          role="presentation"
          onMouseDown={() => setEdicionRegistro(null)}
        >
          <section
            className="inventario-modal inventario-modal-registro"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventario-modal-editar-titulo"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Editar registro</span>
                <h3 id="inventario-modal-editar-titulo">{edicionRegistro.nombre}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEdicionRegistro(null)}
                aria-label="Cerrar edición"
              >
                <Icon name="close" size={18} />
              </button>
            </header>
            <form onSubmit={guardarEdicionRegistro}>
              {mensajeGuardado && <p role="alert">{mensajeGuardado}</p>}
              <div className="inventario-modal-cuerpo inventario-modal-registro-grid">
                <label>
                  <span>Codigo</span>
                  <input
                    value={edicionRegistro.codigo}
                    readOnly
                    disabled
                  />
                </label>
                <label>
                  <span>Nombre o identificacion</span>
                  <input
                    required
                    value={edicionRegistro.nombre}
                    onChange={(event) =>
                      setEdicionRegistro((actual) =>
                        actual ? { ...actual, nombre: event.target.value } : actual,
                      )
                    }
                  />
                </label>
                <label className="inventario-campo-completo">
                  <span>Descripcion</span>
                  <textarea
                    required
                    rows={3}
                    value={edicionRegistro.descripcion}
                    onChange={(event) =>
                      setEdicionRegistro((actual) =>
                        actual ? { ...actual, descripcion: event.target.value } : actual,
                      )
                    }
                  />
                </label>
                <label>
                  <span>Unidad de medida</span>
                  <select
                    required
                    value={edicionRegistro.unidadMedida}
                    onChange={(event) =>
                      setEdicionRegistro((actual) =>
                        actual ? { ...actual, unidadMedida: event.target.value } : actual,
                      )
                    }
                  >
                    <option value="">Seleccionar</option>
                    <option value="Unidad">Unidad</option>
                    <option value="Caja">Caja</option>
                    <option value="Paquete">Paquete</option>
                    <option value="Frasco">Frasco</option>
                    <option value="Servicio">Servicio</option>
                  </select>
                </label>
                <label>
                  <span>Tipo</span>
                  <select
                    value={edicionRegistro.tipo}
                    onChange={(event) =>
                      setEdicionRegistro((actual) =>
                        actual ? { ...actual, tipo: event.target.value } : actual,
                      )
                    }
                  >
                    <option value="Producto">Producto</option>
                    <option value="Insumo">Insumo</option>
                    <option value="Servicio">Servicio</option>
                  </select>
                </label>
                <label>
                  <span>Categoria</span>
                  <select
                    required
                    value={edicionRegistro.categoria}
                    onChange={(event) =>
                      setEdicionRegistro((actual) =>
                        actual
                          ? {
                              ...actual,
                              categoria: event.target.value,
                              grupo:
                                subcategoriasPorCategoria[event.target.value]?.[0] ??
                                'General',
                            }
                          : actual,
                      )
                    }
                  >
                    <option value="">Seleccionar</option>
                    {categorias.map((item) => (
                      <option key={item} value={item}> {item} </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Grupo</span>
                  <select
                    required
                    value={edicionRegistro.grupo || 'General'}
                    onChange={(event) =>
                      setEdicionRegistro((actual) =>
                        actual ? { ...actual, grupo: event.target.value } : actual,
                      )
                    }
                  >
                    {(subcategoriasPorCategoria[edicionRegistro.categoria]?.length
                      ? subcategoriasPorCategoria[edicionRegistro.categoria]
                      : ['General']
                    ).map((item) => (
                      <option key={item} value={item}> {item} </option>
                    ))}
                  </select>
                </label>
                <label><input type="checkbox" checked={!!edicionRegistro.confirmarPrecio} onChange={e => setEdicionRegistro(a => a ? { ...a, confirmarPrecio: e.target.checked } : a)} /> Confirmar precio de venta revisado (quita la alerta si cubre los costos)</label>
                <label>
                  <span>Precio de venta</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={String(edicionRegistro.precioVenta)}
                    onChange={(event) =>
                      setEdicionRegistro((actual) =>
                        actual ? { ...actual, precioVenta: Number(event.target.value) } : actual,
                      )
                    }
                  />
                </label>
                <label>
                  <span>Estado</span>
                  <select
                    required
                    value={normalizarEstadoFormulario(edicionRegistro.estado)}
                    onChange={(event) =>
                      setEdicionRegistro((actual) =>
                        actual
                          ? {
                              ...actual,
                              estado: normalizarEstadoFormulario(event.target.value),
                            }
                          : actual,
                      )
                    }
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </label>
                <label className="inventario-campo-serie">
                  <span>Numero de serie</span>
                  <input
                    disabled={!edicionRegistro.usarNumeroSerie}
                    value={edicionRegistro.numeroSerie || ''}
                    onChange={(event) =>
                      setEdicionRegistro((actual) =>
                        actual ? { ...actual, numeroSerie: event.target.value } : actual,
                      )
                    }
                  />
                </label>
                <label className="inventario-serie-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(edicionRegistro.usarNumeroSerie)}
                    onChange={(event) =>
                      setEdicionRegistro((actual) =>
                        actual
                          ? { ...actual, usarNumeroSerie: event.target.checked }
                          : actual,
                      )
                    }
                  />
                  <span>Usar numero de serie</span>
                </label>
              </div>
              <footer>
                <button
                  className="inventario-secundario"
                  type="button"
                  onClick={() => setEdicionRegistro(null)}
                >
                  Cancelar
                </button>
                <button className="inventario-primario" type="submit">
                  Guardar cambios
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {mensajeGuardado && (
        <div className="inventario-toast" role="status" aria-live="polite">
          {mensajeGuardado}
        </div>
      )}

      {modalRegistroAbierto && (
        <div
          className="inventario-modal-fondo"
          role="presentation"
          onMouseDown={() => setModalRegistroAbierto(false)}
        >
          <section
            className="inventario-modal inventario-modal-registro"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventario-modal-registro-titulo"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Nuevo registro</span>
                <h3 id="inventario-modal-registro-titulo">
                  Registrar inventario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalRegistroAbierto(false)}
                aria-label="Cerrar"
              >
                <Icon name="close" size={18} />
              </button>
            </header>
            <form onSubmit={guardarRegistroInventario}>
              {mensajeGuardado && <p role="alert">{mensajeGuardado}</p>}
              <div className="inventario-modal-cuerpo inventario-modal-registro-grid">
                <label>
                  <span>Codigo</span>
                  <input value={formularioRegistro.codigo || codigoRegistro} disabled readOnly />
                </label>
                <label>
                  <span>Nombre o identificacion</span>
                  <input
                    required
                    value={formularioRegistro.nombre}
                    onChange={(event) =>
                      actualizarCampoRegistro('nombre', event.target.value)
                    }
                    placeholder="Ej. Jeringa descartable 10 ml"
                  />
                </label>
                <label className="inventario-campo-completo">
                  <span>Descripcion</span>
                  <textarea
                    required
                    rows={3}
                    value={formularioRegistro.descripcion}
                    onChange={(event) =>
                      actualizarCampoRegistro('descripcion', event.target.value)
                    }
                    placeholder="Detalle breve del producto, insumo o servicio"
                  />
                </label>
                <label>
                  <span>Unidad de medida</span>
                  <select
                    required
                    value={formularioRegistro.unidadMedida}
                    onChange={(event) =>
                      actualizarCampoRegistro('unidadMedida', event.target.value)
                    }
                  >
                    <option value="" disabled>
                      Seleccionar
                    </option>
                    <option value="Unidad">Unidad</option>
                    <option value="Caja">Caja</option>
                    <option value="Paquete">Paquete</option>
                    <option value="Frasco">Frasco</option>
                    <option value="Servicio">Servicio</option>
                  </select>
                </label>
                <label>
                  <span>Tipo</span>
                  <select
                    value={formularioRegistro.tipo}
                    onChange={(event) => {
                      const siguienteTipo = event.target.value as TipoRegistro;
                      setTipoRegistro(siguienteTipo);
                      actualizarCampoRegistro('tipo', siguienteTipo);
                    }}
                    required
                  >
                    <option value="Producto">Producto</option>
                    <option value="Insumo">Insumo</option>
                    <option value="Servicio">Servicio</option>
                  </select>
                </label>
                <label>
                  <span>Categoria</span>
                  <select
                    value={formularioRegistro.categoria || categoriaRegistro}
                    onChange={(event) => {
                      const siguienteCategoria = event.target.value;
                      setCategoriaRegistro(siguienteCategoria);
                      setSubcategoriaRegistro('');
                      actualizarCampoRegistro('categoria', siguienteCategoria);
                      actualizarCampoRegistro('grupo', '');
                    }}
                    required
                  >
                    <option value="" disabled>
                      Seleccionar
                    </option>
                    {categorias.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Grupo</span>
                  <select
                    value={formularioRegistro.grupo || subcategoriaRegistro}
                    onChange={(event) => {
                      const siguienteGrupo = event.target.value;
                      setSubcategoriaRegistro(siguienteGrupo);
                      actualizarCampoRegistro('grupo', siguienteGrupo);
                    }}
                    required
                    disabled={!categoriaRegistro}
                  >
                    <option value="" disabled>
                      Seleccionar
                    </option>
                    {subcategoriasDisponibles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Precio de venta</span>
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={formularioRegistro.precioVenta}
                    onChange={(event) =>
                      actualizarCampoRegistro('precioVenta', event.target.value)
                    }
                    placeholder="0.00"
                  />
                </label>
                <label>
                  <span>Estado</span>
                  <select
                    required
                    value={formularioRegistro.estado}
                    onChange={(event) =>
                      actualizarCampoRegistro(
                        'estado',
                        event.target.value as 'activo' | 'inactivo',
                      )
                    }
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </label>
                <label className="inventario-campo-serie">
                  <span>Numero de serie</span>
                  <input
                    disabled={!serieHabilitada}
                    value={formularioRegistro.numeroSerie}
                    onChange={(event) =>
                      actualizarCampoRegistro('numeroSerie', event.target.value)
                    }
                    placeholder="Codigo de barras"
                  />
                </label>
                <label className="inventario-serie-toggle">
                  <input
                    type="checkbox"
                    checked={serieHabilitada}
                    onChange={(event) => {
                      const siguiente = event.target.checked;
                      setSerieHabilitada(siguiente);
                      actualizarCampoRegistro('usarNumeroSerie', siguiente);
                    }}
                  />
                  <span>Usar numero de serie</span>
                </label>
              </div>
              <footer>
                <button
                  className="inventario-secundario"
                  type="button"
                  onClick={() => setModalRegistroAbierto(false)}
                >
                  Cancelar
                </button>
                <button className="inventario-primario" type="submit">
                  Guardar registro
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
