import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAll as getMedications } from '../services/medications.service';
import { getAll as getConditions } from '../services/conditions.service';
import { firstName, useCurrentPersona } from '../context/CurrentPersonaContext';
import { useDelayedFlag } from '../hooks/useDelayedFlag';
import { formatDate, formatDias, formatLongDate, formatMonthYear, toLocalISODate } from '../utils/date';
import { NoPersona, PageError, PageLoading } from '../components/StateViews';

function nombreDe(med) {
  return med.nombre_comercial || med.droga;
}

// "Levotiroxina" arriba y la marca abajo, solo si son distintas.
function DrogaMarca({ med }) {
  const showMarca =
    med.nombre_comercial && med.nombre_comercial.toLowerCase() !== med.droga.toLowerCase();
  return (
    <>
      <span className="block font-semibold capitalize text-on-surface">{med.droga}</span>
      {showMarca && <span className="block text-on-surface-variant">{med.nombre_comercial}</span>}
    </>
  );
}

function IndicadoPor({ medico }) {
  if (!medico) return <span className="text-outline">—</span>;
  return (
    <>
      <span className="block font-semibold text-on-surface">{medico.nombre}</span>
      {(medico.especialidad || medico.matricula) && (
        <span className="block text-on-surface-variant">
          {[medico.especialidad, medico.matricula && `MN ${medico.matricula}`].filter(Boolean).join(' · ')}
        </span>
      )}
    </>
  );
}

const thClass =
  'border-b border-outline-variant px-space-sm py-space-sm text-left font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant print:border-slate-400';
const tdClass = 'border-b border-surface-container px-space-sm py-space-sm align-top print:border-slate-300';

