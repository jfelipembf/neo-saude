// Tipos do artefato odontogram-shell.js (build de biblioteca do
// React-Odontogram-Modul — ver vendor/odontogram-modul/PATCHES-NEOSAUDE.md).
// Só as props que o Neo Saúde usa; o componente aceita outras (ver App.tsx do vendor).
import type { ComponentType } from 'react'

/** Cores do tema (viram as CSS vars --odon-* dentro do componente). */
export interface OdontogramThemeConfig {
  background?: string
  panel?: string
  card?: string
  text?: string
  muted?: string
  line?: string
  accent?: string
  accent2?: string
}

export interface OdontogramShellProps {
  /** Idioma da UI (modo controlado — travado). */
  language?: 'hu' | 'en' | 'de' | 'es' | 'it' | 'sk' | 'pl' | 'ru' | 'pt-br'
  /** Tema escuro (modo controlado — segue o ThemeProvider do app). */
  darkMode?: boolean
  themeConfig?: OdontogramThemeConfig
  /** Desabilita interações (impressão/visualização). */
  readOnly?: boolean
  /** Notas por dente (duplo clique). */
  enableNotes?: boolean
}

declare const OdontogramShell: ComponentType<OdontogramShellProps>
export default OdontogramShell
