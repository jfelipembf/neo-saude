import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ToothProposal } from './toothFields'

// O motor real é um bundle vendorizado que exige o shell MONTADO no DOM. Aqui
// o que precisa ser travado é o CONTRATO do payload: o motor descarta em
// silêncio (filterSet/validateEnum) tudo que não bate exatamente com a forma
// esperada, então o teste captura o que mandamos pra loadOdontogramState e
// confere contra as regras reais do motor, citadas em cada caso.
const loadSpy = vi.fn()
let estadoAtual: Record<string, unknown> = {}

vi.mock('./odontogram-shell', () => ({
  getOdontogramState: () => estadoAtual,
  loadOdontogramState: (p: unknown) => {
    loadSpy(p)
    estadoAtual = p && typeof p === 'object'
      ? p as Record<string, unknown>
      : { version: '2.10', globals: {}, teeth: {} }
  },
}))

const {
  applyToothProposal, clearTeeth, clearAllTeeth, normalizeToothProposal,
  verifyToothProposalState, verifyToothClearState,
} = await import('./toothFields')

/** Estado do dente que foi efetivamente mandado pro motor. */
function denteEnviado(numero: number): Record<string, unknown> {
  const payload = loadSpy.mock.calls.at(-1)?.[0] as { teeth?: Record<string, Record<string, unknown>> }
  return payload?.teeth?.[String(numero)] ?? {}
}

function comEstado(teeth: Record<string, Record<string, unknown>> = {}) {
  estadoAtual = { version: '2.10', globals: { showHealthyPulp: false }, teeth }
}

beforeEach(() => {
  loadSpy.mockClear()
  comEstado()
})

describe('cárie', () => {
  // ESTE é o bug que fazia a Cibelly nunca marcar nada: o motor valida
  // `caries` contra ids PREFIXADOS (codesystems.ts:92-99) e filterSet
  // (odontogram.ts:4139) descarta silenciosamente qualquer chave nua.
  it('grava as superfícies de caries com o prefixo "caries-"', () => {
    applyToothProposal({ dentes: [16], achado: 'carie', superficies: ['oclusal', 'mesial'] })
    expect(denteEnviado(16).caries).toEqual(['caries-occlusal', 'caries-mesial'])
  })

  // ...mas cariesSeverity é validada contra VALID_FILLING_SURFACES
  // (odontogram.ts:4355), que só conhece as chaves NUAS. Misturar as duas
  // convenções é exatamente o que quebrava.
  it('grava cariesSeverity com a chave NUA, sem prefixo', () => {
    applyToothProposal({ dentes: [16], achado: 'carie', superficies: ['oclusal'], gravidade: 4 })
    expect(denteEnviado(16).cariesSeverity).toEqual({ occlusal: 4 })
  })

  it('sem gravidade dita usa 2 — nunca 0, que apagaria a cárie no gate de coerência', () => {
    applyToothProposal({ dentes: [16], achado: 'carie', superficies: ['oclusal'] })
    expect(denteEnviado(16).cariesSeverity).toEqual({ occlusal: 2 })
  })

  it('soma à cárie que já existia em vez de sobrescrever', () => {
    comEstado({ 16: { caries: ['caries-distal'], cariesSeverity: { distal: 3 } } })
    applyToothProposal({ dentes: [16], achado: 'carie', superficies: ['oclusal'] })
    expect(denteEnviado(16).caries).toEqual(['caries-distal', 'caries-occlusal'])
    expect(denteEnviado(16).cariesSeverity).toEqual({ distal: 3, occlusal: 2 })
  })

  it('palatina e lingual caem na mesma chave do motor', () => {
    applyToothProposal({ dentes: [16], achado: 'carie', superficies: ['palatina'] })
    expect(denteEnviado(16).caries).toEqual(['caries-lingual'])
  })

  it('recusa sem superfície em vez de gravar um no-op silencioso', () => {
    const r = applyToothProposal({ dentes: [16], achado: 'carie' })
    expect(r.ok).toBe(false)
    expect(loadSpy).not.toHaveBeenCalled()
  })

  it('recusa em dente com coroa, onde o motor não desenharia cárie de face', () => {
    comEstado({ 16: { restorationType: 'crown' } })
    const r = applyToothProposal({ dentes: [16], achado: 'carie', superficies: ['oclusal'] })
    expect(r.ok).toBe(false)
    expect(loadSpy).not.toHaveBeenCalled()
  })
})

