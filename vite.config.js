import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3's own SCSS still uses @import and the old global
        // color functions (mix/red/green/blue) - quietDeps silences
        // deprecation warnings whose origin is a dependency (node_modules),
        // not our own bootstrap-custom.scss. 'import' and 'legacy-js-api'
        // aren't dependency-scoped (the former fires on our own
        // `@import "bootstrap/scss/bootstrap"` line, the latter is about how
        // Vite invokes the sass compiler) so quietDeps can't catch either -
        // both stay until Bootstrap ships a version built on @use/@forward.
        quietDeps: true,
        silenceDeprecations: ['legacy-js-api', 'import'],
      },
    },
  },
});
