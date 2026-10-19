let accessToken = '';
let refreshPromise: Promise<any> | null = null;
const base = import.meta.env.VITE_API_URL || '/api';
export const setToken = (token: string) => {
  accessToken = token;
};
export async function restoreSession() {
  const r = await fetch(base + '/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!r.ok) throw new Error('Inicia sesión');
  const data = await r.json();
  accessToken = data.accessToken;
  return data;
}
export async function api<T = any>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const r = await fetch(base + path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
  if (r.status === 401 && path.startsWith('/admin') && retry) {
    refreshPromise ??= restoreSession().finally(() => {
      refreshPromise = null;
    });
    try {
      await refreshPromise;
      return api(path, options, false);
    } catch {
      window.dispatchEvent(new Event('ferremax-session-expired'));
      throw new Error('Tu sesión venció. Inicia sesión nuevamente.');
    }
  }
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || 'No se pudo completar la operación');
  return data;
}
export const send = (path: string, body: any, method = 'POST') =>
  api(path, { method, body: JSON.stringify(body) });