describe('restauração', () => {
  // hydrateState:4419 regenera fillingSurfaces a partir das chaves de
  // fillingSurfaceMaterials — restauração sem material vira nada.
  it('exige material, senão o motor apagaria as superfícies', () => {
    const r = applyToothProposal({ dentes: [36], achado: 'restauracao', superficies: ['mesial'] })
    expect(r.ok).toBe(false)
    expect(loadSpy).not.toHaveBeenCalled()
  })

  it('grava o material por face com o código do motor', () => {
    applyToothProposal({ dentes: [36], achado: 'restauracao', superficies: ['mesial', 'distal'], material: 'resina' })
    expect(denteEnviado(36).fillingSurfaceMaterials).toEqual({ mesial: 'composite', distal: 'composite' })
    expect(denteEnviado(36).fillingSurfaces).toEqual(['mesial', 'distal'])
  })

  it('preenche fillingMaterial, que é o que o tooltip lê para virar texto', () => {
    applyToothProposal({ dentes: [36], achado: 'restauracao', superficies: ['oclusal'], material: 'amalgama' })
    expect(denteEnviado(36).fillingMaterial).toBe('amalgam')
  })
})

describe('coroa', () => {
  // O enum de material de COROA é diferente do de obturação: mandar
  // 'composite' num crown vira 'emax' silenciosamente (odontogram.ts:4539).
  it('usa o enum de restauração fixa, não o de obturação', () => {
    applyToothProposal({ dentes: [11], achado: 'coroa', materialCoroa: 'zirconia' })
    expect(denteEnviado(11).restorationType).toBe('crown')
    expect(denteEnviado(11).restorationMaterial).toBe('zircon')
  })
})

describe('ausente / extraído', () => {
  // Só setar toothSelection deixava a coroa antiga desenhada e o resumo
  // listando cárie de um dente que não existe mais.
  it('limpa cárie, restauração e coroa antigas', () => {
    comEstado({
      46: {
        caries: ['caries-occlusal'],
        cariesSeverity: { occlusal: 3 },
        fillingSurfaceMaterials: { mesial: 'composite' },
        restorationType: 'crown',
        restorationMaterial: 'zircon',
        mobility: 'm2',
      },
    })
    applyToothProposal({ dentes: [46], achado: 'ausente' })
    const d = denteEnviado(46)
    expect(d.toothSelection).toBe('none')
    expect(d.caries).toEqual([])
    expect(d.cariesSeverity).toEqual({})
    expect(d.fillingSurfaceMaterials).toEqual({})
    expect(d.restorationType).toBe('none')
    expect(d.mobility).toBe('none')
  })

  it('extraído marca o alvéolo, ausente não', () => {
    applyToothProposal({ dentes: [46], achado: 'extraida' })
    expect(denteEnviado(46).extractionWound).toBe(true)
    loadSpy.mockClear()
    comEstado()
    applyToothProposal({ dentes: [46], achado: 'ausente' })
    expect(denteEnviado(46).extractionWound).toBe(false)
  })
})

describe('mobilidade', () => {
  it('recusa sem grau em vez de gravar um no-op', () => {
    const r = applyToothProposal({ dentes: [31], achado: 'mobilidade' })
    expect(r.ok).toBe(false)
    expect(loadSpy).not.toHaveBeenCalled()
  })

  it('mapeia o grau para o enum do motor', () => {
    applyToothProposal({ dentes: [31], achado: 'mobilidade', grauMobilidade: 2 })
    expect(denteEnviado(31).mobility).toBe('m2')
  })

  it('normaliza grau aninhado enviado pelo modelo de voz', () => {
    const proposta = normalizeToothProposal({
      dentes: [16],
      achado: 'mobilidade',
      mobilidade: { grau: 2 },
    })
    expect(proposta.grauMobilidade).toBe(2)
    expect(applyToothProposal(proposta).ok).toBe(true)
    expect(denteEnviado(16).mobility).toBe('m2')
  })

  it('recusa em implante, onde não existe mobilidade periodontal', () => {
    comEstado({ 31: { toothSelection: 'implant' } })
    const r = applyToothProposal({ dentes: [31], achado: 'mobilidade', grauMobilidade: 2 })
    expect(r.ok).toBe(false)
  })
})

