import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { OPCOES_SEXO } from '@/constants'
import { useAtualizarProfissional } from '@/hooks/useProfissionais'
import type { Professional, Gender } from '@/types/domain'
import shared from '../shared/profile.module.scss'

interface FormProfissional {
  nome: string
  sobrenome: string
  sexo: Gender | ''
  nascimentoIso: string   // aaaa-mm-dd (input date)
  especialidade: string
  registro: string
  descricao: string
  email: string
  telefone: string
  whatsapp: string
  cep: string
  estado: string
  cidade: string
  bairro: string
  numero: string
  ativo: boolean
}

function formDoProfissional(p: Professional): FormProfissional {
  // "Dra. Camila Duarte" → nome "Dra. Camila" + sobrenome "Duarte": o prefixo
  // do conselho fica junto do primeiro nome (dividir só no espaço deixaria
  // o nome como "Dra." solto).
  const partes = p.nome.split(' ').filter(Boolean)
  const temTitulo = /^Dra?\.$/i.test(partes[0] ?? '') && partes.length > 1
  const corte = temTitulo ? 2 : 1
  return {
    nome: partes.slice(0, corte).join(' '),
    sobrenome: partes.slice(corte).join(' '),
    sexo: p.sexo ?? '',
    nascimentoIso: p.nascimento ? p.nascimento.split('/').reverse().join('-') : '',
    especialidade: p.especialidade,
    registro: p.registro,
    descricao: p.descricao ?? '',
    email: p.email ?? '',
    telefone: p.telefone ?? '',
    whatsapp: p.whatsapp ?? '',
    cep: p.cep ?? '',
    estado: p.estado ?? '',
    cidade: p.cidade ?? '',
    bairro: p.bairro ?? '',
    numero: p.numero ?? '',
    ativo: p.status === 'ativo',
  }
}

interface PersonalDataFormProps {
  profissional: Professional
  onFechar: () => void
}

/** Aba "Dados pessoais" em modo edição. O rascunho nasce do cadastro salvo a
 *  cada montagem — fechar/trocar de aba descarta o que não foi salvo. */
export function PersonalDataForm({ profissional, onFechar }: PersonalDataFormProps) {
  const toast = useToast()
  const { mutate: salvar, isPending: salvando } = useAtualizarProfissional()

  const [form, setForm] = useState<FormProfissional>(() => formDoProfissional(profissional))
  const [erroNome, setErroNome] = useState('')

  const set = (campo: keyof FormProfissional) => (valor: string | boolean) => {
    setForm(atual => ({ ...atual, [campo]: valor }))
    if (campo === 'nome') setErroNome('')
  }

  function aoSalvar(e: FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      setErroNome('Informe o nome do profissional.')
      return
    }
    salvar(
      {
        id: profissional.id,
        dados: {
          nome: `${form.nome.trim()} ${form.sobrenome.trim()}`.trim(),
          sexo: form.sexo || undefined,
          nascimento: form.nascimentoIso ? form.nascimentoIso.split('-').reverse().join('/') : '',
          especialidade: form.especialidade.trim(),
          registro: form.registro.trim(),
          // Vazio limpa o campo — `undefined` (não enviado) preservaria o valor.
          descricao: form.descricao.trim(),
          email: form.email.trim(),
          telefone: form.telefone.trim(),
          whatsapp: form.whatsapp.trim(),
          cep: form.cep.trim(),
          estado: form.estado.trim().toUpperCase(),
          cidade: form.cidade.trim(),
          bairro: form.bairro.trim(),
          numero: form.numero.trim(),
          status: form.ativo ? 'ativo' : 'inativo',
        },
      },
      {
        onSuccess: () => {
          toast.success('Dados atualizados!')
          onFechar()
        },
      },
    )
  }

  return (
    <section className={shared.formCard} aria-label="Editar cadastro">
      <h2 className={shared.formTitulo}>Editar cadastro</h2>

      <form className={shared.form} onSubmit={aoSalvar}>
        <section className={shared.formSection}>
          <h3>Dados pessoais</h3>
          <div className={shared.grid2}>
            <Input label="Nome" value={form.nome} onChange={e => set('nome')(e.target.value)} error={erroNome} autoFocus />
            <Input label="Sobrenome" value={form.sobrenome} onChange={e => set('sobrenome')(e.target.value)} />
          </div>
          <div className={shared.grid2}>
            <Select
              label="Sexo"
              options={OPCOES_SEXO}
              placeholder="Selecione..."
              value={form.sexo}
              onChange={e => set('sexo')(e.target.value)}
            />
            <Input
              label="Data de nascimento"
              type="date"
              value={form.nascimentoIso}
              onChange={e => set('nascimentoIso')(e.target.value)}
            />
          </div>
        </section>

        <section className={shared.formSection}>
          <h3>Dados profissionais</h3>
          <div className={shared.grid2}>
            <Input label="Especialidade" value={form.especialidade} onChange={e => set('especialidade')(e.target.value)} />
            <Input label="Registro (conselho)" placeholder="Ex: CRO/SE 4567" value={form.registro} onChange={e => set('registro')(e.target.value)} />
          </div>
          <Textarea
            label="Sobre a atuação"
            placeholder="Breve descrição da especialidade e dos atendimentos."
            rows={3}
            value={form.descricao}
            onChange={e => set('descricao')(e.target.value)}
          />
          <Toggle label="Profissional ativo" checked={form.ativo} onChange={v => set('ativo')(v)} />
        </section>

        <section className={shared.formSection}>
          <h3>Contato</h3>
          <Input label="E-mail" type="email" value={form.email} onChange={e => set('email')(e.target.value)} />
          <div className={shared.grid2}>
            <Input label="Telefone" type="tel" value={form.telefone} onChange={e => set('telefone')(e.target.value)} />
            <Input label="WhatsApp" type="tel" value={form.whatsapp} onChange={e => set('whatsapp')(e.target.value)} />
          </div>
        </section>

        <section className={shared.formSection}>
          <h3>Endereço</h3>
          <div className={shared.grid2}>
            <Input label="CEP" value={form.cep} onChange={e => set('cep')(e.target.value)} />
            <Input label="Estado" maxLength={2} value={form.estado} onChange={e => set('estado')(e.target.value)} />
          </div>
          <div className={shared.grid2}>
            <Input label="Cidade" value={form.cidade} onChange={e => set('cidade')(e.target.value)} />
            <Input label="Bairro" value={form.bairro} onChange={e => set('bairro')(e.target.value)} />
          </div>
          <div className={shared.grid2}>
            <Input label="Número" value={form.numero} onChange={e => set('numero')(e.target.value)} />
          </div>
        </section>

        <div className={shared.formAcoes}>
          <Button variant="ghost" onClick={onFechar} disabled={salvando}>Cancelar</Button>
          <Button type="submit" loading={salvando}>Salvar alterações</Button>
        </div>
      </form>
    </section>
  )
}
