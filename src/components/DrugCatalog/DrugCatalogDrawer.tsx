import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Drawer } from '@/components/Drawer/Drawer'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconDocument, IconSearch } from '@/components/icons'
import { useDebounce } from '@/hooks/useDebounce'
import { useDrugCatalog } from '@/hooks/useDrugCatalog'
import { bulaUrl, termoDeBusca } from '@/utils/anvisaBula'
import styles from './DrugCatalog.module.scss'

interface DrugCatalogDrawerProps {
  open: boolean
  onClose: () => void
}

/**
 * CONSULTA DE MEDICAMENTOS, num painel lateral.
 *
 * Busca por marca OU princípio ativo — o profissional lembra de um ou de outro,
 * e obrigá-lo a saber qual dos dois está digitando seria transferir para ele um
 * detalhe do nosso banco.
 *
 * O que esta tela NÃO faz, de propósito: mostrar posologia, indicação ou
 * contraindicação. Esse conteúdo não existe em fonte pública estruturada no
 * Brasil, e inventá-lo dentro de um prontuário é dano ao paciente. Quem precisa
 * dele abre a BULA OFICIAL, que é um clique e é sempre a versão vigente.
 */
export function DrugCatalogDrawer({ open, onClose }: DrugCatalogDrawerProps) {
  const [busca, setBusca] = useState('')
  const termo = useDebounce(busca)
  const { data: medicamentos, isLoading, isFetching } = useDrugCatalog(termo)

  const lista = medicamentos ?? []

  return (
    <Drawer open={open} onClose={onClose} size="md" title="Medicamentos">
      <div className={styles.busca}>
        <Input
          placeholder="Nome comercial ou princípio ativo…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          iconLeft={<IconSearch />}
          aria-label="Buscar medicamento"
        />
        {/* Procedência na tela, não escondida: catálogo de medicamento
            desatualizado apresentado como atual é o risco número um aqui. */}
        <p className={styles.fonte}>
          Lista de Preços CMED/ANVISA · a bula abre no Bulário Eletrônico oficial
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : lista.length === 0 ? (
        <EmptyState
          icon={<IconDocument />}
          title={termo ? 'Nenhum medicamento encontrado' : 'Busque um medicamento'}
          description={
            termo
              ? 'Confira a grafia. A busca aceita marca e princípio ativo, com ou sem acento.'
              : 'Digite o nome comercial ou o princípio ativo. A bula oficial abre a partir de cada resultado.'
          }
        />
      ) : (
        <ul className={`${styles.lista} ${isFetching ? styles.listaCarregando : ''}`}>
          {lista.map(m => {
            const url = bulaUrl(termoDeBusca(m.name))
            return (
              <li key={m.id} className={styles.item}>
                <div className={styles.linhaTopo}>
                  <strong className={styles.nome}>{m.name}</strong>
                  {m.tarja && <span className={classeDaTarja(m.tarja)}>{m.tarja.replace(/^Tarja /, '')}</span>}
                </div>

                {/* O princípio ativo é clicável: é como se filtra por ele sem
                    um campo de filtro à parte — e numa associação cada
                    componente vira um caminho próprio. */}
                <div className={styles.substancias}>
                  {m.substances.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={styles.substancia}
                      onClick={() => setBusca(s)}
                      title={`Buscar ${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {m.presentation && <span className={styles.apresentacao}>{m.presentation}</span>}

                <div className={styles.rodape}>
                  <span className={styles.meta}>
                    {[m.manufacturer, m.productType].filter(Boolean).join(' · ')}
                    {m.hospitalOnly && <span className={styles.hospitalar}>uso hospitalar</span>}
                  </span>
                  {url && (
                    <Button
                      size="sm" variant="outline" iconLeft={<IconDocument />}
                      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                    >
                      Ver bula
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Drawer>
  )
}

/**
 * A tarja é a informação de PRESCRIÇÃO da lista — diz se exige receita e qual.
 * Por isso ganha cor, e não é só mais um texto cinza: preta é a que muda o
 * bloco de receituário.
 */
function classeDaTarja(tarja: string): string {
  const t = tarja.toLowerCase()
  if (t.includes('preta')) return `${styles.tarja} ${styles.tarjaPreta}`
  if (t.includes('restrição')) return `${styles.tarja} ${styles.tarjaRestrita}`
  if (t.includes('vermelha')) return `${styles.tarja} ${styles.tarjaVermelha}`
  return styles.tarja
}
