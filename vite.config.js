import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Si quieres usar vite-plugin-pwa (recomendado, genera SW automáticamente):
// npm install -D vite-plugin-pwa
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    // ── Opción A: vite-plugin-pwa (automático, recomendado) ───────────────────
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   manifest: {
    //     name: 'GBH Nutrición',
    //     short_name: 'GBH',
    //     theme_color: '#1A3A10',
    //     background_color: '#081208',
    //     display: 'standalone',
    //     icons: [
    //       { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    //       { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    //     ],
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
    //   },
    // }),
  ],

  // ── Build optimizado para PWA ─────────────────────────────────────────────
  build: {
    rollupOptions: {
      output: {
        // Separar chunks grandes en archivos independientes
        manualChunks: {
          react:    ['react', 'react-dom'],
          recharts: ['recharts'],
        },
      },
    },
    // Aumentar límite de warning de chunk (iconos base64 eliminados, no debería hacer falta)
    chunkSizeWarningLimit: 700,
  },

  // ── Dev server ────────────────────────────────────────────────────────────
  server: {
    port: 3000,
    host: true, // Para probar en móvil en red local
  },
})
