import { useEffect, useRef, useState } from 'react';
import Icon from '@ui/components/Icon';

type Props = { codigo: string; imagen?: string; onCodigo: (valor: string) => void; onImagen: (valor: string) => void };
export default function CapturaCodigo({ codigo, imagen, onCodigo, onImagen }: Props) {
  const [mensaje, setMensaje] = useState('');
  const [camara, setCamara] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [lista, setLista] = useState(false);
  const archivoInput = useRef<HTMLInputElement>(null);
  const vigente = useRef(true);
  const video = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const cerrar = () => { flujo.current?.getTracks().forEach(track => track.stop()); flujo.current = null; setCamara(false); setLista(false); };
  useEffect(() => { vigente.current = true; return () => { vigente.current = false; flujo.current?.getTracks().forEach(track => track.stop()); }; }, []);
  async function procesar(fuente: CanvasImageSource, ancho: number, alto: number) {
    const canvas = document.createElement('canvas');
    const escala = Math.min(1, 1200 / Math.max(ancho, alto));
    canvas.width = Math.round(ancho * escala); canvas.height = Math.round(alto * escala);
    canvas.getContext('2d')!.drawImage(fuente, 0, 0, canvas.width, canvas.height);
    const imagenNueva = canvas.toDataURL('image/jpeg', 0.75);
    if (imagenNueva.length > 700000) { setMensaje('La imagen es muy grande. Prueba con un encuadre más pequeño.'); return; }
    if (!vigente.current) return;
    onImagen(imagenNueva);
    cerrar();
    const Detector = (window as unknown as { BarcodeDetector?: new () => { detect: (source: HTMLCanvasElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!Detector) { setMensaje('Imagen adjunta. Este navegador no permite leer barras desde imágenes; usa el lector o escribe el código.'); return; }
    try {
      const resultados = await new Detector().detect(canvas);
      if (resultados[0]?.rawValue) { onCodigo(resultados[0].rawValue); setMensaje('Código detectado.'); }
      else setMensaje('Imagen adjunta. No se detectó un código; puedes ingresarlo manualmente.');
    } catch { setMensaje('Imagen adjunta. No se pudo leer el código automáticamente.'); }
  }
  async function abrirCamara() {
    setOcupado(true); setMensaje('');
    try {
      cerrar();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (!vigente.current) { stream.getTracks().forEach(track => track.stop()); return; }
      flujo.current = stream; setCamara(true);
      if (video.current) { video.current.srcObject = stream; await video.current.play(); }
    } catch { cerrar(); setMensaje('No se pudo abrir la cámara. Revisa el permiso o sube una imagen.'); }
    finally { if (vigente.current) setOcupado(false); }
  }
  return <div className="inventario-campo-completo captura-codigo">
    <label><span>Serie / código de barras</span><input maxLength={128} value={codigo} onChange={e => onCodigo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setMensaje('Lectura recibida.'); } }} placeholder="Escribe o enfoca este campo y escanea con el lector" /></label>
    <section className="captura-imagen-panel" aria-label="Imagen del activo">
      <h3>Imagen del activo</h3>
      <p>Registra una fotografía clara para facilitar la identificación.</p>
      <div className="captura-imagen-marco">
        <div className="captura-imagen-preview">
          <video ref={video} hidden={!camara || Boolean(imagen)} muted playsInline onLoadedData={() => setLista(true)} />
          {imagen ? <>
            <img src={imagen} alt="Imagen del activo" />
            <button className="captura-imagen-eliminar" type="button" aria-label="Eliminar imagen" title="Eliminar imagen" disabled={ocupado} onClick={() => { cerrar(); onImagen(''); setMensaje(''); if (archivoInput.current) archivoInput.current.value = ''; }}><Icon name="close" size={18} /></button>
          </> : !camara && <div className="captura-imagen-vacio"><Icon name="image" size={58} /><span>Sin imagen</span></div>}
        </div>
        {!imagen && <div className="captura-imagen-acciones">
          <button className="captura-imagen-camara" type="button" disabled={ocupado || (camara && !lista)} onClick={camara ? async () => {
            if (!video.current?.videoWidth) return;
            setOcupado(true); setMensaje('');
            try { await procesar(video.current, video.current.videoWidth, video.current.videoHeight); }
            catch { setMensaje('No se pudo capturar la imagen. Intenta nuevamente.'); }
            finally { setOcupado(false); }
          } : abrirCamara}><Icon name="camera" size={18} />{camara ? 'Capturar' : 'Cámara'}</button>
          <button className="captura-imagen-subir" type="button" disabled={ocupado} onClick={() => archivoInput.current?.click()}><Icon name="image" size={18} />Subir</button>
        </div>}
      </div>
      <input ref={archivoInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={async e => {
        const archivo = e.target.files?.[0]; e.target.value = ''; if (!archivo) return;
        if (archivo.size > 10000000) { setMensaje('Selecciona una imagen de hasta 10 MB.'); return; }
        setOcupado(true); setMensaje('');
        try { const bitmap = await createImageBitmap(archivo); try { await procesar(bitmap, bitmap.width, bitmap.height); } finally { bitmap.close(); } } catch { setMensaje('No se pudo abrir la imagen.'); }
        finally { if (vigente.current) setOcupado(false); }
      }} />
    </section>
    {mensaje && <small role="status">{mensaje}</small>}
  </div>;
}
