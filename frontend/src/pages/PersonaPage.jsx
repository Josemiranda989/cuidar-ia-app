import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentPersona } from '../context/CurrentPersonaContext';
import { formatDate } from '../utils/date';
import PersonaACargoForm from '../components/PersonaACargoForm';
import PersonaACargoList from '../components/PersonaACargoList';
import CondicionesPanel from '../components/CondicionesPanel';
import MedicosPanel from '../components/MedicosPanel';
import { PageError, PageLoading } from '../components/StateViews';

function initials(nombre = '') {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function SummaryPill({ icon, iconClass, label, labelClass = 'text-on-surface-variant', value }) {
  return (
    <div className="flex items-center gap-space-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass}`} aria-hidden="true">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <span className={`block font-label-sm text-label-sm uppercase ${labelClass}`}>{label}</span>
        <span className="font-body-md text-body-md font-semibold text-on-surface">{value}</span>
      </div>
    </div>
  );
}

function PersonaPage() {
  const { currentPersona, setCurrentPersonaId, loading, error, reload } = useCurrentPersona();
  const [conditions, setConditions] = useState([]);
  const [listRefresh, setListRefresh] = useState(0);

  const handleCreated = (saved) => {
    reload();
    setListRefresh((prev) => prev + 1);
    if (saved?.id) setCurrentPersonaId(saved.id);
  };

  const handleUpdated = () => {
    reload();
    setListRefresh((prev) => prev + 1);
  };

  if (loading) return <PageLoading label="Cargando ficha…" />;
  if (error) return <PageError message="No se pudo cargar la ficha. Intentá de nuevo." onRetry={reload} />;

  // Sin personas todavía: solo el alta.
  if (!currentPersona) {
    return (
      <div className="flex flex-col gap-space-lg">
        <div className="rounded-xl bg-surface-container-low p-space-lg">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface sm:font-headline-lg sm:text-headline-lg">
            Empecemos por quién cuidás
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Con su ficha armamos el plan diario y el resumen para el médico.
          </p>
        </div>
        <PersonaACargoForm onSaved={handleCreated} />
      </div>
    );
  }

  const alergias = conditions.filter((c) => c.tipo === 'alergia');
  const diagnosticos = conditions.filter((c) => c.tipo === 'diagnostico');

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Encabezado: identidad */}
      <section className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs md:p-space-lg">
        <div className="flex flex-col justify-between gap-space-lg md:flex-row md:items-center">
          <div className="flex flex-col items-start gap-space-md sm:flex-row sm:items-center">
            <div
              className="flex size-24 shrink-0 items-center justify-center rounded-full bg-primary-container font-display-lg text-display-lg text-on-primary shadow-md"
              aria-hidden="true"
            >
              {initials(currentPersona.nombre_completo)}
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex flex-wrap items-center gap-space-xs">
                <span className="rounded-full bg-primary-container px-space-sm py-0.5 font-label-sm text-label-sm uppercase tracking-wider text-on-primary">
                  Persona a Cargo
                </span>
                {currentPersona.parentesco && (
                  <span className="rounded-full bg-surface-container px-space-sm py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                    Parentesco: {currentPersona.parentesco}
                  </span>
                )}
              </div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface sm:font-headline-lg sm:text-headline-lg">
                {currentPersona.nombre_completo}
              </h1>
              <p className="flex items-center gap-space-xs font-body-md text-body-md text-on-surface-variant tabular-nums">
                <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                  calendar_today
                </span>
                {currentPersona.edad} años ({formatDate(currentPersona.fecha_nacimiento)})
              </p>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-row gap-space-xs md:w-auto md:flex-col">
            <Link
              to="/hoy"
              className="flex min-h-12 flex-1 items-center justify-center gap-space-xs rounded-lg bg-surface-container px-space-md font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high md:flex-initial"
            >
              <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
                today
              </span>
              Ver tomas de hoy
            </Link>
            <Link
              to="/medicaciones"
              className="flex min-h-12 flex-1 items-center justify-center gap-space-xs rounded-lg bg-secondary-container/30 px-space-md font-label-md text-label-md text-secondary transition-colors hover:bg-secondary-container/50 md:flex-initial"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                medication
              </span>
              Ver vademécum
            </Link>
          </div>
        </div>

        <div className="mt-space-md flex flex-wrap items-center justify-between gap-space-md rounded-lg bg-surface-container-low/60 p-space-md">
          <SummaryPill
            icon="warning"
            iconClass={alergias.length ? 'bg-error-container text-error' : 'bg-surface-container text-outline'}
            label={alergias.length ? 'Alergias' : 'Alergias'}
            labelClass={alergias.length ? 'text-error' : 'text-on-surface-variant'}
            value={alergias.length ? alergias.map((a) => a.descripcion).join(', ') : 'Sin declarar'}
          />
          <SummaryPill
            icon="vital_signs"
            iconClass="bg-surface-container-high text-primary"
            label="Condición principal"
            value={diagnosticos[0]?.descripcion ?? 'Sin cargar'}
          />
          <SummaryPill
            icon="shield"
            iconClass="bg-secondary-container text-on-secondary-container"
            label="Cobertura"
            value={currentPersona.obra_social || 'Sin cargar'}
          />
        </div>
      </section>

      <PersonaACargoForm persona={currentPersona} onSaved={handleUpdated} />

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <CondicionesPanel personaId={currentPersona.id} onChange={setConditions} />
        <MedicosPanel personaId={currentPersona.id} />
      </div>

      <PersonaACargoList
        refreshTrigger={listRefresh}
        currentId={currentPersona.id}
        onSelect={setCurrentPersonaId}
      />

      <details className="group rounded-xl bg-surface-container-low p-space-md">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-space-sm font-headline-sm text-headline-sm text-on-surface">
          <span className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[22px] text-primary" aria-hidden="true">
              person_add
            </span>
            Agregar otra persona a cargo
          </span>
          <span
            className="material-symbols-outlined text-outline transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          >
            expand_more
          </span>
        </summary>
        <div className="mt-space-md">
          <PersonaACargoForm onSaved={handleCreated} />
        </div>
      </details>
    </div>
  );
}

export default PersonaPage;
