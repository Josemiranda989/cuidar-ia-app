import { useState } from 'react';
import { create } from '../services/dependents.service';
import Spinner from './Spinner';

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

function PersonaACargoForm({ onCreated }) {
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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
        Object.entries(form).map(([key, value]) => [key, value.trim() || null])
      );

      await create(payload);

      setSuccessMsg('Persona a cargo registrada con éxito.');
      setForm(initialFormState);

      if (typeof onCreated === 'function') {
        onCreated();
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
    <section className="mb-space-xl rounded-xl bg-surface-container-lowest p-space-lg font-body-md text-body-md text-on-surface shadow-md sm:p-margin-desktop">
      <div className="mb-space-lg flex items-center gap-space-sm">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-[24px]">person_add</span>
        </div>
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Nueva Persona a Cargo</h2>
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

      {successMsg && (
        <div
          role="status"
          className="mb-space-md flex items-start gap-space-sm rounded-lg bg-secondary-fixed/40 p-space-md font-body-sm text-body-sm text-on-secondary-fixed-variant"
        >
          <span className="material-symbols-outlined shrink-0 text-[20px]" aria-hidden="true">
            check_circle
          </span>
          <p>{successMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-space-lg">
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
          <fieldset className="flex flex-col gap-space-md rounded-lg bg-surface-container-low p-space-md">
            <legend className="sr-only">Datos Personales</legend>
            <div className="flex items-center gap-space-xs" aria-hidden="true">
              <span className="material-symbols-outlined text-[24px] text-primary">badge</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">Datos Personales</span>
            </div>

            <div className="flex flex-col gap-space-xs">
              <label htmlFor="nombre_completo" className={labelClass}>
                Nombre Completo y Apellido *
              </label>
              <input
                type="text"
                id="nombre_completo"
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
                <label htmlFor="fecha_nacimiento" className={labelClass}>
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                  required
                  className={`${fieldClass} tabular-nums`}
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <label htmlFor="dni" className={labelClass}>
                  DNI / Documento
                </label>
                <input
                  type="text"
                  id="dni"
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  placeholder="Ej: 4.582.109"
                  className={`${fieldClass} tabular-nums`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              <label htmlFor="parentesco" className={labelClass}>
                Parentesco con el Cuidador
              </label>
              <input
                type="text"
                id="parentesco"
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
                <label htmlFor="obra_social" className={labelClass}>
                  Obra Social / Prepaga
                </label>
                <input
                  type="text"
                  id="obra_social"
                  name="obra_social"
                  value={form.obra_social}
                  onChange={handleChange}
                  placeholder="Ej: PAMI"
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <label htmlFor="numero_afiliado" className={labelClass}>
                  Número de Afiliado
                </label>
                <input
                  type="text"
                  id="numero_afiliado"
                  name="numero_afiliado"
                  value={form.numero_afiliado}
                  onChange={handleChange}
                  placeholder="Ej: 150392819201 / 00"
                  className={`${fieldClass} tabular-nums`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              <label htmlFor="notas" className={labelClass}>
                Notas de cuidado
              </label>
              <textarea
                id="notas"
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
            {submitting ? 'Guardando…' : 'Guardar Persona'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default PersonaACargoForm;
