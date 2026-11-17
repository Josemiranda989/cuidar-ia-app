import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import MedicacionForm from './components/MedicacionForm';
import MedicacionList from './components/MedicacionList';
import PersonaACargoForm from './components/PersonaACargoForm';
import PersonaACargoList from './components/PersonaACargoList';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [personasRefreshTrigger, setPersonasRefreshTrigger] = useState(0);
  // Medicación cargada en el form para editar; null = modo alta.
  const [editingMed, setEditingMed] = useState(null);

  const handleSaved = () => {
    // Al incrementar el contador, notificamos a MedicacionList que debe re-ejecutar su efecto
    setRefreshTrigger((prev) => prev + 1);
    setEditingMed(null);
  };

  const handlePersonaCreated = () => {
    // Mismo mecanismo para PersonaACargoList
    setPersonasRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/medicaciones" replace />} />
        <Route
          path="medicaciones"
          element={
            <>
              <MedicacionForm
                editingMed={editingMed}
                onSaved={handleSaved}
                onCancelEdit={() => setEditingMed(null)}
              />
              <MedicacionList refreshTrigger={refreshTrigger} onEdit={setEditingMed} />
            </>
          }
        />
        <Route
          path="personas"
          element={
            <>
              <PersonaACargoForm onCreated={handlePersonaCreated} />
              <PersonaACargoList refreshTrigger={personasRefreshTrigger} />
            </>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
