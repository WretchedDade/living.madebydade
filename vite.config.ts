import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { resolve } from 'path';
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
      '@': resolve(__dirname),
    },
  },
  server: {
    port: 3000,
  },
  plugins: [tsConfigPaths(), tanstackStart({ target: 'vercel' }), tailwindcss()],
})