import { useState, useEffect } from 'react';
import { create } from '../services/medications.service';
import { getAll as getDependents } from '../services/dependents.service';

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

function MedicacionForm({ onCreated }) {
  const [form, setForm] = useState(initialFormState);
  const [dependents, setDependents] = useState([]);
  const [loadingDependents, setLoadingDependents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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

      await create(payload);

      setSuccessMsg('Medicación registrada con éxito.');
      setForm({
        ...initialFormState,
        fecha_inicio: getTodayDate(),
      });

      if (typeof onCreated === 'function') {
        onCreated();
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
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#2d3748' }}>
        Nueva Medicación
      </h2>

      {error && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#fff5f5',
            color: '#c53030',
            border: '1px solid #feb2b2',
            borderRadius: '6px',
            marginBottom: '14px',
            fontSize: '0.9rem',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#f0fff4',
            color: '#276749',
            border: '1px solid #9ae6b4',
            borderRadius: '6px',
            marginBottom: '14px',
            fontSize: '0.9rem',
          }}
        >
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
        <div>
          <label
            htmlFor="persona_id"
            style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}
          >
            Persona a Cargo *
          </label>
          <select
            id="persona_id"
            name="persona_id"
            value={form.persona_id}
            onChange={handleChange}
            required
            disabled={loadingDependents}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e0',
              backgroundColor: '#fff',
            }}
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          <div>
            <label
              htmlFor="droga"
              style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}
            >
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
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e0',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="nombre_comercial"
              style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}
            >
              Nombre Comercial
            </label>
            <input
              type="text"
              id="nombre_comercial"
              name="nombre_comercial"
              value={form.nombre_comercial}
              onChange={handleChange}
              placeholder="Ej: Lotrial"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e0',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}
        >
          <div>
            <label
              htmlFor="concentracion"
              style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}
            >
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
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e0',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="cantidad_por_toma"
              style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}
            >
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
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e0',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="forma"
              style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}
            >
              Forma *
            </label>
            <select
              id="forma"
              name="forma"
              value={form.forma}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e0',
                backgroundColor: '#fff',
                boxSizing: 'border-box',
              }}
            >
              <option value="comprimido">Comprimido</option>
              <option value="gota">Gota</option>
              <option value="ml">ml</option>
              <option value="aplicacion">Aplicación</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="fecha_inicio"
              style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}
            >
              Fecha Inicio *
            </label>
            <input
              type="date"
              id="fecha_inicio"
              name="fecha_inicio"
              value={form.fecha_inicio}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e0',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
          <input
            type="checkbox"
            id="es_sos"
            name="es_sos"
            checked={form.es_sos}
            onChange={handleChange}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="es_sos" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
            Es medicación de rescate / eventual (SOS)
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 16px',
            backgroundColor: submitting ? '#a0aec0' : '#3182ce',
            color: '#fff',
            fontWeight: '600',
            border: 'none',
            borderRadius: '6px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            marginTop: '8px',
            justifySelf: 'start',
          }}
        >
          {submitting ? 'Guardando...' : 'Guardar Medicación'}
        </button>
      </form>
    </div>
  );
}

export default MedicacionForm;

