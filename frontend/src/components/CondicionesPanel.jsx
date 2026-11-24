import { useEffect, useId, useState } from 'react';
import * as conditionsService from '../services/conditions.service';
import { useConfirm } from '../hooks/useConfirm';
import Spinner from './Spinner';

const fieldClass =
  'h-13 w-full rounded-lg border-[1.5px] border-outline-variant bg-surface-container-lowest px-space-md font-body-md text-body-md text-on-surface placeholder:text-outline transition-colors focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-primary-container/20';

const TIPOS = {
  diagnostico: { label: 'Diagnóstico', plural: 'Diagnósticos activos', icon: 'check_circle' },
  alergia: { label: 'Alergia', plural: 'Alergias medicamentosas', icon: 'emergency_home' },
};

/** Diagnósticos y alergias de una persona (entidad `condicion`). */
function CondicionesPanel({ personaId, onChange }) {
  const uid = useId();
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tipo, setTipo] = useState('diagnostico');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [confirm, confirmDialog] = useConfirm();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    conditionsService
      .getAll(personaId)
      .then((data) => {
        if (isMounted) {
          const list = Array.isArray(data) ? data : [];
          setConditions(list);
          setLoading(false);
          // El encabezado de la ficha resume alergias y diagnósticos con estos mismos datos.
          onChange?.(list);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('No se pudieron cargar los diagnósticos y alergias.');
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [personaId]);

  const notify = (next) => {
    setConditions(next);
    onChange?.(next);
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!descripcion.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await conditionsService.create({ persona_id: personaId, tipo, descripcion });
      notify([...conditions, created]);
      setDescripcion('');
    } catch (err) {
      setError(err.response?.data?.data?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (condition) => {
    const confirmed = await confirm({
      title: `¿Quitar «${condition.descripcion}»?`,
      description: `Se va a borrar de la ficha y de la ficha para el médico.`,
      confirmLabel: 'Quitar',
      tone: 'danger',
    });
    if (!confirmed) return;
    setRemovingId(condition.id);
    setError(null);
    try {
      await conditionsService.remove(condition.id);
      notify(conditions.filter((item) => item.id !== condition.id));
    } catch (err) {
      setError(err.response?.data?.data?.message || 'No se pudo quitar.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-xs md:p-space-lg">
      <div className="flex items-center gap-space-xs">
        <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden="true">
          clinical_notes
        </span>
        <h2 className="font-headline-md text-headline-md text-on-surface">Diagnósticos y Alergias</h2>
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
      ) : (
        Object.entries(TIPOS).map(([key, meta]) => {
          const items = conditions.filter((condition) => condition.tipo === key);
          const isAllergy = key === 'alergia';
          return (
            <div
              key={key}
              className={isAllergy ? 'rounded-lg bg-error-container/30 p-space-sm' : ''}
            >
              <p
                className={`mb-space-xs flex items-center gap-1 font-label-md text-label-md ${
                  isAllergy ? 'text-error' : 'text-on-surface'
                }`}
              >
                {isAllergy && (
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    {meta.icon}
                  </span>
                )}
                {meta.plural}
              </p>
              {items.length === 0 ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {isAllergy ? 'Sin alergias declaradas.' : 'Sin diagnósticos cargados.'}
                </p>
              ) : (
                <ul className="flex flex-wrap gap-space-xs">
                  {items.map((condition) => (
                    <li
                      key={condition.id}
                      className={`flex items-center gap-1 rounded-full py-1 pl-space-sm pr-1 font-body-sm text-body-sm ${
                        isAllergy ? 'bg-surface-container-lowest text-on-error-container' : 'bg-surface-container text-on-surface'
                      }`}
                    >
                      {!isAllergy && (
                        <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
                          {meta.icon}
                        </span>
                      )}
                      {condition.descripcion}
                      <button
                        type="button"
                        onClick={() => handleRemove(condition)}
                        disabled={removingId === condition.id}
                        aria-label={`Quitar ${condition.descripcion}`}
                        className="inline-flex size-8 items-center justify-center rounded-full text-outline transition-colors hover:bg-error-container hover:text-error disabled:opacity-60"
                      >
                        {removingId === condition.id ? (
                          <Spinner className="size-3.5" />
                        ) : (
                          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                            close
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-space-sm rounded-lg bg-surface-container-low p-space-sm sm:flex-row">
        <label htmlFor={`${uid}-tipo`} className="sr-only">
          Tipo
        </label>
        <select
          id={`${uid}-tipo`}
          value={tipo}
          onChange={(event) => setTipo(event.target.value)}
          className={`${fieldClass} sm:w-44`}
        >
          {Object.entries(TIPOS).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <label htmlFor={`${uid}-descripcion`} className="sr-only">
          Descripción
        </label>
        <input
          id={`${uid}-descripcion`}
          type="text"
          required
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          placeholder={tipo === 'alergia' ? 'Ej: Penicilina' : 'Ej: Hipertensión arterial'}
          className={fieldClass}
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-13 shrink-0 items-center justify-center gap-1 rounded-lg bg-primary px-space-lg font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
        >
          {saving ? <Spinner className="size-4" /> : (
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              add
            </span>
          )}
          Agregar
        </button>
      </form>

      {confirmDialog}
    </section>
  );
}

export default CondicionesPanel;
