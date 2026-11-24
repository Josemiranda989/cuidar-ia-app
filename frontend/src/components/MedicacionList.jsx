import { useState, useEffect, useRef } from 'react';
import { getAll, update } from '../services/medications.service';
import { useConfirm } from '../hooks/useConfirm';
import { useDelayedFlag } from '../hooks/useDelayedFlag';
import { firstName, useCurrentPersona } from '../context/CurrentPersonaContext';
import { formatDate, formatDias, toLocalISODate } from '../utils/date';
import Spinner from './Spinner';

const FILTERS = [
  { value: 'activa', label: 'Activas' },
  { value: 'discontinuada', label: 'Discontinuadas' },
  { value: 'todas', label: 'Todas' },
];

const EMPTY_FILTER_COPY = {
  activa: 'No hay medicaciones activas.',
  discontinuada: 'No hay medicaciones discontinuadas.',
  todas: 'No hay medicaciones registradas actualmente.',
};

const SUCCESS_TIMEOUT_MS = 3000;

// min-w fijo: el botón no cambia de ancho al pasar a "Guardando…" con spinner.
const cardActionClass =
  'inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg px-space-sm font-label-md text-label-md transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const SKELETON_CARDS = 4;

// Misma silueta que la tarjeta real: ícono, título, subtítulo, bloque de info y pie.
function MedicacionCardSkeleton() {
  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-xs">
      <div className="flex items-start gap-space-sm">
        <div className="h-11 w-11 shrink-0 rounded-lg bg-surface-container" />
        <div className="flex flex-1 flex-col gap-space-sm pt-1">
          <div className="h-5 w-2/5 rounded-full bg-surface-container" />
          <div className="h-3.5 w-3/5 rounded-full bg-surface-container-low" />
        </div>
      </div>
      <div className="h-16 rounded-lg bg-surface-container-low" />
      <div className="flex items-center justify-between">
        <div className="h-6 w-20 rounded-full bg-surface-container" />
        <div className="flex gap-space-xs">
          <div className="h-9 w-16 rounded-lg bg-surface-container-low" />
          <div className="h-9 w-24 rounded-lg bg-surface-container-low" />
        </div>
      </div>
    </div>
  );
}

