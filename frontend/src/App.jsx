import { useState } from 'react';
import MedicacionForm from './components/MedicacionForm';
import MedicacionList from './components/MedicacionList';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreated = () => {
    // Al incrementar el contador, notificamos a MedicacionList que debe re-ejecutar su efecto
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '24px 16px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#1a202c',
      }}
    >
      <header
        style={{
          borderBottom: '2px solid #edf2f7',
          paddingBottom: '16px',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#2b6cb0' }}>CuidAR</h1>
        <p style={{ margin: '4px 0 0 0', color: '#4a5568', fontSize: '1rem' }}>
          Gestión y seguimiento de medicación para cuidadores
        </p>
      </header>

      <main>
        <MedicacionForm onCreated={handleCreated} />
        <MedicacionList refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
}

export default App;