describe('conferência pós-condição', () => {
  it('detecta marcação ainda não aplicada e confirma depois da escrita', () => {
    const proposta = { dentes: [16], achado: 'mobilidade' as const, grauMobilidade: 2 as const }
    expect(verifyToothProposalState(proposta).ok).toBe(false)
    applyToothProposal(proposta)
    expect(verifyToothProposalState(proposta)).toEqual({ ok: true, dentes: [16] })
  })

  it('confirma cárie e restauração pelas superfícies e material reais', () => {
    const carie: ToothProposal = {
      dentes: [25],
      achado: 'carie',
      superficies: ['mesial'],
    }
    const restauracao: ToothProposal = {
      dentes: [44],
      achado: 'restauracao',
      superficies: ['mesial'],
      material: 'amalgama',
    }
    applyToothProposal(carie)
    applyToothProposal(restauracao)
    expect(verifyToothProposalState(carie).ok).toBe(true)
    expect(verifyToothProposalState(restauracao).ok).toBe(true)
  })

  it('confirma remoção de ausência e rejeita quando o dente segue ausente', () => {
    comEstado({ 48: { toothSelection: 'none', extractionWound: false } })
    expect(verifyToothClearState([48], 'ausente').ok).toBe(false)
    clearTeeth([48], 'ausente')
    expect(verifyToothClearState([48], 'ausente')).toEqual({ ok: true, dentes: [48] })
  })
})

describe('desgaste', () => {
  // wearEdge e wearCervical são enums DISJUNTOS — trocar um pelo outro cai no
  // fallback 'none' sem erro nenhum.
  it('atrição vai para wearEdge; abrasão para wearCervical', () => {
    applyToothProposal({ dentes: [13], achado: 'desgaste', desgaste: 'atricao' })
    expect(denteEnviado(13).wearEdge).toBe('attrition')
    loadSpy.mockClear()
    comEstado()
    applyToothProposal({ dentes: [13], achado: 'desgaste', desgaste: 'abrasao' })
    expect(denteEnviado(13).wearCervical).toBe('abrasion')
  })
})

describe('anotação', () => {
  // O dentista dita "cárie na oclusal, anota que reclamou de sensibilidade"
  // numa frase só — a nota tem que valer para QUALQUER achado.
  it('acompanha um achado estruturado, não só o achado "nota"', () => {
    applyToothProposal({
      dentes: [26], achado: 'carie', superficies: ['oclusal'], nota: 'paciente relatou sensibilidade',
    })
    expect(denteEnviado(26).note).toBe('paciente relatou sensibilidade')
    expect(denteEnviado(26).caries).toEqual(['caries-occlusal'])
  })

  it('soma linha nova sem apagar a anotação anterior', () => {
    comEstado({ 26: { note: 'primeira' } })
    applyToothProposal({ dentes: [26], achado: 'nota', nota: 'segunda' })
    expect(denteEnviado(26).note).toBe('primeira\nsegunda')
  })

  it('recusa anotação vazia', () => {
    expect(applyToothProposal({ dentes: [26], achado: 'nota', nota: '  ' }).ok).toBe(false)
  })
})

describe('integridade do payload', () => {
  it('preserva os outros dentes e os globals no read-modify-write', () => {
    comEstado({ 11: { note: 'não me perca' }, 16: {} })
    applyToothProposal({ dentes: [16], achado: 'calculo' })
    const payload = loadSpy.mock.calls.at(-1)?.[0] as Record<string, unknown>
    expect((payload.teeth as Record<string, unknown>)['11']).toEqual({ note: 'não me perca' })
    expect(payload.globals).toEqual({ showHealthyPulp: false })
    expect(payload.version).toBe('2.10')
  })

  it('recusa número de dente fora da FDI', () => {
    const r = applyToothProposal({ dentes: [19], achado: 'calculo' })
    expect(r.ok).toBe(false)
    expect(loadSpy).not.toHaveBeenCalled()
  })
})