function MedicacionList({ refreshTrigger, onEdit }) {
  const [medications, setMedications] = useState([]);
  // loading = primera carga (no hay nada que mostrar). refreshing = recarga con datos en pantalla.
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);
  const showSkeleton = useDelayedFlag(loading);
  const showRefreshing = useDelayedFlag(refreshing);
  const [filter, setFilter] = useState('activa');
  // id de la medicación con un cambio de estado en curso (deshabilita sus botones).
  const [pendingId, setPendingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  // "Reintentar" lo incrementa para volver a disparar el fetch.
  const [reloadKey, setReloadKey] = useState(0);
  const [confirm, confirmDialog] = useConfirm();
  const { currentPersona, currentPersonaId } = useCurrentPersona();
  const lastPersonaRef = useRef(currentPersonaId);

  useEffect(() => {
    let isMounted = true;
    // Cambiar de persona es una carga nueva: los datos en pantalla son de otra persona.
    if (lastPersonaRef.current !== currentPersonaId) {
      lastPersonaRef.current = currentPersonaId;
      hasLoadedRef.current = false;
      setMedications([]);
    }
    // Si ya hay datos, no los borramos: refresco en el lugar, sin parpadeo ni salto de scroll.
    if (hasLoadedRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    getAll(currentPersonaId)
      .then((data) => {
        if (isMounted) {
          setMedications(Array.isArray(data) ? data : []);
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
            'Error al cargar la lista de medicaciones';
          setError(errorMsg);
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger, reloadKey, currentPersonaId]);

  // El badge de éxito se va solo a los 3s.
  useEffect(() => {
    if (!successMsg) return undefined;
    const timeoutId = setTimeout(() => setSuccessMsg(null), SUCCESS_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [successMsg]);

  const handleToggleEstado = async (med) => {
    const nombre = med.nombre_comercial || med.droga;
    const discontinuing = med.estado === 'activa';

    if (discontinuing) {
      const confirmed = await confirm({
        title: `¿Discontinuar ${nombre}?`,
        description:
          'Va a pasar a Discontinuadas y dejará de figurar entre las activas. Podés reactivarla cuando quieras.',
        confirmLabel: 'Discontinuar',
        cancelLabel: 'Cancelar',
        tone: 'danger',
      });
      if (!confirmed) return;
    }

    setActionError(null);
    setSuccessMsg(null);
    setPendingId(med.id);

    try {
      // Discontinuar fecha el fin del tratamiento; reactivar lo reabre.
      const updated = await update(
        med.id,
        discontinuing
          ? { estado: 'discontinuada', fecha_fin: toLocalISODate() }
          : { estado: 'activa', fecha_fin: null, motivo_baja: null }
      );
      // El PATCH devuelve la medicación actualizada: la reemplazamos sin volver a pedir la lista.
      setMedications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSuccessMsg(discontinuing ? `${nombre} discontinuada.` : `${nombre} reactivada.`);
    } catch (err) {
      setActionError(
        err.response?.data?.data?.message ||
          err.message ||
          'No se pudo cambiar el estado de la medicación.'
      );
    } finally {
      setPendingId(null);
    }
  };

  if (loading) {
    // Antes de 300ms no se muestra nada visible (solo el texto para lectores de pantalla).
    return (
      <section role="status" aria-busy="true" className="flex flex-col gap-space-md font-body-md text-body-md">
        {showSkeleton ? (
          <>
            <p className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
              <Spinner className="size-4 text-primary" />
              Cargando medicaciones…
            </p>
            <div
              aria-hidden="true"
              className="grid animate-pulse grid-cols-1 gap-space-md motion-reduce:animate-none md:grid-cols-2"
            >
              {Array.from({ length: SKELETON_CARDS }, (_, index) => (
                <MedicacionCardSkeleton key={index} />
              ))}
            </div>
          </>
        ) : (
          <span className="sr-only">Cargando medicaciones…</span>
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
          <p>No se pudieron cargar las medicaciones. Intentá de nuevo.</p>
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

  if (medications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-space-sm rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-space-xl text-center font-body-md text-body-md text-on-surface-variant">
        <span className="material-symbols-outlined text-[32px] text-outline" aria-hidden="true">
          medication
        </span>
        No hay medicaciones cargadas. Cargá la primera.
      </div>
    );
  }

  const counts = {
    activa: medications.filter((med) => med.estado === 'activa').length,
    discontinuada: medications.filter((med) => med.estado === 'discontinuada').length,
    todas: medications.length,
  };

  const visibleMedications =
    filter === 'todas' ? medications : medications.filter((med) => med.estado === filter);

  return (
    <section className="flex flex-col gap-space-md font-body-md text-body-md text-on-surface">
      <div className="flex flex-col gap-space-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="h-3 w-3 rounded-full bg-secondary" aria-hidden="true"></span>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            {currentPersona ? `Medicamentos de ${firstName(currentPersona)}` : 'Listado de Medicaciones'}
          </h2>
          {showRefreshing && (
            <span className="ml-1 inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
              <Spinner className="size-3.5 text-primary" />
              Actualizando…
            </span>
          )}
        </div>

        <div
          role="group"
          aria-label="Filtrar por estado"
          className="flex items-center gap-space-xs overflow-x-auto rounded-lg bg-surface-container p-1"
        >
          {FILTERS.map(({ value, label }) => {
            const isActive = filter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(value)}
                className={`min-h-10 whitespace-nowrap rounded-lg px-space-md py-2 font-label-md text-label-md transition-colors ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {label}{' '}
                <span className={`ml-1 tabular-nums ${isActive ? 'opacity-90' : 'opacity-70'}`}>
                  ({counts[value]})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live region siempre montada para que el lector de pantalla anuncie el cambio. */}
      <div role="status" aria-live="polite">
        {successMsg && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-fixed/40 px-space-md py-space-xs font-label-md text-label-md text-on-secondary-fixed-variant">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              check_circle
            </span>
            {successMsg}
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

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-space-sm rounded-lg bg-error-container p-space-md font-body-sm text-body-sm text-on-error-container"
        >
          <span className="material-symbols-outlined shrink-0 text-[20px] text-error" aria-hidden="true">
            error
          </span>
          <p>
            <strong className="font-semibold">Error:</strong> {actionError}
          </p>
        </div>
      )}

      {visibleMedications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-space-lg text-center font-body-md text-body-md text-on-surface-variant">
          {EMPTY_FILTER_COPY[filter]}
        </div>
      ) : (
        <div
          aria-busy={refreshing}
          className={`grid grid-cols-1 gap-space-md transition-opacity duration-200 md:grid-cols-2 ${
            showRefreshing ? 'opacity-60' : ''
          }`}
        >
          {visibleMedications.map((med) => {
            const isActiva = med.estado === 'activa';
            const isPending = pendingId === med.id;
            return (
              <article
                key={med.id}
                className={`flex flex-col justify-between rounded-xl p-space-lg shadow-xs transition-shadow ${
                  isActiva
                    ? 'bg-surface-container-lowest hover:shadow-md'
                    : 'bg-surface-container-lowest/80'
                }`}
              >
                <div>
                  <div className="mb-space-md flex items-start justify-between gap-space-sm">
                    <div className="flex min-w-0 items-start gap-space-sm">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary"
                        aria-hidden="true"
                      >
                        <span className="material-symbols-outlined text-[24px]">pill</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-space-xs">
                          <h3
                            className={`font-headline-sm text-headline-sm font-bold ${
                              isActiva ? 'text-on-surface' : 'text-on-surface-variant'
                            }`}
                          >
                            {med.nombre_comercial || med.droga}
                          </h3>
                          <span className="font-label-md text-label-md text-primary">
                            {med.concentracion}
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {med.nombre_comercial && <>{med.droga} • </>}
                          {med.cantidad_por_toma} {med.forma}
                          {med.via && <> • vía {med.via}</>}
                        </p>
                      </div>
                    </div>

                    {med.es_sos ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-tertiary-fixed px-2.5 py-1 font-label-sm text-label-sm text-on-tertiary-fixed">
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                          medical_services
                        </span>
                        SOS
                      </span>
                    ) : (
                      med.horarios?.length > 0 && (
                        <ul className="flex shrink-0 flex-col items-end gap-1" aria-label="Horarios">
                          {med.horarios.map((horario) => (
                            <li
                              key={horario.id}
                              title={formatDias(horario.dias_semana)}
                              className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-space-sm py-1 font-label-sm text-label-sm text-on-surface tabular-nums"
                            >
                              <span className="material-symbols-outlined text-[15px] text-primary" aria-hidden="true">
                                schedule
                              </span>
                              {horario.hora} hs
                              {horario.dias_semana.length < 7 && (
                                <span className="font-normal text-on-surface-variant">
                                  · {formatDias(horario.dias_semana)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )
                    )}
                  </div>

                  {(med.motivo || med.medico || med.indicaciones || med.motivo_baja) && (
                    <div className="mb-space-md space-y-space-xs rounded-lg bg-surface-container-low/60 px-space-md py-space-sm">
                      {med.motivo && (
                        <div className="flex items-start gap-space-xs font-body-sm text-body-sm text-on-surface">
                          <span className="material-symbols-outlined shrink-0 text-[16px] text-secondary" aria-hidden="true">
                            info
                          </span>
                          <p>
                            <span className="font-semibold">Para qué sirve:</span> {med.motivo}
                          </p>
                        </div>
                      )}
                      {med.medico && (
                        <div className="flex items-start gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                          <span className="material-symbols-outlined shrink-0 text-[16px] text-outline" aria-hidden="true">
                            person
                          </span>
                          <p>
                            Indicó {med.medico.nombre}
                            {med.medico.especialidad && <> ({med.medico.especialidad})</>}
                          </p>
                        </div>
                      )}
                      {med.indicaciones && (
                        <div className="flex items-start gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                          <span className="material-symbols-outlined shrink-0 text-[16px] text-tertiary" aria-hidden="true">
                            sticky_note_2
                          </span>
                          <p>{med.indicaciones}</p>
                        </div>
                      )}
                      {med.motivo_baja && (
                        <div className="flex items-start gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                          <span className="material-symbols-outlined shrink-0 text-[16px] text-outline" aria-hidden="true">
                            history
                          </span>
                          <p>
                            <span className="font-semibold text-on-surface">Motivo de baja:</span>{' '}
                            {med.motivo_baja}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="mb-space-sm font-label-sm text-label-sm text-outline tabular-nums">
                    Desde {formatDate(med.fecha_inicio)}
                    {med.fecha_fin && <> · Hasta {formatDate(med.fecha_fin)}</>}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                  {isActiva ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary-fixed/40 px-2.5 py-1 font-label-sm text-label-sm text-on-secondary-fixed-variant">
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                        check_circle
                      </span>
                      Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                        cancel
                      </span>
                      Discontinuada
                    </span>
                  )}

                  <div className="flex items-center gap-space-xs">
                    <button
                      type="button"
                      onClick={() => onEdit?.(med)}
                      disabled={isPending}
                      className={`${cardActionClass} text-on-surface-variant hover:bg-surface-container hover:text-on-surface`}
                    >
                      Editar
                    </button>
                    {isActiva ? (
                      <button
                        type="button"
                        onClick={() => handleToggleEstado(med)}
                        disabled={isPending}
                        className={`${cardActionClass} min-w-30 text-outline hover:bg-error-container/40 hover:text-error`}
                      >
                        {isPending && <Spinner className="size-3.5" />}
                        {isPending ? 'Guardando…' : 'Discontinuar'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleEstado(med)}
                        disabled={isPending}
                        className={`${cardActionClass} min-w-30 text-primary hover:bg-primary-container/10 hover:text-primary-container`}
                      >
                        {isPending && <Spinner className="size-3.5" />}
                        {isPending ? 'Guardando…' : 'Reactivar'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {confirmDialog}
    </section>
  );
}

export default MedicacionList;
