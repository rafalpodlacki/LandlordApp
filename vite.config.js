import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-app': ['firebase/app', 'firebase/auth'],
          'firebase-db': ['firebase/firestore'],
          'ui-vendor': ['lucide-react', 'date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 300,
  },
})
