
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  define: {
    'process.env': {}
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['lucide-react', 'recharts'],
          'supabase': ['@supabase/supabase-js'],
          'analytics': ['./components/analytics/index.ts']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
