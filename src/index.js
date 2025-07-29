import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import PresentlyApp from './components/PresentlyApp';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PresentlyApp />
  </React.StrictMode>
);