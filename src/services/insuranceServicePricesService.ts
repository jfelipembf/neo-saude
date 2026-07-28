import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { InsuranceServicePrice } from '@/types/domain'

/**
 * QUANTO CADA CONVÊNIO PAGA POR CADA SERVIÇO.
 *
 * Tabela à parte, e não uma coluna em `service`: um serviço tem N preços, um
 * por operadora com quem há contrato — e nenhum deles é o preço particular, que
 * continua em `service.price`. Confundir os dois é faturar a consulta do plano
 * pelo valor de balcão.
 */

const COLUMNS = 'id, clinic_id, insurance_id, service_id, price'

type PriceRow = {
  id: string
  clinic_id: string
  insurance_id: string
  service_id: string
  price: number
}

function toPrice(row: PriceRow): InsuranceServicePrice {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    insuranceId: row.insurance_id,
    serviceId: row.service_id,
    price: Number(row.price),
  }
}

/** Todos os preços negociados de UM serviço, um por convênio. */
export async function listServiceInsurancePrices(
  serviceId: string,
): Promise<InsuranceServicePrice[]> {
  const { data, error } = await supabase
    .from('insurance_service_price')
    .select(COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
    .eq('service_id', serviceId)
  if (error) throw error
  return (data as PriceRow[]).map(toPrice)
}

/**
 * Regrava a tabela de preços do serviço inteira.
 *
 * Convênio SEM valor informado tem a linha APAGADA, em vez de gravada como
 * zero: "não tenho contrato com esta operadora" e "esta operadora paga R$ 0,00"
 * são coisas diferentes, e zero silencioso viraria guia faturada sem valor.
 */
export async function saveServiceInsurancePrices(
  serviceId: string,
  precos: { insuranceId: string; price: number | null }[],
): Promise<void> {
  const clinicId = getCurrentClinicId()
  const comValor = precos.filter(p => p.price != null && p.price >= 0)
  const semValor = precos.filter(p => p.price == null)

  if (semValor.length) {
    const { error } = await supabase
      .from('insurance_service_price')
      .delete()
      .eq('clinic_id', clinicId)
      .eq('service_id', serviceId)
      .in('insurance_id', semValor.map(p => p.insuranceId))
    if (error) throw error
  }

  if (comValor.length) {
    const { error } = await supabase
      .from('insurance_service_price')
      .upsert(
        comValor.map(p => ({
          clinic_id: clinicId,
          service_id: serviceId,
          insurance_id: p.insuranceId,
          price: p.price as number,
        })),
        { onConflict: 'insurance_id,service_id' },
      )
    if (error) throw error
  }
}
