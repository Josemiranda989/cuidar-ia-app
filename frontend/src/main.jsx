import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CurrentPersonaProvider } from './context/CurrentPersonaContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CurrentPersonaProvider>
        <App />
      </CurrentPersonaProvider>
    </BrowserRouter>
  </React.StrictMode>
);

