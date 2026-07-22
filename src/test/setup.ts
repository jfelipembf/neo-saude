import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Desmonta a árvore entre testes — sem isso, um teste enxerga o DOM do anterior
// e o erro aparece no teste errado.
afterEach(() => {
  cleanup()
})

// matchMedia não existe no jsdom e o ThemeProvider o consulta na montagem.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }),
})
