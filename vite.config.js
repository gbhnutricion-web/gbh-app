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
        // MAESTRO-2026-1234: con la forma de objeto, React acababa DENTRO del trozo de recharts y el
        // bundle principal lo importaba (y lo precargaba) solo para tener React. Ahora React va en su
        // trozo y recharts sale solo de las importaciones diferidas (GraficaPeso, CicloPeso).
        manualChunks(id) {
          if (/[\/]node_modules[\/](react|react-dom|scheduler)[\/]/.test(id)) return 'react';
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
