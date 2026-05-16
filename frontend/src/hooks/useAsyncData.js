import { useEffect, useState } from 'react';

export function useAsyncData(loader, deps = []) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: '',
  });

  useEffect(() => {
    let ignore = false;

    async function run() {
      setState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const data = await loader();
        if (!ignore) {
          setState({ data, loading: false, error: '' });
        }
      } catch (error) {
        if (!ignore) {
          setState({ data: null, loading: false, error: error.message });
        }
      }
    }

    run();

    return () => {
      ignore = true;
    };
  }, deps);

  return state;
}
