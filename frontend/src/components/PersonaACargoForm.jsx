import { useEffect, useId, useState } from 'react';
import { create, update } from '../services/dependents.service';
import Spinner from './Spinner';

const SUCCESS_TIMEOUT_MS = 3000;

const initialFormState = {
  nombre_completo: '',
  fecha_nacimiento: '',
  dni: '',
  parentesco: '',
  obra_social: '',
  numero_afiliado: '',
  notas: '',
};

// Field ergonomics de DESIGN.md: alto mínimo 52px, borde 1.5px, foco teal con halo.
const fieldClass =
  'h-13 w-full rounded-lg border-[1.5px] border-outline-variant bg-surface-container-lowest px-space-md font-body-md text-body-md text-on-surface placeholder:text-outline transition-colors focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-primary-container/20';

const labelClass = 'font-label-md text-label-md text-on-surface';

// Persona de la API → estado del form (null pasa a '' para los inputs controlados).
const toFormState = (persona) =>
  Object.fromEntries(Object.keys(initialFormState).map((key) => [key, persona?.[key] ?? '']));

/**
 * Alta o edición de una persona a cargo.
 * Con `persona` edita (update); sin ella da de alta (create).
 * `onSaved(personaGuardada)` se llama después de guardar.
 */
function PersonaACargoForm({ persona, onSaved }) {
  const isEditing = Boolean(persona);
  // Puede haber dos forms en la misma página (edición y alta): ids únicos por instancia.
  const uid = useId();
  const [form, setForm] = useState(() => toFormState(persona));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Si cambia la persona que se edita (selector del header), recargamos sus datos.
  useEffect(() => {
    setForm(toFormState(persona));
    setError(null);
  }, [persona]);

  // El badge de éxito se va solo a los 3s.
  useEffect(() => {
    if (!successMsg) return undefined;
    const timeoutId = setTimeout(() => setSuccessMsg(null), SUCCESS_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [successMsg]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      // Los opcionales vacíos viajan como null, igual que los guarda el modelo.
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, String(value).trim() || null])
      );

      const saved = isEditing ? await update(persona.id, payload) : await create(payload);

      if (isEditing) {
        setSuccessMsg('Datos actualizados con éxito.');
      } else {
        setSuccessMsg('Persona a cargo registrada con éxito.');
        setForm(initialFormState);
      }

      if (typeof onSaved === 'function') {
        onSaved(saved);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.data?.message ||
        err.message ||
        'Error inesperado al guardar la persona a cargo.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl bg-surface-container-lowest p-space-lg font-body-md text-body-md text-on-surface shadow-xs sm:p-margin-desktop">
      <div className="mb-space-lg flex items-center gap-space-sm">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-[24px]">{isEditing ? 'badge' : 'person_add'}</span>
        </div>
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {isEditing ? 'Datos de la persona' : 'Nueva Persona a Cargo'}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Con estos datos se arma la ficha para el médico.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-space-md flex items-start gap-space-sm rounded-lg bg-error-container p-space-md font-body-sm text-body-sm text-on-error-container"
        >
          <span className="material-symbols-outlined shrink-0 text-[20px] text-error" aria-hidden="true">
            error
          </span>
          <p>
            <strong className="font-semibold">Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Live region siempre montada para que el lector de pantalla anuncie el cambio. */}
      <div role="status" aria-live="polite">
        {successMsg && (
          <span className="mb-space-md inline-flex items-center gap-1 rounded-full bg-secondary-fixed/40 px-space-md py-space-xs font-label-md text-label-md text-on-secondary-fixed-variant">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              check_circle
            </span>
            {successMsg}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-space-lg">
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
          <fieldset className="flex flex-col gap-space-md rounded-lg bg-surface-container-low p-space-md">
            <legend className="sr-only">Datos Personales</legend>
            <div className="flex items-center gap-space-xs" aria-hidden="true">
              <span className="material-symbols-outlined text-[24px] text-primary">badge</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">Datos Personales</span>
            </div>

            <div className="flex flex-col gap-space-xs">
              <label htmlFor={`${uid}-nombre_completo`} className={labelClass}>
                Nombre Completo y Apellido *
              </label>
              <input
                type="text"
                id={`${uid}-nombre_completo`}
                name="nombre_completo"
                value={form.nombre_completo}
                onChange={handleChange}
                placeholder="Ej: Elsa Beatriz Ramos"
                required
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
              <div className="flex flex-col gap-space-xs">
                <label htmlFor={`${uid}-fecha_nacimiento`} className={labelClass}>
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  id={`${uid}-fecha_nacimiento`}
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                  required
                  className={`${fieldClass} tabular-nums`}
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <label htmlFor={`${uid}-dni`} className={labelClass}>
                  DNI / Documento
                </label>
                <input
                  type="text"
                  id={`${uid}-dni`}
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  placeholder="Ej: 4.582.109"
                  className={`${fieldClass} tabular-nums`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              <label htmlFor={`${uid}-parentesco`} className={labelClass}>
                Parentesco con el Cuidador
              </label>
              <input
                type="text"
                id={`${uid}-parentesco`}
                name="parentesco"
                value={form.parentesco}
                onChange={handleChange}
                placeholder="Ej: Madre"
                className={fieldClass}
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-space-md rounded-lg bg-surface-container-low p-space-md">
            <legend className="sr-only">Cobertura Médica</legend>
            <div className="flex items-center gap-space-xs" aria-hidden="true">
              <span className="material-symbols-outlined text-[24px] text-primary">health_and_safety</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">Cobertura Médica</span>
            </div>

            <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
              <div className="flex flex-col gap-space-xs">
                <label htmlFor={`${uid}-obra_social`} className={labelClass}>
                  Obra Social / Prepaga
                </label>
                <input
                  type="text"
                  id={`${uid}-obra_social`}
                  name="obra_social"
                  value={form.obra_social}
                  onChange={handleChange}
                  placeholder="Ej: PAMI"
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <label htmlFor={`${uid}-numero_afiliado`} className={labelClass}>
                  Número de Afiliado
                </label>
                <input
                  type="text"
                  id={`${uid}-numero_afiliado`}
                  name="numero_afiliado"
                  value={form.numero_afiliado}
                  onChange={handleChange}
                  placeholder="Ej: 150392819201 / 00"
                  className={`${fieldClass} tabular-nums`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              <label htmlFor={`${uid}-notas`} className={labelClass}>
                Notas de cuidado
              </label>
              <textarea
                id={`${uid}-notas`}
                name="notas"
                rows="3"
                value={form.notas}
                onChange={handleChange}
                placeholder="Ej: Prefiere tomar los comprimidos grandes con una cucharada de yogur."
                className="w-full resize-none rounded-lg border-[1.5px] border-outline-variant bg-surface-container-lowest p-space-md font-body-md text-body-md text-on-surface placeholder:text-outline transition-colors focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-primary-container/20"
              />
            </div>
          </fieldset>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex h-14 w-full items-center justify-center gap-space-xs rounded-lg bg-primary px-space-xl font-label-lg text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary sm:w-auto sm:min-w-56"
          >
            {submitting ? (
              <Spinner className="size-5" />
            ) : (
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                save
              </span>
            )}
            {submitting ? 'Guardando…' : isEditing ? 'Guardar Cambios' : 'Guardar Persona'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default PersonaACargoForm;
