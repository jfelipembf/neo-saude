import type { Material } from '@/types/domain'

export const MOCK_MATERIALS: Material[] = [
  {
    id: 'm1',
    clinicId: 'c1', name: 'Resina Fotopolimerizável A2', photo: 'https://picsum.photos/seed/neosaude-mat1/200/200',
    inStock: 8, minQuantity: 3, expiryDate: '10/03/2027', notes: 'Lote 123',
  },
  {
    id: 'm2',
    clinicId: 'c1', name: 'Luva de Procedimento M (cx 100)', photo: 'https://picsum.photos/seed/neosaude-mat2/200/200',
    inStock: 2, minQuantity: 5, expiryDate: '01/09/2028', notes: 'Repor com urgência',
  },
  {
    id: 'm3',
    clinicId: 'c1', name: 'Anestésico Lidocaína 2%', photo: 'https://picsum.photos/seed/neosaude-mat3/200/200',
    inStock: 12, minQuantity: 6, expiryDate: '15/12/2026', notes: 'Lote AN-77',
  },
  {
    id: 'm4',
    clinicId: 'c1', name: 'Máscara Cirúrgica Tripla (cx 50)',
    inStock: 0, minQuantity: 4, expiryDate: '30/06/2029',
  },
  {
    id: 'm5',
    clinicId: 'c1', name: 'Fio de Sutura Nylon 3-0',
    inStock: 9, minQuantity: 3, expiryDate: '05/02/2026', notes: 'Lote FS-31 — VENCIDO, descartar',
  },
  {
    id: 'm6',
    clinicId: 'c1', name: 'Álcool 70% 1L', photo: 'https://picsum.photos/seed/neosaude-mat6/200/200',
    inStock: 15, minQuantity: 5, expiryDate: '20/08/2027',
  },
  {
    id: 'm7',
    clinicId: 'c1', name: 'Gaze Estéril (pct 500)',
    inStock: 6, minQuantity: 6, expiryDate: '11/11/2027', notes: 'Lote GZ-05',
  },
]
