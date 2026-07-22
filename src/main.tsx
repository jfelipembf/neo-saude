import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/global.scss'
import { SessionProvider } from './context/SessionProvider'
import { ThemeProvider } from './context/ThemeProvider'
import { ToastProvider } from './components/Toast/useToast'
import App from './App.tsx'

// Em dev o PWA NÃO registra service worker (devOptions.enabled: false), mas um
// SW de build antigo pode ter ficado registrado nesta origem — e aí ele serve o
// index.html precacheado (bundles velhos), fazendo a tela ora atualizar, ora
// voltar ao estado antigo. Aqui limpamos o resquício; em produção nada muda.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(reg => reg.unregister()))
    .catch(() => {})
  globalThis.caches?.keys()
    .then(names => names.forEach(name => caches.delete(name)))
    .catch(() => {})
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>,
)
