import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { GoogleAuthProvider } from './contexts/GoogleAuthContext.tsx';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleAuthProvider>
      <App />
    </GoogleAuthProvider>
  </React.StrictMode>
);