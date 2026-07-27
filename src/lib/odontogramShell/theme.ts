import type { OdontogramThemeConfig } from './odontogram-shell'

// Paleta do odontograma = tokens do app (styles/_themes.scss), por tema.
// Fonte única: TreatmentsPanel (odontograma dentro do prontuário) e a tela
// cheia standalone (OdontogramFullscreenPage) usam os MESMOS valores — o
// motor vendorizado não lê CSS var, só aceita hex via themeConfig, então isto
// é o que existe para as duas superfícies não divergirem sozinhas.
export const LIGHT_THEME: OdontogramThemeConfig = {
  background: '#F3F7F5', panel: '#FFFFFF', card: '#FFFFFF',
  text: '#12211C', muted: '#5E6E68', line: '#D8E2DE',
  accent: '#10B981', accent2: '#8B5CF6',
}

export const DARK_THEME: OdontogramThemeConfig = {
  background: '#0D1512', panel: '#121D18', card: '#121D18',
  text: '#EDF7F2', muted: '#95A69F', line: '#26332D',
  accent: '#34D399', accent2: '#A78BFA',
}
