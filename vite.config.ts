import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'sql-wasm.wasm', 'sql-wasm-browser.wasm', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Kakawihan',
        short_name: 'Kakawihan',
        description: 'Pemutar musik modern local-first berbasis SQLite WebAssembly dan IndexedDB',
        theme_color: '#101012',
        background_color: '#101012',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,wasm}'],
      },
    }),
  ],
})
