// Intercept all Google/Firebase APIs to route them through our full-stack server-side proxy
if (typeof window !== 'undefined') {
  // 1. Intercept Fetch API with dynamic support for iframe sandbox overrides
  try {
    const originalFetch = window.fetch;
    const proxiedFetch = function (input: any, init?: any) {
      let url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input && typeof input === 'object' && 'url' in input) {
        url = (input as any).url;
      } else if (input && typeof input === 'object' && typeof (input as any).toString === 'function') {
        url = (input as any).toString();
      }

      if (
        url.includes('identitytoolkit.googleapis.com') ||
        url.includes('securetoken.googleapis.com') ||
        url.includes('firestore.googleapis.com')
      ) {
        const cleanUrl = url.replace(/^https?:\/\//, '');
        const proxyUrl = `/api-proxy/${cleanUrl}`;
        if (typeof input === 'string') {
          return originalFetch(proxyUrl, init);
        } else {
          try {
            const newRequest = new Request(proxyUrl, input as any);
            return originalFetch(newRequest, init);
          } catch {
            return originalFetch(proxyUrl, init);
          }
        }
      }
      return originalFetch.apply(this, arguments as any);
    };

    // Try standard setter assignment
    try {
      (window as any).fetch = proxiedFetch;
    } catch {
      // Force overlay via Object.defineProperty if direct assignment is blocked by read-only descriptors
      Object.defineProperty(window, 'fetch', {
        value: proxiedFetch,
        configurable: true,
        writable: true,
        enumerable: true
      });
    }

    // Shadow on alternative globals to ensure fully transparent SDK hook in all contexts
    try {
      Object.defineProperty(globalThis, 'fetch', {
        value: proxiedFetch,
        configurable: true,
        writable: true,
        enumerable: true
      });
    } catch {}
    try {
      Object.defineProperty(self, 'fetch', {
        value: proxiedFetch,
        configurable: true,
        writable: true,
        enumerable: true
      });
    } catch {}
  } catch (err) {
    console.error('[PROXY INTERCEPTOR] Failed to intercept fetch API:', err);
  }

  // 2. Intercept XMLHttpRequest API
  try {
    const originalOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function (method, url, ...args) {
      if (typeof url === 'string') {
        if (
          url.includes('identitytoolkit.googleapis.com') ||
          url.includes('securetoken.googleapis.com') ||
          url.includes('firestore.googleapis.com')
        ) {
          const cleanUrl = url.replace(/^https?:\/\//, '');
          url = `/api-proxy/${cleanUrl}`;
        }
      }
      return originalOpen.apply(this, [method, url, ...args] as any);
    };
  } catch (err) {
    console.error('[PROXY INTERCEPTOR] Failed to intercept XMLHttpRequest API:', err);
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register the service worker that makes the site installable to a phone home
// screen. Production only: during development a cached shell would fight HMR
// and hide the code changes being made.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // Not fatal: the site still works, only offline support is unavailable.
      console.warn('[PWA] service worker registration failed:', err);
    });
  });
}
