import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update for PWA offline capabilities
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('[PWA] New version detected, auto-refreshing caches...');
  },
  onOfflineReady() {
    console.info('[PWA] StealthCam Pro is ready to work completely offline.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
