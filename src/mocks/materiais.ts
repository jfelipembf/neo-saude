import type { Material } from '@/types/domain'

export const MOCK_MATERIAIS: Material[] = [
  {
    id: 'm1', nome: 'Resina Fotopolimerizável A2', foto: 'https://picsum.photos/seed/neosaude-mat1/200/200',
    emEstoque: 8, qtdMinima: 3, validade: '10/03/2027', observacao: 'Lote 123',
  },
  {
    id: 'm2', nome: 'Luva de Procedimento M (cx 100)', foto: 'https://picsum.photos/seed/neosaude-mat2/200/200',
    emEstoque: 2, qtdMinima: 5, validade: '01/09/2028', observacao: 'Repor com urgência',
  },
  {
    id: 'm3', nome: 'Anestésico Lidocaína 2%', foto: 'https://picsum.photos/seed/neosaude-mat3/200/200',
    emEstoque: 12, qtdMinima: 6, validade: '15/12/2026', observacao: 'Lote AN-77',
  },
  {
    id: 'm4', nome: 'Máscara Cirúrgica Tripla (cx 50)',
    emEstoque: 0, qtdMinima: 4, validade: '30/06/2029',
  },
  {
    id: 'm5', nome: 'Fio de Sutura Nylon 3-0',
    emEstoque: 9, qtdMinima: 3, validade: '05/02/2026', observacao: 'Lote FS-31 — VENCIDO, descartar',
  },
  {
    id: 'm6', nome: 'Álcool 70% 1L', foto: 'https://picsum.photos/seed/neosaude-mat6/200/200',
    emEstoque: 15, qtdMinima: 5, validade: '20/08/2027',
  },
  {
    id: 'm7', nome: 'Gaze Estéril (pct 500)',
    emEstoque: 6, qtdMinima: 6, validade: '11/11/2027', observacao: 'Lote GZ-05',
  },
]
