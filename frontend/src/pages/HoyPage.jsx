import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAll as getMedications } from '../services/medications.service';
import { getAll as getDoctors } from '../services/doctors.service';
import * as dosesService from '../services/doses.service';
import { firstName, useCurrentPersona } from '../context/CurrentPersonaContext';
import { useDelayedFlag } from '../hooks/useDelayedFlag';
import {
  addDays,
  currentTimeHHMM,
  formatLongDate,
  formatTimeOfDay,
  toLocalISODate,
  weekdayOf,
} from '../utils/date';
import Spinner from '../components/Spinner';
import { NoPersona, PageError, PageLoading } from '../components/StateViews';

const SUCCESS_TIMEOUT_MS = 3000;

const DAY_NAV = [
  { offset: -1, label: 'Ayer' },
  { offset: 0, label: 'Hoy' },
  { offset: 1, label: 'Mañana' },
];

// Franja del día según la hora programada (ícono + nombre, como el diseño).
function turnoDe(hora) {
  if (hora < '12:00') return { label: 'Mañana', icon: 'wb_sunny' };
  if (hora < '15:00') return { label: 'Mediodía', icon: 'restaurant' };
  if (hora < '20:00') return { label: 'Tarde', icon: 'wb_twilight' };
  return { label: 'Noche', icon: 'nights_stay' };
}

/**
 * Arma la agenda del día: medicaciones activas, no SOS, con un horario que cae ese día
 * de la semana. Agrupa por hora y cruza con las tomas registradas.
 */
function buildSlots(medications, doses, fecha) {
  const weekday = weekdayOf(fecha);
  const doseByHorario = new Map(doses.map((dose) => [dose.horario_id, dose]));
  const byHora = new Map();

  for (const med of medications) {
    if (med.estado !== 'activa' || med.es_sos) continue;
    for (const horario of med.horarios ?? []) {
      if (!horario.dias_semana.includes(weekday)) continue;
      const items = byHora.get(horario.hora) ?? [];
      items.push({ med, horario, dose: doseByHorario.get(horario.id) ?? null });
      byHora.set(horario.hora, items);
    }
  }

  return [...byHora.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hora, items]) => ({ hora, items, done: items.every((item) => item.dose) }));
}

function nombreDe(med) {
  return med.nombre_comercial || med.droga;
}

