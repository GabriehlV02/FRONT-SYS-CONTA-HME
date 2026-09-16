# Organizacion de flujos

Cada carpeta representa un flujo funcional.

- `*View.tsx`: entrada del flujo; selecciona y renderiza la subvista activa.
- `componentes/*Navegacion.tsx`: opciones y botones de navegacion del flujo.
- `subvistas/*View.tsx`: pantalla propia de cada subvista.
- `*View.css`: estilos compartidos entre las pantallas del flujo.
- `datos/`: datos separados del renderizado, cuando corresponda.

Los botones de navegacion usan `src/ui/components/BotonSubvista.tsx`.
El desplazamiento horizontal usa `HorizontalSubvistaNav.tsx` y su CSS compartido.
Una subvista nueva debe tener su propio archivo e incorporarse a la navegacion
y a la entrada del flujo.

Productos y Servicios tienen entradas independientes y comparten
`inventario/componentes/CatalogoView.tsx` para mantener el mismo comportamiento
de busqueda, filtros, listado, galeria y paginacion. Sus datos de ejemplo viven
en `inventario/datos/catalogoDemo.ts`.

Las pantallas de Ventas conservan el estado vacio que existia antes de esta
separacion. Los listados de Usuarios, Movimientos y las subvistas auxiliares de
Inventario conservan sus plantillas actuales; esta reorganizacion no implementa
operaciones de backend ni convierte las acciones pendientes en funcionales.
