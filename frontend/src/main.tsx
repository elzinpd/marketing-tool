import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Import error monitor in development mode
const isDevelopment = process.env.NODE_ENV === 'development';
if (isDevelopment) {
  // This will set up error monitoring for VS Code integration
  import('./utils/errorMonitor').then(module => {
    console.log('Error monitor initialized for VS Code debugging');
  }).catch(err => {
    console.warn('Failed to initialize error monitor:', err);
  });
}

// Disable StrictMode in development to prevent double mounting/unmounting
// which can cause issues with the authentication flow
ReactDOM.createRoot(document.getElementById('root')!).render(
  isDevelopment ? (
    <App />
  ) : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
);
