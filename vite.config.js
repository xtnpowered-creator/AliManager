import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    /* VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'AliManager',
        short_name: 'AliManager',
        description: 'Professional Office Management Platform',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }) */
  ],
  server: {
    port: 5181,
    strictPort: true
  }
})

// restart
