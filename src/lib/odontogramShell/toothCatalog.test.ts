import { describe, it, expect } from 'vitest'
import { getOdontogramState, loadOdontogramState } from './odontogram-shell'
import { MAPA_MOTOR } from './toothCatalog'

/**
 * ROUND-TRIP CONTRA O MOTOR REAL.
 *
 * O outro arquivo de teste MOCKA o motor — ele trava o contrato do que
 * enviamos, não que o motor aceite. E o motor descarta em silêncio
 * (filterSet/validateEnum) tudo que não conhece: valor errado não vira erro,
 * vira "a IA disse que marcou e não apareceu nada".
 *
 * Aqui cada valor do catálogo é ESCRITO, recarregado e conferido. Foi assim que
 * caíram três palpites meus tirados da leitura do bundle minificado
 * (`periapicalType`, `pulpLatin` e `secondaryCaries` não aceitam escrita).
 */
function sobrevive(campo: string, valor: unknown): boolean {
  const base = JSON.parse(JSON.stringify(getOdontogramState())) as {
    teeth?: Record<string, Record<string, unknown>>
  }
  base.teeth = base.teeth ?? {}
  base.teeth['16'] = { ...(base.teeth['16'] ?? {}), [campo]: valor }
  loadOdontogramState(base)
  const depois = (getOdontogramState() as { teeth?: Record<string, Record<string, unknown>> })
    .teeth?.['16']?.[campo]
  return JSON.stringify(depois) === JSON.stringify(valor)
}

const CAMPO_DO_GRUPO: Record<keyof typeof MAPA_MOTOR, string> = {
  pulpa: 'pulpDx',
  apical: 'apicalDx',
  periImplante: 'periImplant',
  discromia: 'discoloration',
  reabsorcao: 'resorptionType',
  protese: 'prosthesis',
  migracao: 'orthoDrift',
  vertical: 'orthoVertical',
  defeito: 'fillingDefect',
}

describe('o motor aceita TODO valor do catálogo', () => {
  for (const [grupo, mapa] of Object.entries(MAPA_MOTOR)) {
    it(`${grupo} → ${CAMPO_DO_GRUPO[grupo as keyof typeof MAPA_MOTOR]}`, () => {
      const campo = CAMPO_DO_GRUPO[grupo as keyof typeof MAPA_MOTOR]
      for (const valorMotor of Object.values(mapa)) {
        // `fillingDefect` é objeto por superfície, não string solta.
        const escrito = campo === 'fillingDefect' ? { occlusal: valorMotor } : valorMotor
        expect(sobrevive(campo, escrito), `${grupo}: "${valorMotor}" foi descartado`).toBe(true)
      }
    })
  }

  it('campos booleanos e de forma especial', () => {
    expect(sobrevive('endoResection', true)).toBe(true)
    expect(sobrevive('parapulpalPin', true)).toBe(true)
    expect(sobrevive('missingClosed', true)).toBe(true)
    expect(sobrevive('bridgePillar', true)).toBe(true)
    expect(sobrevive('orthoRotation', true)).toBe(true)
    expect(sobrevive('contactMesial', true)).toBe(true)
    expect(sobrevive('contactDistal', true)).toBe(true)
    expect(sobrevive('restorationType', 'bridge')).toBe(true)
    expect(sobrevive('mods', ['parodontal'])).toBe(true)
    expect(sobrevive('orthoAppliance', 'bracket')).toBe(true)
    expect(sobrevive('orthoAppliance', 'band')).toBe(true)
    // MAIÚSCULA: 'd1' é descartado, 'D1' entra. Foi medido.
    expect(sobrevive('radiographicDepth', { occlusal: 'D1' })).toBe(true)
    expect(sobrevive('radiographicDepth', { occlusal: 'd1' })).toBe(false)
  })
})
