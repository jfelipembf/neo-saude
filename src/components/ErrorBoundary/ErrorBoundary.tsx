import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import errorImage from '@/assets/images/error.png'
import { Button } from '@/components/Button/Button'
import styles from './ErrorBoundary.module.scss'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Captura erros de RENDER não tratados na árvore abaixo dela e mostra uma tela
 * amigável (imagem + "tentar novamente") em vez da tela branca. Erros de
 * eventos/async (ex.: falha de service) NÃO passam por aqui — esses são
 * tratados na ponta pelo TanStack Query + toast.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Observabilidade: em produção, plugar num serviço de erros (Sentry etc.).
    console.error('ErrorBoundary capturou um erro de renderização:', error, info)
  }

  private handleRetry = () => {
    // Recarrega a aplicação: descarta o estado corrompido e refaz as queries.
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className={styles.page} role="alert">
        <img src={errorImage} alt="" className={styles.image} />
        <h1 className={styles.title}>Algo deu errado</h1>
        <p className={styles.description}>
          Encontramos um problema inesperado ao carregar esta tela. Você pode tentar novamente.
        </p>
        <Button variant="primary" onClick={this.handleRetry} className={styles.action}>
          Tentar novamente
        </Button>
      </div>
    )
  }
}
