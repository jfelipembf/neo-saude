import { describe, expect, it } from 'vitest'
import { auditValorLegivel, ehChaveTecnica } from './auditValue'

describe('ehChaveTecnica', () => {
  // Um UUID não responde nenhuma pergunta que alguém faça na auditoria — e são
  // 34 campos assim na trilha real, empurrando o que interessa para fora.
  it('esconde chave estrangeira e identificador', () => {
    for (const campo of ['id', 'clinic_id', 'test_id', 'session_id', 'item_id',
                         'access_profile_id', 'sale_item_id', 'entitlement_id']) {
      expect(ehChaveTecnica(campo), campo).toBe(true)
    }
  })

  it('esconde autoria por UUID e token', () => {
    for (const campo of ['created_by', 'updated_by', 'invited_by', 'approved_by',
                         'uploaded_by', 'opened_by', 'client_token', 'storage_path']) {
      expect(ehChaveTecnica(campo), campo).toBe(true)
    }
  })

  // Estas a tela resolve para nome de gente, então valem a linha.
  it('mantém paciente e profissional', () => {
    expect(ehChaveTecnica('patient_id')).toBe(false)
    expect(ehChaveTecnica('professional_id')).toBe(false)
  })

  // A regexp precisa exigir a borda: "valid" e "paid" terminam em "id" mas não
  // são chave nenhuma.
  it('não confunde palavra terminada em "id"', () => {
    expect(ehChaveTecnica('paid')).toBe(false)
    expect(ehChaveTecnica('valid')).toBe(false)
    expect(ehChaveTecnica('liquid')).toBe(false)
  })

  it('não esconde campo comum', () => {
    for (const campo of ['name', 'status', 'amount', 'notes', 'due_date']) {
      expect(ehChaveTecnica(campo), campo).toBe(false)
    }
  })
})

describe('auditValorLegivel — o caso que motivou tudo', () => {
  // O bloco literal que apareceu na tela do usuário.
  it('traduz o registro de colaborador criado', () => {
    expect(auditValorLegivel('status', 'active')).toBe('Ativo')
    expect(auditValorLegivel('user_id', 'bcf17f74-ef65-41b3-8d7c-962bcc612156')).toBeNull()
    expect(auditValorLegivel('is_owner', false)).toBe('Não')
    expect(auditValorLegivel('joined_at', '2026-07-27T14:12:36.175865+00:00')).toBe('27/07/2026 14:12')
    expect(auditValorLegivel('invited_by', '16f54f3a-c1f1-4461-89f8-866032a4b7cf')).toBeNull()
    expect(auditValorLegivel('access_profile_id', '5fed8a14-fe00-4852-b079-d476a0286240')).toBeNull()
  })
})

describe('auditValorLegivel — datas', () => {
  it('data pura vira dd/mm/aaaa', () => {
    expect(auditValorLegivel('due_date', '2026-05-20')).toBe('20/05/2026')
    expect(auditValorLegivel('birth_date', '1984-10-16')).toBe('16/10/1984')
  })

  // A HORA importa: duas ações no mesmo dia só se distinguem por ela.
  it('carimbo mantém a hora', () => {
    expect(auditValorLegivel('connected_at', '2026-07-26T20:42:27.433+00:00')).toBe('26/07/2026 20:42')
    expect(auditValorLegivel('starts_at', '2026-05-31T09:00:00')).toBe('31/05/2026 09:00')
  })
})

describe('auditValorLegivel — enums', () => {
  it('usa o STATUS_MAP do app, que é a fonte dos selos', () => {
    expect(auditValorLegivel('status', 'scheduled')).toBe('Agendada')
    expect(auditValorLegivel('status', 'paid')).toBe('Pago')
  })

  it('traduz enums que nunca viraram selo', () => {
    expect(auditValorLegivel('method', 'pix')).toBe('Pix')
    expect(auditValorLegivel('sex', 'male')).toBe('Masculino')
    expect(auditValorLegivel('category_kind', 'expense')).toBe('Despesa')
    expect(auditValorLegivel('debtor', 'payer')).toBe('Paciente')
    expect(auditValorLegivel('end_reason', 'dose_changed')).toBe('Dosagem alterada')
  })

  // Inventar rótulo para o que não se conhece seria pior que mostrar o cru: a
  // auditoria é lida quando algo deu errado, e um nome errado ali desvia a
  // investigação.
  it('enum desconhecido sai como veio', () => {
    expect(auditValorLegivel('kind', 'goniometry')).toBe('goniometry')
  })
})

describe('auditValorLegivel — bordas', () => {
  it('booleano e nulo', () => {
    expect(auditValorLegivel('can_edit', true)).toBe('Sim')
    expect(auditValorLegivel('can_edit', false)).toBe('Não')
    expect(auditValorLegivel('notes', null)).toBe('—')
    expect(auditValorLegivel('notes', '')).toBe('—')
  })

  // JSON cru (nota SOAP, ficha médica) numa linha é ilegível. Dizer o tamanho
  // vale mais que despejar 2 KB de chaves.
  it('objeto vira resumo, não JSON', () => {
    expect(auditValorLegivel('clinical_note', { subjective: 'a', plan: 'b' })).toBe('{ 2 campos }')
    expect(auditValorLegivel('medical_note', {})).toBe('—')
  })

  it('número passa direto', () => {
    expect(auditValorLegivel('amount', 150.5)).toBe('150.5')
  })

  // Texto livre não é enum e não pode ser traduzido por acidente.
  it('texto livre não é mexido', () => {
    expect(auditValorLegivel('name', 'Amoxicilina 500mg')).toBe('Amoxicilina 500mg')
    expect(auditValorLegivel('description', 'Acesso total — perfil do dono.')).toBe('Acesso total — perfil do dono.')
  })
})
