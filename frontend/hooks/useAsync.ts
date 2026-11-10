import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

type Snapshot<T> = {
  key: string | null;
  data: T | undefined;
  error: unknown;
};

export function useAsync<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
  enabled = true,
) {
  const [reloadCount, setReloadCount] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    key: null,
    data: undefined,
    error: null,
  });

  const requestKey = JSON.stringify([...deps, reloadCount]);
  const load = useEffectEvent((signal: AbortSignal) => loader(signal));

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    load(controller.signal)
      .then((data) => setSnapshot({ key: requestKey, data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSnapshot((prev) => ({ key: requestKey, data: prev.data, error }));
      });

    return () => controller.abort();
  }, [requestKey, enabled]);

  const isCurrent = snapshot.key === requestKey;

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  const setData: Dispatch<SetStateAction<T | undefined>> = useCallback((update) => {
    setSnapshot((prev) => ({
      ...prev,
      data:
        typeof update === 'function'
          ? (update as (value: T | undefined) => T | undefined)(prev.data)
          : update,
    }));
  }, []);

  return {
    data: snapshot.data,
    error: isCurrent ? snapshot.error : null,
    isLoading: !isCurrent,
    reload,
    setData,
  };
}
