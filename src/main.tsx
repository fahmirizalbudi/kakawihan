import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Versi anyar kakawihan PWA parantos sayagi.');
  },
  onOfflineReady() {
    console.log('Kakawihan PWA parantos tiasa dianggo offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
