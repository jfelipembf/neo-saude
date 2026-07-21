import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Button } from '@/components/Button/Button'
import { useConsultorio, useResponsavel } from '@/hooks/useConsultorio'
import { SEXO_LABEL } from '@/constants'
import {
  IconPredio, IconEditar, IconTelefone, IconEmail, IconLocal, IconDocumento, IconUsuario,
} from '@/components/icons'
import type { Endereco } from '@/types/domain'
import { ClinicFormModal } from './ClinicForm'
import { ResponsibleFormModal } from './ResponsibleForm'
import styles from './ClinicTab.module.scss'

/** 'Av. Beira Mar, 1234 — Centro' + 'Aracaju/SE · CEP 49000-000' (só o que existir). */
function linhasEndereco(e: Endereco): string[] {
  const rua = [e.rua, e.numero].filter(Boolean).join(', ')
  const linha1 = [rua, e.bairro].filter(Boolean).join(' — ')
  const cidade = [e.cidade, e.estado].filter(Boolean).join('/')
  const linha2 = [cidade, e.cep ? `CEP ${e.cep}` : ''].filter(Boolean).join(' · ')
  return [linha1, linha2].filter(Boolean)
}

/** Aba "Dados do consultório": visualização do consultório e do responsável técnico. */
export function ClinicTab() {
  const { data: consultorio, isLoading: carregandoConsultorio } = useConsultorio()
  const { data: responsavel, isLoading: carregandoResponsavel } = useResponsavel()

  const [editandoConsultorio, setEditandoConsultorio] = useState(false)
  const [editandoResponsavel, setEditandoResponsavel] = useState(false)

  if (carregandoConsultorio || carregandoResponsavel || !consultorio || !responsavel) {
    return <PageLoader />
  }

  const nomeResponsavel = `${responsavel.nome} ${responsavel.sobrenome}`.trim()
  const subResponsavel = [
    responsavel.sexo ? SEXO_LABEL[responsavel.sexo] : '',
    responsavel.nascimento ? `nasc. ${responsavel.nascimento}` : '',
  ].filter(Boolean).join(' · ')

  return (
    <>
      {/* Cartão único em largura total: consultório | divisor vertical | responsável. */}
      <div className={styles.card}>

          {/* ── Consultório ── */}
          <section className={styles.secao}>
            <header className={styles.secaoHeader}>
              <h2 className={styles.secaoTitle}>Consultório</h2>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<IconEditar />}
                onClick={() => setEditandoConsultorio(true)}
                aria-label="Editar dados do consultório"
              >
                Editar
              </Button>
            </header>

            {consultorio.logo ? (
              <img src={consultorio.logo} alt={`Logo de ${consultorio.nome}`} className={styles.logo} />
            ) : (
              <div className={styles.semFoto}><IconPredio /></div>
            )}

            <span className={styles.nome}>{consultorio.nome}</span>

            <ul className={styles.linhas}>
              {consultorio.cnpj && <li className={styles.linha}><IconDocumento /> CNPJ {consultorio.cnpj}</li>}
              {consultorio.email && <li className={styles.linha}><IconEmail /> {consultorio.email}</li>}
              {consultorio.telefone && <li className={styles.linha}><IconTelefone /> {consultorio.telefone}</li>}
              {linhasEndereco(consultorio).map(linha => (
                <li key={linha} className={styles.linha}><IconLocal /> {linha}</li>
              ))}
            </ul>
          </section>

          <hr className={styles.divisor} />

          {/* ── Responsável técnico ── */}
          <section className={styles.secao}>
            <header className={styles.secaoHeader}>
              <h2 className={styles.secaoTitle}>Responsável técnico</h2>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<IconEditar />}
                onClick={() => setEditandoResponsavel(true)}
                aria-label="Editar responsável técnico"
              >
                Editar
              </Button>
            </header>

            {responsavel.foto ? (
              <img src={responsavel.foto} alt={`Foto de ${nomeResponsavel}`} className={styles.foto} />
            ) : (
              <div className={styles.semFoto}><IconUsuario /></div>
            )}

            <span className={styles.nome}>{nomeResponsavel}</span>
            {subResponsavel && <span className={styles.sub}>{subResponsavel}</span>}

            <ul className={styles.linhas}>
              {responsavel.telefone && <li className={styles.linha}><IconTelefone /> {responsavel.telefone}</li>}
              {responsavel.email && <li className={styles.linha}><IconEmail /> {responsavel.email}</li>}
              {linhasEndereco(responsavel).map(linha => (
                <li key={linha} className={styles.linha}><IconLocal /> {linha}</li>
              ))}
            </ul>
          </section>
      </div>

      {/* Modais montam só quando abertos — o formulário nasce com os dados atuais. */}
      {editandoConsultorio && (
        <ClinicFormModal inicial={consultorio} onClose={() => setEditandoConsultorio(false)} />
      )}
      {editandoResponsavel && (
        <ResponsibleFormModal inicial={responsavel} onClose={() => setEditandoResponsavel(false)} />
      )}
    </>
  )
}
