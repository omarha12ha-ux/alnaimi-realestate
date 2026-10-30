import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(env.GOOGLE_MAPS_PLATFORM_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // The client bundle used to ship as one ~3.5 MB file. Guests on phones
      // waited through a blank screen before anything painted. Splitting the
      // heavy libraries into cached chunks lets the app shell download first
      // and the big vendors stream in alongside.
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            'vendor-motion': ['motion', 'framer-motion'],
            'vendor-maps': ['leaflet', 'react-leaflet', '@vis.gl/react-google-maps'],
            'vendor-charts': ['recharts'],
            'vendor-pdf': ['jspdf', 'html2canvas', 'react-signature-canvas', 'qrcode'],
            'vendor-misc': ['date-fns', 'libphonenumber-js', 'react-markdown'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify this file: file watching is disabled to prevent flickering.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
