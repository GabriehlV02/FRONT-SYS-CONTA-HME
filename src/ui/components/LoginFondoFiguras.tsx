import { useEffect, useRef } from 'react';

const colores = ['#087f87', '#71949e', '#d2ac58', '#68a994', '#98b8bc'];
const figuras = [
  'M25 6 45 42H5Z',
  'M9 9H41V41H9Z',
  'M42 25a17 17 0 1 1-34 0 17 17 0 1 1 34 0',
  'M5 25c8-25 12 25 20 0s12 25 20 0',
  'M14 14 36 36M36 14 14 36',
  'M8 34a17 17 0 0 1 34 0',
];

// Coordenadas relativas a la pantalla: no dependen de medir el contenedor
// mientras se cargan los estilos y se ajustan al cambiar el tamaño de ventana.
const transformar = (p: { x: number; y: number; giro: number }) =>
  `translate3d(calc(${p.x * 100}vw - ${p.x * 54}px), calc(${p.y * 100}vh - ${p.y * 54}px), 0) rotate(${p.giro}deg)`;
const posicionInicial = (indice: number, cantidad: number) => {
  const columnas = cantidad === 48 ? 6 : 10;
  const filas = Math.ceil(cantidad / columnas);
  return {
    x: ((indice % columnas) + .5) / columnas,
    y: (Math.floor(indice / columnas) + .5) / filas,
    giro: (indice * 137.5) % 360,
  };
};

export function LoginFondoFiguras() {
  const fondo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contenedor = fondo.current;
    if (!contenedor) return;
    const preferencia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pantallaPequena = window.matchMedia('(max-width: 600px)');
    const animaciones = new Set<Animation>();
    let detenido = false;

    function iniciar() {
      animaciones.forEach((animacion) => animacion.cancel());
      animaciones.clear();
      const cantidad = pantallaPequena.matches ? 48 : 90;
      contenedor!.querySelectorAll<SVGSVGElement>('svg').forEach((figura, indice) => {
        figura.style.display = indice < cantidad ? '' : 'none';
        if (indice >= cantidad) return;
        const posicion = () => ({
          x: Math.random(),
          y: Math.random(),
          giro: Math.random() * 360,
        });
        let actual = posicionInicial(indice, cantidad);
        figura.style.transform = transformar(actual);

        function mover() {
          if (detenido || preferencia.matches) return;
          const destino = posicion();
          destino.giro = actual.giro + (Math.random() - .5) * 180;
          const distancia = Math.hypot(
            (destino.x - actual.x) * window.innerWidth,
            (destino.y - actual.y) * window.innerHeight,
          );
          const animacion = figura.animate(
            [{ transform: transformar(actual) }, { transform: transformar(destino) }],
            { duration: Math.max(6000, distancia / (12 + Math.random() * 16) * 1000), easing: 'ease-in-out' },
          );
          animaciones.add(animacion);
          if (document.hidden) animacion.pause();
          animacion.onfinish = () => {
            animaciones.delete(animacion);
            actual = destino;
            figura.style.transform = transformar(actual);
            mover();
          };
        }
        mover();
      });
    }

    function actualizarVisibilidad() {
      animaciones.forEach((animacion) => {
        if (document.hidden) animacion.pause();
        else animacion.play();
      });
    }

    iniciar();
    preferencia.addEventListener('change', iniciar);
    pantallaPequena.addEventListener('change', iniciar);
    document.addEventListener('visibilitychange', actualizarVisibilidad);
    return () => {
      detenido = true;
      preferencia.removeEventListener('change', iniciar);
      pantallaPequena.removeEventListener('change', iniciar);
      document.removeEventListener('visibilitychange', actualizarVisibilidad);
      animaciones.forEach((animacion) => animacion.cancel());
    };
  }, []);

  return (
    <div ref={fondo} className="login-fondo-figuras" aria-hidden="true">
      {Array.from({ length: 90 }, (_, indice) => (
        <svg key={indice} viewBox="0 0 50 50" fill="none"
          stroke={colores[indice % colores.length]} strokeWidth="4"
          strokeLinecap="round" strokeLinejoin="round" focusable="false"
          style={{
            width: 30 + (indice % 5) * 6,
            transform: transformar(posicionInicial(indice, 90)),
          }}>
          <path d={figuras[indice % figuras.length]} />
        </svg>
      ))}
    </div>
  );
}
