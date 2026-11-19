import '@/lib/monitoring';
import '@fontsource-variable/inter';
import '@fontsource/barlow-semi-condensed/500.css';
import '@fontsource/barlow-semi-condensed/600.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { reactErrorHandler } from '@/lib/monitoring';

import App from './App';

createRoot(document.getElementById('root')!, {
  onUncaughtError: reactErrorHandler(),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
