import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.css';
import PresentlyApp from './components/PresentlyApp';
import { AuthProvider } from './context/AuthContext';
import { TimerProvider } from './context/TimerContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TimerProvider>
          <PresentlyApp />
        </TimerProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);