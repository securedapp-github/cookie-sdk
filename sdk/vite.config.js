import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './index.js',
      name: 'CookieConsent',
      fileName: 'cookie-consent-sdk',
      formats: ['iife']
    },
    cssCodeSplit: false // Bundle CSS into the JS if possible, though Vite IIFE often generates a separate CSS or we import it. For true single file, we may need a plugin, but an external CSS is okay too for now.
  }
});
