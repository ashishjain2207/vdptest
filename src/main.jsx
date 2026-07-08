import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import React from 'react';
import { initializeAppInsights } from '@/services/telemetry/appInsights.js';

// Make React available for libs that expect a global "React"
globalThis.React = React;
void initializeAppInsights();

// Initialize theme before rendering to prevent flash
(function initializeTheme() {
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (prefersDark ? 'dark' : 'light');
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();

createRoot(document.getElementById('root')).render(<App />);
