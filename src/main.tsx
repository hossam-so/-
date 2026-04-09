import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    // Auto update without confirm for better UX in iframes
    updateSW(true);
  },
  onOfflineReady() {
    console.log('التطبيق جاهز للعمل بدون إنترنت');
    window.dispatchEvent(new CustomEvent('swOfflineReady'));
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
