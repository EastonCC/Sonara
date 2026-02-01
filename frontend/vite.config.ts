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
    host: true,
    port: 8080,
  }
})
