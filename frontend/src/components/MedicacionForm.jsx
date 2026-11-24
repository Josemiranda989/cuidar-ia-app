import { useState, useEffect, useRef } from 'react';
import { create, update } from '../services/medications.service';
import { getAll as getDoctors } from '../services/doctors.service';
import { useCurrentPersona } from '../context/CurrentPersonaContext';
import { DAY_OPTIONS, toLocalISODate } from '../utils/date';
import Spinner from './Spinner';

const ALL_DAYS = DAY_OPTIONS.map((day) => day.value);

const newHorario = (hora = '08:00') => ({ hora, dias_semana: [...ALL_DAYS] });

const buildInitialState = (personaId = '') => ({
  persona_id: personaId,
  medico_id: '',
  droga: '',
  nombre_comercial: '',
  concentracion: '',
  cantidad_por_toma: 1,
  forma: 'comprimido',
  via: 'oral',
  motivo: '',
  indicaciones: '',
  es_sos: false,
  fecha_inicio: toLocalISODate(),
  horarios: [newHorario()],
});

// Field ergonomics de DESIGN.md: alto mínimo 52px, borde 1.5px, foco teal con halo.
const fieldClass =
  'h-13 w-full rounded-lg border-[1.5px] border-outline-variant bg-surface-container-lowest px-space-md font-body-md text-body-md text-on-surface placeholder:text-outline transition-colors focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-primary-container/20 disabled:cursor-not-allowed disabled:opacity-60';

const textareaClass =
  'w-full resize-none rounded-lg border-[1.5px] border-outline-variant bg-surface-container-lowest p-space-md font-body-md text-body-md text-on-surface placeholder:text-outline transition-colors focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-primary-container/20';

const labelClass = 'font-label-md text-label-md text-on-surface';

const SUCCESS_TIMEOUT_MS = 3000;

// Pasa una medicación de la API a la forma del estado del form.
const toFormState = (med) => ({
  persona_id: med.persona_id ?? '',
  medico_id: med.medico_id ?? '',
  droga: med.droga ?? '',
  nombre_comercial: med.nombre_comercial ?? '',
  concentracion: med.concentracion ?? '',
  cantidad_por_toma: med.cantidad_por_toma ?? 1,
  forma: med.forma ?? 'comprimido',
  via: med.via ?? '',
  motivo: med.motivo ?? '',
  indicaciones: med.indicaciones ?? '',
  es_sos: Boolean(med.es_sos),
  fecha_inicio: med.fecha_inicio ?? toLocalISODate(),
  horarios: med.horarios?.length
    ? med.horarios.map(({ hora, dias_semana }) => ({ hora, dias_semana: [...dias_semana] }))
    : med.es_sos
      ? []
      : [newHorario()],
});

const optionalText = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);

