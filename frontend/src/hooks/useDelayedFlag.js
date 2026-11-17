import { useEffect, useState } from 'react';

/**
 * Devuelve true recién cuando `flag` lleva `delay` ms en true.
 * Evita el parpadeo de skeletons/spinners cuando la respuesta llega rápido:
 * si la API contesta en 20ms, el indicador nunca aparece.
 */
export function useDelayedFlag(flag, delay = 300) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!flag) {
      setShow(false);
      return undefined;
    }
    const timeoutId = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timeoutId);
  }, [flag, delay]);

  return show;
}

export default useDelayedFlag;
