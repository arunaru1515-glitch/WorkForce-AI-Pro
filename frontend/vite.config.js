import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listens on 0.0.0.0 (enables both 127.0.0.1 and localhost)
    port: 5173,
  },
})
