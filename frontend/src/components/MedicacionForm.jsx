import { useState, useEffect, useRef } from 'react';
import { create, update } from '../services/medications.service';
import { getAll as getDependents } from '../services/dependents.service';
import Spinner from './Spinner';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const initialFormState = {
  persona_id: '',
  droga: '',
  nombre_comercial: '',
  concentracion: '',
  cantidad_por_toma: 1,
  forma: 'comprimido',
  es_sos: false,
  fecha_inicio: getTodayDate(),
};

// Field ergonomics de DESIGN.md: alto mínimo 52px, borde 1.5px, foco teal con halo.
const fieldClass =
  'h-13 w-full rounded-lg border-[1.5px] border-outline-variant bg-surface-container-lowest px-space-md font-body-md text-body-md text-on-surface placeholder:text-outline transition-colors focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-primary-container/20 disabled:cursor-not-allowed disabled:opacity-60';

const labelClass = 'font-label-md text-label-md text-on-surface';

const SUCCESS_TIMEOUT_MS = 3000;

// Pasa una medicación de la API a la forma del estado del form.
const toFormState = (med) => ({
  persona_id: med.persona_id ?? '',
  droga: med.droga ?? '',
  nombre_comercial: med.nombre_comercial ?? '',
  concentracion: med.concentracion ?? '',
  cantidad_por_toma: med.cantidad_por_toma ?? 1,
  forma: med.forma ?? 'comprimido',
  es_sos: Boolean(med.es_sos),
  fecha_inicio: med.fecha_inicio ?? getTodayDate(),
});

function MedicacionForm({ editingMed, onSaved, onCancelEdit }) {
  const [form, setForm] = useState(initialFormState);
  const [dependents, setDependents] = useState([]);
  const [loadingDependents, setLoadingDependents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const sectionRef = useRef(null);

  const isEditing = Boolean(editingMed);

  // Al elegir "Editar" en una tarjeta: cargar los datos y llevar el form a la vista.
  // Al salir de edición (guardar o cancelar): volver al form vacío.
  useEffect(() => {
    if (editingMed) {
      setForm(toFormState(editingMed));
      setError(null);
      setSuccessMsg(null);
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setForm({ ...initialFormState, fecha_inicio: getTodayDate() });
    }
  }, [editingMed]);

  // El badge de éxito se va solo a los 3s.
  useEffect(() => {
    if (!successMsg) return undefined;
    const timeoutId = setTimeout(() => setSuccessMsg(null), SUCCESS_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [successMsg]);

  useEffect(() => {
    let isMounted = true;
    setLoadingDependents(true);

    getDependents()
      .then((data) => {
        if (isMounted) {
          setDependents(Array.isArray(data) ? data : []);
          setLoadingDependents(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err.response?.data?.data?.message ||
              err.message ||
              'Error al cargar personas a cargo'
          );
          setLoadingDependents(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
      };

      if (isEditing) {
        await update(editingMed.id, payload);
        setSuccessMsg('Medicación actualizada con éxito.');
      } else {
        await create(payload);
        setSuccessMsg('Medicación registrada con éxito.');
      }

      setForm({
        ...initialFormState,
        fecha_inicio: getTodayDate(),
      });

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
            disabled={loadingDependents}
            className={fieldClass}
          >
            <option value="">
              {loadingDependents
                ? 'Cargando personas...'
                : '-- Seleccioná una persona --'}
            </option>
            {dependents.map((dep) => (
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
