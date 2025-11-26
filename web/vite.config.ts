import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/100-cities-for-kids/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
})
