import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAll as getDependents } from '../services/dependents.service';

const STORAGE_KEY = 'cuidar:persona-actual';

const CurrentPersonaContext = createContext(null);

function readStoredId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeId(id) {
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Sin storage (modo privado, bloqueado): la selección vive solo en memoria.
  }
}

/**
 * "A quién estás cuidando": la persona a cargo seleccionada en el header.
 * Hoy, Vademécum, Ficha médica y Ficha de la persona trabajan sobre ella.
 */
export function CurrentPersonaProvider({ children }) {
  const [personas, setPersonas] = useState([]);
  const [selectedId, setSelectedId] = useState(readStoredId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setError(null);

    getDependents()
      .then((data) => {
        if (isMounted) {
          setPersonas(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err.response?.data?.data?.message || err.message || 'Error al cargar personas a cargo'
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  // Si la guardada ya no existe (o no hay ninguna), caemos en la primera.
  const currentPersona =
    personas.find((persona) => persona.id === selectedId) ?? personas[0] ?? null;

  const setCurrentPersonaId = useCallback((id) => {
    setSelectedId(id);
    storeId(id);
  }, []);

  const reload = useCallback(() => setReloadKey((prev) => prev + 1), []);

  const value = useMemo(
    () => ({
      personas,
      currentPersona,
      currentPersonaId: currentPersona?.id ?? null,
      setCurrentPersonaId,
      loading,
      error,
      reload,
    }),
    [personas, currentPersona, setCurrentPersonaId, loading, error, reload]
  );

  return <CurrentPersonaContext.Provider value={value}>{children}</CurrentPersonaContext.Provider>;
}

export function useCurrentPersona() {
  const context = useContext(CurrentPersonaContext);
  if (!context) {
    throw new Error('useCurrentPersona debe usarse dentro de <CurrentPersonaProvider>');
  }
  return context;
}

// "Elsa Beatriz Ramos" → "Elsa"
export function firstName(persona) {
  return persona?.nombre_completo?.trim().split(/\s+/)[0] ?? '';
}