// "anota ausência dos dentes 16, 26 e 36" é uma frase só na cadeira — ditar de
// um em um numa arcada inteira é inviável.
describe('vários dentes na mesma proposta', () => {
  it('aplica o achado em todos os dentes informados', () => {
    applyToothProposal({ dentes: [16, 26, 36], achado: 'ausente' })
    expect(denteEnviado(16).toothSelection).toBe('none')
    expect(denteEnviado(26).toothSelection).toBe('none')
    expect(denteEnviado(36).toothSelection).toBe('none')
  })

  // getOdontogramState serializa os 32 dentes e loadOdontogramState re-hidrata
  // e repinta os 32: um ciclo por dente faria a boca piscar 16 vezes numa
  // arcada. O lote inteiro tem que caber numa escrita só.
  it('faz UMA única escrita no motor, não uma por dente', () => {
    applyToothProposal({ dentes: [16, 26, 36, 46], achado: 'calculo' })
    expect(loadSpy).toHaveBeenCalledTimes(1)
  })

  it('aplica a mesma superfície e severidade em todos', () => {
    applyToothProposal({ dentes: [16, 26], achado: 'carie', superficies: ['oclusal'], gravidade: 5 })
    expect(denteEnviado(16).caries).toEqual(['caries-occlusal'])
    expect(denteEnviado(26).cariesSeverity).toEqual({ occlusal: 5 })
  })

  // Falha de UM dente não pode derrubar a arcada inteira — mas o dentista
  // precisa ouvir o que não entrou.
  it('aplica nos que aceitam e devolve o motivo dos recusados', () => {
    comEstado({ 26: { restorationType: 'crown' } })
    const r = applyToothProposal({ dentes: [16, 26, 36], achado: 'carie', superficies: ['oclusal'] })
    expect(r.ok).toBe(true)
    expect(denteEnviado(16).caries).toEqual(['caries-occlusal'])
    expect(denteEnviado(36).caries).toEqual(['caries-occlusal'])
    expect(denteEnviado(26).caries).toBeUndefined()      // não foi tocado
    if (r.ok) {
      expect(r.recusados?.join(' ')).toContain('26')
      expect(r.resumo).toContain('16')
      expect(r.resumo).not.toContain('26')               // não anuncia o que não marcou
    }
  })

  it('quando NENHUM dente aceita, não escreve nada e explica', () => {
    comEstado({ 16: { restorationType: 'crown' }, 26: { restorationType: 'crown' } })
    const r = applyToothProposal({ dentes: [16, 26], achado: 'carie', superficies: ['oclusal'] })
    expect(r.ok).toBe(false)
    expect(loadSpy).not.toHaveBeenCalled()
  })

  // O que falta na FALA derruba tudo: sem o material, nenhum dente poderia ser
  // marcado — diferente de uma recusa por estado de um dente específico.
  it('campo que faltou na fala derruba a proposta inteira', () => {
    const r = applyToothProposal({ dentes: [16, 26], achado: 'restauracao', superficies: ['mesial'] })
    expect(r.ok).toBe(false)
    expect(loadSpy).not.toHaveBeenCalled()
  })

  it('separa os válidos dos inexistentes na FDI', () => {
    const r = applyToothProposal({ dentes: [16, 19, 26], achado: 'ausente' })
    expect(r.ok).toBe(true)
    expect(denteEnviado(16).toothSelection).toBe('none')
    expect(denteEnviado(26).toothSelection).toBe('none')
    if (r.ok) expect(r.recusados?.join(' ')).toContain('19')
  })

  it('a anotação vale para todos os dentes do lote', () => {
    applyToothProposal({ dentes: [16, 26], achado: 'ausente', nota: 'extraídos há 2 anos' })
    expect(denteEnviado(16).note).toBe('extraídos há 2 anos')
    expect(denteEnviado(26).note).toBe('extraídos há 2 anos')
  })
})

describe('describeProposal', () => {
  it('lista os dentes como alguém fala', async () => {
    const { describeProposal } = await import('./toothFields')
    expect(describeProposal({ dentes: [16], achado: 'ausente' })).toContain('dente 16')
    expect(describeProposal({ dentes: [16, 26], achado: 'ausente' })).toContain('dentes 16 e 26')
    expect(describeProposal({ dentes: [16, 26, 36], achado: 'ausente' })).toContain('dentes 16, 26 e 36')
  })
})

