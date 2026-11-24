import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HoyPage from './pages/HoyPage';
import VademecumPage from './pages/VademecumPage';
import FichaMedicaPage from './pages/FichaMedicaPage';
import PersonaPage from './pages/PersonaPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/medicaciones" replace />} />
        <Route path="hoy" element={<HoyPage />} />
        <Route path="medicaciones" element={<VademecumPage />} />
        <Route path="ficha-medica" element={<FichaMedicaPage />} />
        <Route path="personas" element={<PersonaPage />} />
      </Route>
    </Routes>
  );
}

export default App;
