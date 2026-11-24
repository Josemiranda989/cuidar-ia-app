import { useState } from 'react';
import { useCurrentPersona } from '../context/CurrentPersonaContext';
import MedicacionForm from '../components/MedicacionForm';
import MedicacionList from '../components/MedicacionList';
import { NoPersona, PageLoading } from '../components/StateViews';

function VademecumPage() {
  const { currentPersona, loading } = useCurrentPersona();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Medicación cargada en el form para editar; null = modo alta.
  const [editingMed, setEditingMed] = useState(null);

  const handleSaved = () => {
    // Al incrementar el contador, notificamos a MedicacionList que debe re-ejecutar su efecto
    setRefreshTrigger((prev) => prev + 1);
    setEditingMed(null);
  };

  if (loading) return <PageLoading label="Cargando…" />;
  if (!currentPersona) return <NoPersona />;

  return (
    <>
      <MedicacionForm
        editingMed={editingMed}
        onSaved={handleSaved}
        onCancelEdit={() => setEditingMed(null)}
      />
      <MedicacionList refreshTrigger={refreshTrigger} onEdit={setEditingMed} />
    </>
  );
}

export default VademecumPage;
