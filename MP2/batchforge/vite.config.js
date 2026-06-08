import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const emptyModule = fileURLToPath(new URL('./src/lib/emptyModule.js', import.meta.url))

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/hcde530/batchforge/' : '/',
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      html2canvas: emptyModule,
      canvg: emptyModule,
      dompurify: emptyModule,
    },
  },
}))
