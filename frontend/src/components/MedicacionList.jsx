import { useState, useEffect } from 'react';
import { getAll } from '../services/medications.service';

function MedicacionList({ refreshTrigger }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getAll()
      .then((data) => {
        if (isMounted) {
          setMedications(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          const errorMsg =
            err.response?.data?.data?.message ||
            err.message ||
            'Error al cargar la lista de medicaciones';
          setError(errorMsg);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div style={{ padding: '16px', color: '#4a5568', fontStyle: 'italic' }}>
        Cargando medicaciones...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '12px 16px',
          color: '#c53030',
          backgroundColor: '#fff5f5',
          border: '1px solid #feb2b2',
          borderRadius: '6px',
          marginBottom: '16px',
        }}
      >
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (medications.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: '#f7fafc',
          border: '1px dashed #cbd5e0',
          borderRadius: '6px',
          textAlign: 'center',
          color: '#718096',
        }}
      >
        No hay medicaciones registradas actualmente.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#2d3748' }}>
        Listado de Medicaciones
      </h2>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.95rem',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#edf2f7', borderBottom: '2px solid #cbd5e0' }}>
            <th style={{ padding: '10px 12px' }}>Nombre Comercial</th>
            <th style={{ padding: '10px 12px' }}>Droga</th>
            <th style={{ padding: '10px 12px' }}>Concentración</th>
            <th style={{ padding: '10px 12px' }}>Toma</th>
            <th style={{ padding: '10px 12px' }}>Forma</th>
            <th style={{ padding: '10px 12px' }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {medications.map((med) => (
            <tr
              key={med.id}
              style={{
                borderBottom: '1px solid #e2e8f0',
                transition: 'background-color 0.2s',
              }}
            >
              <td style={{ padding: '10px 12px', fontWeight: '500' }}>
                {med.nombre_comercial || '—'}
              </td>
              <td style={{ padding: '10px 12px', color: '#2b6cb0' }}>{med.droga}</td>
              <td style={{ padding: '10px 12px' }}>{med.concentracion}</td>
              <td style={{ padding: '10px 12px' }}>{med.cantidad_por_toma}</td>
              <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>
                {med.forma}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    backgroundColor: med.estado === 'activa' ? '#c6f6d5' : '#fed7d7',
                    color: med.estado === 'activa' ? '#22543d' : '#742a2a',
                  }}
                >
                  {med.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MedicacionList;

