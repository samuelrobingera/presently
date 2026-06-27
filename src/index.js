import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.css';
import PresentlyApp from './components/PresentlyApp';
import { AuthProvider } from './context/AuthContext';
import { DemoTimerProvider } from './context/DemoTimerContext';
import { TimerProvider } from './context/TimerContext';
import ErrorBoundary from './components/ErrorBoundary';
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <DemoTimerProvider>
            <TimerProvider>
              <PresentlyApp />
            </TimerProvider>
          </DemoTimerProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register service worker for offline support
serviceWorkerRegistration.register();