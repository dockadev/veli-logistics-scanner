import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Tauri, frontend'i özel protokol üzerinden servis eder; bu yüzden
// mutlak yol yerine göreli yol şart.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Rust tarafındaki değişiklikler Vite'ın HMR'ını tetiklemesin.
      ignored: ['**/src-tauri/**'],
    },
  },
})