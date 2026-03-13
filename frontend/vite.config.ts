import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/locations': 'http://localhost:3000',
      '/picture': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
})
