import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Needed for Railway to expose the port
    port: 8080,
  },
  preview: {
    port: 8080,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: true // This allows any URL to access the preview
  }
})
