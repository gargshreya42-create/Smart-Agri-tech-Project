import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../services/api';

// Loads data on mount / when deps change and exposes loading, error and reload.
export default function useFetch(loader, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, meta: null, loading: enabled, error: null });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const runId = useRef(0);

  const run = useCallback(async (silent = false) => {
    const id = ++runId.current;
    if (!silent) setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await loaderRef.current();
      if (id === runId.current) setState({ data: res.data, meta: res.meta || null, loading: false, error: null });
    } catch (err) {
      if (id === runId.current) setState((prev) => ({ ...prev, loading: false, error: errorMessage(err), status: err.response && err.response.status }));
    }
  }, []);

  useEffect(() => {
    if (enabled) run();
    return () => { runId.current += 1; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { ...state, reload: () => run(), refresh: () => run(true) };
}
