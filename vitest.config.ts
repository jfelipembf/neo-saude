import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Config de teste SEPARADA do vite.config.ts de propósito: o plugin do PWA
// registra service worker e gera manifest — nada disso faz sentido em teste, e
// só deixaria a suíte lenta e barulhenta.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Testes ficam ao lado do que testam (Button.test.tsx junto de Button.tsx),
    // como manda a convenção de pasta do projeto: um componente, uma pasta.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Sem meta de percentual: cobertura alta em mock não prova nada. O que
      // importa é o que está coberto — services, regras de dinheiro e RLS.
      exclude: [
        'src/mocks/**',
        'src/types/database.types.ts',
        'src/**/*.module.scss',
        'src/main.tsx',
      ],
    },
  },
})
