import styles from './Spinner.module.scss'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      className={`${styles.spinner} ${styles[`spinner--${size}`]} ${className ?? ''}`}
      role="status"
      aria-label="Carregando"
    />
  )
}
