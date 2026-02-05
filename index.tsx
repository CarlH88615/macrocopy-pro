import "./src/index.css";

if (new URLSearchParams(window.location.search).get('view') === 'popup') {
  import('./src/popup.css');
}
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root') || document.getElementById('macrocopy-floater-root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