// A transcrição de um atendimento real mostrou o dentista pedindo quatro vezes
// "remove essa obturação" / "limpa todos os dentes" e a Cibelly respondendo que
// não conseguia — não havia ferramenta de apagar, só desfazer o último passo.
describe('apagar marcações', () => {
  it('zera o dente inteiro quando não se diz o achado', () => {
    comEstado({ 16: { caries: ['caries-occlusal'], mobility: 'm2', note: 'algo' } })
    const r = clearTeeth([16])
    expect(r.ok).toBe(true)
    // Objeto vazio hidrata como dente padrão — é o "zerar" do motor.
    expect(denteEnviado(16)).toEqual({})
  })

  // O pedido real foi "no 15, 16 e 17 tá aparecendo uma obturação, remove aí" —
  // tirar a restauração sem levar junto a cárie do mesmo dente.
  it('tira só o achado pedido e preserva o resto do dente', () => {
    comEstado({
      15: {
        caries: ['caries-occlusal'],
        cariesSeverity: { occlusal: 3 },
        fillingSurfaceMaterials: { mesial: 'amalgam' },
        fillingMaterial: 'amalgam',
        mobility: 'm1',
      },
    })
    clearTeeth([15], 'restauracao')
    const d = denteEnviado(15)
    expect(d.fillingSurfaceMaterials).toEqual({})
    expect(d.fillingMaterial).toBe('none')
    expect(d.caries).toEqual(['caries-occlusal'])   // cárie intacta
    expect(d.mobility).toBe('m1')                   // mobilidade intacta
  })

  it('apaga em vários dentes de uma vez', () => {
    comEstado({
      15: { fillingSurfaceMaterials: { mesial: 'amalgam' } },
      16: { fillingSurfaceMaterials: { distal: 'composite' } },
      17: { fillingSurfaceMaterials: { oclusal: 'gic' } },
    })
    clearTeeth([15, 16, 17], 'restauracao')
    expect(denteEnviado(15).fillingSurfaceMaterials).toEqual({})
    expect(denteEnviado(16).fillingSurfaceMaterials).toEqual({})
    expect(denteEnviado(17).fillingSurfaceMaterials).toEqual({})
    expect(loadSpy).toHaveBeenCalledTimes(1)   // uma escrita só, como no marcar
  })

  it('"ausente" volta o dente para presente', () => {
    comEstado({ 46: { toothSelection: 'none', extractionWound: true } })
    clearTeeth([46], 'ausente')
    expect(denteEnviado(46).toothSelection).toBe('tooth-base')
    expect(denteEnviado(46).extractionWound).toBe(false)
  })

  it('recusa dente fora da FDI sem escrever nada', () => {
    const r = clearTeeth([19])
    expect(r.ok).toBe(false)
    expect(loadSpy).not.toHaveBeenCalled()
  })

  // "limpe todos os dentes" — null é o caminho documentado do motor para zerar.
  it('limpar tudo manda null para o motor', () => {
    clearAllTeeth()
    expect(loadSpy).toHaveBeenCalledWith(null)
  })
})

describe('anotação não substitui achado', () => {
  // Caso real: "mobilidade no dente 23" foi recusada por faltar o grau e ela
  // gravou a frase como nota. O dente ficou com "📝 Mobilidade no dente 23,
  // nível 2." e SEM mobilidade no desenho — duas vezes.
  it('recusa a paráfrase do comando como anotação', () => {
    const r = applyToothProposal({ dentes: [23], achado: 'nota', nota: 'Mobilidade no dente 23, nível 2.' })
    expect(r.ok).toBe(false)
    // O erro volta PARA ELA, então precisa dizer o que fazer, não só recusar.
    if (!r.ok) expect(r.erro).toContain('ACHADO')
  })

  it('recusa as outras famílias de achado escritas como texto', () => {
    for (const nota of ['Cárie oclusal no 16', 'Restauração de resina na mesial', 'Dente ausente', 'Fratura no 11']) {
      expect(applyToothProposal({ dentes: [16], achado: 'nota', nota }).ok).toBe(false)
    }
  })

  it('deixa passar observação clínica de verdade', () => {
    // Começa pelo sujeito, não pelo achado — é anotação, não comando parafraseado.
    expect(applyToothProposal({ dentes: [16], achado: 'nota', nota: 'Paciente reclamou de sensibilidade ao frio' }).ok).toBe(true)
    expect(applyToothProposal({ dentes: [16], achado: 'nota', nota: 'Vamos precisar de raio-x' }).ok).toBe(true)
  })

  it('nota JUNTO de um achado continua sendo complemento', () => {
    // Aqui a marcação acontece de verdade; a nota só acompanha.
    const r = applyToothProposal({
      dentes: [23], achado: 'mobilidade', grauMobilidade: 2,
      nota: 'Mobilidade percebida à palpação',
    })
    expect(r.ok).toBe(true)
  })
})

describe('aparelho ortodôntico', () => {
  // O motor sempre teve orthoAppliance (bracket/band) — só não estava mapeado.
  // Sem isso, "adicione aparelho nos superiores" virou anotação em 8 dentes e o
  // desenho não mostrou aparelho nenhum.
  it('marca braquete e banda no campo do motor', () => {
    expect(applyToothProposal({ dentes: [11], achado: 'aparelho', aparelho: 'braquete' }).ok).toBe(true)
    expect(applyToothProposal({ dentes: [12], achado: 'aparelho', aparelho: 'banda' }).ok).toBe(true)
  })

  it('braquete é o padrão quando ele não especifica', () => {
    // "aparelho ortodôntico" sem mais nada é braquete no uso corrente.
    const r = applyToothProposal({ dentes: [13], achado: 'aparelho' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.resumo).toContain('braquete')
  })

  it('aceita a arcada inteira numa chamada', () => {
    const superiores = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
    const r = applyToothProposal({ dentes: superiores, achado: 'aparelho', aparelho: 'braquete' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.recusados ?? []).toEqual([])
  })
})
