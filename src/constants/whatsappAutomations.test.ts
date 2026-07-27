import { describe, expect, it } from 'vitest'
import { AUTOMATION_CATALOG, automationCatalogItem } from './whatsappAutomations'

describe('WhatsApp automation defaults', () => {
  it('oferece uma mensagem multitenant para cada gatilho', () => {
    expect(AUTOMATION_CATALOG).toHaveLength(5)
    for (const item of AUTOMATION_CATALOG) {
      expect(item.defaultMessage).toContain('{clinica}')
      expect(item.defaultMessage).toContain('{paciente}')
    }
  })

  it('define horário apenas para gatilhos agendados', () => {
    for (const item of AUTOMATION_CATALOG) {
      expect(Boolean(item.defaultSendTime)).toBe(item.scheduled)
    }
  })

  it('localiza o modelo de cobrança pela chave', () => {
    expect(automationCatalogItem('billing').defaultMessage).toContain('{valor}')
  })
})