function SlotStatus({ slot, kind }) {
  if (slot.done) {
    const omitidas = slot.items.filter((item) => item.dose.estado === 'omitida').length;
    const lastAt = slot.items
      .map((item) => item.dose.registrada_at)
      .sort()
      .at(-1);
    return omitidas > 0 ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-space-sm py-1 font-label-sm text-label-sm text-on-tertiary-fixed">
        <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
          do_not_disturb_on
        </span>
        Registrada · {omitidas} omitida{omitidas > 1 ? 's' : ''}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary-fixed/40 px-space-sm py-1 font-label-sm text-label-sm text-on-secondary-fixed-variant tabular-nums">
        <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
          check_circle
        </span>
        Administrada a las {formatTimeOfDay(lastAt)} hs
      </span>
    );
  }

  const styles = {
    ahora: 'bg-primary-container text-on-primary',
    proxima: 'bg-surface-container-high text-primary',
    atrasada: 'bg-error-container text-on-error-container',
    pendiente: 'bg-surface-container text-on-surface-variant',
    programada: 'bg-surface-container text-on-surface-variant',
    sinRegistro: 'bg-error-container text-on-error-container',
  };
  const labels = {
    ahora: ['alarm', 'Toca ahora'],
    proxima: ['schedule', 'Próxima toma'],
    atrasada: ['warning', 'Atrasada'],
    pendiente: ['hourglass_empty', 'Pendiente'],
    programada: ['event', 'Programada'],
    sinRegistro: ['help', 'Sin registrar'],
  };
  const [icon, label] = labels[kind];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-space-sm py-1 font-label-sm text-label-sm ${styles[kind]}`}
    >
      <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
        {icon}
      </span>
      {label}
    </span>
  );
}

function HoyPage() {
  const { currentPersona, currentPersonaId, loading: loadingPersonas } = useCurrentPersona();
  const today = toLocalISODate();
  const [fecha, setFecha] = useState(today);
  const [medications, setMedications] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doses, setDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Claves de lo que se está guardando: 'slot:08:00' o 'item:<horario_id>'.
  const [pending, setPending] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [now, setNow] = useState(currentTimeHHMM);
  const showLoading = useDelayedFlag(loading);

  // "Toca ahora" depende de la hora: la refrescamos cada minuto.
  useEffect(() => {
    const intervalId = setInterval(() => setNow(currentTimeHHMM()), 60_000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!successMsg) return undefined;
    const timeoutId = setTimeout(() => setSuccessMsg(null), SUCCESS_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [successMsg]);

  // Medicaciones y médicos: cambian con la persona.
  useEffect(() => {
    if (!currentPersonaId) return undefined;
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([getMedications(currentPersonaId), getDoctors(currentPersonaId)])
      .then(([meds, docs]) => {
        if (isMounted) {
          setMedications(Array.isArray(meds) ? meds : []);
          setDoctors(Array.isArray(docs) ? docs : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('No se pudo cargar el plan del día. Intentá de nuevo.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentPersonaId, reloadKey]);

  // Tomas registradas: cambian con la persona y con el día elegido.
  useEffect(() => {
    if (!currentPersonaId) return undefined;
    let isMounted = true;
    setDoses([]);

    dosesService
      .getAll({ personaId: currentPersonaId, fecha })
      .then((data) => {
        if (isMounted) setDoses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (isMounted) setError('No se pudieron cargar las tomas registradas. Intentá de nuevo.');
      });

    return () => {
      isMounted = false;
    };
  }, [currentPersonaId, fecha, reloadKey]);

  const slots = useMemo(() => buildSlots(medications, doses, fecha), [medications, doses, fecha]);
  const sosMeds = medications.filter((med) => med.estado === 'activa' && med.es_sos);

  const isToday = fecha === today;
  const isFuture = fecha > today;
  const totalItems = slots.reduce((sum, slot) => sum + slot.items.length, 0);
  const registeredItems = slots.reduce(
    (sum, slot) => sum + slot.items.filter((item) => item.dose).length,
    0
  );
  const progress = totalItems ? Math.round((registeredItems / totalItems) * 100) : 0;
  // La toma en foco: la primera sin registrar del día de hoy.
  const focusHora = isToday ? slots.find((slot) => !slot.done)?.hora : undefined;

  const slotKind = (slot) => {
    if (isFuture) return 'programada';
    if (!isToday) return 'sinRegistro';
    if (slot.hora === focusHora) return slot.hora <= now ? 'ahora' : 'proxima';
    return slot.hora < now ? 'atrasada' : 'pendiente';
  };

  const applyDose = (dose) => {
    setDoses((prev) => [...prev.filter((item) => item.horario_id !== dose.horario_id), dose]);
  };

  const registerItems = async (items, estado, key) => {
    setActionError(null);
    setSuccessMsg(null);
    setPending(key);
    try {
      const saved = await Promise.all(
        items.map((item) => dosesService.register({ horario_id: item.horario.id, fecha, estado }))
      );
      saved.forEach(applyDose);
      setSuccessMsg(
        estado === 'tomada'
          ? `¡Listo! Toma registrada a las ${formatTimeOfDay(saved[0].registrada_at)} hs.`
          : 'Toma marcada como omitida.'
      );
    } catch (err) {
      setActionError(
        err.response?.data?.data?.message || err.message || 'No se pudo registrar la toma.'
      );
    } finally {
      setPending(null);
    }
  };

  const undoItem = async (item) => {
    setActionError(null);
    setPending(`item:${item.horario.id}`);
    try {
      await dosesService.remove(item.dose.id);
      setDoses((prev) => prev.filter((dose) => dose.id !== item.dose.id));
      setSuccessMsg('Registro deshecho.');
    } catch (err) {
      setActionError(err.response?.data?.data?.message || err.message || 'No se pudo deshacer.');
    } finally {
      setPending(null);
    }
  };

  if (loadingPersonas) return <PageLoading label="Cargando…" />;
  if (!currentPersona) return <NoPersona />;

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Fecha + selector de día */}
      <section className="flex flex-col justify-between gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-xs sm:p-space-lg md:flex-row md:items-center">
        <div className="flex flex-col gap-space-xs">
          <p className="flex items-center gap-space-xs font-label-md text-label-md text-primary first-letter:uppercase">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              calendar_today
            </span>
            <span className="first-letter:uppercase">{formatLongDate(fecha)}</span>
          </p>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface sm:font-headline-lg sm:text-headline-lg">
            Plan Diario de {firstName(currentPersona)}
          </h1>
          {totalItems > 0 && (
            <p className="flex items-center gap-space-xs font-body-md text-body-md text-on-surface-variant">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-secondary" aria-hidden="true" />
              <span>
                {isToday ? 'Vas al día: ' : ''}
                <strong className="font-semibold text-on-surface tabular-nums">
                  {registeredItems} de {totalItems} tomas registradas
                </strong>
              </span>
            </p>
          )}
        </div>
        <div
          role="group"
          aria-label="Elegir día"
          className="flex items-center self-start rounded-full bg-surface-container-low p-space-xs md:self-center"
        >
          {DAY_NAV.map(({ offset, label }) => {
            const value = addDays(today, offset);
            const active = fecha === value;
            return (
              <button
                key={offset}
                type="button"
                aria-pressed={active}
                onClick={() => setFecha(value)}
                className={`min-h-10 rounded-full px-space-md font-label-md text-label-md transition-colors ${
                  active
                    ? 'bg-primary font-bold text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
        {/* Línea de tiempo */}
        <div className="flex flex-col gap-space-lg lg:col-span-8">
          {loading ? (
            showLoading ? <PageLoading label="Cargando el plan del día…" /> : null
          ) : error ? (
            <PageError message={error} onRetry={() => setReloadKey((prev) => prev + 1)} />
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center gap-space-sm rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-space-xl text-center font-body-md text-body-md text-on-surface-variant">
              <span className="material-symbols-outlined text-[32px] text-outline" aria-hidden="true">
                event_available
              </span>
              <p>No hay tomas programadas para este día.</p>
              <Link to="/medicaciones" className="font-label-lg text-label-lg text-primary hover:underline">
                Cargar horarios en el Vademécum
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs">
                <div className="mb-space-xs flex items-center justify-between font-label-md text-label-md">
                  <span id="progreso-label" className="text-on-surface">
                    Progreso de cuidados
                  </span>
                  <span className="text-primary tabular-nums">{progress}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-labelledby="progreso-label"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container"
                >
                  <div
                    className="h-full rounded-full bg-primary-container transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

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

              {actionError && (
                <div
                  role="alert"
                  className="flex items-start gap-space-sm rounded-lg bg-error-container p-space-md font-body-sm text-body-sm text-on-error-container"
                >
                  <span className="material-symbols-outlined shrink-0 text-[20px] text-error" aria-hidden="true">
                    error
                  </span>
                  <p>{actionError}</p>
                </div>
              )}

              <ol className="flex flex-col gap-space-md">
                {slots.map((slot) => {
                  const turno = turnoDe(slot.hora);
                  const kind = slotKind(slot);
                  const isFocus = !slot.done && kind === 'ahora';
                  const pendingItems = slot.items.filter((item) => !item.dose);
                  const slotKey = `slot:${slot.hora}`;
                  const canRegister = !isFuture && pendingItems.length > 0;

                  return (
                    <li
                      key={slot.hora}
                      className={`relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-md sm:p-space-lg ${
                        isFocus
                          ? 'shadow-[0_10px_25px_-4px_rgba(13,118,110,0.08),0_4px_10px_-2px_rgba(13,118,110,0.03)] ring-1 ring-primary-container/20'
                          : 'shadow-xs'
                      } ${slot.done ? 'opacity-90' : ''}`}
                    >
                      {isFocus && (
                        <span className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" aria-hidden="true" />
                      )}

                      <div className="mb-space-md flex flex-wrap items-center justify-between gap-space-sm">
                        <div className="flex items-center gap-space-sm">
                          <span
                            className={`flex h-11 w-11 items-center justify-center rounded-full ${
                              isFocus ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-primary'
                            }`}
                            aria-hidden="true"
                          >
                            <span className="material-symbols-outlined text-[22px]">{turno.icon}</span>
                          </span>
                          <div>
                            <h2 className="font-headline-sm text-headline-sm text-on-surface">{turno.label}</h2>
                            <p className="font-time-display text-[18px] font-bold leading-6 text-on-surface tabular-nums">
                              {slot.hora} hs
                            </p>
                          </div>
                        </div>
                        <SlotStatus slot={slot} kind={kind} />
                      </div>

                      <ul className="flex flex-col gap-space-sm">
                        {slot.items.map((item) => {
                          const itemKey = `item:${item.horario.id}`;
                          const busy = pending === itemKey || pending === slotKey;
                          return (
                            <li
                              key={item.horario.id}
                              className="flex flex-col gap-space-sm rounded-lg bg-surface-container-low/60 p-space-sm sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex min-w-0 items-start gap-space-sm">
                                <span
                                  className={`material-symbols-outlined mt-0.5 shrink-0 text-[22px] ${
                                    item.dose?.estado === 'omitida' ? 'text-tertiary' : 'text-primary'
                                  }`}
                                  aria-hidden="true"
                                >
                                  {item.dose?.estado === 'tomada'
                                    ? 'done_all'
                                    : item.dose?.estado === 'omitida'
                                      ? 'do_not_disturb_on'
                                      : 'medication'}
                                </span>
                                <div className="min-w-0">
                                  <p className="flex flex-wrap items-baseline gap-x-space-sm font-label-lg text-label-lg text-on-surface">
                                    {nombreDe(item.med)} {item.med.concentracion}
                                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                                      {item.med.cantidad_por_toma} {item.med.forma}
                                      {item.med.via && <> · {item.med.via}</>}
                                    </span>
                                  </p>
                                  {item.med.indicaciones && (
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                                      {item.med.indicaciones}
                                    </p>
                                  )}
                                  {item.dose && (
                                    <p className="font-body-sm text-body-sm text-outline tabular-nums">
                                      {item.dose.estado === 'tomada' ? 'Administrada' : 'Omitida'} ·{' '}
                                      {formatTimeOfDay(item.dose.registrada_at)} hs
                                    </p>
                                  )}
                                </div>
                              </div>

                              {!isFuture && (
                                <div className="flex shrink-0 items-center gap-space-xs self-end sm:self-auto">
                                  {item.dose ? (
                                    <button
                                      type="button"
                                      onClick={() => undoItem(item)}
                                      disabled={busy}
                                      className="inline-flex min-h-10 items-center gap-1 rounded-lg px-space-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-60"
                                    >
                                      {pending === itemKey && <Spinner className="size-3.5" />}
                                      Deshacer
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => registerItems([item], 'omitida', itemKey)}
                                      disabled={busy}
                                      className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-error-container/50 px-space-sm font-label-md text-label-md text-on-error-container transition-colors hover:bg-error-container disabled:opacity-60"
                                    >
                                      {pending === itemKey && <Spinner className="size-3.5" />}
                                      Omitir
                                    </button>
                                  )}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>

                      {canRegister && (
                        <button
                          type="button"
                          onClick={() => registerItems(pendingItems, 'tomada', slotKey)}
                          disabled={pending !== null}
                          className={`mt-space-md inline-flex w-full items-center justify-center gap-space-xs rounded-lg font-label-lg text-label-lg transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                            isFocus
                              ? 'h-14 bg-primary text-on-primary shadow-md hover:bg-primary-container'
                              : 'min-h-12 bg-surface-container-high text-primary hover:bg-surface-container-highest'
                          }`}
                        >
                          {pending === slotKey ? (
                            <Spinner className="size-5" />
                          ) : (
                            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                              check_circle
                            </span>
                          )}
                          {pending === slotKey
                            ? 'Guardando…'
                            : pendingItems.length === slot.items.length
                              ? 'Marcar como administrada'
                              : `Marcar ${pendingItems.length} restante${pendingItems.length > 1 ? 's' : ''} como administrada${pendingItems.length > 1 ? 's' : ''}`}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>

        {/* Columna lateral */}
        <aside className="flex flex-col gap-space-lg lg:col-span-4">
          <section className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs sm:p-space-lg">
            <h2 className="mb-space-md flex items-center gap-space-xs font-headline-sm text-headline-sm text-on-surface">
              <span className="material-symbols-outlined text-[22px] text-primary" aria-hidden="true">
                contacts
              </span>
              Contactos de Salud
            </h2>
            <ul className="flex flex-col gap-space-sm">
              {doctors.map((doctor) => (
                <li key={doctor.id} className="rounded-lg bg-surface-container-low p-space-sm">
                  <p className="font-label-lg text-label-lg text-on-surface">{doctor.nombre}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {[doctor.especialidad, doctor.matricula && `Mat. ${doctor.matricula}`]
                      .filter(Boolean)
                      .join(' · ') || 'Sin especialidad cargada'}
                  </p>
                </li>
              ))}
              {currentPersona.obra_social && (
                <li className="rounded-lg bg-error-container/40 p-space-sm">
                  <p className="font-label-lg text-label-lg text-on-surface">{currentPersona.obra_social}</p>
                  {currentPersona.numero_afiliado && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant tabular-nums">
                      Afiliado N° {currentPersona.numero_afiliado}
                    </p>
                  )}
                </li>
              )}
              {doctors.length === 0 && !currentPersona.obra_social && (
                <li className="font-body-sm text-body-sm text-on-surface-variant">
                  Sin contactos cargados.{' '}
                  <Link to="/personas" className="text-primary hover:underline">
                    Agregalos en la ficha
                  </Link>
                  .
                </li>
              )}
            </ul>
          </section>

          {sosMeds.length > 0 && (
            <section className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs sm:p-space-lg">
              <h2 className="mb-space-sm flex items-center gap-space-xs font-headline-sm text-headline-sm text-on-surface">
                <span className="material-symbols-outlined text-[22px] text-tertiary" aria-hidden="true">
                  medical_services
                </span>
                Si hace falta (SOS)
              </h2>
              <ul className="flex flex-col gap-space-xs">
                {sosMeds.map((med) => (
                  <li key={med.id} className="font-body-sm text-body-sm text-on-surface">
                    <span className="font-semibold">
                      {nombreDe(med)} {med.concentracion}
                    </span>
                    {med.indicaciones && (
                      <span className="text-on-surface-variant"> · {med.indicaciones}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav aria-label="Gestión y documentos" className="rounded-xl bg-surface-container-low p-space-md">
            <p className="mb-space-sm font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Gestión y Documentos
            </p>
            <ul className="flex flex-col gap-space-xs">
              {[
                { to: '/medicaciones', icon: 'library_add', title: 'Modificar Medicación', sub: 'Vademécum completo' },
                { to: '/ficha-medica', icon: 'print', title: 'Ver Ficha Imprimible', sub: 'Hoja limpia para la consulta' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="flex min-h-14 items-center justify-between gap-space-sm rounded-lg bg-surface-container-lowest p-space-sm transition-colors hover:bg-surface-container-high"
                  >
                    <span className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-[22px] text-primary" aria-hidden="true">
                        {link.icon}
                      </span>
                      <span>
                        <span className="block font-label-lg text-label-lg text-on-surface">{link.title}</span>
                        <span className="block font-body-sm text-body-sm text-on-surface-variant">{link.sub}</span>
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-[20px] text-outline" aria-hidden="true">
                      chevron_right
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}

export default HoyPage;
