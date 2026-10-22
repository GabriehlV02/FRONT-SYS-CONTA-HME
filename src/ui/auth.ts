import type { AuthSession } from './types';

type SessionResponse = {
  usuario: { id: string; usuario: string; nombre: string; rol: string; permisos: string[]; administra_catalogo?: boolean };
};

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  const method = (options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    // Laravel devuelve la cookie XSRF cifrada; se reenvía en el encabezado.
    let cookie = document.cookie.split('; ').find(item => item.startsWith('XSRF-TOKEN='));
    if (!cookie) {
      const response = await fetch('/api/csrf', { credentials: 'same-origin', headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) throw new AuthError('No se pudo preparar la sesión. Vuelve a intentarlo.', response.status);
      cookie = document.cookie.split('; ').find(item => item.startsWith('XSRF-TOKEN='));
    }
    if (!cookie) throw new AuthError('Habilita las cookies para iniciar sesión.', 419);
    headers.set('X-XSRF-TOKEN', decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)));
  }
  const response = await fetch(url, { ...options, credentials: 'same-origin', headers, cache: 'no-store' });
  if (response.status === 401 && url !== '/api/login') {
    window.dispatchEvent(new Event('contable:sesion-expirada'));
  }
  return response;
}

async function readSession(response: Response): Promise<AuthSession> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = response.status === 419
      ? 'La sesión del formulario expiró. Vuelve a intentarlo.'
      : data?.message || 'No se pudo verificar la sesión.';
    throw new AuthError(message, response.status);
  }
  const usuario = (data as SessionResponse | null)?.usuario;
  if (!usuario || typeof usuario.nombre !== 'string' || typeof usuario.rol !== 'string' || !Array.isArray(usuario.permisos)) {
    throw new AuthError('El servidor devolvió una sesión inválida.', 502);
  }
  return { user: usuario.nombre, role: usuario.rol, permissions: usuario.permisos, administraCatalogo: usuario.administra_catalogo === true };
}

export async function iniciarSesion(usuario: string, password: string): Promise<AuthSession> {
  // Renueva la cookie CSRF incluso si una sesión anterior ya venció.
  const response = await fetch('/api/csrf', { credentials: 'same-origin', headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new AuthError('No se pudo conectar con el servidor contable.', response.status);
  return readSession(await apiFetch('/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password }),
  }));
}

export async function recuperarSesion(signal?: AbortSignal): Promise<AuthSession | null> {
  const response = await apiFetch('/api/session', { signal });
  if (response.status === 401) return null;
  return readSession(response);
}

export async function cerrarSesion(): Promise<void> {
  const response = await apiFetch('/api/logout', { method: 'POST' });
  if (!response.ok && response.status !== 401) {
    throw new AuthError('No se pudo cerrar la sesión. Vuelve a intentarlo.', response.status);
  }
}
