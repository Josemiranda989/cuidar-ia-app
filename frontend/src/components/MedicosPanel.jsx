import { useEffect, useId, useState } from 'react';
import * as doctorsService from '../services/doctors.service';
import { useConfirm } from '../hooks/useConfirm';
import Spinner from './Spinner';

const fieldClass =
  'h-13 w-full rounded-lg border-[1.5px] border-outline-variant bg-surface-container-lowest px-space-md font-body-md text-body-md text-on-surface placeholder:text-outline transition-colors focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-primary-container/20';

const labelClass = 'font-label-md text-label-md text-on-surface';

const emptyForm = { nombre: '', especialidad: '', matricula: '' };

/** Médicos tratantes de una persona (entidad `medico`). */
function MedicosPanel({ personaId }) {
  const uid = useId();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [confirm, confirmDialog] = useConfirm();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    doctorsService
      .getAll(personaId)
      .then((data) => {
        if (isMounted) {
          setDoctors(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('No se pudieron cargar los médicos.');
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [personaId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await doctorsService.create({
        persona_id: personaId,
        nombre: form.nombre.trim(),
        especialidad: form.especialidad.trim() || null,
        matricula: form.matricula.trim() || null,
      });
      setDoctors((prev) => [...prev, created]);
      setForm(emptyForm);
    } catch (err) {
      setError(err.response?.data?.data?.message || 'No se pudo guardar el médico.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (doctor) => {
    const confirmed = await confirm({
      title: `¿Quitar a ${doctor.nombre}?`,
      description: 'Las medicaciones que recetó quedan guardadas, pero sin médico asignado.',
      confirmLabel: 'Quitar',
      tone: 'danger',
    });
    if (!confirmed) return;
    setRemovingId(doctor.id);
    setError(null);
    try {
      await doctorsService.remove(doctor.id);
      setDoctors((prev) => prev.filter((item) => item.id !== doctor.id));
    } catch (err) {
      setError(err.response?.data?.data?.message || 'No se pudo quitar el médico.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-xs md:p-space-lg">
      <div className="flex items-center gap-space-xs">
        <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden="true">
          stethoscope
        </span>
        <h2 className="font-headline-md text-headline-md text-on-surface">Médicos Tratantes</h2>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-error-container p-space-sm font-body-sm text-body-sm text-on-error-container">
          {error}
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
          <Spinner className="size-4 text-primary" /> Cargando…
        </p>
      ) : doctors.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Sin médicos cargados. Agregalos para indicar quién recetó cada medicación.
        </p>
      ) : (
        <ul className="flex flex-col gap-space-xs">
          {doctors.map((doctor) => (
            <li
              key={doctor.id}
              className="flex items-center justify-between gap-space-sm rounded-lg bg-surface-container-low p-space-sm"
            >
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface">{doctor.nombre}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {[doctor.especialidad, doctor.matricula && `Mat. ${doctor.matricula}`]
                    .filter(Boolean)
                    .join(' · ') || 'Sin especialidad cargada'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(doctor)}
                disabled={removingId === doctor.id}
                aria-label={`Quitar a ${doctor.nombre}`}
                className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg text-outline transition-colors hover:bg-error-container/40 hover:text-error disabled:opacity-60"
              >
                {removingId === doctor.id ? (
                  <Spinner className="size-4" />
                ) : (
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    delete
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-space-sm rounded-lg bg-surface-container-low p-space-sm">
        <p className="font-label-md text-label-md text-on-surface">Agregar médico</p>
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-3">
          <div className="flex flex-col gap-space-xs sm:col-span-3">
            <label htmlFor={`${uid}-nombre`} className={labelClass}>
              Nombre *
            </label>
            <input
              id={`${uid}-nombre`}
              name="nombre"
              type="text"
              required
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Dra. Gómez"
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-space-xs sm:col-span-2">
            <label htmlFor={`${uid}-especialidad`} className={labelClass}>
              Especialidad
            </label>
            <input
              id={`${uid}-especialidad`}
              name="especialidad"
              type="text"
              value={form.especialidad}
              onChange={handleChange}
              placeholder="Ej: Cardiología"
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-space-xs">
            <label htmlFor={`${uid}-matricula`} className={labelClass}>
              Matrícula
            </label>
            <input
              id={`${uid}-matricula`}
              name="matricula"
              type="text"
              value={form.matricula}
              onChange={handleChange}
              placeholder="Ej: 45.102"
              className={`${fieldClass} tabular-nums`}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-12 items-center justify-center gap-1 self-end rounded-lg bg-primary px-space-lg font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
        >
          {saving ? <Spinner className="size-4" /> : (
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              add
            </span>
          )}
          Agregar médico
        </button>
      </form>

      {confirmDialog}
    </section>
  );
}

export default MedicosPanel;