function FichaMedicaPage() {
  const { currentPersona, currentPersonaId, loading: loadingPersonas } = useCurrentPersona();
  const [medications, setMedications] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const showLoading = useDelayedFlag(loading);

  useEffect(() => {
    if (!currentPersonaId) return undefined;
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([getMedications(currentPersonaId), getConditions(currentPersonaId)])
      .then(([meds, conds]) => {
        if (isMounted) {
          setMedications(Array.isArray(meds) ? meds : []);
          setConditions(Array.isArray(conds) ? conds : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('No se pudo armar la ficha. Intentá de nuevo.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentPersonaId, reloadKey]);

  if (loadingPersonas) return <PageLoading label="Cargando…" />;
  if (!currentPersona) return <NoPersona />;
  if (loading) return showLoading ? <PageLoading label="Armando la ficha…" /> : null;
  if (error) return <PageError message={error} onRetry={() => setReloadKey((prev) => prev + 1)} />;

  const activas = medications.filter((med) => med.estado === 'activa');
  const programadas = activas.filter((med) => !med.es_sos);
  const sos = activas.filter((med) => med.es_sos);
  const diagnosticos = conditions.filter((cond) => cond.tipo === 'diagnostico');
  const alergias = conditions.filter((cond) => cond.tipo === 'alergia');
  const tomasDiarias = programadas.reduce(
    (sum, med) => sum + (med.horarios ?? []).filter((h) => h.dias_semana.length === 7).length,
    0
  );
  const nombre = firstName(currentPersona);

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Barra de acciones: no se imprime */}
      <section className="flex flex-col justify-between gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-xs sm:p-space-lg md:flex-row md:items-center print:hidden">
        <div className="flex items-start gap-space-sm">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <span className="material-symbols-outlined text-[24px]">description</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm text-on-surface">Ficha Clínica de {nombre}</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Resumen ordenado para presentar al médico. Para PDF, elegí «Guardar como PDF» al imprimir.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-space-xs rounded-lg bg-primary px-space-lg font-label-lg text-label-lg text-on-primary shadow-md transition-colors hover:bg-primary-container"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            print
          </span>
          Imprimir / Guardar PDF
        </button>
      </section>

      {/* Resumen rápido: no se imprime */}
      <section className="grid grid-cols-1 gap-space-sm sm:grid-cols-2 print:hidden">
        <div className="flex items-start gap-space-sm rounded-xl bg-surface-container-low p-space-md">
          <span className="material-symbols-outlined text-[22px] text-primary" aria-hidden="true">
            verified
          </span>
          <div>
            <p className="font-label-md text-label-md text-on-surface">Medicación activa</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {programadas.length} con horario{sos.length > 0 && ` · ${sos.length} de rescate (SOS)`}
            </p>
          </div>
        </div>
        <div
          className={`flex items-start gap-space-sm rounded-xl p-space-md ${
            alergias.length ? 'bg-error-container' : 'bg-surface-container-low'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[22px] ${alergias.length ? 'text-error' : 'text-outline'}`}
            aria-hidden="true"
          >
            notification_important
          </span>
          <div>
            <p className="font-label-md text-label-md text-on-surface">
              {alergias.length ? 'Alergias declaradas' : 'Sin alergias cargadas'}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {alergias.length ? (
                alergias.map((a) => a.descripcion).join(', ')
              ) : (
                <Link to="/personas" className="text-primary hover:underline">
                  Revisalo en la ficha antes de imprimir
                </Link>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Documento imprimible */}
      <article className="rounded-xl bg-surface-container-lowest p-space-lg font-body-sm text-body-sm text-on-surface shadow-xs sm:p-margin-desktop print:rounded-none print:p-0 print:text-slate-900 print:shadow-none">
        <header className="mb-space-lg flex flex-col justify-between gap-space-md border-b-2 border-primary-container pb-space-md sm:flex-row sm:items-end print:border-slate-900">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[32px] text-primary print:text-slate-900" aria-hidden="true">
              local_hospital
            </span>
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                CuidAR · Documento clínico
              </p>
              <h2 className="font-headline-md text-headline-md text-on-surface print:text-slate-900">
                Resumen Farmacológico Activo
              </h2>
              <p className="text-on-surface-variant">Para consultas médicas y guardia ambulatoria</p>
            </div>
          </div>
          <p className="text-on-surface-variant sm:text-right">
            <span className="block font-label-sm text-label-sm uppercase tracking-wider">Fecha de emisión</span>
            <span className="first-letter:uppercase">{formatLongDate(toLocalISODate())}</span>
          </p>
        </header>

        {/* Identificación + diagnósticos */}
        <section className="mb-space-lg grid grid-cols-1 gap-space-md md:grid-cols-3 print:grid-cols-3">
          <div className="rounded-lg border border-outline-variant p-space-md md:col-span-2 print:border-slate-300">
            <p className="mb-space-xs font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Ficha de identificación
            </p>
            <p className="font-headline-sm text-headline-sm text-on-surface print:text-slate-900">
              {currentPersona.nombre_completo}
            </p>
            <dl className="mt-space-sm grid grid-cols-1 gap-space-sm sm:grid-cols-2 print:grid-cols-2">
              <div>
                <dt className="text-on-surface-variant">Edad</dt>
                <dd className="font-semibold tabular-nums">
                  {currentPersona.edad} años ({formatDate(currentPersona.fecha_nacimiento)})
                </dd>
              </div>
              {currentPersona.dni && (
                <div>
                  <dt className="text-on-surface-variant">DNI</dt>
                  <dd className="font-semibold tabular-nums">{currentPersona.dni}</dd>
                </div>
              )}
              {currentPersona.obra_social && (
                <div>
                  <dt className="text-on-surface-variant">Cobertura médica</dt>
                  <dd className="font-semibold">{currentPersona.obra_social}</dd>
                </div>
              )}
              {currentPersona.numero_afiliado && (
                <div>
                  <dt className="text-on-surface-variant">Afiliado N°</dt>
                  <dd className="font-semibold tabular-nums">{currentPersona.numero_afiliado}</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="rounded-lg border border-outline-variant p-space-md print:border-slate-300">
            <p className="mb-space-xs font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Diagnósticos de base
            </p>
            {diagnosticos.length ? (
              <ul className="flex flex-col gap-1">
                {diagnosticos.map((d) => (
                  <li key={d.id} className="flex items-start gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary print:text-slate-900" aria-hidden="true">
                      radio_button_checked
                    </span>
                    {d.descripcion}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-outline">Sin diagnósticos cargados.</p>
            )}
          </div>
        </section>

        {/* Alergias */}
        <section
          className={`mb-space-lg flex items-start gap-space-sm rounded-lg p-space-md ${
            alergias.length
              ? 'bg-error-container text-on-error-container print:border-2 print:border-slate-900 print:bg-transparent'
              : 'border border-outline-variant print:border-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-[24px] text-error print:text-slate-900" aria-hidden="true">
            warning
          </span>
          <div>
            <p className="font-label-md text-label-md uppercase">Alergias y contraindicaciones</p>
            <p className="font-body-md text-body-md font-semibold">
              {alergias.length
                ? alergias.map((a) => a.descripcion).join(' · ')
                : 'Sin alergias declaradas en CuidAR.'}
            </p>
          </div>
        </section>

        {/* Cuadro de medicación */}
        <section className="mb-space-lg">
          <div className="mb-space-sm flex flex-wrap items-center justify-between gap-space-sm">
            <h3 className="flex items-center gap-space-xs font-headline-sm text-headline-sm text-on-surface print:text-slate-900">
              <span className="material-symbols-outlined text-[22px] text-primary print:text-slate-900" aria-hidden="true">
                pill
              </span>
              Medicación activa vigente
            </h3>
            {tomasDiarias > 0 && (
              <span className="font-label-sm text-label-sm text-on-surface-variant tabular-nums">
                {tomasDiarias} tomas programadas diarias
              </span>
            )}
          </div>

          {programadas.length === 0 ? (
            <p className="text-outline">Sin medicación activa con horario.</p>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full min-w-[640px] border-collapse print:min-w-0">
                <thead>
                  <tr>
                    <th className={thClass}>Droga / Marca</th>
                    <th className={thClass}>Dosis</th>
                    <th className={thClass}>Vía y horario</th>
                    <th className={thClass}>Indicado por</th>
                    <th className={thClass}>Inicio</th>
                    <th className={thClass}>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {programadas.map((med) => (
                    <tr key={med.id} className="break-inside-avoid">
                      <td className={tdClass}>
                        <DrogaMarca med={med} />
                      </td>
                      <td className={tdClass}>
                        <span className="block font-semibold">{med.concentracion}</span>
                        <span className="block text-on-surface-variant">
                          {med.cantidad_por_toma} {med.forma}
                        </span>
                      </td>
                      <td className={tdClass}>
                        {(med.horarios ?? []).map((h) => (
                          <span key={h.id} className="block font-semibold tabular-nums">
                            {h.hora}
                            {h.dias_semana.length < 7 && (
                              <span className="font-normal text-on-surface-variant"> · {formatDias(h.dias_semana)}</span>
                            )}
                          </span>
                        ))}
                        <span className="block text-on-surface-variant">
                          {[med.via && med.via[0].toUpperCase() + med.via.slice(1), med.indicaciones]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </td>
                      <td className={tdClass}>
                        <IndicadoPor medico={med.medico} />
                      </td>
                      <td className={`${tdClass} whitespace-nowrap capitalize`}>{formatMonthYear(med.fecha_inicio)}</td>
                      <td className={tdClass}>{med.motivo || <span className="text-outline">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {sos.length > 0 && (
            <div className="mt-space-md break-inside-avoid rounded-lg border border-outline-variant p-space-md print:border-slate-300">
              <p className="mb-space-xs font-label-md text-label-md text-on-surface">Medicación de rescate (SOS)</p>
              <ul className="flex flex-col gap-1">
                {sos.map((med) => (
                  <li key={med.id}>
                    <span className="font-semibold">
                      {nombreDe(med)} {med.concentracion}
                    </span>{' '}
                    · {med.cantidad_por_toma} {med.forma}
                    {med.indicaciones && <> · {med.indicaciones}</>}
                    {med.motivo && <span className="text-on-surface-variant"> ({med.motivo})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {currentPersona.notas && (
          <section className="mb-space-lg break-inside-avoid rounded-lg border border-outline-variant p-space-md print:border-slate-300">
            <p className="mb-space-xs flex items-center gap-space-xs font-label-md text-label-md text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-primary print:text-slate-900" aria-hidden="true">
                notes
              </span>
              Observaciones del cuidador
            </p>
            <p className="whitespace-pre-line">{currentPersona.notas}</p>
          </section>
        )}

        {/* Espacio para el médico */}
        <section className="grid break-inside-avoid grid-cols-1 gap-space-md md:grid-cols-3 print:grid-cols-3">
          <div className="rounded-lg border border-dashed border-outline-variant p-space-md md:col-span-2 print:border-slate-400">
            <p className="font-label-md text-label-md text-on-surface">Anotaciones del médico durante la consulta</p>
            <p className="mb-space-sm text-on-surface-variant">Ajustes posológicos o nuevas indicaciones:</p>
            <div className="h-28" aria-hidden="true" />
          </div>
          <div className="flex flex-col justify-end rounded-lg border border-dashed border-outline-variant p-space-md print:border-slate-400">
            <div className="mb-space-xs border-b border-outline print:border-slate-900" aria-hidden="true" />
            <p className="font-label-md text-label-md text-on-surface">Firma y sello del profesional</p>
            <p className="text-on-surface-variant">Fecha: ____ / ____ / ______</p>
          </div>
        </section>

        <footer className="mt-space-lg flex flex-col justify-between gap-1 border-t border-outline-variant pt-space-sm font-label-sm text-label-sm text-outline sm:flex-row print:border-slate-300">
          <span>Generado con CuidAR</span>
          <span>Válido como resumen para interconsultas médicas</span>
        </footer>
      </article>

      <div className="flex flex-col items-center justify-between gap-space-sm rounded-xl bg-surface-container-low p-space-md sm:flex-row print:hidden">
        <p className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
            help_outline
          </span>
          ¿Querés modificar alguna dosis antes de imprimir?
        </p>
        <Link
          to="/medicaciones"
          className="inline-flex min-h-12 items-center rounded-lg px-space-lg font-label-lg text-label-lg text-primary transition-colors hover:bg-primary-container/10"
        >
          Editar medicamentos
        </Link>
      </div>
    </div>
  );
}

export default FichaMedicaPage;
