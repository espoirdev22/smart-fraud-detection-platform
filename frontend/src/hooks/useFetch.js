import { useCallback, useEffect, useRef, useState } from "react";

/** Charge des donnees et expose data / error / loading / reload. Se relance quand deps change. */
export default function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const counter = useRef(0);

  const run = useCallback(() => {
    const id = ++counter.current;
    setState((s) => ({ ...s, loading: true }));
    fnRef.current()
      .then((data) => id === counter.current && setState({ data, error: null, loading: false }))
      .catch((error) => id === counter.current && setState((s) => ({ data: s.data, error: error.message, loading: false })));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(run, deps);
  return { ...state, reload: run };
}
