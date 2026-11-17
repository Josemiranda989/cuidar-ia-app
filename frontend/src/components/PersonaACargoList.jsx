import { useState, useEffect, useRef } from 'react';
import { getAll } from '../services/dependents.service';
import { useDelayedFlag } from '../hooks/useDelayedFlag';
import Spinner from './Spinner';

const SKELETON_CARDS = 2;

// Misma silueta que la tarjeta real: avatar, chips, nombre, edad y bloque de datos.
function PersonaCardSkeleton() {
  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-xs">
      <div className="flex items-start gap-space-md">
        <div className="h-14 w-14 shrink-0 rounded-full bg-surface-container" />
        <div className="flex flex-1 flex-col gap-space-sm">
          <div className="flex gap-space-xs">
            <div className="h-5 w-28 rounded-full bg-surface-container" />
            <div className="h-5 w-24 rounded-full bg-surface-container-low" />
          </div>
          <div className="h-6 w-1/2 rounded-full bg-surface-container" />
          <div className="h-4 w-2/5 rounded-full bg-surface-container-low" />
        </div>
      </div>
      <div className="h-16 rounded-lg bg-surface-container-low" />
    </div>
  );
}

function PersonaACargoList({ refreshTrigger }) {
  const [personas, setPersonas] = useState([]);
  // loading = primera carga (no hay nada que mostrar). refreshing = recarga con datos en pantalla.
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);
  const showSkeleton = useDelayedFlag(loading);
  const showRefreshing = useDelayedFlag(refreshing);
  // "Reintentar" lo incrementa para volver a disparar el fetch.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    // Si ya hay datos, no los borramos: refresco en el lugar, sin parpadeo ni salto de scroll.
    if (hasLoadedRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    getAll()
      .then((data) => {
        if (isMounted) {
          setPersonas(Array.isArray(data) ? data : []);
          hasLoadedRef.current = true;
          setLoading(false);
          setRefreshing(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          const errorMsg =
            err.response?.data?.data?.message ||
            err.message ||
            'Error al cargar las personas a cargo';
          setError(errorMsg);
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger, reloadKey]);

  if (loading) {
    // Antes de 300ms no se muestra nada visible (solo el texto para lectores de pantalla).
    return (
      <section role="status" aria-busy="true" className="flex flex-col gap-space-md font-body-md text-body-md">
        {showSkeleton ? (
          <>
            <p className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
              <Spinner className="size-4 text-primary" />
              Cargando personas a cargo…
            </p>
            <div
              aria-hidden="true"
              className="grid animate-pulse grid-cols-1 gap-space-md motion-reduce:animate-none lg:grid-cols-2"
            >
              {Array.from({ length: SKELETON_CARDS }, (_, index) => (
                <PersonaCardSkeleton key={index} />
              ))}
            </div>
          </>
        ) : (
          <span className="sr-only">Cargando personas a cargo…</span>
        )}
      </section>
    );
  }

  // Sin datos previos, el error ocupa el lugar de la lista. Con datos, va como aviso arriba.
  if (error && !hasLoadedRef.current) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-space-md rounded-xl bg-error-container p-space-lg font-body-md text-body-md text-on-error-container sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-space-sm">
          <span className="material-symbols-outlined shrink-0 text-[22px] text-error" aria-hidden="true">
            error
          </span>
          <p>No se pudieron cargar las personas a cargo. Intentá de nuevo.</p>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((prev) => prev + 1)}
          className="inline-flex min-h-12 shrink-0 items-center gap-space-xs rounded-lg bg-error px-space-lg font-label-lg text-label-lg text-on-error transition-colors hover:bg-error/90"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            refresh
          </span>
          Reintentar
        </button>
      </div>
    );
  }

  if (personas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-space-sm rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-space-xl text-center font-body-md text-body-md text-on-surface-variant">
        <span className="material-symbols-outlined text-[32px] text-outline" aria-hidden="true">
          person
        </span>
        No hay personas a cargo cargadas. Cargá la primera.
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-space-md font-body-md text-body-md text-on-surface">
      <div className="flex items-center gap-space-xs">
        <span className="h-3 w-3 rounded-full bg-secondary" aria-hidden="true"></span>
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Personas a Cargo
        </h2>
        <span className="ml-1 rounded-full bg-secondary-fixed/50 px-2 py-0.5 font-label-sm text-label-sm text-on-secondary-fixed">
          {personas.length} registradas
        </span>
        {showRefreshing && (
          <span className="ml-1 inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
            <Spinner className="size-3.5 text-primary" />
            Actualizando…
          </span>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col items-start gap-space-sm rounded-lg bg-error-container p-space-md font-body-sm text-body-sm text-on-error-container sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-space-sm">
            <span className="material-symbols-outlined shrink-0 text-[20px] text-error" aria-hidden="true">
              error
            </span>
            <p>No se pudo actualizar la lista. Lo que ves puede estar desactualizado.</p>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((prev) => prev + 1)}
            className="inline-flex min-h-10 shrink-0 items-center gap-space-xs rounded-lg px-space-md font-label-md text-label-md text-error transition-colors hover:bg-error/10"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              refresh
            </span>
            Reintentar
          </button>
        </div>
      )}

      <div
        aria-busy={refreshing}
        className={`grid grid-cols-1 gap-space-md transition-opacity duration-200 lg:grid-cols-2 ${
          showRefreshing ? 'opacity-60' : ''
        }`}
      >
        {personas.map((persona) => (
          <article
            key={persona.id}
            className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-xs transition-shadow hover:shadow-md"
          >
            <div className="flex items-start gap-space-md">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary"
                aria-hidden="true"
              >
                <span className="material-symbols-outlined text-[28px]">person</span>
              </div>
              <div className="flex min-w-0 flex-col gap-space-xs">
                <div className="flex flex-wrap items-center gap-space-xs">
                  <span className="rounded-full bg-primary-container px-space-sm py-0.5 font-label-sm text-label-sm uppercase tracking-wider text-on-primary">
                    Persona a Cargo
                  </span>
                  {persona.parentesco && (
                    <span className="rounded-full bg-surface-container px-space-sm py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                      Parentesco: {persona.parentesco}
                    </span>
                  )}
                </div>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                  {persona.nombre_completo}
                </h3>
                <p className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant tabular-nums">
                  <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                    calendar_today
                  </span>
                  {persona.edad} años ({persona.fecha_nacimiento})
                </p>
              </div>
            </div>

            {(persona.dni || persona.obra_social || persona.numero_afiliado) && (
              <dl className="grid grid-cols-1 gap-space-sm rounded-lg bg-surface-container-low/60 p-space-md sm:grid-cols-3">
                {persona.dni && (
                  <div>
                    <dt className="font-label-sm text-label-sm text-on-surface-variant">DNI</dt>
                    <dd className="font-body-md text-body-md font-semibold tabular-nums">{persona.dni}</dd>
                  </div>
                )}
                {persona.obra_social && (
                  <div>
                    <dt className="font-label-sm text-label-sm text-on-surface-variant">Obra Social</dt>
                    <dd className="font-body-md text-body-md font-semibold">{persona.obra_social}</dd>
                  </div>
                )}
                {persona.numero_afiliado && (
                  <div>
                    <dt className="font-label-sm text-label-sm text-on-surface-variant">N° de Afiliado</dt>
                    <dd className="font-body-md text-body-md font-semibold tabular-nums">
                      {persona.numero_afiliado}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {persona.notas && (
              <div className="flex items-start gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined shrink-0 text-[16px] text-tertiary" aria-hidden="true">
                  sticky_note_2
                </span>
                <p>{persona.notas}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default PersonaACargoList;
