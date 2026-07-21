import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // App instalável (standalone) no Android/iOS/desktop.
      registerType: 'autoUpdate',   // SW novo assume ao recarregar — sem prompt manual
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Neo Saúde — Gestão para consultórios',
        short_name: 'Neo Saúde',
        description: 'Sistema de gestão para consultórios e clínicas de saúde',
        lang: 'pt-BR',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',            // sem barra do navegador; parece app nativo
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        background_color: '#F3F7F5',      // splash — mesmo fundo do tema claro (padrão)
        theme_color: '#10B981',           // cor da barra de status/UI do sistema (verde da marca)
        categories: ['business', 'productivity', 'health', 'medical'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache do shell do app (JS/CSS/HTML/ícones). Imagens pesadas ficam no runtime.
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: 'index.html',
        // Não intercepta callbacks de auth nem a API do Supabase (deixa ir à rede).
        navigateFallbackDenylist: [/^\/api/, /supabase/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Imagens não-precache (avatares/fotos do Supabase Storage, etc.): serve do
            // cache na hora e revalida em background — evita foto trocada ficar presa.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'neo-saude-images',
              expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,   // SW só em produção (evita cache atrapalhando o dev)
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
