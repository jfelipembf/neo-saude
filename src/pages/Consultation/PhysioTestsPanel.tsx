import { PatientTestsPanel } from '@/pages/Patients/Profile/Tests/PatientTestsPanel'

/**
 * TESTES, dentro do atendimento.
 *
 * É o MESMO painel da aba Testes do perfil — aplicar um teste e ver a evolução
 * do resultado é a mesma operação, esteja o fisioterapeuta no perfil ou com o
 * paciente na maca. Uma segunda implementação aqui divergiria da primeira no
 * dia em que alguém acrescentasse um tipo de medida.
 *
 * O invólucro existe só para dar um ponto único onde ajustar densidade se a
 * coluna de 400px pedir — hoje não pede.
 */
export function PhysioTestsPanel({ patientId }: { patientId: string }) {
  return <PatientTestsPanel patientId={patientId} />
}
