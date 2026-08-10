import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// No `define` block here on purpose. The Google AI Studio scaffold this project
// grew out of inlined GEMINI_API_KEY into the client bundle, which would have
// published the key in readable JavaScript the moment the variable was set.
// Nothing in the app uses Gemini, so the whole path is gone. Anything genuinely
// secret belongs on the server — see the .env read in server.ts.
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is off in AI Studio via the DISABLE_HMR env var — file watching
      // there causes flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
