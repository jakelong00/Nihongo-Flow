
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      'react': 'https://esm.sh/react@18.2.0',
      'react-dom': 'https://esm.sh/react-dom@18.2.0',
      'react-dom/client': 'https://esm.sh/react-dom@18.2.0/client',
      'react/': 'https://esm.sh/react@18.2.0/',
      'react-dom/': 'https://esm.sh/react-dom@18.2.0/',
      '@google/genai': 'https://esm.sh/@google/genai@1.41.0'
    }
  }
})