function MedicacionForm({ editingMed, onSaved, onCancelEdit }) {
  const { personas, currentPersonaId, loading: loadingPersonas } = useCurrentPersona();
  const [form, setForm] = useState(() => buildInitialState(currentPersonaId ?? ''));
  const [doctors, setDoctors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const sectionRef = useRef(null);

  const isEditing = Boolean(editingMed);

  // Al elegir "Editar" en una tarjeta: cargar los datos y llevar el form a la vista.
  // Al salir de edición (guardar o cancelar) o cambiar de persona: form vacío para la actual.
  useEffect(() => {
    if (editingMed) {
      setForm(toFormState(editingMed));
      setError(null);
      setSuccessMsg(null);
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setForm(buildInitialState(currentPersonaId ?? ''));
    }
  }, [editingMed, currentPersonaId]);

  // El badge de éxito se va solo a los 3s.
  useEffect(() => {
    if (!successMsg) return undefined;
    const timeoutId = setTimeout(() => setSuccessMsg(null), SUCCESS_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [successMsg]);

  // Los médicos dependen de la persona elegida en el form.
  useEffect(() => {
    if (!form.persona_id) {
      setDoctors([]);
      return undefined;
    }
    let isMounted = true;
    getDoctors(form.persona_id)
      .then((data) => {
        if (isMounted) setDoctors(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        // Sin médicos el form sigue funcionando: el campo es opcional.
        if (isMounted) setDoctors([]);
      });
    return () => {
      isMounted = false;
    };
  }, [form.persona_id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      // Un médico es de una persona: si cambia la persona, se limpia.
      if (name === 'persona_id') next.medico_id = '';
      // Una medicación SOS no tiene horarios; al desmarcarla, proponemos uno.
      if (name === 'es_sos') next.horarios = checked ? [] : [newHorario()];
      return next;
    });
  };

  const updateHorario = (index, changes) => {
    setForm((prev) => ({
      ...prev,
      horarios: prev.horarios.map((horario, i) => (i === index ? { ...horario, ...changes } : horario)),
    }));
  };

  const toggleDia = (index, day) => {
    setForm((prev) => ({
      ...prev,
      horarios: prev.horarios.map((horario, i) => {
        if (i !== index) return horario;
        const has = horario.dias_semana.includes(day);
        // Nunca dejamos un horario sin días.
        if (has && horario.dias_semana.length === 1) return horario;
        const dias_semana = has
          ? horario.dias_semana.filter((d) => d !== day)
          : [...horario.dias_semana, day].sort((a, b) => a - b);
        return { ...horario, dias_semana };
      }),
    }));
  };

  const addHorario = () => {
    setForm((prev) => ({ ...prev, horarios: [...prev.horarios, newHorario('20:00')] }));
  };

  const removeHorario = (index) => {
    setForm((prev) => ({ ...prev, horarios: prev.horarios.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        cantidad_por_toma: Number(form.cantidad_por_toma) || form.cantidad_por_toma,
        medico_id: form.medico_id || null,
        nombre_comercial: optionalText(form.nombre_comercial),
        via: optionalText(form.via),
        motivo: optionalText(form.motivo),
        indicaciones: optionalText(form.indicaciones),
        horarios: form.es_sos ? [] : form.horarios,
      };

      if (isEditing) {
        await update(editingMed.id, payload);
        setSuccessMsg('Medicación actualizada con éxito.');
      } else {
        await create(payload);
        setSuccessMsg('Medicación registrada con éxito.');
      }

      setForm(buildInitialState(currentPersonaId ?? ''));

      if (typeof onSaved === 'function') {
        onSaved();
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.data?.message ||
        err.message ||
        'Error inesperado al guardar la medicación.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      className={`mb-space-xl scroll-mt-36 rounded-xl bg-surface-container-lowest p-space-lg font-body-md text-body-md text-on-surface shadow-md sm:p-margin-desktop ${
        isEditing ? 'ring-2 ring-primary-container/40' : ''
      }`}
    >
      <div className="mb-space-lg flex items-center gap-space-sm">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-[24px]">
            {isEditing ? 'edit' : 'edit_note'}
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {isEditing
              ? `Editando: ${editingMed.nombre_comercial || editingMed.droga}`
              : 'Nueva Medicación'}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {isEditing
              ? 'Corregí lo que haga falta y guardá los cambios.'
              : 'Completá los datos tal como figuran en la caja o la receta.'}
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

      <form onSubmit={handleSubmit} className="space-y-space-lg">
        <div className="flex flex-col gap-space-xs">
          <label htmlFor="persona_id" className={labelClass}>
            Persona a Cargo *
          </label>
          <select
            id="persona_id"
            name="persona_id"
            value={form.persona_id}
            onChange={handleChange}
            required
            disabled={loadingPersonas}
            className={fieldClass}
          >
            <option value="">
              {loadingPersonas
                ? 'Cargando personas...'
                : '-- Seleccioná una persona --'}
            </option>
            {personas.map((dep) => (
              <option key={dep.id} value={dep.id}>
                {dep.nombre_completo}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
          <div className="flex flex-col gap-space-xs">
            <label htmlFor="droga" className={labelClass}>
              Droga (Principio Activo) *
            </label>
            <input
              type="text"
              id="droga"
              name="droga"
              value={form.droga}
              onChange={handleChange}
              placeholder="Ej: Enalapril"
              required
              className={fieldClass}
            />
            <span className="font-body-sm text-body-sm text-outline">
              El nombre genérico que figura en la receta.
            </span>
          </div>

          <div className="flex flex-col gap-space-xs">
            <label htmlFor="nombre_comercial" className={labelClass}>
              Nombre Comercial
            </label>
            <input
              type="text"
              id="nombre_comercial"
              name="nombre_comercial"
              value={form.nombre_comercial}
              onChange={handleChange}
              placeholder="Ej: Lotrial"
              className={fieldClass}
            />
            <span className="font-body-sm text-body-sm text-outline">
              Tal como figura en la cajita.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-space-lg sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-space-xs">
            <label htmlFor="concentracion" className={labelClass}>
              Concentración *
            </label>
            <input
              type="text"
              id="concentracion"
              name="concentracion"
              value={form.concentracion}
              onChange={handleChange}
              placeholder="Ej: 10 mg"
              required
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-space-xs">
            <label htmlFor="cantidad_por_toma" className={labelClass}>
              Cantidad por toma *
            </label>
            <input
              type="number"
              id="cantidad_por_toma"
              name="cantidad_por_toma"
              min="0.25"
              step="any"
              value={form.cantidad_por_toma}
              onChange={handleChange}
              required
              className={`${fieldClass} tabular-nums`}
            />
          </div>

          <div className="flex flex-col gap-space-xs">
            <label htmlFor="forma" className={labelClass}>
              Forma *
            </label>
            <select
              id="forma"
              name="forma"
              value={form.forma}
              onChange={handleChange}
              required
              className={fieldClass}
            >
              <option value="comprimido">Comprimido</option>
              <option value="gota">Gota</option>
              <option value="ml">ml</option>
              <option value="aplicacion">Aplicación</option>
            </select>
          </div>

          <div className="flex flex-col gap-space-xs">
            <label htmlFor="fecha_inicio" className={labelClass}>
              Fecha Inicio *
            </label>
            <input
              type="date"
              id="fecha_inicio"
              name="fecha_inicio"
              value={form.fecha_inicio}
              onChange={handleChange}
              required
              className={`${fieldClass} tabular-nums`}
            />
          </div>
        </div>

        <label
          htmlFor="es_sos"
          className="flex min-h-12 cursor-pointer items-center gap-space-sm rounded-lg bg-surface-container-low px-space-md py-space-sm transition-colors hover:bg-surface-container"
        >
          <input
            type="checkbox"
            id="es_sos"
            name="es_sos"
            checked={form.es_sos}
            onChange={handleChange}
            className="h-5 w-5 shrink-0 cursor-pointer accent-primary"
          />
          <span className="material-symbols-outlined text-[20px] text-tertiary" aria-hidden="true">
            medical_services
          </span>
          <span className="font-body-md text-body-md text-on-surface">
            Es medicación de rescate / eventual (SOS)
          </span>
        </label>

        <fieldset className="flex flex-col gap-space-md rounded-lg bg-surface-container-low p-space-md">
          <legend className="sr-only">Indicación médica</legend>
          <div className="flex items-center gap-space-xs" aria-hidden="true">
            <span className="material-symbols-outlined text-[22px] text-primary">clinical_notes</span>
            <span className="font-headline-sm text-headline-sm text-on-surface">Indicación médica</span>
          </div>

          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <div className="flex flex-col gap-space-xs">
              <label htmlFor="medico_id" className={labelClass}>
                ¿Quién lo recetó?
              </label>
              <select
                id="medico_id"
                name="medico_id"
                value={form.medico_id}
                onChange={handleChange}
                disabled={!form.persona_id}
                className={fieldClass}
              >
                <option value="">Sin médico asignado</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.nombre}
                    {doctor.especialidad ? ` (${doctor.especialidad})` : ''}
                  </option>
                ))}
              </select>
              <span className="font-body-sm text-body-sm text-outline">
                Los médicos se cargan en la ficha de la persona.
              </span>
            </div>

            <div className="flex flex-col gap-space-xs">
              <label htmlFor="via" className={labelClass}>
                Vía
              </label>
              <input
                type="text"
                id="via"
                name="via"
                list="vias-sugeridas"
                value={form.via}
                onChange={handleChange}
                placeholder="Ej: oral"
                className={fieldClass}
              />
              <datalist id="vias-sugeridas">
                <option value="oral" />
                <option value="sublingual" />
                <option value="oftálmica" />
                <option value="tópica" />
                <option value="inhalatoria" />
                <option value="subcutánea" />
              </datalist>
            </div>

            <div className="flex flex-col gap-space-xs md:col-span-2">
              <label htmlFor="motivo" className={labelClass}>
                Motivo / ¿Para qué sirve?
              </label>
              <input
                type="text"
                id="motivo"
                name="motivo"
                value={form.motivo}
                onChange={handleChange}
                placeholder="Ej: Regular la presión arterial"
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-space-xs md:col-span-2">
              <label htmlFor="indicaciones" className={labelClass}>
                Indicaciones para el cuidador
              </label>
              <textarea
                id="indicaciones"
                name="indicaciones"
                rows="2"
                value={form.indicaciones}
                onChange={handleChange}
                placeholder="Ej: Con el desayuno y un vaso entero de agua."
                className={textareaClass}
              />
            </div>
          </div>
        </fieldset>

        {!form.es_sos && (
          <fieldset className="flex flex-col gap-space-md rounded-lg bg-surface-container-low p-space-md">
            <legend className="sr-only">Horarios de toma</legend>
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs" aria-hidden="true">
                <span className="material-symbols-outlined text-[22px] text-primary">schedule</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Horarios de toma</span>
              </div>
              <button
                type="button"
                onClick={addHorario}
                className="inline-flex min-h-12 items-center gap-1 rounded-lg px-space-md font-label-md text-label-md text-primary transition-colors hover:bg-primary-container/10"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  add
                </span>
                Agregar horario
              </button>
            </div>

            {form.horarios.length === 0 && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Sin horarios no va a aparecer en Hoy. Agregá al menos uno.
              </p>
            )}

            <ul className="flex flex-col gap-space-sm">
              {form.horarios.map((horario, index) => (
                <li
                  key={index}
                  className="flex flex-col gap-space-sm rounded-lg bg-surface-container-lowest p-space-sm sm:flex-row sm:items-center"
                >
                  <label className="flex items-center gap-space-sm">
                    <span className="sr-only">Hora del horario {index + 1}</span>
                    <input
                      type="time"
                      required
                      value={horario.hora}
                      onChange={(event) => updateHorario(index, { hora: event.target.value })}
                      className={`${fieldClass} w-36 tabular-nums`}
                    />
                  </label>
                  <div
                    role="group"
                    aria-label={`Días del horario ${index + 1}`}
                    className="flex flex-1 flex-wrap gap-1"
                  >
                    {DAY_OPTIONS.map((day) => {
                      const active = horario.dias_semana.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleDia(index, day.value)}
                          className={`min-h-10 min-w-11 rounded-full px-space-sm font-label-md text-label-md transition-colors ${
                            active
                              ? 'bg-primary-container text-on-primary'
                              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHorario(index)}
                    aria-label={`Quitar horario de las ${horario.hora}`}
                    className="inline-flex min-h-12 min-w-12 items-center justify-center self-end rounded-lg text-outline transition-colors hover:bg-error-container/40 hover:text-error sm:self-auto"
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      delete
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        <div className="flex flex-col-reverse gap-space-sm pt-space-md sm:flex-row sm:justify-end">
          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={submitting}
              className="h-14 rounded-lg px-space-lg font-label-lg text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-14 w-full items-center justify-center gap-space-xs rounded-lg bg-primary px-space-xl font-label-lg text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary sm:w-auto sm:min-w-56"
          >
            {submitting && <Spinner className="size-5" />}
            {submitting
              ? 'Guardando…'
              : isEditing
                ? 'Guardar Cambios'
                : 'Guardar Medicación'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default MedicacionForm;
