import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export function usePrivateResource<T>(path: string, poll = false) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [loadedPath, setLoadedPath] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let fetching = false;
    const load = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const result = await api<T>(path, { signal: controller.signal });
        if (active) {
          setData(result);
          setError('');
        }
      } catch (reason) {
        if (active && !controller.signal.aborted)
          setError(
            reason instanceof Error ? reason.message : 'No se pudo consultar la información',
          );
      } finally {
        fetching = false;
        if (active) {
          setLoadedPath(path);
          setLoading(false);
        }
      }
    };
    setLoading(true);
    void load();
    const timer = poll
      ? window.setInterval(() => {
          if (document.visibilityState === 'visible') void load();
        }, 8000)
      : undefined;
    return () => {
      active = false;
      controller.abort();
      if (timer) window.clearInterval(timer);
    };
  }, [path, poll, version]);
  return {
    data: loadedPath === path ? data : null,
    loading: loading || loadedPath !== path,
    error: loadedPath === path ? error : '',
    refresh: () => setVersion((value) => value + 1),
  };
}
